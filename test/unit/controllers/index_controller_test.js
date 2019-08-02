const IndexController = require('../../../app/controllers/index_controller.js');
const sandbox = require('sinon').createSandbox();
const assert = require('assert');
const ControllerHelper = require('../../helpers/controller_helper.js');
const UserService = require('../../../app/services/user_service.js');
const TableService = require('../../../app/services/table_service.js');

describe('IndexController', function() {
  afterEach(function() {
    sandbox.restore();
  });

  describe('#authAuth', function() {
    it('should call next on index when user is not logged in', function() {
      let request = {'path': '/'};
      let response = new ControllerHelper.TestResponse();
      let next = sandbox.fake();
      let controller = new IndexController({}, {});
      let result = controller.authAuth();
      result(request, response, next);
      assert(next.calledOnce);
      assert(response.writeHeadCount(0));
    });
    it('should return 401 when unauthenticated user visits dashboard', function() {
      let request = {'path': '/dashboard'};
      let response = new ControllerHelper.TestResponse();
      let next = sandbox.fake();
      let controller = new IndexController({}, {});
      let result = controller.authAuth();
      result(request, response, next);
      assert(next.notCalled);
      assert(response.responseCode(401));
    });
    it('should call next when authenticated user visits dasboard', function() {
      let request = {'path': '/dashboard', 'session': {'user_id': 1}};
      let response = new ControllerHelper.TestResponse();
      let next = sandbox.fake();
      let controller = new IndexController({}, {});
      let result = controller.authAuth();
      result(request, response, next);
      assert(next.calledOnce);
      assert(response.writeHeadCount(0));
    });
    it('should return 401 when unauthorized user visits profile', function() {
      let request = {'path': '/profile'};
      let response = new ControllerHelper.TestResponse();
      let next = sandbox.fake();
      let controller = new IndexController({}, {});
      let result = controller.authAuth();
      result(request, response, next);
      assert(next.notCalled);
      assert(response.responseCode(401));
    });
    it('should call next when authenticated user visits profile', function() {
      let request = {'path': '/profile', 'session': {'user_id': 1}};
      let response = new ControllerHelper.TestResponse();
      let next = sandbox.fake();
      let controller = new IndexController({}, {});
      let result = controller.authAuth();
      result(request, response, next);
      assert(next.calledOnce);
      assert(response.writeHeadCount(0));
    });
    it('should return 401 when unauthorized user visits change_password', function() {
      let request = {'path': '/change_password'};
      let response = new ControllerHelper.TestResponse();
      let next = sandbox.fake();
      let controller = new IndexController({}, {});
      let result = controller.authAuth();
      result(request, response, next);
      assert(next.notCalled);
      assert(response.responseCode(401));
    });
    it('should call next when authenticated user visits change_password', function() {
      let request = {'path': '/change_password', 'session': {'user_id': 1}};
      let response = new ControllerHelper.TestResponse();
      let next = sandbox.fake();
      let controller = new IndexController({}, {});
      let result = controller.authAuth();
      result(request, response, next);
      assert(next.calledOnce);
      assert(response.writeHeadCount(0));
    });
    it('should return 401 when unauthorized user visits logout', function() {
      let request = {'path': '/logout'};
      let response = new ControllerHelper.TestResponse();
      let next = sandbox.fake();
      let controller = new IndexController({}, {});
      let result = controller.authAuth();
      result(request, response, next);
      assert(next.notCalled);
      assert(response.responseCode(401));
    });
    it('should call next when authenticated user visits logout', function() {
      let request = {'path': '/logout', 'session': {'user_id': 1}};
      let response = new ControllerHelper.TestResponse();
      let next = sandbox.fake();
      let controller = new IndexController({}, {});
      let result = controller.authAuth();
      result(request, response, next);
      assert(next.calledOnce);
      assert(response.writeHeadCount(0));
    });
  });

  describe('#index', function() {
    it('should render index.ejs', async() => {
      let request = {};
      let response = new ControllerHelper.TestResponse();
      let ejs = new ControllerHelper.TestEjs();
      let controller = new IndexController();
      controller.setEjs(ejs);
      await controller.index(request, response);
      assert(ejs.renderFileCount() === 1);
      assert(ejs.tplPath().indexOf('index/index.ejs') > -1);
    });
  });

  describe('#indexPost', function() {
    it('should render index.ejs on error', async() => {
      let request = {};
      let response = new ControllerHelper.TestResponse();
      let ejs = new ControllerHelper.TestEjs();
      let user_service = sandbox.createStubInstance(UserService);
      let result = ControllerHelper.error_result('No such user');
      user_service.login.returns(result);
      let controller = new IndexController(user_service, {});
      controller.setEjs(ejs);
      await controller.indexPost(request, response);
      assert(ejs.renderFileCount() === 1);
      assert(ejs.tplPath().indexOf('index/index.ejs') > -1);
    });
    it('should redirect to dashboard on login', async() => {
      let session_class = function() {
        this.saved = false;
        this.save = function() {
          this.saved = true;
        };
      };

      let session = new session_class();
      let request = {'session': session};
      let response = new ControllerHelper.TestResponse();
      let user_service = sandbox.createStubInstance(UserService);
      let result = ControllerHelper.success_result({'user': {'id': 1, 'schema_name': 'xyz'}});
      user_service.login.returns(result);
      let controller = new IndexController(user_service, {});
      await controller.indexPost(request, response);
      assert(response.redirectCount(1));
      assert(response.redirectUrl('/dashboard'));
    });
  });

  describe('#dashboard', function() {
    it('should render dashboard.ejs', async() => {
      let request = {};
      let response = new ControllerHelper.TestResponse();
      let ejs = new ControllerHelper.TestEjs();
      let table_service = sandbox.createStubInstance(TableService);
      let result = ControllerHelper.success_result({});
      table_service.tablesForDashboard.returns(result);
      let controller = new IndexController({}, table_service);
      controller.setEjs(ejs);
      await controller.dashboard(request, response);
      assert(ejs.renderFileCount() === 1);
      assert(ejs.tplPath().indexOf('index/dashboard.ejs') > -1);
      assert(result['js'].length === 1);
    });
  });

  describe('#profile', function() {
    it('should render profile.ejs', async() => {
      let request = {'session': {'user_id': 1}};
      let response = new ControllerHelper.TestResponse();
      let result = ControllerHelper.success_result({});
      let user_service = sandbox.createStubInstance(UserService);
      user_service.userById.returns(result);
      let ejs = new ControllerHelper.TestEjs();
      let controller = new IndexController(user_service, {});
      controller.setEjs(ejs);
      await controller.profile(request, response);
      assert(ejs.renderFileCount() === 1);
      assert(ejs.tplPath().indexOf('index/profile.ejs') > -1);
      assert(result['js'].length === 1);
    });
  });

  describe('#profilePost', function() {
    it('should render json', async() => {
      let request = {};
      let response = new ControllerHelper.TestResponse();
      let result = ControllerHelper.success_result({});
      let user_service = sandbox.createStubInstance(UserService);
      user_service.updateMapKeys.returns(result);
      let controller = new IndexController(user_service, {});
      await controller.profilePost(request, response);
      assert(response.responseCode(200));
      assert(response.responseHeader('Content-Type', 'application/json'));
    });
  });

  describe('#changePasswordPost', function() {
    it('should render json', async() => {
      let request = {};
      let response = new ControllerHelper.TestResponse();
      let result = ControllerHelper.success_result({});
      let user_service = sandbox.createStubInstance(UserService);
      user_service.changePassword.returns(result);
      let controller = new IndexController(user_service, {});
      await controller.profilePost(request, response);
      assert(response.responseCode(200));
      assert(response.responseHeader('Content-Type', 'application/json'));
    });
  });

  describe('#logout', function() {
    it('should destroy session', async() => {
      let session_class = function() {
        this.destroyed = false;
        this.destroy = function() {
          this.destroyed = true;
        };
      };

      let session = new session_class();
      let request = {'session': session};
      let response = new ControllerHelper.TestResponse();
      let controller = new IndexController({}, {});
      await controller.logout(request, response);
      assert(session.destroyed);
    });
  });
});

