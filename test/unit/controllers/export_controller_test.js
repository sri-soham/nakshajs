const ExportController = require('../../../app/controllers/export_controller.js');
const ExportService = require('../../../app/services/export_service.js');
const sandbox = require('sinon').createSandbox();
const assert = require('assert');
const constants = require('../../../app/helpers/constants.js');
const ControllerHelper = require('../../helpers/controller_helper.js');
const fs = require('fs');

describe('ExportController', function() {
  afterEach(function() {
    sandbox.restore();
  });

  describe('#authAuth', function() {
    it('should return 401 when not logged in', async() => {
      let request = {};
      let response = new ControllerHelper.TestResponse();
      let next = sandbox.fake();

      let controller = new ExportController({}, {});
      let result = controller.authAuth();
      await result(request, response, next);
      assert(next.notCalled);
      assert(response.writeHeadCount(1));
      assert(response.endCount(1));
      assert(response.responseCode(401));
    });
    it('should call next when logged in for /index', async() => {
      let request = {'session': {'user_id': 1}, 'path': '/index'};
      let response = new ControllerHelper.TestResponse();
      let next = sandbox.fake();

      let controller = new ExportController({}, {});
      let result = controller.authAuth();
      await result(request, response, next);
      assert(response.writeHeadCount(0));
      assert(response.endCount(0));
      assert(next.calledOnce);
    });
    it('should return 401 when user requests for status of export they do not own', async() => {
      let request = {'session': {'user_id': 1}, 'path': '/1/status', 'params':  {'id': 1}};
      let response = new ControllerHelper.TestResponse();
      let service = sandbox.createStubInstance(ExportService);
      service.exportUserCount.returns(0);
      let next = sandbox.fake();

      let controller = new ExportController(service, {});
      let result = controller.authAuth();
      await result(request, response, next);
      assert(next.notCalled);
      assert(response.writeHeadCount(1));
      assert(response.endCount(1));
      assert(response.responseCode(401));
    });
    it('should call next when user requests for status of export they own', async() => {
      let request = {'session': {'user_id': 1}, 'path': '/1/status', 'params':  {'id': 1}};
      let response = new ControllerHelper.TestResponse();
      let service = sandbox.createStubInstance(ExportService);
      service.exportUserCount.returns(1);
      let next = sandbox.fake();

      let controller = new ExportController(service, {});
      let result = controller.authAuth();
      await result(request, response, next);
      assert(next.calledOnce);
      assert(response.writeHeadCount(0));
      assert(response.endCount(0));
    });
    it('should return 401 when user tries to delete an export they do not own', async() => {
      let request = {'session': {'user_id': 1}, 'path': '/1/delete', 'params':  {'id': 1}};
      let response = new ControllerHelper.TestResponse();
      let service = sandbox.createStubInstance(ExportService);
      service.exportUserCount.returns(0);
      let next = sandbox.fake();

      let controller = new ExportController(service, {});
      let result = controller.authAuth();
      await result(request, response, next);
      assert(next.notCalled);
      assert(response.writeHeadCount(1));
      assert(response.endCount(1));
      assert(response.responseCode(401));
    });
    it('should call next when user wants to delete an export they own', async() => {
      let request = {'session': {'user_id': 1}, 'path': '/1/delete', 'params':  {'id': 1}};
      let response = new ControllerHelper.TestResponse();
      let service = sandbox.createStubInstance(ExportService);
      service.exportUserCount.returns(1);
      let next = sandbox.fake();

      let controller = new ExportController(service, {});
      let result = controller.authAuth();
      await result(request, response, next);
      assert(next.calledOnce);
      assert(response.writeHeadCount(0));
      assert(response.endCount(0));
    });
    it('should return 401 when user wants to download an export they do not own', async() => {
      let request = {'session': {'user_id': 1}, 'path': '/1/download', 'params':  {'id': 1}};
      let response = new ControllerHelper.TestResponse();
      let service = sandbox.createStubInstance(ExportService);
      service.exportUserCount.returns(0);
      let next = sandbox.fake();

      let controller = new ExportController(service, {});
      let result = controller.authAuth();
      await result(request, response, next);
      assert(next.notCalled);
      assert(response.writeHeadCount(1));
      assert(response.endCount(1));
      assert(response.responseCode(401));
    });
    it('should call next when user wants to download an export they own', async() => {
      let request = {'session': {'user_id': 1}, 'path': '/1/download', 'params':  {'id': 1}};
      let response = new ControllerHelper.TestResponse();
      let service = sandbox.createStubInstance(ExportService);
      service.exportUserCount.returns(1);
      let next = sandbox.fake();

      let controller = new ExportController(service, {});
      let result = controller.authAuth();
      await result(request, response, next);
      assert(next.calledOnce);
      assert(response.writeHeadCount(0));
      assert(response.endCount(0));
    });
  });

  describe('#exportStatus', function() {
    it('should remove export id from session when export status is success', async() => {
      let request = {
        'session': {'user_id': 1},
        'params': {'id': 1}
      };
      request.session[constants.SESSION_EXPORTS_KEY] = [1,2];
      let response = new ControllerHelper.TestResponse();
      let export_service = sandbox.createStubInstance(ExportService);
      export_service.exportStatus.returns({'remove_export_id': true, 'export_status': 10, 'export_name': 'somefile'});
      let controller = new ExportController(export_service, {});
      await controller.exportStatus(request, response);
      assert.ok(request.session[constants.SESSION_EXPORTS_KEY].indexOf(1) === -1);
    });
    it('should not remove export id from session export status is in-queue', async() => {
      let request = {
        'session': {'user_id': 1},
        'params': {'id': 1}
      };
      request.session[constants.SESSION_EXPORTS_KEY] = [1,2];
      let response = new ControllerHelper.TestResponse();
      let export_service = sandbox.createStubInstance(ExportService);
      export_service.exportStatus.returns({'remove_export_id': false, 'export_status': 0, 'export_name': 'somefile'});
      let controller = new ExportController(export_service, {});
      await controller.exportStatus(request, response);
      assert.ok(request.session[constants.SESSION_EXPORTS_KEY].indexOf(1) > -1);
    });
  });

  describe('#download', function() {
    let stream_class = function() {
      var pipe_count = 0;

      this.pipe = function(response) {
        pipe_count++;
      };

      this.get_pipe_count = function() {
        return pipe_count;
      }
    };
    it('should render error when file does not exist', async () => {
      let request = {'params': {'id': 1}};
      let response = new ControllerHelper.TestResponse();
      let export_service = sandbox.createStubInstance(ExportService);
      let result = ControllerHelper.error_result('file does not exist');
      export_service.download.returns(result);
      let controller = new ExportController(export_service);
      let ejs = new ControllerHelper.TestEjs();
      controller.setEjs(ejs);
      await controller.download(request, response);
      assert.ok(ejs.renderFileCount() === 1);
      assert.ok(ejs.tplPath().indexOf('error.ejs') > -1);
    });
    it('should stream file when available', async() => {
      let request = {'params': {'id': 1}};
      let response = new ControllerHelper.TestResponse();
      let export_service = sandbox.createStubInstance(ExportService);
      let result = ControllerHelper.success_result({
        'file_path': '/path/to/export.shp.zip',
        'content_type': 'application/zip',
        'file_name': 'export.shp.zip'
      });
      export_service.download.returns(result);
      let stream = new stream_class();
      let my_fs = sandbox.stub(fs, 'createReadStream').returns(stream);
      let controller = new ExportController(export_service);
      await controller.download(request, response);
      assert(response.responseCode(200));
      assert(stream.get_pipe_count() === 1);
    });
  });

  describe('#index', function() {
    it('should render index.ejs', async() => {
      let request = {'session': {'user_id': 1}, 'query': {}};
      let response = new ControllerHelper.TestResponse();
      let export_service = sandbox.createStubInstance(ExportService);
      let result = ControllerHelper.success_result({'exports': []});
      export_service.exportsOfUser.returns(result);
      let ejs = new ControllerHelper.TestEjs();
      let controller = new ExportController(export_service, {});
      controller.setEjs(ejs);
      await controller.index(request, response);
      assert(response.responseCode(200));
      assert(ejs.tplPath().indexOf('exports/index.ejs') > -1);
    });
  });

  describe('#deletePost', function() {
    it('should render json', async() => {
      let response = new ControllerHelper.TestResponse();
      let export_service = sandbox.createStubInstance(ExportService);
      let result = ControllerHelper.success_result({});
      export_service.deleteExport.returns(result);
      let controller = new ExportController(export_service);
      await controller.deletePost({}, response);
      assert(response.responseCode(200));
      assert(response.responseHeader('Content-Type', 'application/json'));
      let resp_json = JSON.stringify(result);
      assert(response.responseBody(resp_json));
    });
  });
});

