const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const yazl = require('yazl');
const constants = require('../helpers/constants.js');
const Helper = require('../helpers/helper.js');
const DbHelper = require('../helpers/db_helper.js');
const logger = require('../helpers/logger.js');
const errors = require('../helpers/errors.js');

const ST_IN_QUEUE =   0;
const ST_SUCCESS  =  10;
const ST_ERROR    = -10;

const SHAPE_FILE   = 10;
const CSV_FILE     = 20;
const GEOJSON_FILE = 30;
const KML_FILE     = 40;

class Exporter {
    constructor(db, format) {
        this._db = db;
        this._format = parseInt(format);
        this._id = 0;
    }

    async handleExport(user_id, table_id) {
        let extension, table_details, properties;

        extension = this._getExtension();
        table_details = await this._db.selectOne(constants.MSTR_TABLE, ['*'], {'id': table_id});
        if (table_details === null) {
            throw new errors.NakshaError('No such table');
        }

        properties = this._populateProperties(table_details, user_id, table_id);
        this._id = await this._addRecord(extension, properties['filename'], properties['hash'], user_id, table_id);
        this._otherSteps(extension, properties);

        // return status while rest of the steps in '_otherSteps' go on asynchronously
        return {'status': 'success', 'id': this._id};
    }

    async _otherSteps(extension, properties) {
        let directory, columns, query, db_conn_str, export_path;

        directory = this._createDirectory(Helper.exportsDirectory(), properties['hash']);
        columns = await this._getColumns(properties['schema_name'], properties['table_name']);
        if (columns.length === 0) {
            logger.error('No such table: ' + properties['schema_name'] + '.' + properties['table_name']);
            this._updateStatus(ST_ERROR);
            return;
        }

        query = 'SELECT ' + columns.join(', ') + ' FROM ' + properties['schema_name'] + '.' + properties['table_name'];

        export_path = path.join(directory, properties['filename'] + extension);
        switch (this._format) {
            case SHAPE_FILE:
                db_conn_str = DbHelper.dbConnStringForOgr2Ogr();
                this._doOgr2ogrExport(export_path, db_conn_str, query, 'ESRI Shapefile');
            break;
            case CSV_FILE:
                db_conn_str = DbHelper.dbConnStringForCsv();
                this._doCsvExport(export_path, db_conn_str, query);
            break;
            case GEOJSON_FILE:
                db_conn_str = DbHelper.dbConnStringForOgr2Ogr();
                this._doOgr2ogrExport(export_path, db_conn_str, query, 'GeoJSON');
            break;
            case KML_FILE:
                db_conn_str = DbHelper.dbConnStringForOgr2Ogr();
                this._doOgr2ogrExport(export_path, db_conn_str, query, 'KML');
            break;
        }
    }

    _getExtension() {
        let extension;

        switch (this._format) {
            case SHAPE_FILE:   extension = '.shp';     break;
            case CSV_FILE:     extension = '.csv';     break;
            case GEOJSON_FILE: extension = '.geojson'; break;
            case KML_FILE:     extension = '.kml';     break;
            default:
                throw new errors.NakshaError('Invalid format');
            break;
        }

        return extension;
    }

    _populateProperties(table_details, user_id, table_id) {
        let properties = {}, filename;

        filename = table_details['name'].trim();
        filename = filename.replace(/\s+/g, '_');
        filename = filename.toLowerCase();

        properties['filename'] = filename;
        properties['schema_name'] = table_details['schema_name'];
        properties['table_name'] = table_details['table_name'];
        properties['hash'] = user_id + Helper.randomString(32) + table_id;

        return properties;
    }

    async _addRecord(extension, filename, hash, user_id, table_id) {
        let values = {}, t, row;

        values['user_id'] = user_id;
        values['table_id'] = table_id;
        values['status'] = ST_IN_QUEUE;
        values['filename'] = filename;
        values['hash'] = hash;
        values['extension'] = extension;
        values['created_at'] = values['updated_at'] = Helper.getCurrentTimestamp();
        row = await this._db.insert(constants.MSTR_EXPORT, values, 'id');

        return row['id'];
    }

    _createDirectory(exports_dir, hash) {
        let directory = path.join(exports_dir, hash);
        fs.mkdirSync(directory);

        return directory;
    }

    async _getColumns(schema_name, table_name) {
        let i, tmp, columns, where;

        where = {'table_schema': schema_name, 'table_name': table_name};
        tmp = await this._db.selectWhere('information_schema.columns', ['column_name'], where);
        columns = [];
        for (i=0; i<tmp.length; ++i) {
            if (tmp[i]['column_name'] !== 'the_geom_webmercator') {
                columns.push(tmp[i]['column_name']);
            }
        }

        return columns;
    }

    _dbExportDone(code, export_path) {
        let format_str, parts, files_to_zip, filename, full_path, zipfile_path, zipfile;
        let zname, that;

        format_str = Exporter.getAvailableFormats()[this._format];
        if (code === 0) {
            parts = path.parse(export_path);
            files_to_zip = {};
            zipfile_path = export_path + '.zip';
            switch (this._format) {
                case SHAPE_FILE:
                    filename = parts.name + '.shp';
                    full_path = path.join(parts.dir, filename);
                    files_to_zip[filename] = full_path;

                    filename = parts.name + '.shx';
                    full_path = path.join(parts.dir, filename);
                    files_to_zip[filename] = full_path;

                    filename = parts.name + '.prj';
                    full_path = path.join(parts.dir, filename);
                    files_to_zip[filename] = full_path;

                    filename = parts.name + '.dbf';
                    full_path = path.join(parts.dir, filename);
                    files_to_zip[filename] = full_path;
                break;
                case CSV_FILE:
                case GEOJSON_FILE:
                case KML_FILE:
                    files_to_zip[parts.base] = export_path;
                break;
            }
            zipfile = new yazl.ZipFile();
            for (zname in files_to_zip) {
                zipfile.addFile(files_to_zip[zname], zname);
            }
            zipfile.end();
            that = this;
            zipfile.outputStream.pipe(fs.createWriteStream(zipfile_path)).on('close', function() {
                that._updateStatus(ST_SUCCESS);
                // delete all files other than zip file
                for (zname in files_to_zip) {
                    fs.unlinkSync(files_to_zip[zname]);
                }
            });
        }
        else {
            logger.error(format_str + ' export failed with code: ' + code);
            this._updateStatus(ST_ERROR);
        }
    }

    async _doOgr2ogrExport(export_path, db_conn_str, query, format_name) {
        let ogr, that;

        that = this;
        ogr = spawn('ogr2ogr', ['-f', format_name, '-fieldTypeToString', 'DateTime', export_path, db_conn_str, '-sql', query]);
        ogr.stderr.on('data', data => {
            logger.error('ogr2ogr-export-error: ' + `${data}`);
            that._updateStatus(ST_ERROR);
        });
        ogr.on('close', function(code) {
          that._dbExportDone(code, export_path);
        });
    }

    async _doCsvExport(export_path, db_conn_str, query) {
        let out_path, csv, psql_cmd, that;

        that = this;
        out_path = path.join('/tmp', path.basename(export_path));
        psql_cmd = "\\COPY (" + query + ") TO '" + out_path + "' DELIMITER ',' CSV HEADER";
        csv = spawn('psql', [db_conn_str, '-c', psql_cmd]);
        csv.stderr.on('data', data => {
            logger.error('csv-export-error: ' + `${data}`);
            that._updateStatus(ST_ERROR);
        });
        csv.on('close', function(code) {
            fs.copyFileSync(out_path, export_path);
            fs.unlinkSync(out_path);
            that._dbExportDone(code, export_path);
        });
    }

    async _updateStatus(export_status) {
        let values, where;

        values = {'status': export_status};
        where = {'id': this._id};
        await this._db.update(constants.MSTR_EXPORT, values, where);
    }

    static get ST_IN_QUEUE() {
        return ST_IN_QUEUE;
    }

    static get ST_SUCCESS() {
        return ST_SUCCESS;
    }

    static get ST_ERROR() {
        return ST_ERROR;
    }

    static get SHAPE_FILE() {
        return SHAPE_FILE;
    }

    static get CSV_FILE() {
        return CSV_FILE;
    }

    static get GEOJSON_FILE() {
        return GEOJSON_FILE;
    }

    static get KML_FILE() {
        return KML_FILE;
    }

    static getAvailableFormats() {
        var formats = {};
        formats[SHAPE_FILE] = 'ESRI Shape File';
        formats[CSV_FILE] = 'CSV File';
        formats[GEOJSON_FILE] = 'GeoJSON File';
        formats[KML_FILE] = 'KML File';

        return formats;
    }

    static isValidFormat(format) {
        let is_valid;
        if (format) {
            format = parseInt(format);
            is_valid = ([SHAPE_FILE, CSV_FILE, GEOJSON_FILE, KML_FILE].indexOf(format) >= 0);
        }
        else {
            is_valid = false;
        }

        return is_valid;
    }

    static isStatusSuccess(st) {
        st = parseInt(st);

        return st === ST_SUCCESS;
    }

    static isStatusInQueue(st) {
        st = parseInt(st);

        return st === ST_IN_QUEUE;
    }

    static typeFromExtension(extension) {
        let type;

        switch (extension) {
            case '.shp':     type = 'ESRI Shapefile'; break;
            case '.csv':     type = 'CSV';            break;
            case '.geojson': type = 'GeoJSON';        break;
            case '.kml':     type = 'KML';            break;
            default:         type = 'Unknown';        break;
        }

        return type;
    }

    static statusText(st) {
        let st_text;

        st = parseInt(st);
        switch (st) {
            case ST_IN_QUEUE: st_text = 'In Queue'; break;
            case ST_SUCCESS:  st_text = 'Success';  break;
            case ST_ERROR:    st_text = 'Error';    break;
            default:          st_text = 'Unknown';  brak;
        }

        return st_text;
    }
}

module.exports = Exporter;
