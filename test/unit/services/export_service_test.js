var assert = require('assert');
const fs = require('fs');
var sandbox = require('sinon').createSandbox();
const DB = require('../../../app/db/db.js');
const Exporter = require('../../../app/exporter/exporter.js');
const ExportService = require('../../../app/services/export_service.js');

describe('ExportService', function() {
  afterEach(function() {
    sandbox.restore();
  });

  describe('#exportStatus', function() {
    function get_export_status_service(st) {
      let db = sandbox.createStubInstance(DB);
      let val = {
        'status': st,
        'filename': 'somename.zip'
      };
      db.find.returns(val);
      let service = new ExportService(db);
      let result = service.exportStatus({'params': {'id': '1'}});

      return result;
    }

    it('should return download url on success', async () => {
      let result = await get_export_status_service(Exporter.ST_SUCCESS);
      assert.strictEqual(result['status'], 'success');
      assert.strictEqual(result['download_url'], '/exports/1/download');
      assert.strictEqual(result['remove_export_id'], true);
      assert.strictEqual(result['export_status'], Exporter.ST_SUCCESS);
    });
    it('should not return download_url on "in queue" status', async() => {
      let result = await get_export_status_service(Exporter.ST_IN_QUEUE);
      assert.strictEqual(result['status'], 'success');
      assert.strictEqual(Object.hasOwnProperty(result, 'download_url'), false);
      assert.strictEqual(result['remove_export_id'], false);
      assert.strictEqual(result['export_status'], Exporter.ST_IN_QUEUE);
    });
    it('should not return download_url on "error" status', async() => {
      let result = await get_export_status_service(Exporter.ST_ERROR);
      assert.strictEqual(result['status'], 'success');
      assert.strictEqual(Object.hasOwnProperty(result, 'download_url'), false);
      assert.strictEqual(result['remove_export_id'], true);
      assert.strictEqual(result['export_status'], Exporter.ST_ERROR);
    });
  });

  describe('#exportsOfUser', function() {
    it('should return exports', async () => {
      let db = sandbox.createStubInstance(DB);
      let values = [{
        'id': '1',
        'filename': 'nalaszip',
        'extension': '.shp',
        'status': '10',
        'created_at': new Date('2019-02-15 10:10:10'),
        'updated_at': new Date('2019-02-15 10:10:50')
      }];
      db.selectWhere.returns(values);
      db.getCount.returns(1);

      let request = {'query': {
          'page': '1'
        },
        'session': {
          'user_id': '1'
        }
      };
      let service = new ExportService(db);
      let result = await service.exportsOfUser(request);
      assert.strictEqual(result['status'], 'success');
      assert.ok('exports' in result);
      assert.ok('pagination_links' in result);
      assert.ok('pagination_text' in result);
      assert.strictEqual(result['exports'].length, 1);
      assert.ok('name' in result.exports[0]);
      assert.ok('status' in result.exports[0]);
      assert.ok('download_link' in result.exports[0]);
      assert.ok('created_at' in result.exports[0]);
      assert.ok('updated_at' in result.exports[0]);
      assert.ok('id' in result.exports[0]);
    });
  });

  describe('#download', function() {
    beforeEach(function() {
      let stub_fs = sandbox.stub(fs, 'existsSync');
      stub_fs.withArgs('/tmp/exports/hash1/exists.shp.zip').returns(true);
      stub_fs.withArgs('/tmp/exports/hash1/not_exists.shp.zip').returns(false);
    });
    afterEach(function() {
      fs.existsSync.restore();
    });

    it('should return error when file does not exist', async() => {
      let db = sandbox.createStubInstance(DB);
      let values = {
        'hash': 'hash1',
        'filename': 'not_exists',
        'extension': '.shp',
      };
      db.find.returns(values);
      let service = new ExportService(db);
      let result = await service.download(1, '/tmp/exports');
      assert.strictEqual(result['status'], 'error');
    });
    it('should return success when file exists', async () => {
      let db = sandbox.createStubInstance(DB);
      let values = {
        'hash': 'hash1',
        'filename': 'exists',
        'extension': '.shp',
      };
      db.find.returns(values);
      let service = new ExportService(db);
      let result = await service.download(1, '/tmp/exports');
      assert.strictEqual(result['status'], 'success');
      assert.strictEqual(result['file_path'], '/tmp/exports/hash1/exists.shp.zip');
      assert.strictEqual(result['content_type'], 'application/zip');
      assert.strictEqual(result['file_name'], 'exists.shp.zip');
    });
  });

  describe('#deleteExport', function() {
    it('should log error when export directory does not exist', async () => {
      sandbox.stub(fs, 'stat').callsArgWith(1, 'no such directory', {});
      sandbox.stub(fs, 'readdir').returns(null);

      try {
        let db = sandbox.createStubInstance(DB);
        let values = {
          'hash': 'hash1'
        };
        db.selectOne.returns(values);
        let spy_delete = db.deleteWhere;
        let service = new ExportService(db);
        let request = {'params': {'id': 1}};
        let result = await service.deleteExport(request, '/tmp/exports/');
        assert(spy_delete.called);
        assert(fs.readdir.notCalled);
      } catch(ex) {
        // this is to make sure that even in case of exception, 'restore' calls
        // are executed.
        console.log('exception in test: ' + ex);
      }

      fs.stat.restore();
      fs.readdir.restore();
    });
    it('should delete directory when it exists', async () => {
      sandbox.stub(fs, 'stat').callsArgWith(1, null, {});
      sandbox.stub(fs, 'readdir').callsArgWith(1, null, []);
      sandbox.stub(fs, 'unlinkSync').returns(null);
      sandbox.stub(fs, 'rmdirSync').returns(null);

      try {
        let db = sandbox.createStubInstance(DB);
        let values = {
          'hash': 'hash1'
        };
        db.selectOne.returns(values);
        let spy_delete = db.deleteWhere;
        let service = new ExportService(db);
        let request = {'params': {'id': 1}};
        let result = await service.deleteExport(request, '/tmp/exports/');
        assert(spy_delete.called);
        assert(fs.readdir.called);
        assert(fs.rmdirSync.called);
      } catch(ex) {
        // this is to make sure that even in case of exception, 'restore' calls
        // are executed.
        console.log('exception in test: ' + ex);
      }

      fs.stat.restore();
      fs.readdir.restore();
      fs.unlinkSync.restore();
      fs.rmdirSync.restore();
    });
  });
});

