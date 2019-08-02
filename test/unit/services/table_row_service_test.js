let assert = require('assert');
let sandbox = require('sinon').createSandbox();
const DB = require('../../../app/db/db.js');
const TableRowService = require('../../../app/services/table_row_service.js');

describe('TableRowService', function() {
  afterEach(function() {
    sandbox.restore();
  });

  describe('#data', function() {
    it('should return data', async() => {
      let db = sandbox.createStubInstance(DB);
      let values = [{
        'naksha_id': '1',
        'name': 'some name 1',
        'the_geom': 'geom1',
        'the_geom_webmercator': 'webmercator1'
      },{
        'naksha_id': '2',
        'name': 'some name 2',
        'the_geom': 'geom2',
        'the_geom_webmercator': 'webmercator2'
      },{
        'naksha_id': '3',
        'name': 'some name 3',
        'the_geom': 'geom3',
        'the_geom_webmercator': 'webmercator3'
      }];
      db.find.returns({'schema_name': 'xyz', 'table_name': 'some_table'});
      db.selectWhere.returns(values);
      db.getCount.returns(3);
      let request = {'query': {
        'page': '1',
        'order_column': 'naksha_id',
        'order_type': 'asc'
      }, 'params': {
        'table_id': '2'
      }};
      let service = new TableRowService(db);
      let result = await service.data(request);
      assert.ok(result['status'] === 'success');
      assert.ok(result['rows'].length === 3);
      assert.ok('the_geom_webmercator' in result['rows'][0] === false);
    });
  });

  describe('#addRow', function() {
    it('should add row without geometry', async() => {
      let db = sandbox.createStubInstance(DB);
      db.find.returns({'schema_name': 'syx', 'table_name': 'some_table'});
      db.insert.returns(10);
      let service = new TableRowService(db);
      let request = {'params': {
        'table_id': '1'
      }, 'body': {
        'with_geometry': '0'
      }};
      let result = await service.addRow(request);
      assert.ok(result['status'] === 'success');
      assert.ok(result['row']['naksha_id'] === 10);
      assert.ok(result['row']['update_hash'] === '');
    });
    it('should add row with geometry and update style', async() => {
      let db = sandbox.createStubInstance(DB);
      db.find.returns({'schema_name': 'syx', 'table_name': 'some_table'});
      db.insert.returns(10);
      db.update.returns(null);
      db.selectOne.returns({'geometry_type': 'unknown'});
      db.genericSelect.returns([{'geom_type': 'ST_POINT'}]);
      let service = new TableRowService(db);
      let request = {'params': {
        'table_id': '1'
      }, 'body': {
        'with_geometry': '1',
        'geometry': 'SRID=4326;POINT(10 10)'
      }};
      let result = await service.addRow(request);
      assert.ok(result['status'] === 'success');
      assert.ok(result['row']['naksha_id'] === 10);
      assert.ok(result['row']['update_hash'].length > 0);
      assert.ok(db.insert.calledOnce);
      assert.ok(db.selectOne.calledOnce);
      assert.ok(db.genericSelect.calledOnce);
      assert.ok(db.update.calledTwice);
    });
    it('should add row with geometry and not update style', async() => {
      let db = sandbox.createStubInstance(DB);
      db.find.returns({'schema_name': 'syx', 'table_name': 'some_table'});
      db.insert.returns(10);
      db.update.returns(null);
      db.selectOne.returns({'geometry_type': 'ST_POINT'});
      db.genericSelect.returns([{'geom_type': 'ST_POINT'}]);
      let service = new TableRowService(db);
      let request = {'params': {
        'table_id': '1'
      }, 'body': {
        'with_geometry': '1',
        'geometry': 'SRID=4326;POINT(10 10)'
      }};
      let result = await service.addRow(request);
      assert.ok(result['status'] === 'success');
      assert.ok(result['row']['naksha_id'] === 10);
      assert.ok(result['row']['update_hash'].length > 0);
      assert.ok(db.insert.calledOnce);
      assert.ok(db.selectOne.calledOnce);
      assert.ok(db.genericSelect.notCalled);
      assert.ok(db.update.calledOnce);
    });
  });

  describe('#deleteRow', function() {
    it('should delete row', async() => {
      let db = sandbox.createStubInstance(DB);
      db.find.returns({'schema_name': 'xyz', 'table_name': 'some_table'});
      db.deleteWhere.returns(null);
      db.update.returns(null);
      let request = {'params': {'table_id': 1, 'naksha_id': 2}};
      let service = new TableRowService(db);
      let result = await service.deleteRow(request);
      assert.ok(result['status'] === 'success');
      assert.ok(result['update_hash'].length > 0);
    });
  });

  describe('#show', function() {
    it('should return error when data is not available', async() => {
      let db = sandbox.createStubInstance(DB);
      db.find.returns({'schema_name': 'xyz', 'table_name': 'some_table'});
      db.selectOne.onCall(0).returns({'infowindow': '{"fields": ["name","city"]}'});
      db.selectOne.onCall(1).returns(null);
      let service = new TableRowService(db);
      let request = {'params': {'table_id': 1, 'naksha_id': 2}};
      let result = await service.show(request);
      assert.ok(result['status'] === 'error');
    });
    it('should return data', async() => {
      let db = sandbox.createStubInstance(DB);
      db.find.returns({'schema_name': 'xyz', 'table_name': 'some_table'});
      db.selectOne.onCall(0).returns({'infowindow': '{"fields": ["name","city"]}'});
      let data = {'name': 'something', 'city': 'somecity'};
      db.selectOne.onCall(1).returns(data);
      let service = new TableRowService(db);
      let request = {'params': {'table_id': 1, 'naksha_id': 2}};
      let result = await service.show(request);
      assert.ok(result['status'] === 'success');
      assert.strictEqual(result['data'], data);
    });
  });

  describe('#updateRow', function() {
    it('should return error when validation fails', async() => {
      let db = sandbox.createStubInstance(DB);
      db.find.returns({'schema_name': 'xyz', 'table_name': 'some_table'});
      let service = new TableRowService(db);
      let request = {'params': {'table_id': '1'}, 'body': {}};
      let result = await service.updateRow(request);
      assert.ok(result['status'] === 'error');
      assert.ok(result['errors'].length > 0);
    });
    it('should update non-geometry column', async() => {
      let db = sandbox.createStubInstance(DB);
      db.find.returns({'schema_name': 'xyz', 'table_name': 'some_table'});
      db.update.returns(null);
      let service = new TableRowService(db);
      let request = {'params': {'table_id': '1'}, 'body': {'column': 'name', 'value': 'Some Name'}};
      let result = await service.updateRow(request);
      assert.ok(result['status'] === 'success');
      assert.ok(db.update.calledOnce);
    });
    it('should update geometry column without updating style', async() => {
      let db = sandbox.createStubInstance(DB);
      db.find.returns({'schema_name': 'xyz', 'table_name': 'some_table'});
      db.updateGeometry.returns(null);
      db.update.returns(null);
      db.selectOne.returns({'geometry_type': 'ST_POINT'});
      db.genericSelect.returns(null);
      let service = new TableRowService(db);
      let request = {'params':
        {'table_id': '1', 'id': '2'},
        'body': {
          'column': 'the_geom',
          'value': 'SRID=4326;POINT(10 10)'
        }
      };
      let result = await service.updateRow(request);
      assert.ok(result['status'] === 'success');
      assert.ok(db.updateGeometry.calledOnce);
      assert.ok(db.selectOne.calledOnce);
      assert.ok(db.update.calledOnce);
      assert.ok(db.genericSelect.notCalled);
    });
    it('should update geometry and update style', async() => {
      let db = sandbox.createStubInstance(DB);
      db.find.returns({'schema_name': 'xyz', 'table_name': 'some_table'});
      db.updateGeometry.returns(null);
      db.update.returns(null);
      db.selectOne.returns({'geometry_type': 'unknown'});
      db.genericSelect.returns([{'geom_type': 'ST_POINT'}]);
      let service = new TableRowService(db);
      let request = {'params':
        {'table_id': '1', 'id': '2'},
        'body': {
          'column': 'the_geom',
          'value': 'SRID=4326;POINT(10 10)'
        }
      };
      let result = await service.updateRow(request);
      assert.ok(result['status'] === 'success');
      assert.ok(db.updateGeometry.calledOnce);
      assert.ok(db.selectOne.calledOnce);
      assert.ok(db.update.calledTwice);
      assert.ok(db.genericSelect.calledOnce);
    });
  });
});

