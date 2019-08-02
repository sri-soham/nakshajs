const TableController = require('../../../app/controllers/table_controller.js');
const TableService = require('../../../app/services/table_service.js');
const constants = require('../../../app/helpers/constants.js');
const sandbox = require('sinon').createSandbox();
const assert = require('assert');
const ControllerHelper = require('../../helpers/controller_helper.js');

describe('TableController', function() {
  afterEach(function() {
    sandbox.restore();
  });

  describe('#authAuth', function() {
    it('should return 401 when not logged in', () => {
      let request = {};
      let response = new ControllerHelper.TestResponse();
      let next = sandbox.fake();

      let controller = new TableController({});
      let result = controller.authAuth();
      result(request, response, next);
      assert(next.notCalled);
      assert(response.writeHeadCount(1));
      assert(response.endCount(1));
      assert(response.responseCode(401));
    });
    it('should call next when logged in', () => {
      let request = {'session': {'user_id': 1}, 'path': '/add'};
      let response = new ControllerHelper.TestResponse();
      let next = sandbox.fake();

      let controller = new TableController({});
      let result = controller.authAuth();
      result(request, response, next);
      assert(response.writeHeadCount(0));
      assert(response.endCount(0));
      assert(next.calledOnce);
    });
  });

  describe('#add', function() {
    it('should render add.ejs', async() => {
      let request = {};
      let response = new ControllerHelper.TestResponse();
      let ejs = new ControllerHelper.TestEjs();
      let controller = new TableController({});
      controller.setEjs(ejs);
      await controller.add(request, response);
      assert(response.responseCode(200));
      assert(ejs.tplPath().indexOf('tables/add.ejs') > -1);
      let data = ejs.data();
      assert(data['js'].length > 0);
      assert(data['css'].length > 0);
    });
  });

  describe('#addPost', function() {
    it('should render error when add table fails', async() => {
      let request = {};
      let response = new ControllerHelper.TestResponse();
      let result = ControllerHelper.error_result('some error');
      let table_service = sandbox.createStubInstance(TableService);
      table_service.addTable.returns(result);
      let controller = new TableController(table_service);
      await controller.addPost(request, response);
      assert(response.responseCode(200));
      assert(response.responseBody(JSON.stringify(result)));
    });
    it('should not add session key on creating empty table', async() => {
      let request = {'session': {}};
      let response = new ControllerHelper.TestResponse();
      let result = ControllerHelper.success_result({'url': 'http://some.url'});
      let table_service = sandbox.createStubInstance(TableService);
      table_service.addTable.returns(result);
      let controller = new TableController(table_service);
      await controller.addPost(request, response);
      assert(response.responseCode(200));
      assert(!request.session.hasOwnProperty(constants.SESSION_IMPORTS_KEY));
    });
    it('should add session key on importing table', async() => {
      let request = {'session': {}};
      let response = new ControllerHelper.TestResponse();
      let result = ControllerHelper.success_result({'id': '2'});
      let table_service = sandbox.createStubInstance(TableService);
      table_service.addTable.returns(result);
      let controller = new TableController(table_service);
      await controller.addPost(request, response);
      assert(response.responseCode(200));
      assert(request.session.hasOwnProperty(constants.SESSION_IMPORTS_KEY));
      assert(request.session[constants.SESSION_IMPORTS_KEY].length >0);
    });
  });

  describe('#tableStatus', function() {
    it('should not remove import id when importing', async() => {
      let request = {'session': ['1']};
      let response = new ControllerHelper.TestResponse();
      let result = ControllerHelper.success_result({'status': 'success', 'import_status': 'importing'});
      let table_service = sandbox.createStubInstance(TableService);
      table_service.tableStatus.returns(result);
      let controller = new TableController(table_service);
      await controller.tableStatus(request, response);
      assert(response.responseCode(200));
      assert(request['session'].length === 1);
    });
    it('should remove import id when import fails', async() => {
      let request = {'params': {'id': 2}};
      request['session'] = {};
      request['session'][constants.SESSION_IMPORTS_KEY] = [1, 2, 3];
      let response = new ControllerHelper.TestResponse();
      let result = ControllerHelper.success_result({'status': 'success', 'import_status': 'error', 'remove_import_id': 1});
      let table_service = sandbox.createStubInstance(TableService);
      table_service.tableStatus.returns(result);
      let controller = new TableController(table_service);
      await controller.tableStatus(request, response);
      assert(response.responseCode(200));
      assert(request['session'][constants.SESSION_IMPORTS_KEY].length === 2);
    });
    it('should remove import id when import succeeds', async() => {
      let request = {'params': {'id': 2}};
      request['session'] = {};
      request['session'][constants.SESSION_IMPORTS_KEY] = [1, 2, 3, 4];
      let response = new ControllerHelper.TestResponse();
      let result = ControllerHelper.success_result({'status': 'success', 'import_status': 'success', 'remove_import_id': 1});
      let table_service = sandbox.createStubInstance(TableService);
      table_service.tableStatus.returns(result);
      let controller = new TableController(table_service);
      await controller.tableStatus(request, response);
      assert(response.responseCode(200));
      assert(request['session'][constants.SESSION_IMPORTS_KEY].length === 3);
    });
  });

  describe('#stylesPost', function() {
    it('should render json', function() {
      ControllerHelper.test_json('TableController', 'stylesPost', 'updateStyles');
    });
  });

  describe('#infowindowPost', function() {
    it('should render json', function() {
      ControllerHelper.test_json('TableController', 'infowindowPost', 'infowindow');
    });
  });

  describe('#deleteTable', function() {
    it('should render json', async() => {
      let request = {'params': {'id': 1}};
      let response = new ControllerHelper.TestResponse();
      let service = sandbox.createStubInstance(TableService);
      let result = ControllerHelper.success_result({});
      service.deleteTable.returns(result);
      let controller = new TableController(service);
      await controller.deleteTable(request, response);
      assert(response.responseCode(200));
      assert(response.responseHeader('Content-Type', 'application/json'));
    });
  });

  describe('#addColumn', function() {
    it('should render json', function() {
      ControllerHelper.test_json('TableController', 'addColumn', 'addColumn');
    });
  });

  describe('#deleteColumn', function() {
    it('should render json', function() {
      ControllerHelper.test_json('TableController', 'deleteColumn', 'deleteColumn');
    });
  });

  describe('#exportPost', function() {
    it('should render error on invalid format', async() => {
      let request = {};
      let response = new ControllerHelper.TestResponse();
      let service = sandbox.createStubInstance(TableService);
      let result = ControllerHelper.error_result('some error');
      service.exportTable.returns(result);
      let controller = new TableController(service);
      await controller.exportPost(request, response);
      assert(response.responseCode(200));
      assert(response.responseHeader('Content-Type', 'application/json'));
      assert(response.responseBody(JSON.stringify(result)));
    });
    it('should created session exports key if it does not exist', async() => {
      let request = {'session': {}};
      let response = new ControllerHelper.TestResponse();
      let service = sandbox.createStubInstance(TableService);
      let result = ControllerHelper.success_result({'id': 1});
      service.exportTable.returns(result);
      let controller = new TableController(service);
      await controller.exportPost(request, response);
      assert(response.responseCode(200));
      assert(response.responseHeader('Content-Type', 'application/json'));
      assert(request['session'].hasOwnProperty(constants.SESSION_EXPORTS_KEY));
      assert(request['session'][constants.SESSION_EXPORTS_KEY].length > 0);
    });
    it('should append id to session exports key if it exists', async() => {
      let request = {'session': {}};
      request['session'][constants.SESSION_EXPORTS_KEY] = [1,2,3];
      let response = new ControllerHelper.TestResponse();
      let service = sandbox.createStubInstance(TableService);
      let result = ControllerHelper.success_result({'id': 4});
      service.exportTable.returns(result);
      let controller = new TableController(service);
      await controller.exportPost(request, response);
      assert(response.responseCode(200));
      assert(response.responseHeader('Content-Type', 'application/json'));
      assert(request['session'][constants.SESSION_EXPORTS_KEY].length === 4);
    });
  });
});

