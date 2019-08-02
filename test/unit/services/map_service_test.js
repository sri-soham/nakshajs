let assert = require('assert');
let sandbox = require('sinon').createSandbox();
const DB = require('../../../app/db/db.js');
const Client = require('../../../app/db/client.js');
const MapService = require('../../../app/services/map_service.js');

describe('MapService', function() {
  afterEach(function() {
    sandbox.restore();
  });

  describe('#userMaps', function() {
    it('should return user maps', async () => {
      let db = sandbox.createStubInstance(DB);
      let values = [{
        'id': 1,
        'user_id': 1,
        'name': 'Nalas',
        'hash': 'nalas',
        'base_layer': 'o-osm',
        'created_at': '2019-01-16 10:10:10',
        'updated_at': '2019-02-26 20:20:20'
      }];
      db.selectWhere.returns(values);
      db.getCount.returns(1);
      let service = new MapService(db);
      let request = {'query': {'page': 1}, 'session': {'user': 1}};
      let result = await service.userMaps(request);
      assert.strictEqual(result['status'], 'success');
      assert.strictEqual(result['maps'].length, 1);
      assert.ok('pagination_links' in result);
      assert.ok('pagination_text' in result);
    });
  });

  describe('#addMap', function() {
    it('should return error result when validation fails', async () => {
      let request = {'body': {}};
      let service = new MapService({});
      let result = await service.addMap(request);
      assert.strictEqual(result['status'], 'error');
    });
    it('should return error when layer does not belong to user', async () => {
      let db = sandbox.createStubInstance(DB);
      db.genericSelect.returns([{'cnt': 0}]);
      let request = {
        'body': {'name': 'Some Map', 'layer': '10'},
        'session': {'user_id': 1}
      };
      let service = new MapService(db);
      let result = await service.addMap(request);
      assert.strictEqual(result['status'], 'error');
      let errors = result['errors'].filter(err => err.indexOf('access to this layer') >= -1);
      assert.strictEqual(errors.length, 1);
    });
    it('should throw error when db query fails', async() => {
      let db = sandbox.createStubInstance(DB);
      db.genericSelect.returns([{'cnt': 1}]);
      let client = sandbox.createStubInstance(Client);
      db.getClient.returns(client);
      client.beginTransaction.returns(null);
      client.rollbackTransaction.returns(null);
      client.insert.throws('some error');

      let request = {
        'body': {'name': 'Some Map', 'layer': '10'},
        'session': {'user_id': 1}
      };
      let service = new MapService(db);
      let error_thrown = false;
      try {
        let result = await service.addMap(request);
      }
      catch (ex) {
        error_thrown = true;
      }
      assert.ok(error_thrown);
    });
    it('should return redir_url on success', async() => {
      let db = sandbox.createStubInstance(DB);
      db.genericSelect.returns([{'cnt': 1}]);
      let client = sandbox.createStubInstance(Client);
      db.getClient.returns(client);
      client.beginTransaction.returns(null);
      client.commitTransaction.returns(null);
      client.insert.onCall(0).returns({'id': 1});
      client.insert.onCall(1).returns(null);
      client.release.returns(null);

      let request = {
        'body': {'name': 'Some Map', 'layer': '10'},
        'session': {'user_id': 1}
      };
      let service = new MapService(db);
      let result = await service.addMap(request);
      assert.strictEqual(result['status'], 'success');
      assert.strictEqual(result['redir_url'], '/maps/1/show');
      assert.strictEqual(client.release.calledOnce, true);
    });
  });

  describe('#mapDetails', function() {
    it('should return map details', async () => {
      let db = sandbox.createStubInstance(DB);
      db.find.returns({});
      db.genericSelect.returns({});
      let service = new MapService(db);
      let request = {'params': {'id': 1}};
      let result = await service.mapDetails(request);
      assert.strictEqual(result['status'], 'success');
      assert.ok('map_details' in result);
      assert.ok('tables' in result);
      assert.ok('base_layers' in result);
    });
  });

  describe('#editMap', function() {
    it('should return error result when validation fails', async() => {
      let db = sandbox.createStubInstance(DB);
      let service = new MapService(db);
      let request = {'body': {}};
      let result = await service.editMap(request);
      assert.ok(result['status'] === 'error');
      assert.ok(result['errors'].length > 0);
    });
    it('should return success on update', async() => {
      let db = sandbox.createStubInstance(DB);
      db.update.returns(null);
      let service = new MapService(db);
      let request = {'body': {'name': 'Some Name'}, 'params': {'id': 1}};
      let result = await service.editMap(request);
      assert.ok(result['status'] === 'success');
      assert.ok(db.update.called);
    });
  });

  describe('#deleteMap', function() {
    it('should return redir_url', async() => {
      let db = sandbox.createStubInstance(DB);
      let client = sandbox.createStubInstance(Client);
      db.getClient.returns(client);
      client.beginTransaction.returns(null);
      client.deleteWhere.returns(null);
      client.commitTransaction.returns(null);
      client.rollbackTransaction.returns(null);
      let request = {'params': {'id': 1}};
      let service = new MapService(db);
      let result = await service.deleteMap(request);
      assert.ok(result['status'] === 'success');
      assert.ok(result['redir_url'] === '/maps/index');
      assert.ok(client.deleteWhere.calledTwice);
      assert.ok(client.commitTransaction.calledOnce);
      assert.ok(client.rollbackTransaction.notCalled);
    });
  });

  describe('#updateBaseLayer', function() {
    it('should return error when validation fails', async() => {
      let db = sandbox.createStubInstance(DB);
      db.find.returns({'google_maps_key': ''});
      let service = new MapService(db);
      let request = {'body': {}, 'params': {'id': '1'}, 'session': {'user_id': 1}};
      let result = await service.updateBaseLayer(request);
      assert.ok(result['status'] === 'error');
      assert.ok(result['errors'].length > 0);
    });
    it('should return success on update', async() => {
      let db = sandbox.createStubInstance(DB);
      db.find.returns({'google_maps_key': ''});
      db.update.returns(null);
      let service = new MapService(db);
      let request = {
        'body': {'base_layer': 'o-osm'},
        'params': {'id': '1'},
        'session': {'user_id': 1}
      };
      let result = await service.updateBaseLayer(request);
      assert.ok(result['status'] === 'success');
    });
  });

  describe('#searchTables', function() {
    it('should return tables', async () => {
      let db = sandbox.createStubInstance(DB);
      db.genericSelect.returns({});
      let service = new MapService(db);
      let request = {
        'query': {'table_name': 'cen'},
        'session': {'user_id': 1},
        'params': {'id': 1}
      };
      let result = await service.searchTables(request);
      assert.ok(result['status'] === 'success');
      assert.ok('tables' in result);
    });
  });

  describe('#addLayer', function() {
    it('should return error when validation fails', async() => {
      let service = new MapService({});
      let request = {'body': {}};
      let result = await service.addLayer(request);
      assert.ok(result['status'] === 'error');
      assert.ok(result['errors'].length > 0);
    });
    it('should return error when layer does not belong user', async() => {
      let db = sandbox.createStubInstance(DB);
      db.genericSelect.returns([{'cnt': 0}]);
      let service = new MapService(db);
      let request = {'body': {'layer_id': 1}, 'session': {'user_id': 1}};
      let result = await service.addLayer(request);
      let errors = result['errors'].filter(err => err.indexOf('do not have access') > -1);
      assert.ok(result['status'] === 'error');
      assert.ok(errors.length === 1);
    });
    it('should return success', async() => {
      let db = sandbox.createStubInstance(DB);
      db.genericSelect.returns([{'cnt': 1}]);
      db.insert.returns(null);
      let service = new MapService(db);
      let request = {
        'body': {'layer_id': 1},
        'params': {'id': 1},
        'session': {'user_id': 1}
      };
      let result = await service.addLayer(request);
      assert.ok(result['status'] === 'success');
    });
  });

  describe('#deleteLayer', function() {
    it('should return error when validation fails', async() => {
      let service = new MapService({});
      let request = {'body': {}};
      let result = await service.deleteLayer(request);
      assert.ok(result['status'] === 'error');
      assert.ok(result['errors'].length > 0);
    });
    it('should return error when map has only one layer', async() => {
      let db = sandbox.createStubInstance(DB);
      db.getCount.returns(1);
      let service = new MapService(db);
      let request = {'body': {'layer_id': 1}, 'params': {'id': 1}};
      let result = await service.deleteLayer(request);
      let errors = result['errors'].filter(err => err.indexOf('at least one layer') > -1);
      assert.ok(result['status'] === 'error');
      assert.ok(errors.length > 0);
    });
    it('should return success on deleting layer', async() => {
      let db = sandbox.createStubInstance(DB);
      db.getCount.returns(2);
      db.deleteWhere.returns(null);
      let service = new MapService(db);
      let request = {
        'body': {'layer_id': 1},
        'params': {'id': 1}
      };
      let result = await service.deleteLayer(request);
      assert.ok(result['status'] === 'success');
    });
  });

  describe('#updateHash', function() {
    it('should return error when validation fails', async() => {
      let service = new MapService({});
      let request = {'body': {}};
      let result = await service.updateHash(request);
      assert.ok(result['status'] === 'error');
      assert.ok(result['errors'].length > 0);
    });
    it('should return success on update', async() => {
      let db = sandbox.createStubInstance(DB);
      db.update.returns(null);
      let service = new MapService(db);
      let request = {
        'body': {'hash': 'something'},
        'params': {'id': 1}
      };
      let result = await service.updateHash(request);
      assert.ok(result['status'] === 'success');
    });
  });
});

