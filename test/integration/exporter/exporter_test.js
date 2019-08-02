const assert = require('assert');
const path = require('path');
const fs = require('fs');
const constants = require('../../../app/helpers/constants.js');
const DbHelper = require('../../../app/helpers/db_helper.js');
const Helper = require('../../../app/helpers/helper.js');
const Exporter = require('../../../app/exporter/exporter.js');
const TestHelper = require('../../helpers/test_helper.js');

describe('Exporter', function() {
  let db = DbHelper.getAppUserConn();

  async function update_tables() {
    let sql, client, params, row;

    client = await db.getClient();
    params = {
      'user_id': 1,
      'name': 'Stops',
      'schema_name': 'public',
      'table_name': 'tbl_stop',
      'status': constants.IMPORT_READY
    };
    try {
      await client.beginTransaction();
      row = await client.insert(constants.MSTR_TABLE, params, 'id');
      sql = `INSERT INTO tbl_stop (id, name, frag, the_geom) VALUES
(1, 'Stop 1', 'stop_1', '0101000020E610000000000000000031400000000000003240'),
(2, 'Stop 2', 'stop_2', '0101000020E6100000EA95B20C711C3140EA95B20C711C3240'),
(3, 'Stop 3', 'stop_3', '0101000020E6100000D42B6519E2383140D42B6519E2383240'),
(4, 'Stop 4', 'stop_4', '0101000020E6100000BEC1172653553140BEC1172653553240'),
(5, 'Stop 5', 'stop_5', '0101000020E6100000A857CA32C4713140A857CA32C4713240'),
(6, 'Stop 6', 'stop_6', '0101000020E610000091ED7C3F358E314091ED7C3F358E3240'),
(7, 'Stop 7', 'stop_7', '0101000020E61000007B832F4CA6AA31407B832F4CA6AA3240'),
(8, 'Stop 8', 'stop_8', '0101000020E61000006519E25817C731406519E25817C73240'),
(9, 'Stop 9', 'stop_9', '0101000020E61000004FAF946588E331404FAF946588E33240'),
(10, 'Stop 10', 'stop_10', '0101000020E610000039454772F9FF314039454772F9FF3240');
`;
      await client.genericExec(sql, []);
      await client.commitTransaction();
    }
    catch (e) {
      await client.rollbackTransaction();
      throw(e);
    }
    finally {
      await client.release();
    }

    return row['id'];
  }

  async function clear_tables() {
    let sql, client;

    client = await db.getClient();
    try {
      client.beginTransaction();

      sql = 'DELETE FROM tbl_stop';
      await client.genericExec(sql, []);

      sql = 'DELETE FROM ' + constants.MSTR_TABLE;
      await client.genericExec(sql, []);

      sql = 'DELETE FROM ' + constants.MSTR_EXPORT;
      await client.genericExec(sql, []);

      await client.commitTransaction();
    }
    catch(e) {
      await client.rollbackTransaction();
      throw(e);
    }
    finally {
      client.release();
    }
  }

  beforeEach(function() {
    var current_test = this.currentTest;
    return new Promise((resolve) => {
      (async() => {
        current_test.table_id = await update_tables();
      })();
      setTimeout(function() {
        resolve();
      }, 100);
    });
  });

  afterEach(async function() {
    return new Promise((resolve) => {
      (async() => {
        await clear_tables();
      })();
      setTimeout(async() => {
        resolve();
      }, 100);
    });
  });

  async function run_exporter_test(file_type, extension, this_test) {
    let exporter = new Exporter(db, file_type);
    let table_count1 = await db.getCount(constants.MSTR_TABLE, {});
    await exporter.handleExport(1, this_test.table_id);
    let table_count2 = await db.getCount(constants.MSTR_TABLE, {});
    assert(table_count2, table_count1+1, extension + ' table count mismatch');
    let tmp = await db.selectAll(constants.MSTR_EXPORT, ['*'], 'id');
    assert(tmp.length, 1, extension + ' export count mismatch');
    let details = tmp[0];
    assert(details['extension'], extension, extension + ' extension mismatch');
    let dir_path = path.join(Helper.exportsDirectory(), details['hash']);
    let file_path = path.join(dir_path, details['filename'] + details['extension'] + '.zip');
    await TestHelper.wait(0.25); // wait for a second till the yazl completes writing the file
    let exists = fs.existsSync(file_path);
    assert(exists, extension + ' file does not exist');
    fs.unlinkSync(file_path);
    fs.rmdirSync(dir_path);
  }

  it('should export shape file', async function() {
    await run_exporter_test(Exporter.SHAPE_FILE, '.shp', this.test);
  });

  it('should export csv file', async function() {
    await run_exporter_test(Exporter.CSV_FILE, '.csv', this.test);
  });

  it('should export geojson file', async function() {
    await run_exporter_test(Exporter.GEOJSON_FILE, '.geojson', this.test);
  });

  it('should export kml file', async function() {
    await run_exporter_test(Exporter.KML_FILE, '.kml', this.test);
  });
});

