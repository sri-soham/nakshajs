let express = require('express');
let BaseController = require('./base_controller.js');
const constants = require('../helpers/constants.js');

class TableController extends BaseController {
    constructor(table_service) {
        super();
        this._table_service = table_service;
        this.add = this.add.bind(this);
        this.addPost = this.addPost.bind(this);
        this.show = this.show.bind(this);
        this.tableStatus = this.tableStatus.bind(this);
        this.stylesPost = this.stylesPost.bind(this);
        this.infowindowPost = this.infowindowPost.bind(this);
        this.deleteTable = this.deleteTable.bind(this);
        this.addColumn = this.addColumn.bind(this);
        this.deleteColumn = this.deleteColumn.bind(this);
        this.exportPost = this.exportPost.bind(this);
    }

    setTableService(table_service) {
        this._table_service = table_service;
    }

    authAuth() {
        let that = this;

        return async(request, response, next) => {
            if (that._isUserLoggedIn(request)) {
                let parts = request.path.split('/');
                let action = parts.pop();
                switch (action) {
                    case 'show':
                    case 'status':
                    case 'styles':
                    case 'infowindow':
                    case 'delete':
                    case 'add_column':
                    case 'delete_column':
                    case 'api_access':
                    case 'export':
                        let id = parts.pop();
                        let count = await that._table_service.tableUserCount(id, request.session.user_id);
                        if (count == 1) {
                            next();
                        }
                        else {
                            that._errorUnauthorizedRequest(response);
                        }
                    break;
                    case 'add':
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

    async add(request, response) {
        let js, css;

        js = ['libs/jquery-ui.1.12.1/jquery-ui.min.js'];
        css = ['libs/jquery-ui.1.12.1/jquery-ui.min.css'];
        this._renderTemplate(request, response, 'tables/add.ejs', {'js': js, 'css': css});
    }

    async addPost(request, response) {
        let result = await this._table_service.addTable(request);
        if (this._isSuccessResult(result)) {
            if ('id' in result) {
                if (request.session.hasOwnProperty(constants.SESSION_IMPORTS_KEY)) {
                    request.session[constants.SESSION_IMPORTS_KEY].push(result.id);
                }
                else {
                    request.session[constants.SESSION_IMPORTS_KEY] = [result.id];
                }
            }
            this._renderJson(response, result);
        }
        else {
            this._renderJson(response, result);
        }
    }

    async show(request, response) {
        let result = await this._table_service.tableDetails(request);
        result['js'] = ['js/table.js', 'js/table_admin.js'];
        this._renderTemplate(request, response, 'tables/show.ejs', result);
    }

    async tableStatus(request, response) {
        let result = await this._table_service.tableStatus(request);
        if (this._isSuccessResult(result)) {
            if ('remove_import_id' in result) {
                let tmp = request.session[constants.SESSION_IMPORTS_KEY];
                let i = tmp.indexOf(parseInt(request.params.id));
                if (i >= 0) {
                    tmp.splice(i, 1);
                    request.session[constants.SESSION_IMPORTS_KEY] = tmp;
                }
            }
        }
        this._renderJson(response, result);
    }

    async stylesPost(request, response) {
        let result = await this._table_service.updateStyles(request);
        this._renderJson(response, result);
    }

    async infowindowPost(request, response) {
        let result = await this._table_service.infowindow(request);
        this._renderJson(response, result);
    }

    async deleteTable(request, response) {
        let result = await this._table_service.deleteTable(request.params.id);
        this._renderJson(response, result);
    }

    async addColumn(request, response) {
        let result = await this._table_service.addColumn(request);
        this._renderJson(response, result);
    }

    async deleteColumn(request, response) {
        let result = await this._table_service.deleteColumn(request);
        this._renderJson(response, result);
    }

    async exportPost(request, response) {
        let result = await this._table_service.exportTable(request);
        if (this._isSuccessResult(result)) {
            if ('id' in result) {
                if (request.session.hasOwnProperty(constants.SESSION_EXPORTS_KEY)) {
                    request.session[constants.SESSION_EXPORTS_KEY].push(result.id);
                }
                else {
                    request.session[constants.SESSION_EXPORTS_KEY] = [result.id];
                }
            }
        }
        this._renderJson(response, result);
    }
}

module.exports = TableController;

