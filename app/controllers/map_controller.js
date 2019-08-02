let express = require('express');
let BaseController = require('./base_controller.js');

class MapController extends BaseController {
    constructor(map_service) {
        super();
        this._map_service = map_service;
        this.index = this.index.bind(this);
        this.addPost = this.addPost.bind(this);
        this.show = this.show.bind(this);
        this.editPost = this.editPost.bind(this);
        this.deletePost = this.deletePost.bind(this);
        this.baseLayerPost = this.baseLayerPost.bind(this);
        this.searchTables = this.searchTables.bind(this);
        this.addLayerPost = this.addLayerPost.bind(this);
        this.deleteLayerPost = this.deleteLayerPost.bind(this);
        this.hashPost = this.hashPost.bind(this);
    }

    setMapService(map_service) {
        this._map_service = map_service;
    }

    authAuth() {
        let that = this;

        return async(request, response, next) => {
            if (that._isUserLoggedIn(request)) {
                let parts = request.path.split('/');
                let action = parts.pop();
                switch (action) {
                    case 'show':
                    case 'edit':
                    case 'delete':
                    case 'base_layer':
                    case 'search_tables':
                    case 'add_layer':
                    case 'delete_layer':
                    case 'hash':
                        let id = parts.pop();
                        let count = await that._map_service.mapUserCount(id, request.session.user_id);
                        if (count == 1) {
                            next();
                        }
                        else {
                            that._errorUnauthorizedRequest(response);
                        }
                    break;
                    case 'index':
                    case 'new':
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

    async index(request, response) {
        let result = await this._map_service.userMaps(request);
        this._renderTemplate(request, response, 'maps/index.ejs', result);
    }

    async addPost(request, response) {
        let result = await this._map_service.addMap(request);
        this._renderJson(response, result);
    }

    async show(request, response) {
        let js, css;

        let result = await this._map_service.mapDetails(request);
        result['js'] = ['libs/jquery-ui.1.12.1/jquery-ui.min.js', 'js/map_admin.js'];
        result['css'] = ['libs/jquery-ui.1.12.1/jquery-ui.min.css'];
        this._renderTemplate(request, response, 'maps/show.ejs', result);
    }

    async editPost(request, response) {
        let result = await this._map_service.editMap(request);
        this._renderJson(response, result);
    }

    async deletePost(request, response) {
        let result = await this._map_service.deleteMap(request);
        this._renderJson(response, result);
    }

    async baseLayerPost(request, response) {
        let result = await this._map_service.updateBaseLayer(request);
        this._renderJson(response, result);
    }

    async searchTables(request, response) {
        let result = await this._map_service.searchTables(request);
        this._renderJson(response, result);
    }

    async addLayerPost(request, response) {
        let result = await this._map_service.addLayer(request);
        this._renderJson(response, result);
    }

    async deleteLayerPost(request, response) {
        let result = await this._map_service.deleteLayer(request);
        this._renderJson(response, result);
    }

    async hashPost(request, response) {
        let result = await this._map_service.updateHash(request);
        this._renderJson(response, result);
    }
}

module.exports = MapController;

