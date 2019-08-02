let express = require('express');
let fs = require('fs');
let BaseController = require('./base_controller.js');
const constants = require('../helpers/constants.js');
const Helper = require('../helpers/helper.js');

class ExportController extends BaseController {
    constructor(export_service) {
        super();
        this._export_service = export_service;
        this.exportStatus = this.exportStatus.bind(this);
        this.download = this.download.bind(this);
        this.index = this.index.bind(this);
        this.deletePost = this.deletePost.bind(this);
    }

    setExportService(export_service) {
        this._export_service = export_service;
    }

    authAuth() {
        let that = this;

        return async(request, response, next) => {
            if (that._isUserLoggedIn(request)) {
                let parts = request.path.split('/');
                let action = parts.pop();
                switch (action) {
                    case 'status':
                    case 'download':
                    case 'delete':
                        let id = parts.pop();
                        let count = await that._export_service.exportUserCount(id, request.session.user_id);
                        if (count == 1) {
                            next();
                        }
                        else {
                            that._errorUnauthorizedRequest(response);
                        }
                    break;
                    case 'index':
                        next();
                    break;
                    default:
                        that._errorUnauthorizedRequest(response);
                    break;
                }
            }
            else {
                that._errorUnauthorizedRequest(response);
            }
        };
    }

    async exportStatus(request, response) {
        let that = this;

        let result = await this._export_service.exportStatus(request);
        if (result['remove_export_id'] === true) {
            let tmp = request.session[constants.SESSION_EXPORTS_KEY];
            let i = tmp.indexOf(parseInt(request.params.id));
            if (i >= 0) {
                tmp.splice(i, 1);
                request.session[constants.SESSION_EXPORTS_KEY] = tmp;
            }
        }
        this._renderJson(response, result);
    }

    async download(request, response) {
        let result = await this._export_service.download(request.params.id, Helper.exportsDirectory());
        if (this._isSuccessResult(result)) {
            let headers = {};
            headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
            headers['Pragma'] = 'no-cache';
            headers['Expires'] = 'Sat, 01 Jan 1994 00:10:20 GMT';
            headers['Content-Type'] = result['content_type'];
            headers['Content-Disposition'] = 'attachment; filename="' + result['file_name'] + '"';
            response.writeHead(200, headers);
            let export_stream = fs.createReadStream(result['file_path']);
            export_stream.pipe(response);
        }
        else {
            this._renderError(request, response, result);
        }
    }

    async index(request, response) {
        let result = await this._export_service.exportsOfUser(request);
        result['js'] = ['js/export.js'];
        this._renderTemplate(request, response, 'exports/index.ejs', result);
    }

    async deletePost(request, response) {
        let result = await this._export_service.deleteExport(request, Helper.exportsDirectory());
        this._renderJson(response, result);
    }
}

module.exports = ExportController;

