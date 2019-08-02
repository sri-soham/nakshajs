const BaseService = require('./base_service.js');
const Paginator = require('../helpers/paginator.js');
const constants = require('../helpers/constants.js');
const Helper = require('../helpers/helper.js');
const StyleGenerator = require('../helpers/style_generator.js');
const StyleValidator = require('../validators/style_validator.js');
const TableValidator = require('../validators/table_validator.js');
const Importer = require('../importer/importer.js');
const Exporter = require('../exporter/exporter.js');
const logger = require('../helpers/logger.js');

class TableService extends BaseService {
    constructor(db) {
        super(db);
        this.addTable = this.addTable.bind(this);
        this.tablesForDashboard = this.tablesForDashboard.bind(this);
        this.tableDetails = this.tableDetails.bind(this);
        this.tableStatus = this.tableStatus.bind(this);
        this.updateStyles = this.updateStyles.bind(this);
        this.infowindow = this.infowindow.bind(this);
        this.deleteTable = this.deleteTable.bind(this);
        this.addColumn = this.addColumn.bind(this);
        this.deleteColumn = this.deleteColumn.bind(this);
        this.exportTable = this.exportTable.bind(this);
        this.tableUserCount = this.tableUserCount.bind(this);
    }

    async addTable(request) {
        let importer, result;

        if (!request.body || !request.body.name || request.body.name.length === 0) {
            return this.errorResult(['Name is required']);
        }
        importer = new Importer(request, this._db);
        result = await importer.handleAddTable();

        return result;
    }

    async tablesForDashboard(request) {
        let result, page, per_page, tables, offset, where, count, paginator;

        per_page = 30;
        if (request.query.page && parseInt(request.query.page) > 0) {
            page = parseInt(request.query.page);
        }
        else {
            page = 1;
        }
        offset = (page - 1) * per_page;
        try {
            where = {user_id: request.session.user_id}
            tables = await this._db.selectWhere(constants.MSTR_TABLE, ['*'], where, 'name', per_page, offset);
            count = await this._db.getCount(constants.MSTR_TABLE, where);
            paginator = new Paginator(count, per_page, page, 4);
            result = this.successResult({
                tables: tables,
                pagination_links: paginator.links('/dashboard?page={page}'),
                pagination_text: paginator.text()
            });
        }
        catch(err) {
            logger.error(err);
            result = this.errorResult(['Unidentified error']);
        }

        return result;
    }

    async tableDetails(request) {
        let table, user, cols_where, tmp, columns, i, extent, lyr_details, result;

        table = await this._db.find(constants.MSTR_TABLE, request.params.id);
        user = await this._db.find(constants.MSTR_USER, request.session.user_id);

        cols_where = {'table_name': table['table_name'], 'table_schema': table['schema_name']};
        tmp = await this._db.selectWhere('information_schema.columns', ['column_name'], cols_where);
        columns = [];
        for (i=0; i<tmp.length; ++i) {
            if (['the_geom', 'the_geom_webmercator'].indexOf(tmp[i]['column_name']) < 0) {
                columns.push(tmp[i]['column_name']);
            }
        }

        tmp = await this._db.selectWhere(Helper.schemaTableFromDetails(table), ['ST_Extent(the_geom) AS xtnt'], null, null, 1);
        extent = tmp[0]['xtnt'];

        lyr_details = await this._db.selectOne(constants.MSTR_LAYER, ['*'], {'table_id': table['id']});

        result = this.successResult({
            'table_details': table,
            'columns':       columns.join(','),
            'url':           '/table_rows/' + table['id'] + '/',
            'map_url':       '/lyr/' + lyr_details['hash'] + '-[ts]/{z}/{x}/{y}.png',
            'extent':        extent,
            'layer_id':      lyr_details['id'],
            'geometry_type': lyr_details['geometry_type'],
            'style':         lyr_details['style'],
            'infowindow':    lyr_details['infowindow'],
            'update_hash':   lyr_details['update_hash'],
            'export_formats': Exporter.getAvailableFormats(),
            'tables_url':    '/tables/' + table['id'],
            'base_layers':   Helper.getBaseLayers(),
            'base_layer':    Helper.getDefaultBaseLayer(),
            'user_details':  user
        });

        return result;
    }

    async tableStatus(request) {
        let details, t_status, result;

        details = await this._db.find(constants.MSTR_TABLE, request.params.id);
        result = {};
        result['status'] = 'success';
        result['import_name'] = details['name'];
        t_status = parseInt(details['status']);
        switch (t_status) {
            case constants.IMPORT_READY:
                result['import_status'] = 'success';
                result['table_url'] = '/tables/' + details['id'] + '/show';
                result['remove_import_id'] = 1;
            break;
            case constants.IMPORT_ERROR:
                result['import_status'] = 'error';
                result['remove_import_id'] = 1;
            break;
            default:
                result['import_status'] = 'importing';
            break;
        }

        return result;
    }

    async updateStyles(request) {
        let lyr_where, lyr_details, geometry_type, validator, errors, style_generator, values, where, result;

        lyr_where = {'table_id': request.params.id};
        lyr_details = await this._db.find(constants.MSTR_LAYER, lyr_where);
        geometry_type = lyr_details['geometry_type'];
        validator = new StyleValidator(request.body, geometry_type);
        errors = validator.validate();
        if (errors.length === 0) {
            style_generator = new StyleGenerator(request.body);
            values = {};
            switch (geometry_type) {
                case 'polygon':
                    values['style'] = style_generator.polygonStyle();
                break;
                case 'linestring':
                    values['style'] = style_generator.linestringStyle();
                break;
                case 'point':
                    values['style'] = style_generator.pointStyle();
                break;
            }
            values['updated_at'] = Helper.getCurrentTimestamp();
            values['update_hash'] = Helper.hashForMapUrl();
            await this._db.update(constants.MSTR_LAYER, values, lyr_where);
            result = this.successResult({'update_hash': values['update_hash']});
        }
        else {
            result = this.errorResult(errors);
        }

        return result;
    }

    async infowindow(request) {
        let valid_count, parts, columns, i, values, where;

        columns = request.body.columns;
        valid_count = 0;
        for (i=0; i<columns.length; ++i) {
            parts = columns[i].split('.');
            if (parts.length === 1) {
                if (columns[i] === 'the_geom' || columns[i] === 'the_geom_webmercator') {
                    // nothing to do
                }
                else {
                    valid_count++;
                }
            }
        }
        if (valid_count !== columns.length) {
            return this.errorResult(['Invalid column names']);
        }

        values = {};
        values['infowindow'] = Helper.infowindowStringFromColumns(columns);
        values['updated_at'] = Helper.getCurrentTimestamp();
        where = {'table_id': request.params.id};
        await this._db.update(constants.MSTR_LAYER, values, where);

        return this.successResult();
    }

    async deleteTable(table_id) {
        let client, table_details, table_name;

        table_details = await this._db.find(constants.MSTR_TABLE, table_id);
        table_name = Helper.schemaTableFromDetails(table_details);
        client = await this._db.getClient();
        try {
            await client.beginTransaction();
            await client.deleteWhere(constants.MSTR_TABLE, {id: table_id});
            await client.genericExec('DROP TABLE IF EXISTS ' + table_name, []);
            await client.commitTransaction();
        }
        catch(e) {
            await client.rollbackTransaction();
            throw(e);
        }
        finally {
            client.release();
        }

        return this.successResult();
    }

    async addColumn(request) {
        let validator, errors, result, table_details;
        let column_name, where, count, table_name, data_type, sql;

        validator = new TableValidator(request.body);
        errors = validator.validateAddColumn();
        if (errors.length === 0) {
            table_details = await this._db.find(constants.MSTR_TABLE, request.params.id);
            column_name = request.body.name;
            where = {
                'table_schema': table_details['schema_name'],
                'table_name': table_details['table_name'],
                'column_name': column_name
            };
            count = await this._db.getCount('information_schema.columns', where);
            if (count > 0) {
                result = this.errorResult(['column with name ' + column_name + ' already exists']);
            }
            else {
                table_name = Helper.schemaTableFromDetails(table_details);
                switch (request.body.data_type) {
                    case '1': data_type = 'INTEGER';                     break;
                    case '2': data_type = 'DOUBLE PRECISION';            break;
                    case '3': data_type = 'VARCHAR';                     break;
                    case '4': data_type = 'TIMESTAMP WITHOUT TIME ZONE'; break;
                    default:  data_type = 'VARCHAR';                     break;
                }
                sql = 'ALTER TABLE ' + table_name + ' ADD COLUMN ' + column_name + ' ' + data_type;
                await this._db.genericExec(sql, []);
                result = this.successResult();
            }
        }
        else {
            result = this.errorResult(errors);
        }

        return result;
    }

    async deleteColumn(request) {
        let validator, errors, result;
        let table_details, layer_details, client, infowindow, fields, i, sql;
        let column_name, values, table_name;

        validator = new TableValidator(request.body);
        errors = validator.validateDeleteColumn();
        if (errors.length === 0) {
            table_details = await this._db.find(constants.MSTR_TABLE, request.params.id);
            layer_details = await this._db.find(constants.MSTR_LAYER, {'table_id': table_details['id']});
            infowindow = JSON.parse(layer_details['infowindow']);
            column_name = request.body.column_name;

            client = await this._db.getClient();
            try {
                client.beginTransaction();
                i = infowindow['fields'].indexOf(column_name);
                if (i >= 0) {
                    delete infowindow['fields'][i];
                }
                values = {'infowindow': JSON.stringify(infowindow)};
                await client.update(constants.MSTR_LAYER, values, {'id': layer_details['id']});

                table_name = Helper.schemaTableFromDetails(table_details);
                sql = 'ALTER TABLE ' + table_name + ' DROP COLUMN IF EXISTS "' + column_name + '"';
                await client.genericExec(sql, []);
                await client.commitTransaction();
            }
            catch (e) {
                await client.rollbackTransaction();
                throw e;
            }
            finally {
                client.release();
            }
            result = this.successResult();
        }
        else {
            result = this.errorResult(errors);
        }

        return result;
    }

    async exportTable(request) {
        let exporter, result;

        if (Exporter.isValidFormat(request.body.format)) {
            exporter = new Exporter(this._db, request.body.format);
            result = await exporter.handleExport(request.session.user_id, request.params.id);
        }
        else {
            result = this.errorResult(['Invalid format']);
        }

        return result;
    }

    async tableUserCount(table_id, user_id) {
        let where = {'id': table_id, 'user_id': user_id};
        let count = await this._db.getCount(constants.MSTR_TABLE, where);

        return count;
    }
}

module.exports = TableService;
