const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const yauzl = require('yauzl');
const csv_parser = require('csv-parser');
const Helper = require('../helpers/helper.js');
const DbHelper = require('../helpers/db_helper.js');
const constants = require('../helpers/constants.js');
const ZipFile = require('./zip_file.js');
const logger = require('../helpers/logger.js');
const errors = require('../helpers/errors.js');

class Importer {
    constructor(request, db) {
        this._request = request;
        this._db = db;
    }

    async handleAddTable() {
        let url, id;

        if (this._request.query.is_empty && this._request.query.is_empty == '1') {
            url = await this._handleCreateEmptyTable();
            return {'status': 'success', 'url': url};
        }
        else {
            if (this._request.files && this._request.files.file && !this._request.files.file.truncated) {
                try {
                    id = await this._handleFileUpload();
                    return {'status': 'success', 'id': id};
                } catch(err) {
                    return {'status': 'error', 'errors': [err.message]};
                }
            }
            else {
                return {'status': 'error', 'errors': ['File is not uploaded or has been truncated']};
            }
        }

    }

    async _handleCreateEmptyTable() {
        let name, user_id, schema_name, table_name, id;

        name = this._request.body.name;
        user_id = this._request.session.user_id;
        schema_name = this._request.session.schema_name;
        table_name = await this._tableNameForImport(user_id, name);
        id = await this._addTable(name, schema_name, table_name, user_id);
        await this._createEmptyTable(id, schema_name + '.' + table_name);
        await this._prepareTable(id, schema_name + '.' + table_name);
        await this._updateStatus(id, constants.IMPORT_READY);

        return '/tables/' + id + '/show';
    }

    async _handleFileUpload() {
        let directory_name, ext, full_path, filename;
        let name, user_id, schema_name, table_name, id, schema_table, zip_file;

        directory_name = path.resolve(Helper.importsDirectory(), Helper.randomString(16) + '_' + Math.round(new Date().getTime()/1000));
        fs.mkdirSync(directory_name);
        ext = path.extname(this._request.files.file.name);
        if (['.zip', '.csv', '.kml', '.json', '.geojson'].indexOf(ext) < 0) {
            throw new errors.NakshaError('Only zip, csv, kml and geojson files are allowed');
        }
        full_path = path.resolve(directory_name, 'tmp' + ext);
        try {
            await this._request.files.file.mv(full_path);
            if (ext === '.zip') {
                zip_file = new ZipFile();
                filename = await zip_file.process(full_path);
            }
            else {
                filename = path.basename(full_path);
            }
            name = this._request.body.name;
            user_id = this._request.session.user_id;
            schema_name = this._request.session.schema_name;
            table_name = await this._tableNameForImport(user_id, name);
            schema_table = schema_name + '.' + table_name;
            id = await this._addTable(name, schema_name, table_name, user_id);

            try {
                ext = path.extname(filename).toLowerCase();
                full_path = path.resolve(directory_name, filename);
                switch (ext) {
                    case '.kml':
                    case '.shp':
                    case '.json':
                    case '.geojson':
                        this._ogr2ogrImport(full_path, id, schema_table);
                    break;
                    case '.csv':
                        this._csvImport(full_path, id, schema_table);
                    break;

                }
                return id;
            } catch(err) {
                await this._updateStatus(id, constants.IMPORT_ERROR);
                throw(err);
            }
        } catch(err2) {
            throw(err2);
        }
    }

    async _ogr2ogrImport(path_to_file, table_id, table_name) {
        let conn_str, ogr;

        conn_str = DbHelper.dbConnStringForOgr2Ogr();

        ogr = spawn('ogr2ogr', ['-f', 'PostgreSQL', conn_str, path_to_file, '-nln', table_name, '-nlt', 'PROMOTE_TO_MULTI', '-lco', 'GEOMETRY_NAME=the_geom', '-lco', 'FID='+ constants.PRIMARY_KEY, '-t_srs', 'EPSG:4326']);

        ogr.stderr.on('data', data => {
            logger.error(`error: ${data}`);
            this._updateStatus(table_id, constants.IMPORT_ERROR);
        });
        ogr.on('close', (async (code) => {
            if (code === 0) {
                await this._updateStatus(table_id, constants.IMPORT_IMPORTED);
                await this._prepareTable(table_id, table_name);
                await this._updateStatus(table_id, constants.IMPORT_READY);
                await this._deleteImportDirectory(path.dirname(path_to_file));
            }
            else {
                logger.error('import failed with code: ' + code);
                await this._updateStatus(table_id, constants.IMPORT_ERROR);
            }
        }));
    }

    async _csvImport(path_to_file, table_id, table_name) {
        let columns, conn_str, csv, psql_copy;

        columns = await this._getCsvColumns(path_to_file);
        if (columns.indexOf('the_geom') < 0) {
            columns.push('the_geom');
        }

        await this._createCsvTable(table_name, columns);

        conn_str = DbHelper.dbConnStringForCsv();
        psql_copy = '\\COPY ' + table_name + ' FROM ' + path_to_file + " WITH CSV HEADER DELIMITER AS ','";
        csv = spawn('psql', [conn_str, '-c', psql_copy]);
        csv.stderr.on('data', data => {
            logger.error(`error: ${data}`);
            this._updateStatus(table_id, constants.IMPORT_ERROR);
        });
        csv.on('close', (async (code) => {
            if (code === 0) {
                await this._updateStatus(table_id, constants.IMPORT_IMPORTED);
                await this._prepareCsv(table_name);
                await this._prepareTable(table_id, table_name);
                await this._updateStatus(table_id, constants.IMPORT_READY);
                await this._deleteImportDirectory(path.dirname(path_to_file));
            }
            else {
                logger.error('import failed with code: ' + code);
                await this._updateStatus(table_id, constants.IMPORT_ERROR);
            }
        }));
    }

    async _tableNameForImport(user_id, name) {
        let new_name, sql, rows, parts, last, tmp;

        new_name = name.toLowerCase().trim();
        new_name = new_name.replace(/[^a-z0-9]+/g, '_'); // replace non alpha-numeric characters with underscore
        new_name = new_name.replace(/_+/g, '_'); // replace multiple underscores with one
        new_name = new_name.trim(); // remove leading and trailing underscores
        new_name = new_name.substring(0, 59);

        sql = 'SELECT * FROM ' + constants.MSTR_TABLE + ' WHERE user_id = $1 AND table_name LIKE $2 ORDER BY id DESC LIMIT 1';
        rows = await this._db.genericSelect(sql, [user_id, new_name + '%']);
        if (rows.length > 0) {
            parts = rows[0]['table_name'].split('_');
            if (parts.length > 1) {
                last = parts.pop();
                if (last.replace(/\d+/g, '').length === 0) {
                    // last part contains only digits.
                    tmp = parseInt(last);
                    tmp++;
                    new_name = parts.join('_') + '_' + tmp;
                }
                else {
                    // last part is not a digit.
                    new_name += '_0';
                }
            }
            else {
                new_name += '_0';
            }
        }
        else {
            // no tables with given name, return the name as is
        }

        return new_name;
    }

    async _addTable(name, schema_name, table_name, user_id) {
        let values, res;

        values = {
            'user_id': user_id,
            'name': name,
            'schema_name': schema_name,
            'table_name': table_name,
            'status': constants.IMPORT_UPLOADED
        };
        res = await this._db.insert(constants.MSTR_TABLE, values, 'id');

        return res['id'];
    }

    async _getCsvColumns(path_to_file) {
        return new Promise(function(resolve, reject) {
            fs.createReadStream(path_to_file)
              .pipe(csv_parser())
              .on('headers', (headers) => {
                resolve(headers);
              });
        });
    }

    async _createEmptyTable(id, table_name) {
        let sql;

        sql = 'CREATE TABLE ' + table_name + ' ( ' +
              '  ' + constants.PRIMARY_KEY + ' SERIAL4 NOT NULL, ' +
              ' the_geom Geometry(Geometry, 4326), ' +
              ' PRIMARY KEY(' + constants.PRIMARY_KEY + ') ' +
              ');';
        await this._db.genericExec(sql, []);
    }

    async _createCsvTable(table_name, columns) {
        let i, query, parts, has_the_geom;

        query = 'CREATE TABLE ' + table_name + ' (\n';
        parts = [];
        has_the_geom = false;
        for (i=0; i<columns.length; ++i) {
            switch (columns[i]) {
                case 'the_geom':
                    has_the_geom = true;
                    parts.push('the_geom Geometry(Geometry, 4326)');
                break;
                case 'naksha_id':
                    parts.push('naksha_id INTEGER NOT NULL');
                break;
                default:
                    parts.push(columns[i] + ' TEXT');
                break;
            }
        }
        if (!has_the_geom) {
            parts.push('the_geom Geometry(Geometry, 4326)');
        }
        query += parts.join(',\n  ');
        query += ');';

        await this._db.genericExec(query, []);
    }

    async _prepareTable(id, table_name) {
        let sql, hash;

        hash = Helper.hashForMapUrl();
        sql = 'SELECT public.naksha_prepare_table($1, $2, $3)';
        await this._db.genericExec(sql, [id, table_name, hash]);
    }

    async _prepareCsv(schema_table) {
        let parts, sql;

        parts = schema_table.split('.');
        sql = 'SELECT public.naksha_prepare_csv($1, $2)';
        await this._db.genericExec(sql, parts);
    }

    async _updateStatus(id, import_status) {
        let where, values;

        where = {'id': id};
        values = {'status': import_status};
        this._db.update(constants.MSTR_TABLE, values, where);
    }

    async _deleteImportDirectory(dir_path) {
        if (fs.existsSync(dir_path)) {
            fs.readdirSync(dir_path).forEach(function(file, index) {
                fs.unlinkSync(path.join(dir_path, file))
            })
            fs.rmdirSync(dir_path);
        }
    }
}

module.exports = Importer;
