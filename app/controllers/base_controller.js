const constants = require('../helpers/constants.js');
const logger = require('../helpers/logger.js');

class BaseController {
    constructor() {
        this._ejs = require('ejs');
        this._views_dir = __dirname + '/../views/';
        this._render_options = {
            cache: true,
            root: __dirname + '/../views'
        };

        this._renderTemplate = this._renderTemplate.bind(this);
        this._renderHtml = this._renderHtml.bind(this);
        this._renderText = this._renderText.bind(this);
        this._renderJson = this._renderJson.bind(this);
        this._renderError = this._renderError.bind(this);
        this._errorNotFound = this._errorNotFound.bind(this);
        this._errorInternalServerError = this._errorInternalServerError.bind(this);
        this._errorUnauthorizedRequest = this._errorUnauthorizedRequest.bind(this);
        this.setEjs = this.setEjs.bind(this);
    }

    _renderTemplate(request, response, tpl_path, data) {
        response.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
        if (tpl_path[0] === '/') {
            tpl_path = tpl_path.substring(1);
        }
        var that = this;
        if (request.session) {
            if (request.session.user_id) {
                data['_session_user_id'] = request.session.user_id;
                if (request.session[constants.SESSION_EXPORTS_KEY]) {
                    data['_session_export_ids'] = JSON.stringify(request.session[constants.SESSION_EXPORTS_KEY]);
                }
                else {
                    data['_session_export_ids'] = '[]';
                }
                if (request.session[constants.SESSION_IMPORTS_KEY]) {
                    data['_session_import_ids'] = JSON.stringify(request.session[constants.SESSION_IMPORTS_KEY]);
                }
                else {
                    data['_session_import_ids'] = '[]';
                }
            }
        }
        data['_h_asset_url'] = _asset_url;
        data['_h_asset_js'] = _asset_js;
        data['_h_asset_css'] = _asset_css;
        data['_h_asset_img'] = _asset_img;

        this._ejs.renderFile(this._views_dir + tpl_path, data, this._render_options, function(err, str) {
            if (err) {
                logger.error(err.message);
                that._errorInternalServerError(response);
            }
            else {
                response.end(str);
            }
        });
    }

    _renderError(request, response, data) {
        this._renderTemplate(request, response, 'common/error.ejs', data);
    }

    _renderHtml(response, html_string, data) {
        response.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
        let str = this._ejs.render(html_string, data, this._render_options);
        response.end(str);
    }

    _renderText(response, txt, response_code) {
        if (!response_code) {
            response_code = 200;
        }
        response.writeHead(response_code, {'Content-Type': 'text/plain'});
        response.end(txt);
    }

    _renderJson(response, json) {
        response.writeHead(200, {'Content-Type': 'application/json'});
        let txt = JSON.stringify(json);
        response.end(txt);
    }

    _errorNotFound(response) {
        response.writeHead(404, {'Content-Type': 'text/plain'});
        response.end('Resource not found');
    }

    _errorInternalServerError(response) {
        response.writeHead(503, {'Content-Type': 'text/plain'});
        response.end('Internal Server Error');
    }

    _errorUnauthorizedRequest(response) {
        response.writeHead(401, {'Content-Type': 'text/plain'});
        response.end('Unauthorized request');
    }

    _isSuccessResult(result) {
        return result['status'] === 'success';
    }

    _isUserLoggedIn(request) {
        return (request && request.session && request.session.user_id && request.session.user_id > 0);
    }

    setEjs(ejs) {
        this._ejs = ejs;
    }
};

function _asset_url(url_part) {
    let parts = url_part.split('/');
    if (parts[0] === 'libs') {
        return '/assets/' + url_part;
    }
    else {
        return '/assets/_' + process.env.ASSET_RANDOM_STR + '/' + url_part;
    }
}

function _asset_js(url_part) {
    return '<script type="text/javascript" src="' + _asset_url(url_part) + '"></script>';
}

function _asset_css(url_part) {
    return '<link type="text/css" rel="stylesheet" href="' + _asset_url(url_part) + '" />';
}

function _asset_img(url, alt, options) {
    let tag = '<img src="/assets/_' + process.env.ASSET_RANDOM_STR + '/images/' + url + '" ';
    if (alt && alt.length > 0) {
        tag += 'alt="' + alt + '" ';
    }
    else {
        tag += 'alt="image" ';
    }
    if (options) {
        for (let k in options) {
            tag += k + '="' + options[k] + '" ';
        }
    }
    tag += '/>';

    return tag;
}

module.exports = BaseController;

