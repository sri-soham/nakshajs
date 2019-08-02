let assert = require('assert');
let sandbox = require('sinon').createSandbox();
const DB = require('../../../app/db/db.js');
const Client = require('../../../app/db/client.js');
const constants = require('../../../app/helpers/constants.js');
const TableService = require('../../../app/services/table_service.js');
const Helper = require('../../../app/helpers/helper.js');
const Exporter = require('../../../app/exporter/exporter.js');

describe('TableService', function() {
  afterEach(function() {
    sandbox.restore();
  });

  describe('#addTable', function() {
    it('should return error when validation fails', async() => {
      let service = new TableService({});
      let request = {'body': {}};
      let result = await service.addTable(request, {});
      assert.ok(result['status'] === 'error');
    });
  });

  describe('#tablesForDashboard', function() {
    it('should return tables', async() => {
      let db = sandbox.createStubInstance(DB);
      let tables = [{
        'id': 1,
        'name': 'Table 1'
      }, {
        'id': 2,
        'name': 'Table 2'
      }, {
        'id': 3,
        'name': 'Table 3'
      }];
      db.selectWhere.returns(tables);
      db.getCount.returns(3);
      let service = new TableService(db);
      let request = {'query': {'page': 1}, 'session': {'user_id': 1}};
      let result = await service.tablesForDashboard(request);
      assert.ok(result['status'] === 'success');
      assert.ok(result['tables'].length === 3);
      assert.ok('pagination_links' in result);
      assert.ok('pagination_text' in result);
    });
    // 2019-02-23: logs errors to the console
    it('should return error when query fails', async() => {
      let db = sandbox.createStubInstance(DB);
      db.selectWhere.throws('DBError');
      let service = new TableService(db);
      let request = {'query': {'page': 1}, 'session': {'user_id': 1}};
      let result = await service.tablesForDashboard(request);
      assert.ok(result['status'] === 'error');
    });
  });

  describe('#tableDetails', function() {
    it('should return table details', async() => {
      let db = sandbox.createStubInstance(DB);
      let table = {
        'id': 1,
        'table_name': 'some_table',
        'schema_name': 'xyz'
      };
      db.find.onCall(0).returns(table);
      let user = {'name': 'Some Name'};
      db.find.onCall(1).returns(user);
      let columns = [{'column_name': 'col1'}, {'column_name': 'col2'}];
      db.selectWhere.onCall(0).returns(columns);
      let extent = [{'xtnt': 'xyz'}];
      db.selectWhere.onCall(1).returns(extent);
      let layer = {
        'id': 1,
        'hash': 'adsdf',
        'geometry_type': 'ST_POINT',
        'style': 'some-style',
        'infowindow': 'someinfowindow',
        'update_hash': 'asdf'
      };
      db.selectOne.returns(layer);
      let service = new TableService(db);
      let request = {'params': {'id': 1}, 'session': {'user_id': 1}};
      let result = await service.tableDetails(request);
      assert.ok(result['status'] === 'success');
      assert.strictEqual(result['table_details'], table);
      assert.strictEqual(result['columns'], 'col1,col2');
      assert.ok(result['url'] === '/table_rows/' + table['id'] + '/');
      assert.ok(result['map_url'] === '/lyr/' + layer['hash'] + '-[ts]/{z}/{x}/{y}.png');
      assert.strictEqual(result['extent'], extent[0]['xtnt']);
      assert.ok(result['layer_id'] === layer['id']);
      assert.ok(result['geometry_type'] === layer['geometry_type']);
      assert.ok(result['style'] === layer['style']);
      assert.ok(result['infowindow'] === layer['infowindow']);
      assert.ok(result['update_hash'] === layer['update_hash']);
      let export_formats = Exporter.getAvailableFormats();
      assert.deepStrictEqual(result['export_formats'], export_formats);
      assert.deepStrictEqual(result['base_layers'], Helper.getBaseLayers());
      assert.strictEqual(result['base_layer'], Helper.getDefaultBaseLayer());
      assert.strictEqual(result['user_details'], user);
    });
  });

  describe('#tableStatus', function() {
    it('should return success on ready', async() => {
      let db = sandbox.createStubInstance(DB);
      let details = {'id': 1, 'name': 'Some Name', 'status': constants.IMPORT_READY.toString()};
      db.find.returns(details);
      let service = new TableService(db);
      let request = {'params': {'id': 1}};
      let result = await service.tableStatus(request);
      assert.ok(result['import_status'] === 'success');
      assert.ok(result['remove_import_id'] === 1);
      assert.ok(result['table_url'], '/tables/' + details['id'] + '/show');
    });
    it('should return error on error', async() => {
      let db = sandbox.createStubInstance(DB);
      let details = {'id': 1, 'name': 'Some Name', 'status': constants.IMPORT_ERROR.toString()};
      db.find.returns(details);
      let service = new TableService(db);
      let request = {'params': {'id': 1}};
      let result = await service.tableStatus(request);
      assert.ok(result['import_status'] === 'error');
      assert.ok(result['remove_import_id'] === 1);
    });
    it('should return importing when uploaded', async() => {
      let db = sandbox.createStubInstance(DB);
      let details = {'id': 1, 'name': 'Some Name', 'status': constants.IMPORT_UPLOADED.toString()};
      db.find.returns(details);
      let service = new TableService(db);
      let request = {'params': {'id': 1}};
      let result = await service.tableStatus(request);
      assert.ok(result['import_status'] === 'importing');
    });
    it('should return importing when imported', async() => {
      let db = sandbox.createStubInstance(DB);
      let details = {'id': 1, 'name': 'Some Name', 'status': constants.IMPORT_IMPORTED.toString()};
      db.find.returns(details);
      let service = new TableService(db);
      let request = {'params': {'id': 1}};
      let result = await service.tableStatus(request);
      assert.ok(result['import_status'] === 'importing');
    });
    it('should return importing when updated', async() => {
      let db = sandbox.createStubInstance(DB);
      let details = {'id': 1, 'name': 'Some Name', 'status': constants.IMPORT_UPDATED.toString()};
      db.find.returns(details);
      let service = new TableService(db);
      let request = {'params': {'id': 1}};
      let result = await service.tableStatus(request);
      assert.ok(result['import_status'] === 'importing');
    });
  });

  describe('#updateStyles', function() {
    it('should return error when validation fails', async() => {
      let db = sandbox.createStubInstance(DB);
      let lyr_details = {'geometry_type': 'linestring'};
      db.find.returns(lyr_details);
      let service = new TableService(db);
      let request = {'params': {'id': '1'}, 'body': {}};
      let result = await service.updateStyles(request);
      assert.ok(result['status'] === 'error');
      assert.ok(result['errors'].length > 0);
    });
    it('should update styles', async() => {
      let db = sandbox.createStubInstance(DB);
      let lyr_details = {'geometry_type': 'linestring'};
      db.find.returns(lyr_details);
      db.update.returns(null);
      let service = new TableService(db);
      let request = {'params': {'id': '1'}, 'body': {
        'stroke': '#ffffff', 'stroke_opacity': '0.95', 'stroke_width': '2'
      }};
      let result = await service.updateStyles(request);
      assert.ok(result['status'] === 'success');
      assert.ok(result['update_hash'].length > 0);
      assert.ok(db.update.calledOnce);
    });
  });

  describe('#infowindow', function() {
    it('should not allow the_geom in infowindow', async() => {
      let service = new TableService({});
      let request = {'body': {'columns': ['name', 'the_geom']}};
      let result = await service.infowindow(request);
      assert.ok(result['status'] === 'error');
    });
    it('should update infowindow', async() => {
      let db = sandbox.createStubInstance(DB);
      db.update.returns(null);
      let service = new TableService(db);
      let request = {'body': {'columns': ['name', 'circle', 'area']}, 'params': {'id': 1}};
      let result = await service.infowindow(request);
      assert.ok(result['status'] === 'success');
      assert.ok(db.update.calledOnce);
    });
  });

  describe('#deleteTable', function() {
    it('should delete table', async() => {
      let client = sandbox.createStubInstance(Client);

      let db = sandbox.createStubInstance(DB);
      db.find.returns({'schema_name': 'xyz', 'table_name': 'some_table'});
      db.getClient.returns(client);
      client.beginTransaction.returns(null);
      client.deleteWhere.returns(null);
      client.genericExec.returns(null);
      client.commitTransaction.returns(null);
      client.rollbackTransaction.returns(null);
      client.release.returns(null);
      let service = new TableService(db);
      let result = await service.deleteTable(2);
      assert.ok(result['status'] === 'success');
      assert.ok(client.beginTransaction.calledOnce);
      assert.ok(client.deleteWhere.calledOnce);
      assert.ok(client.genericExec.calledOnce);
      assert.ok(client.commitTransaction.calledOnce);
      assert.ok(client.rollbackTransaction.notCalled);
      assert.ok(client.release.calledOnce);
    });
    it('should throw error when query fails', async() => {
      let db = sandbox.createStubInstance(DB);
      let client = sandbox.createStubInstance(Client);
      db.find.returns({'schema_name': 'xyz', 'table_name': 'some_table'});
      db.getClient.returns(client);
      client.beginTransaction.returns(null);
      client.deleteWhere.throws('some error');
      client.genericExec.returns(null);
      client.commitTransaction.returns(null);
      client.rollbackTransaction.returns(null);
      client.release.returns(null);
      let service = new TableService(db);
      let error_thrown = false;
      let result;
      try {
        result = await service.deleteTable(1);
      }
      catch(e) {
        error_thrown = true;
      }
      assert.ok(error_thrown);
      assert.ok(client.beginTransaction.calledOnce);
      assert.ok(client.deleteWhere.calledOnce);
      assert.ok(client.genericExec.notCalled);
      assert.ok(client.commitTransaction.notCalled);
      assert.ok(client.rollbackTransaction.calledOnce);
      assert.ok(client.release.calledOnce);
    });
  });

  describe('#addColumn', function() {
    it('should return error when validation fails', async() => {
      let service = new TableService({});
      let request = {'body': {}};
      let result = await service.addColumn(request);
      assert.ok(result['status'] === 'error');
      assert.ok(result['errors'].length > 0);
    });
    it('should return error when column name exists', async() => {
      let db = sandbox.createStubInstance(DB);
      db.find.returns({'schema_name': 'xyz', 'table_name': 'some_table'});
      db.getCount.returns(1);
      let service = new TableService(db);
      let request = {'body': {'name': 'first_name', 'data_type': '1'}, 'params': {'id': 1}};
      let result = await service.addColumn(request);
      assert.ok(result['status'] === 'error');
      assert.ok(result['errors'].length > 0);
    });
    it('should add column', async() => {
      let db = sandbox.createStubInstance(DB);
      db.find.returns({'schema_name': 'xyz', 'table_name': 'some_table'});
      db.getCount.returns(0);
      db.genericExec.returns(null);
      let service = new TableService(db);
      let request = {'body': {'name': 'first_name', 'data_type': '1'}, 'params': {'id': 1}};
      let result = await service.addColumn(request);
      assert.ok(result['status'] === 'success');
      assert.ok(db.genericExec.calledOnce);
    });
  });

  describe('#deleteColumn', function() {
    it('should return error when validation fails', async() => {
      let service = new TableService({});
      let request = {'body': {}};
      let result = await service.deleteColumn(request);
      assert.ok(result['status'] === 'error');
      assert.ok(result['errors'].length > 0);
    });
    it('should throw error when database function fails', async() => {
      let db = sandbox.createStubInstance(DB);
      db.find.onCall(0).returns({'id': '1', 'schema_name': 'xyz', 'table_name': 'some_table'});
      db.find.onCall(1).returns({'infowindow': '{"fields":["name","circle","zone"]}'});
      let client = sandbox.createStubInstance(Client);
      db.getClient.returns(client);
      client.beginTransaction.returns(null);
      client.update.throws('some error');
      client.genericExec.returns(null);
      client.commitTransaction.returns(null);
      client.rollbackTransaction.returns(null);
      client.release.returns(null);
      let service = new TableService(db);
      let request = {'body': {'column_name': 'name'}, 'params': {'id': '1'}};
      let result;
      let error_thrown = false;
      try {
        result = await service.deleteColumn(request);
      }
      catch(e) {
        error_thrown = true;
      }
      assert.ok(error_thrown);
      assert.ok(client.release.calledOnce);
      assert.ok(client.beginTransaction.calledOnce);
      assert.ok(client.rollbackTransaction.calledOnce);
      assert.ok(client.genericExec.notCalled);
    });
    it('should delete column', async() => {
      let db = sandbox.createStubInstance(DB);
      db.find.onCall(0).returns({'id': '1', 'schema_name': 'xyz', 'table_name': 'some_table'});
      db.find.onCall(1).returns({'infowindow': '{"fields":["name","circle","zone"]}'});
      let client = sandbox.createStubInstance(Client);
      db.getClient.returns(client);
      client.beginTransaction.returns(null);
      client.update.returns(null);
      client.genericExec.returns(null);
      client.commitTransaction.returns(null);
      client.rollbackTransaction.returns(null);
      client.release.returns(null);
      let service = new TableService(db);
      let request = {'body': {'column_name': 'name'}, 'params': {'id': '1'}};
      let result;
      let error_thrown = false;
      try {
        result = await service.deleteColumn(request);
      }
      catch(e) {
        error_thrown = true;
      }
      assert.ok(!error_thrown);
      assert.ok(client.release.calledOnce);
      assert.ok(client.beginTransaction.calledOnce);
      assert.ok(client.genericExec.calledOnce);
      assert.ok(client.rollbackTransaction.notCalled);
      assert.ok(client.commitTransaction.calledOnce);
    });
  });

  describe('#exportTable', function() {
    it('should return error when format is invalid', async() => {
      let service = new TableService({});
      let request = {'body': {'format': '1'}};
      let result = await service.exportTable(request, {});
      assert.ok(result['status'] === 'error');
      assert.ok(result['errors'].length > 0);
    });
  });
});

