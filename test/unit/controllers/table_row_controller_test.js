const TableRowController = require('../../../app/controllers/table_row_controller.js');
const TableRowService = require('../../../app/services/table_row_service.js');
const sandbox = require('sinon').createSandbox();
const assert = require('assert');
const ControllerHelper = require('../../helpers/controller_helper.js');

describe('TableRowController', function() {
  afterEach(function() {
    sandbox.restore();
  });

  describe('#authAuth', function() {
    it('should return 401 when not logged in', () => {
      let request = {};
      let response = new ControllerHelper.TestResponse();
      let next = sandbox.fake();

      let controller = new TableRowController({});
      let result = controller.authAuth();
      result(request, response, next);
      assert(next.notCalled);
      assert(response.writeHeadCount(1));
      assert(response.endCount(1));
      assert(response.responseCode(401));
    });
    it('should call next when logged in', async () => {
      let request = {'session': {'user_id': 1}, 'path': '/1/add'};
      let response = new ControllerHelper.TestResponse();
      let next = sandbox.fake();
      let service = sandbox.createStubInstance(TableRowService);
      service.tableUserCount.returns(1);

      let controller = new TableRowController(service);
      let result = controller.authAuth();
      await result(request, response, next);
      assert(response.writeHeadCount(0));
      assert(response.endCount(0));
      assert(next.calledOnce);
    });
  });

  describe('#data', function() {
    it('should render json', function() {
      ControllerHelper.test_json('TableRowController', 'data', 'data');
    });
  });

  describe('#addPost', function() {
    it('should render json', function() {
      ControllerHelper.test_json('TableRowController', 'addPost', 'addRow');
    });
  });

  describe('#update', function() {
    it('should render json', function() {
      ControllerHelper.test_json('TableRowController', 'update', 'updateRow');
    });
  });

  describe('#show', function() {
    it('should render json', function() {
      ControllerHelper.test_json('TableRowController', 'show', 'show');
    });
  });

  describe('#deletePost', function() {
    it('should render json', function() {
      ControllerHelper.test_json('TableRowController', 'deletePost', 'deleteRow');
    });
  });
});

