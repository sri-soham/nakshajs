const Helper = require('../helpers/helper.js');
const constants = require('../helpers/constants.js');
const BaseService = require('./base_service.js');
const TableRowValidator = require('../validators/table_row_validator.js');

class TableRowService extends BaseService {
    constructor(db) {
        super(db);
        this.data = this.data.bind(this);
        this.addRow = this.addRow.bind(this);
        this.deleteRow = this.deleteRow.bind(this);
        this.show = this.show.bind(this);
        this.updateRow = this.updateRow.bind(this);
        this.tableUserCount = this.tableUserCount.bind(this);
        this._tableNameById = this._tableNameById.bind(this);
        this._updateUpdateHash = this._updateUpdateHash.bind(this);
        this._updateGeometryTypeStyle = this._updateGeometryTypeStyle.bind(this);
    }

    async data(request) {
        let table_name, page, per_page, offset, order_column, order_type, rows, count, i;

        table_name = await this._tableNameById(request.params.table_id);
        page = parseInt(request.params.page);
        per_page = 40;
        offset = (page - 1) * per_page;
        order_column = request.query.order_column;
        order_type = request.query.order_type;
        if (!order_column || order_column.length === 0) {
            order_column = 'naksha_id';
        }
        if (!order_type || order_type.length === 0) {
            order_type = 'asc';
        }
        else {
            if (order_type === 'asc' || order_type === 'desc') {
                // nothing to do
            }
            else {
                order_type = 'asc';
            }
        }
        rows = await this._db.selectWhere(
            table_name,
            ['*', 'ST_AsEWKT(the_geom) AS the_geom'],
            {},
            order_column + ' ' + order_type,
            per_page,
            offset
        );

        for (i=0; i<rows.length; ++i) {
            delete rows[i]['the_geom_webmercator'];
        }

        count = await this._db.getCount(table_name);

        return this.successResult({'rows': rows, 'count': count});
    }

    async addRow(request) {
        let table_name, validator, errors, result;
        let values, geometry, with_geometry, naksha_id, update_hash;

        table_name = await this._tableNameById(request.params.table_id);
        validator = new TableRowValidator(request.body);
        errors = validator.validateAdd();
        if (errors.length === 0) {
            with_geometry = request.body.with_geometry;
            values = {};
            values['created_at'] = values['updated_at'] = Helper.getCurrentTimestamp();
            if (with_geometry === '1') {
                values['the_geom'] = request.body.geometry;
                naksha_id = await this._db.insert(table_name, values, 'naksha_id');
                update_hash = await this._updateUpdateHash(request.params.table_id);
                this._updateGeometryTypeStyle(request.params.table_id, table_name);
            }
            else {
                naksha_id = await this._db.insert(table_name, values, 'naksha_id');
                update_hash = '';
            }
            result = this.successResult({
                'row': {
                    'naksha_id': naksha_id,
                    'update_hash': update_hash
                }
            });
        }
        else {
            result = this.errorResult(errors);
        }

        return result;
    }

    async deleteRow(request) {
        let table_name, where, update_hash;

        table_name = await this._tableNameById(request.params.table_id);
        where = {'naksha_id': request.params.id};
        await this._db.deleteWhere(table_name, where);
        update_hash = await this._updateUpdateHash(request.params.table_id);

        return this.successResult({'update_hash': update_hash});
    }

    async show(request) {
        let table_name, layer_where, layer_details, iw, where, row, result;

        table_name = await this._tableNameById(request.params.table_id);
        layer_where = {'table_id': request.params.table_id};
        layer_details = await this._db.selectOne(constants.MSTR_LAYER, ['*'], layer_where);
        iw = JSON.parse(layer_details['infowindow']);
        where = {'naksha_id': request.params.id};
        row = await this._db.selectOne(table_name, iw.fields, where);
        if (row === null) {
            result = this.errorResult(['No details']);
        }
        else {
            result = this.successResult({'data': row});
        }

        return result;
    }

    async updateRow(request) {
        let table_name, validator, errors, result;
        let column, value, where, values, update_hash;

        validator = new TableRowValidator(request.body);
        errors = validator.validateUpdate();
        if (errors.length === 0) {
            table_name = await this._tableNameById(request.params.table_id);
            column = request.body.column;
            value = request.body.value ? request.body.value : '';
            where = {'naksha_id': request.params.id};
            if (column === 'the_geom') {
                await this._db.updateGeometry(table_name, value, where);
                update_hash = await this._updateUpdateHash(request.params.table_id);
                this._updateGeometryTypeStyle(request.params.table_id, table_name);
                result = this.successResult({'update_hash': update_hash});
            }
            else {
                values = {};
                values[column] = value;
                await this._db.update(table_name, values, where);
                result = this.successResult();
            }
        }
        else {
            result = this.errorResult(errors);
        }

        return result;
    }

    async tableUserCount(table_id, user_id) {
        let where = {'id': table_id, 'user_id': user_id};
        let count = await this._db.getCount(constants.MSTR_TABLE, where);

        return count;
    }

    async _tableNameById(id) {
        let details = await this._db.find(constants.MSTR_TABLE, id);
        return Helper.schemaTableFromDetails(details);
    }

    async _updateUpdateHash(table_id) {
        let update_hash = Helper.hashForMapUrl();
        await this._db.update(constants.MSTR_LAYER, {'update_hash': update_hash}, {'table_id': table_id});

        return update_hash;
    }

    async _updateGeometryTypeStyle(table_id, table_name) {
        let where, layer_details, query, rows, geom_type, values;

        where = {'table_id': table_id};
        layer_details = await this._db.selectOne(constants.MSTR_LAYER, ['*'], where);
        if (layer_details['geometry_type'] !== 'unknown') {
            return;
        }

        query = 'SELECT ST_GeometryType(the_geom) AS geom_type FROM ' + table_name + ' WHERE ST_GeometryType(the_geom) IS NOT NULL LIMIT 1';
        rows = await this._db.genericSelect(query, []);
        geom_type = rows[0]['geom_type'].toUpperCase();
        values = {};
        values['updated_at'] = Helper.getCurrentTimestamp();
        switch (geom_type) {
            case 'ST_POLYGON':
            case 'ST_MULTIPOLYGON':
		        values['geometry_type'] = 'polygon';
		        values['style'] = '<Rule>' +
			        '<PolygonSymbolizer fill="#000000" fill-opacity="0.75" />' +
			        '<LineSymbolizer stroke="#ffffff" stroke-width="0.5" stroke-opacity="1.0" />' +
			        '</Rule>';
            break;
            case 'ST_LINESTRING':
            case 'ST_MULTILINESTRING':
                values['geometry_type'] = 'linestring';
                values['style'] = '<Rule>' +
                    '<LineSymbolizer stroke="#ffffff" stroke-width="4" stroke-opacity="1.0" />' +
                    '</Rule>';
            break;
            case 'ST_POINT':
            case 'ST_MULTIPOINT':
                values['geometry_type'] = 'point';
                values['style'] = '<Rule>' +
                    '<MarkersSymbolizer fill="#000000" stroke="#ffffff" opacity="0.75" stroke-width="1" stroke-opacity="1.0" width="10" height="10" marker-type="ellipse" />' +
                    '</Rule>';
            break;
            default:
                values['geometry_type'] = 'unknown';
                values['style'] = '<Rule>' +
                    '<PolygonSymbolizer fill="#000000" fill-opacity="0.75" />' +
                    '<LineSymbolizer stroke="#ffffff" stroke-width="0.5" stroke-opacity="1.0" />' +
                    '<MarkersSymbolizer fill="#000000" stroke="#ffffff" opacity="0.75" stroke-width="1" stroke-opacity="1.0" width="10" height="10" marker-type="ellipse" />' +
                    '</Rule>';
            break;
        }
        await this._db.update(constants.MSTR_LAYER, values, where);
    }
}

module.exports = TableRowService;
