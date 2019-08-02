const MapController = require('../../app/controllers/map_controller.js');
const TableController = require('../../app/controllers/table_controller.js');
const TableRowController = require('../../app/controllers/table_row_controller.js');
const http = require('http');
const assert = require('assert');

class TestEjs {
    constructor() {
        this._tpl_path = '';
        this._data = {};
        this._render_options = {};
        this._callback = null;
        this._html_string = '';
        this._render_file_count = 0;
        this._render_count = 0;
    }

    renderFile(tpl_path, data, render_options, callback) {
        this._tpl_path = tpl_path;
        this._data = data;
        this._render_options = render_options;
        this._callback = callback;
        this._render_file_count++;
    }

    render(html_string, data, render_options) {
        this._html_string = html_string;
        this._data = data;
        this._render_options = render_options;
        this._render_count++;
    }

    tplPath() {
        return this._tpl_path;
    }

    data() {
        return this._data;
    }

    renderOptions() {
        return this._render_options;
    }

    callback() {
        return this._callback;
    }

    htmlString() {
        return this._html_string;
    }

    renderFileCount() {
        return this._render_file_count;
    }

    renderCount() {
        return this._render_count;
    }
}

class TestResponse {
    constructor() {
        this._response_code = 0;
        this._response_headers = {};
        this._response_body = '';
        this._write_head_count = 0;
        this._end_count = 0;
        this._redirect_url = '';
        this._redirect_count = 0;
    }

    writeHead(response_code, response_headers) {
        this._response_code = response_code;
        this._response_headers = response_headers;
        this._write_head_count = this._write_head_count + 1;
    }

    end(response_body) {
        this._response_body = response_body;
        this._end_count++;
    }

    redirect(url) {
        this._redirect_url = url;
        this._redirect_count++;
    }

    writeHeadCount(count) {
        return this._write_head_count === count;
    }

    endCount(count) {
        return this._end_count === count;
    }

    responseCode(code) {
        return this._response_code === code;
    }

    responseHeader(header, value) {
        return this._response_headers[header] && this._response_headers[header] === value;
    }

    responseBody(body) {
        return this._response_body === body;
    }

    redirectUrl(url) {
        return this._redirect_url === url;
    }

    redirectCount(count) {
        return this._redirect_count === count;
    }

    getResponseHeaders() {
        return this._response_headers;
    }
}

function error_result(errors) {
    if (! errors instanceof Array) {
        errors = [errors];
    }

    return {'status': 'error', 'errors': errors};
}

function success_result(values) {
    values['status'] = 'success';

    return values;
}

function get_test_response(sandbox) {
    let response = sandbox.createStubInstance(http.ServerResponse);
    response.writeHead.returns(null);
    response.end.returns(null);

    return response;
}

const service_class = function() {};

// returns a mock (sort of) of service class with given method_name defined
// on it returning the success result.
function get_service_class(method_name) {
  let service = new service_class();
  let result = success_result({});
  service[method_name] = function() {
    return result;
  }

  return service;
}

function test_json(controller_class, controller_method, service_method) {
  (async() => {
  let request = {};
  let response = new TestResponse();
  let service = get_service_class(service_method);
  let controller;
  switch (controller_class) {
    case 'MapController':
      controller = new MapController(service);
    break;
    case 'TableController':
      controller = new TableController(service);
    break;
    case 'TableRowController':
      controller = new TableRowController(service);
    break;
  }
  await controller[controller_method](request, response);
  let msg = 'Failed: ' + controller_class + '.' + controller_method + ' : ' + service_method;
  assert(response.responseCode(200), msg + ' [responseCode]');
  assert(response.responseHeader('Content-Type', 'application/json'), msg + 'content-type');
  })();
}

module.exports = {
    'TestEjs': TestEjs,
    'error_result': error_result,
    'success_result': success_result,
    'get_test_response': get_test_response,
    'TestResponse': TestResponse,
    'get_service_class': get_service_class,
    'test_json': test_json
};
