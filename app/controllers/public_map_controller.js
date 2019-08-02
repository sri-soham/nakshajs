let express = require('express');
let BaseController = require('./base_controller.js');
const constants = require('../helpers/constants.js');

class PublicMapController extends BaseController {
    constructor(public_map_service) {
        super();
        this._public_map_service = public_map_service;
        this.showMap = this.showMap.bind(this);
        this.queryData = this.queryData.bind(this);
        this.layerOfTable = this.layerOfTable.bind(this);
    }

    setPublicMapService(public_map_service) {
        this._public_map_service = public_map_service;
    }

    async showMap(request, response) {
        let result = await this._public_map_service.mapDetailsForDisplay(request);
        if (this._isSuccessResult(result)) {
            this._renderTemplate(request, response, 'index/map.ejs', result);
        }
        else {
            this._renderError(request, response, {'errors': ['No such map']});
        }
    }

    async queryData(request, response) {
        let result = await this._public_map_service.queryData(request);
        if (this._isSuccessResult(result)) {
            let response_str = JSON.stringify(result);
            if (request.query && request.query.callback && request.query.callback.length > 0) {
                response_str = request.query.callback + '(' + response_str + ')';
            }
            response.writeHead(200, {'Content-Type': 'application/javascript'});
            response.end(response_str);
        }
        else {
            this._renderJson(response, result);
        }
    }

    async layerOfTable(request, response) {
        let result = await this._public_map_service.layerOfTable(request);
        if (this._isSuccessResult(result)) {
            let response_str = JSON.stringify(result);
            if (request.query && request.query.callback && request.query.callback.length > 0) {
                response_str = request.query.callback + '(' + response_str + ')';
            }
            response.writeHead(200, {'Content-Type': 'application/javascript'});
            response.end(response_str);
        }
        else {
            this._renderJson(response, result);
        }
    }
}

module.exports = PublicMapController;

