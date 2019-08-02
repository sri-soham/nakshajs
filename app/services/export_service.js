const fs = require('fs');
const path = require('path');
const BaseService = require('./base_service.js');
const constants = require('../helpers/constants.js');
const Paginator = require('../helpers/paginator.js');
const Helper = require('../helpers/helper.js');
const Exporter = require('../exporter/exporter.js');
const logger = require('../helpers/logger.js');

class ExportService extends BaseService {
    constructor(db) {
        super(db);
        this.exportStatus = this.exportStatus.bind(this);
        this.exportsOfUser = this.exportsOfUser.bind(this);
        this.download = this.download.bind(this);
        this.deleteExport = this.deleteExport.bind(this);
        this.exportUserCount = this.exportUserCount.bind(this);
    }

    async exportStatus(request) {
        let export_details, values;

        export_details = await this._db.find(constants.MSTR_EXPORT, request.params.id);
        values = {};
        values['export_status'] = export_details['status'];
        values['export_name'] = export_details['filename'];
        if (Exporter.isStatusSuccess(export_details['status'])) {
            values['download_url'] = '/exports/' + request.params.id + '/download';
        }
        if (Exporter.isStatusInQueue(export_details['status'])) {
            values['remove_export_id'] = false;
        }
        else {
            values['remove_export_id'] = true;
        }

        return this.successResult(values);
    }

    async exportsOfUser(request) {
        let page, per_page, offset, where, tmp, count, exports, exp, i, paginator;

        if (request.query.page) {
            page = parseInt(request.query.page);
            if (page < 1) {
                page = 1;
            }
        }
        else {
            page = 1;
        }
        per_page = 20;
        offset = (page - 1) * per_page;
        where = {'user_id': request.session.user_id};
        tmp = await this._db.selectWhere(constants.MSTR_EXPORT, ['*'], where, 'filename', per_page, offset);
        count = await this._db.getCount(constants.MSTR_EXPORT, where);
        exports = [];
        for (i=0; i<tmp.length; ++i) {
            exp = {};
            exp['name'] = this._nameFromFilename(tmp[i]['filename']);
            exp['type'] = Exporter.typeFromExtension(tmp[i]['extension']);
            exp['status'] = Exporter.statusText(tmp[i]['status']);
            if (Exporter.isStatusSuccess(tmp[i]['status'])) {
                exp['download_link'] = '<a href="/exports/' + tmp[i]['id'] + '/download" target="_blank">Download</a>';
            }
            else {
                exp['download_link'] = 'N/A';
            }
            exp['created_at'] = Helper.dateForView(tmp[i]['created_at']);
            exp['updated_at'] = Helper.dateForView(tmp[i]['updated_at']);
            exp['id'] = tmp[i]['id'];

            exports.push(exp);
        }

        paginator = new Paginator(count, per_page, page, 4);

        return this.successResult({
            'exports': exports,
            'pagination_links': paginator.links('/exports/index?page={page}'),
            'pagination_text': paginator.text()
        });
    }

    async download(id, exports_dir) {
        let export_details, export_path, result;

        export_details = await this._db.find(constants.MSTR_EXPORT, id);
        export_path = path.join(exports_dir, export_details['hash'], export_details['filename'] + export_details['extension'] + '.zip');
        if (fs.existsSync(export_path)) {
            result = this.successResult({
                'file_path': export_path,
                'content_type': 'application/zip',
                'file_name': path.basename(export_path)
            });
        }
        else {
            result = this.errorResult(['File does not exist']);
        }

        return result;
    }

    async deleteExport(request, exports_dir) {
        let export_details, export_path, file_path;

        export_details = await this._db.selectOne(constants.MSTR_EXPORT, ['*'], {'id': request.params.id});
        if (export_details === null) {
            return this.errorResult(['No such record']);
        }
        export_path = path.join(exports_dir, export_details['hash']);
        await this._db.deleteWhere(constants.MSTR_EXPORT, {'id': request.params.id});
        fs.stat(export_path, function(err, stats) {
            if (err) {
                logger.error(err);
            }
            else {
                fs.readdir(export_path, function(err, files) {
                    files.forEach(function(file, index) {
                        file_path = path.join(export_path, file);
                        fs.unlinkSync(file_path);
                    });
                    fs.rmdirSync(export_path);
                });
            }
        });

        return this.successResult();
    }

    async exportUserCount(export_id, user_id) {
        let count = await this._db.getCount(constants.MSTR_EXPORT, {'id': export_id, 'user_id': user_id});

        return count;
    }

    _nameFromFilename(filename) {
        let parts, tmp, i;

        filename = filename.trim();
        tmp = filename.split('_');
        parts = [];
        for (i=0; i<tmp.length; ++i) {
            parts.push(tmp[i][0].toUpperCase() + tmp[i].substring(1));
        }

        return parts.join(' ');
    }
}

module.exports = ExportService;
