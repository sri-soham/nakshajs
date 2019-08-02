const BaseService = require('./base_service.js');
const constants = require('../helpers/constants.js');
const Helper = require('../helpers/helper.js');

class PublicMapService extends BaseService {
    constructor(db, api_db) {
        super(db);
        this._api_db = api_db;
        this.mapDetailsForDisplay = this.mapDetailsForDisplay.bind(this);
        this.queryData = this.queryData.bind(this);
        this.layerOfTable = this.layerOfTable.bind(this);
    }

    async mapDetailsForDisplay(request) {
        let map_details, user_details, query, tables_of_map, i, extent_queries;
        let tmp, extents, values;

        map_details = await this._db.selectOne(constants.MSTR_MAP, ['*'], {'id': request.params.id, 'hash': request.params.hash});
        if (map_details === null) {
            return this.errorResult(['No such map']);
        }

        user_details = await this._db.find(constants.MSTR_USER, map_details['user_id']);

        query = `SELECT mt.name, mt.table_name
                   FROM ${constants.MSTR_TABLE} AS mt
             INNER JOIN ${constants.MSTR_LAYER} AS ml
                     ON mt.id = ml.table_id
             INNER JOIN ${constants.MSTR_MAP_LAYER} AS mml
                     ON ml.id = mml.layer_id
                  WHERE mml.map_id = $1`;
        tables_of_map = await this._db.genericSelect(query, [map_details['id']]);

        extent_queries = [];
        for (i=0; i<tables_of_map.length; ++i) {
            query = "SELECT '" + tables_of_map[i]['table_name'] + "' AS table_name, ST_Extent(the_geom) AS xtnt FROM " + user_details['schema_name'] + '.' + tables_of_map[i]['table_name'];
            extent_queries.push(query);
        }

        tmp = await this._db.genericSelect(extent_queries.join(' UNION ALL '), []);
        extents = [];
        for (i=0; i<tmp.length; ++i) {
            extents.push(tmp[i]['table_name']);
            extents.push(tmp[i]['xtnt']);
        }

        values = {};
        values['map_details'] = map_details;
        values['is_google_maps'] = Helper.isGoogleMapsBaseLayer(map_details['base_layer']);
        values['is_bing_maps'] = Helper.isBingMapsBaseLayer(map_details['base_layer']);
        values['is_yandex_maps'] = Helper.isYandexMapsBaseLayer(map_details['base_layer']);
        values['user_details'] = user_details;
        values['layer_data'] = tables_of_map;
        values['extents'] = extents;

        return this.successResult(values);
    }

    async queryData(request) {
        let result, query, data;

        if (request.query && request.query.query && request.query.query.length > 0) {
            query = 'SELECT * FROM (' + request.query.query + ') AS foo';
            data = await this._api_db.genericSelect(query, []);
            result = this.successResult({'data': data});
        }
        else {
            result = this.errorResult(['Query is missing']);
        }

        return result;
    }

    async layerOfTable(request) {
        let query, layer_details, layer_url;

        query = `SELECT ml.hash, ml.update_hash, ml.infowindow
                   FROM ${constants.MSTR_TABLE} AS mt
             INNER JOIN ${constants.MSTR_LAYER} AS ml
                     ON mt.id = ml.table_id
                  WHERE mt.schema_name = $1
                    AND mt.table_name = $2`;
        layer_details = await this._db.genericSelect(query, [request.params.schema, request.params.table]);
        layer_url = '/lyr/' + layer_details[0]['hash'] + '-' + layer_details[0]['update_hash'];
        layer_url += '/{z}/{x}/{y}.png';

        return this.successResult({
            'layer_url': layer_url,
            'infowindow': layer_details[0]['infowindow']
        });
    }
}

module.exports = PublicMapService;

