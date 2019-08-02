let express = require('express');
const logger = require('../helpers/logger.js');

let BaseController = require('./base_controller.js');

class IndexController extends BaseController {
    constructor(user_service, table_service) {
        super();
        this._user_service = user_service;
        this._table_service = table_service;

        this.index = this.index.bind(this);
        this.indexPost = this.indexPost.bind(this);
        this.dashboard = this.dashboard.bind(this);
        this.logout = this.logout.bind(this);
        this.profile = this.profile.bind(this);
        this.profilePost = this.profilePost.bind(this);
        this.changePasswordPost = this.changePasswordPost.bind(this);
    }

    setUserService(user_service) {
        this._user_service = user_service;
    }

    setTableService(table_service) {
        this._table_service = table_service;
    }

    authAuth() {
        let that = this;

        return function(request, response, next) {
            let is_valid = false;
            if (['/dashboard', '/profile', '/logout', '/change_password'].indexOf(request.path) >= 0) {
                if (that._isUserLoggedIn(request)) {
                    is_valid = true;
                }
                else {
                    that._errorUnauthorizedRequest(response);
                }
            }
            else {
                is_valid = true;
            }
            if (is_valid) {
                next();
            }
        };
    }

    async index(request, response) {
        this._renderTemplate(request, response, 'index/index.ejs', {});
    }

    async indexPost(request, response) {
        let result = await this._user_service.login(request);
        if (this._isSuccessResult(result)) {
            request.session.user_id = result.user.id;
            request.session.schema_name = result.user.schema_name;
            request.session.save();
            response.redirect('/dashboard');
        }
        else {
            this._renderTemplate(request, response, 'index/index.ejs', result);
        }
    }

    async dashboard(request, response) {
        let result = await this._table_service.tablesForDashboard(request);
        result['js'] = ['js/dashboard.js'];
        this._renderTemplate(request, response, 'index/dashboard.ejs', result);
    }

    async profile(request, response) {
        let result = await this._user_service.userById(request.session.user_id);
        result['js'] = ['js/user.js'];
        this._renderTemplate(request, response, 'index/profile.ejs', result);
    }

    async profilePost(request, response) {
        let result = await this._user_service.updateMapKeys(request);
        this._renderJson(response, result);
    }

    async changePasswordPost(request, response) {
        let result = await this._user_service.changePassword(request);
        this._renderJson(response, result);
    }

    async logout(request, response) {
        let that = this;
        request.session.destroy(function(err) {
            if (err) {
                logger.error(err);
            }
            else {
                response.clearCookie(process.env.COOKIE_NAME);
                response.redirect('/');
            }
        });
    }
}

module.exports = IndexController;

