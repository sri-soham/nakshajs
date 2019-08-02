const express = require('express');
let BaseController = require('./base_controller.js');

class TableRowController extends BaseController {
    constructor(table_row_service) {
        super();
        this._table_row_service = table_row_service;
        this.data = this.data.bind(this);
        this.addPost = this.addPost.bind(this);
        this.update = this.update.bind(this);
        this.show = this.show.bind(this);
        this.deletePost = this.deletePost.bind(this);
    }

    setTableRowService(table_row_service) {
        this._table_row_service = table_row_service;
    }

    authAuth() {
        let that = this;

        return async(request, response, next) => {
            if (that._isUserLoggedIn(request)) {
                let parts = request.path.split('/');
                parts.shift();
                let table_id = parts.shift();
                let count = await that._table_row_service.tableUserCount(table_id, request.session.user_id);
                if (count == 1) {
                    next();
                }
                else {
                    that._errorUnauthorizedRequest(response);
                }
            }
            else {
                that._errorUnauthorizedRequest(response);
            }
        };
    }

    async data(request, response) {
        let result = await this._table_row_service.data(request);
        this._renderJson(response, result);
    }

    async addPost(request, response) {
        let result = await this._table_row_service.addRow(request);
        this._renderJson(response, result);
    }

    async update(request, response) {
        let result = await this._table_row_service.updateRow(request);
        this._renderJson(response, result);
    }

    async show(request, response) {
        let result = await this._table_row_service.show(request);
        this._renderJson(response, result);
    }

    async deletePost(request, response) {
        let result = await this._table_row_service.deleteRow(request);
        this._renderJson(response, result);
    }
}

module.exports = TableRowController;

