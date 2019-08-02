const MapController = require('../../../app/controllers/map_controller.js');
const MapService = require('../../../app/services/map_service.js');
const sandbox = require('sinon').createSandbox();
const assert = require('assert');
const ControllerHelper = require('../../helpers/controller_helper.js');

describe('MapController', function() {
  afterEach(function() {
    sandbox.restore();
  });

  describe('#authAuth', function() {
    it('should return 401 when not logged in', () => {
      let request = {};
      let response = new ControllerHelper.TestResponse();
      let next = sandbox.fake();

      let controller = new MapController({});
      let result = controller.authAuth();
      result(request, response, next);
      assert(next.notCalled);
      assert(response.writeHeadCount(1));
      assert(response.endCount(1));
      assert(response.responseCode(401));
    });
    it('should call next when logged in', () => {
      let request = {'session': {'user_id': 1}, 'path': '/index'};
      let response = new ControllerHelper.TestResponse();
      let next = sandbox.fake();

      let controller = new MapController({});
      let result = controller.authAuth();
      result(request, response, next);
      assert(response.writeHeadCount(0));
      assert(response.endCount(0));
      assert(next.calledOnce);
    });
  });

  describe('#index', function() {
    it('should render index.ejs', async() => {
      let request = {};
      let response = new ControllerHelper.TestResponse();
      let ejs = new ControllerHelper.TestEjs();
      let map_service = sandbox.createStubInstance(MapService);
      let result = ControllerHelper.success_result({});
      map_service.userMaps.returns(result);
      let controller = new MapController(map_service);
      controller.setEjs(ejs);
      await controller.index(request, response);
      assert(response.responseCode(200));
      assert(ejs.tplPath().indexOf('maps/index.ejs') > -1);
    });
  });

  describe('#addPost', function() {
    it('should render json', async() => {
      let request = {};
      let response = new ControllerHelper.TestResponse();
      let map_service = sandbox.createStubInstance(MapService);
      let result = ControllerHelper.success_result({});
      map_service.addMap.returns(result);
      let controller = new MapController(map_service);
      await controller.addPost(request, response);
      assert(response.responseCode(200));
      assert(response.responseHeader('Content-Type', 'application/json'));
    });
  });

  describe('#show', function() {
    it('should render show.ejs', async() => {
      let request = {};
      let response = new ControllerHelper.TestResponse();
      let ejs = new ControllerHelper.TestEjs();
      let map_service = sandbox.createStubInstance(MapService);
      let result = ControllerHelper.success_result({});
      map_service.mapDetails.returns(result);
      let controller = new MapController(map_service);
      controller.setEjs(ejs);
      await controller.show(request, response);
      assert(response.responseCode(200));
      assert(ejs.tplPath().indexOf('maps/show.ejs') > -1);
      assert(result['js'].length === 2);
      assert(result['css'].length === 1);
    });
  });

  describe('#editPost', function() {
    it('should render json', function() {
      ControllerHelper.test_json('MapController', 'editPost', 'editMap');
    });
  });

  describe('#deletePost', function() {
    it('should render json', function() {
      ControllerHelper.test_json('MapController', 'deletePost', 'deleteMap');
    });
  });

  describe('#baseLayerPost', function() {
    it('should render json', function() {
      ControllerHelper.test_json('MapController', 'baseLayerPost', 'updateBaseLayer');
    });
  });

  describe('#searchTables', function() {
    it('should render json', function() {
      ControllerHelper.test_json('MapController', 'searchTables', 'searchTables');
    });
  });

  describe('#addLayerPost', function() {
    it('should render json', function() {
      ControllerHelper.test_json('MapController', 'addLayerPost', 'addLayer');
    });
  });

  describe('#deleteLayerPost', function() {
    it('should render json', function() {
      ControllerHelper.test_json('MapController', 'deleteLayerPost', 'deleteLayer');
    });
  });

  describe('#hashPost', function() {
    it('should render json', function() {
      ControllerHelper.test_json('MapController', 'hashPost', 'updateHash');
    });
  });
});

