let assert = require('assert');
let sandbox = require('sinon').createSandbox();
const DB = require('../../../app/db/db.js');
const PublicMapService = require('../../../app/services/public_map_service.js');

describe('PublicMapService', function() {
  afterEach(function() {
    sandbox.restore();
  });

  describe('#mapDetailsForDisplay', function() {
    it('should return when map does not exist for given values', async () => {
      let db = sandbox.createStubInstance(DB);
      db.selectOne.returns(null);
      let service = new PublicMapService(db, {});
      let request = {'params': {'id': 1, 'hash': 'abc'}};
      let result = await service.mapDetailsForDisplay(request);
      assert.ok(result['status'] === 'error');
      assert.ok(result['errors'].length > 0);
    });
    it('should return details', async() => {
      let db = sandbox.createStubInstance(DB);
      db.selectOne.returns({'user_id': 1, 'id': 1, 'base_layer': 'o-osm'});
      db.find.returns({'schema_name': 'abc'});
      db.genericSelect.onCall(0).returns([{'table_name': 'table1'}, {'table_name': 'table2'}]);
      db.genericSelect.onCall(1).returns([{'table_name': 'table1', 'xtnt': 'xtnt1'}, {'table_name': 'table2', 'xtnt': 'xtnt2'}]);
      let service = new PublicMapService(db, {});
      let request = {'params': {'id': 1, 'hash': 'abc'}};
      let result = await service.mapDetailsForDisplay(request);
      assert.ok(result['status'] === 'success');
      assert.ok('map_details' in result);
      assert.strictEqual(result['is_google_maps'], false);
      assert.strictEqual(result['is_bing_maps'], false);
      assert.strictEqual(result['is_yandex_maps'], false);
      assert.ok('user_details' in result);
      assert.ok('layer_data' in result);
      assert.ok('extents' in result);
    });
  });

  describe('#queryData', function() {
    it('should return error when query is missing', async() => {
      let service = new PublicMapService({}, {});
      let request = {};
      let result = await service.queryData(request);
      assert.ok(result['status'] === 'error');
      assert.ok(result['errors'].length > 0);
    });
    it('should return error when query.query is missing', async() => {
      let service = new PublicMapService({}, {});
      let request = {'query': {}};
      let result = await service.queryData(request);
      assert.ok(result['status'] === 'error');
      assert.ok(result['errors'].length > 0);
    });
    it('should return error when query.query is empty', async() => {
      let service = new PublicMapService({}, {});
      let request = {'query': {'query': ''}};
      let result = await service.queryData(request);
      assert.ok(result['status'] === 'error');
      assert.ok(result['errors'].length > 0);
    });
    it('should return data when query is present', async() => {
      let api_db = sandbox.createStubInstance(DB);
      api_db.genericSelect.returns({});
      let service = new PublicMapService({}, api_db);
      let request = {'query': {'query': 'cen'}};
      let result = await service.queryData(request);
      assert.ok(result['status'] === 'success');
      assert.ok('data' in result);
    });
  });

  describe('#layerOfTable', function() {
    it('should return layer of table', async() => {
      let db = sandbox.createStubInstance(DB);
      db.genericSelect.returns([{'hash': 'hash1', 'update_hash': 'hash2', 'infowindow': 'somewindow'}]);
      let service = new PublicMapService(db, {});
      let request = {'params': {'schema': 'schema1', 'table': 'table1'}};
      let result = await service.layerOfTable(request);
      assert.ok(result['status'] === 'success');
      assert.ok(result['layer_url'] === '/lyr/hash1-hash2/{z}/{x}/{y}.png');
      assert.ok(result['infowindow'] === 'somewindow');
    });
  });
});

