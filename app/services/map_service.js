const BaseService = require('./base_service.js');
const constants = require('../helpers/constants.js');
const Paginator = require('../helpers/paginator.js');
const Helper = require('../helpers/helper.js');
const MapValidator = require('../validators/map_validator.js');

class MapService extends BaseService {
    constructor(db) {
        super(db);
        this.userMaps = this.userMaps.bind(this);
        this.addMap = this.addMap.bind(this);
        this.mapDetails = this.mapDetails.bind(this);
        this.editMap = this.editMap.bind(this);
        this.deleteMap = this.deleteMap.bind(this);
        this.updateBaseLayer = this.updateBaseLayer.bind(this);
        this.searchTables = this.searchTables.bind(this);
        this.addLayer = this.addLayer.bind(this);
        this.deleteLayer = this.deleteLayer.bind(this);
        this.updateHash = this.updateHash.bind(this);
        this.mapUserCount = this.mapUserCount.bind(this);
        this._layerBelongsToUser = this._layerBelongsToUser.bind(this);
    }

    async userMaps(request) {
        let page, per_page, where, maps, count, paginator, values;

        if (request.query.page) {
            page = parseInt(request.query.page);
        }
        else {
            page = 1;
        }
        if (page < 1) {
            page = 1;
        }
        per_page = 20;
        where = {'user_id': request.session.user_id};
        maps = await this._db.selectWhere(constants.MSTR_MAP, ['*'], where, 'name', per_page, ((page-1) * per_page));
        count = await this._db.getCount(constants.MSTR_MAP, where);
        paginator = new Paginator(count, per_page, page, 4);
        values = {};
        values['maps'] = maps;
        values['pagination_links'] = paginator.links('/maps/index?page={page}');
        values['pagination_text'] = paginator.text();

        return this.successResult(values);
    }

    async addMap(request) {
        let validator, errors, result, client, map_values, map_row, layer_values;

        validator = new MapValidator(request.body);
        errors = validator.validateAdd();
        if (errors.length === 0) {
            if (!await this._layerBelongsToUser(request.body.layer, request.session.user_id)) {
                errors.push('You do not have access to this layer');
            }
        }

        if (errors.length === 0) {
            client = await this._db.getClient();
            map_values = {
                'user_id': request.session.user_id,
                'name': request.body.name,
                'hash': Helper.hashFromName(request.body.name),
                'base_layer': Helper.getDefaultBaseLayer()
            };
            try {
                await client.beginTransaction();
                map_row = await client.insert(constants.MSTR_MAP, map_values, 'id');

                layer_values = {
                    'map_id': map_row['id'],
                    'layer_id': request.body.layer,
                    'layer_index': 1
                };
                await client.insert(constants.MSTR_MAP_LAYER, layer_values, '');
                await client.commitTransaction();
                result = this.successResult({
                    'redir_url': '/maps/' + map_row['id'] + '/show'
                });
            }
            catch (e) {
                await client.rollbackTransaction();
                throw(e);
            }
            finally {
                client.release();
            }
        }
        else {
            result = this.errorResult(errors);
        }

        return result;
    }

    async mapDetails(request) {
        let map_details, query, tables, base_layers;

        map_details = await this._db.find(constants.MSTR_MAP, request.params.id);
        query = `SELECT mt.schema_name, mt.name AS table_name, ml.id AS layer_id
                   FROM ${constants.MSTR_TABLE} AS mt
             INNER JOIN ${constants.MSTR_LAYER} AS ml
                     ON mt.id = ml.table_id
             INNER JOIN ${constants.MSTR_MAP_LAYER} AS mml
                     ON ml.id = mml.layer_id
                  WHERE mml.map_id = $1
               ORDER BY table_name`;
        tables = await this._db.genericSelect(query, [request.params.id]);
        base_layers = Helper.getBaseLayers();

        return this.successResult({
            'map_details': map_details,
            'tables': tables,
            'base_layers': base_layers
        });
    }

    async editMap(request) {
        let validator, errors, result;

        validator = new MapValidator(request.body);
        errors = validator.validateUpdate();
        if (errors.length === 0) {
            await this._db.update(constants.MSTR_MAP, {'name': request.body.name}, {'id': request.params.id});
            result = this.successResult();
        }
        else {
            result = this.errorResult(errors);
        }

        return result;
    }

    async deleteMap(request) {
        let client;

        client = await this._db.getClient();
        try {
            await client.beginTransaction();
            await client.deleteWhere(constants.MSTR_MAP_LAYER, {'map_id': request.params.id});
            await client.deleteWhere(constants.MSTR_MAP, {'id': request.params.id});
            await client.commitTransaction();
        }
        catch (err) {
            await client.rollbackTransaction();
            throw(err);
        }
        finally {
            client.release();
        }

        return this.successResult({'redir_url': '/maps/index'});
    }

    async updateBaseLayer(request) {
        let user_details, validator, errors, result;

        user_details = await this._db.find(constants.MSTR_USER, request.session.user_id);
        validator = new MapValidator(request.body);
        errors = validator.validateBaseLayerUpdate(user_details);
        if (errors.length === 0) {
            await this._db.update(constants.MSTR_MAP, {'base_layer': request.body.base_layer}, {'id': request.params.id});
            result = this.successResult();
        }
        else {
            result = this.errorResult(errors);
        }

        return result;
    }

    async searchTables(request) {
        let query, params, tables;

        query = `SELECT mt.name AS value, ml.id AS layer_id
                   FROM ${constants.MSTR_TABLE} AS mt
             INNER JOIN ${constants.MSTR_LAYER} AS ml
                     ON mt.id = ml.table_id
                  WHERE mt.name ILIKE $1
                    AND mt.user_id = $2
                    AND ml.id NOT IN (
                        SELECT layer_id FROM ${constants.MSTR_MAP_LAYER} where map_id = $3
                    )`
        params = [request.query.table_name + '%', request.session.user_id, request.params.id];
        tables = await this._db.genericSelect(query, params);

        return this.successResult({'tables': tables});
    }

    async addLayer(request) {
        let validator, errors, result, layer_values;

        validator = new MapValidator(request.body);
        errors = validator.validateAddLayer();
        if (errors.length === 0) {
            if (!await this._layerBelongsToUser(request.body.layer_id, request.session.user_id)) {
                errors.push('You do not have access to this layer');
            }
        }

        if (errors.length === 0) {
            layer_values = {
                'map_id': request.params.id,
                'layer_id': request.body.layer_id,
                'layer_index': 1
            };
            await this._db.insert(constants.MSTR_MAP_LAYER, layer_values);
            result = this.successResult();
        }
        else {
            result = this.errorResult(errors);
        }

        return result;
    }

    async deleteLayer(request) {
        let validator, errors, cnt, result, where;

        validator = new MapValidator(request.body);
        errors = validator.validateDeleteLayer();
        if (errors.length === 0) {
            cnt = await this._db.getCount(constants.MSTR_MAP_LAYER, {'map_id': request.params.id});
            if (cnt <= 1) {
                errors.push('Map should have at least one layer');
            }
        }

        if (errors.length === 0) {
            where = {'map_id': request.params.id, 'layer_id': request.body.layer_id};
            await this._db.deleteWhere(constants.MSTR_MAP_LAYER, where);
            result = this.successResult();
        }
        else {
            result = this.errorResult(errors);
        }

        return result;
    }

    async updateHash(request) {
        let validator, errors, result;

        validator = new MapValidator(request.body);
        errors = validator.validateUpdateHash();
        if (errors.length === 0) {
            await this._db.update(constants.MSTR_MAP, {'hash': request.body.hash}, {'id': request.params.id});
            result = this.successResult();
        }
        else {
            result = this.errorResult(errors);
        }

        return result;
    }

    async mapUserCount(map_id, user_id) {
        let where = {'id': map_id, 'user_id': user_id};
        let count = await this._db.getCount(constants.MSTR_MAP, where);

        return count;
    }

    async _layerBelongsToUser(layer_id, user_id) {
        let query, rows;

        query = `SELECT COUNT(*) AS cnt
                   FROM ${constants.MSTR_LAYER} AS ml
             INNER JOIN ${constants.MSTR_TABLE} AS mt
                     ON ml.table_id = mt.id
                  WHERE ml.id = $1
                    AND mt.user_id = $2`;
        rows = await this._db.genericSelect(query, [layer_id, user_id]);

        return parseInt(rows[0]['cnt']) === 1;
    }
}

module.exports = MapService;
