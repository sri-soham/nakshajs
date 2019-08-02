const PublicMapController = require('../../../app/controllers/public_map_controller.js');
const PublicMapService = require('../../../app/services/public_map_service.js');
const sandbox = require('sinon').createSandbox();
const assert = require('assert');
const ControllerHelper = require('../../helpers/controller_helper.js');

describe('PublicMapController', function() {
  afterEach(function() {
    sandbox.restore();
  });

  describe('#showMap', function() {
    it('should render error when no details', async() => {
      let request = {};
      let response = new ControllerHelper.TestResponse();
      let public_map_service = sandbox.createStubInstance(PublicMapService);
      let result = ControllerHelper.error_result('some error');
      let ejs = new ControllerHelper.TestEjs();
      public_map_service.mapDetailsForDisplay.returns(result);
      let controller = new PublicMapController(public_map_service);
      controller.setEjs(ejs);
      await controller.showMap(request, response);
      assert(response.responseCode(200));
      assert(ejs.tplPath().indexOf('common/error.ejs') > -1);
    });
    it('should render map when details are available', async() => {
      let request = {};
      let response = new ControllerHelper.TestResponse();
      let public_map_service = sandbox.createStubInstance(PublicMapService);
      let result = ControllerHelper.success_result({});
      let ejs = new ControllerHelper.TestEjs();
      public_map_service.mapDetailsForDisplay.returns(result);
      let controller = new PublicMapController(public_map_service);
      controller.setEjs(ejs);
      await controller.showMap(request, response);
      assert(response.responseCode(200));
      assert(ejs.tplPath().indexOf('index/map.ejs') > -1);
    });
  });

  describe('#queryData', function() {
    it('should render error when no query', async() => {
      let request = {};
      let response = new ControllerHelper.TestResponse();
      let public_map_service = sandbox.createStubInstance(PublicMapService);
      let result = ControllerHelper.error_result('No query');
      public_map_service.queryData.returns(result);
      let controller = new PublicMapController(public_map_service);
      await controller.queryData(request, response);
      assert(response.responseHeader('Content-Type', 'application/json'));
      assert(response.responseBody(JSON.stringify(result)));
    });
    it('should render data when available', async() => {
      let request = {};
      let response = new ControllerHelper.TestResponse();
      let public_map_service = sandbox.createStubInstance(PublicMapService);
      let result = ControllerHelper.success_result({'data': {}});
      public_map_service.queryData.returns(result);
      let controller = new PublicMapController(public_map_service);
      await controller.queryData(request, response);
      assert(response.responseHeader('Content-Type', 'application/javascript'));
      assert(response.responseBody(JSON.stringify(result)));
    });
    it('should render jsonp when callback is present in query', async() => {
      let request = {'query': {'callback': 'l0r0'}};
      let response = new ControllerHelper.TestResponse();
      let public_map_service = sandbox.createStubInstance(PublicMapService);
      let result = ControllerHelper.success_result({'data': {}});
      public_map_service.queryData.returns(result);
      let controller = new PublicMapController(public_map_service);
      await controller.queryData(request, response);
      assert(response.responseHeader('Content-Type', 'application/javascript'));
      let resp = 'l0r0(' + JSON.stringify(result) + ')';
      assert(response.responseBody(resp));
    });
  });

  describe('#layerOfTable', function() {
    it('should render error when no query', async() => {
      let request = {};
      let response = new ControllerHelper.TestResponse();
      let public_map_service = sandbox.createStubInstance(PublicMapService);
      let result = ControllerHelper.error_result('No query');
      public_map_service.layerOfTable.returns(result);
      let controller = new PublicMapController(public_map_service);
      await controller.layerOfTable(request, response);
      assert(response.responseHeader('Content-Type', 'application/json'));
      assert(response.responseBody(JSON.stringify(result)));
    });
    it('should render data when available', async() => {
      let request = {};
      let response = new ControllerHelper.TestResponse();
      let public_map_service = sandbox.createStubInstance(PublicMapService);
      let result = ControllerHelper.success_result({'data': {}});
      public_map_service.layerOfTable.returns(result);
      let controller = new PublicMapController(public_map_service);
      await controller.layerOfTable(request, response);
      assert(response.responseHeader('Content-Type', 'application/javascript'));
      assert(response.responseBody(JSON.stringify(result)));
    });
    it('should render jsonp when callback is present in query', async() => {
      let request = {'query': {'callback': 'l0r0'}};
      let response = new ControllerHelper.TestResponse();
      let public_map_service = sandbox.createStubInstance(PublicMapService);
      let result = ControllerHelper.success_result({'data': {}});
      public_map_service.layerOfTable.returns(result);
      let controller = new PublicMapController(public_map_service);
      await controller.layerOfTable(request, response);
      assert(response.responseHeader('Content-Type', 'application/javascript'));
      let resp = 'l0r0(' + JSON.stringify(result) + ')';
      assert(response.responseBody(resp));
    });
  });
});

