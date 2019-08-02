const { Pool } = require('pg');
const assert = require('assert');
const DB = require('../../../app/db/db.js');

describe('DB Integration', function() {
  const TABLE_STOP = 'tbl_stop';
  
  let pool =  new Pool({
    user: process.env.DB_APP_USER,
    host: process.env.DB_HOST,
    password: process.env.DB_APP_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
  });
  
  beforeEach(async() => {
      let sql = `INSERT INTO tbl_stop (id, name, frag, the_geom) VALUES
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
  
      await pool.query(sql, []);
  });
  
  afterEach(async() => {
      let sql = 'DELETE FROM tbl_stop';
      await pool.query(sql, []);
  });
  
 
  async function getCount() {
    let sql = 'SELECT COUNT(*) AS cnt FROM ' + TABLE_STOP;
    let result = await pool.query(sql);
  
    return result.rows[0]['cnt'];
  }
  
  async function getRow(id) {
    let sql = 'SELECT * FROM ' + TABLE_STOP + ' WHERE id = $1';
    let values = [id];
    let result = await pool.query(sql, values);
  
    return result.rows[0];
  }
  
  async function getRows(name) {
    let sql = 'SELECT * FROM ' + TABLE_STOP + ' WHERE name = $1';
    let values = [name];
    let result = await pool.query(sql, values);
  
    return result.rows;
  }

  describe('#insert', function() {
    it('should insert row with auto-increment', async() => {
      let db = new DB(pool);
      let values = {'id': 11, 'name': 'Stop 11', 'frag': 'stop_11', 'the_geom': 'SRID=4326;POINT(10 10)'};
      await db.insert(TABLE_STOP, values);
      let count = await getCount(TABLE_STOP);
      assert.strictEqual(parseInt(count), 11);
    });
  });

  describe('#update', function() {
    it('should update values', async() => {
      let db = new DB(pool);
      let values = {'name': 'Stop 11'};
      let where = {'id': 10};
      let result = await db.update(TABLE_STOP, values, where);
      let row = await getRow(10);
      assert.strictEqual(row['name'], 'Stop 11');
    });
  });

  describe('#updateGeometry', function() {
    it('should update geometry with value', async() => {
      let db = new DB(pool);
      let where = {'id': 1};
      await db.updateGeometry(TABLE_STOP, 'SRID=4326;POINT(17.9999 18.9999)', where);
      let row = await getRow(1);
      assert(row['the_geom'] === '0101000020E610000039454772F9FF314039454772F9FF3240');
    });
    it('should set geometry to null', async() => {
      let db = new DB(pool);
      let where = {'id': 1};
      await db.updateGeometry(TABLE_STOP, '', where);
      let row = await getRow(1);
      assert(row['the_geom'] === null);
    });
  });

  describe('#deleteWhere', function() {
    it('should delete rows', async() => {
      let db = new DB(pool);
      let where = {'frag': 'stop_5'};
      await db.deleteWhere(TABLE_STOP, where);
      let count = await getCount();
      assert.strictEqual(parseInt(count), 9);
    });
  });

  describe('#selectAll', function() {
    it('should select all rows', async() => {
      let db = new DB(pool);
      let rows = await db.selectAll(TABLE_STOP, ['*']);
      assert.strictEqual(rows.length, 10);
    });
  });

  describe('#selectWhere', function() {
    it('should select with where', async() => {
      let db = new DB(pool);
      let rows = await db.selectWhere(TABLE_STOP, ['*'], {'frag': 'stop_1'});
      assert(rows.length === 1);
    });
    it('should select with order by limit', async() => {
      let db = new DB(pool);
      let rows = await db.selectWhere(TABLE_STOP, ['*'], {}, 'id', 4);
      assert.strictEqual(rows.length, 4);
    });
    it('should select with limit and offset', async() => {
      let db = new DB(pool);
      let rows = await db.selectWhere(TABLE_STOP, ['*'], {}, 'id', 3, 4);
      assert.strictEqual(rows.length, 3);
      assert.strictEqual(rows[0]['frag'], 'stop_5');
    });
  });

  describe('#getCount', function() {
    it('should get count all', async() => {
      let db = new DB(pool);
      let count = await db.getCount(TABLE_STOP);
      assert.strictEqual(parseInt(count), 10);
    });
    it('should get count where', async() => {
      let db = new DB(pool);
      let count = await db.getCount(TABLE_STOP, {'frag': 'stop_1'});
      assert.strictEqual(parseInt(count), 1);
    });
  });

  describe('#selectOne', function() {
    it('should get one 1', async() => {
      let db = new DB(pool);
      let row = await db.selectOne(TABLE_STOP, ['*'], {'frag': 'stop_1'});
      assert.strictEqual(row['name'], 'Stop 1');
    });
    it('should get null', async() => {
      let db = new DB(pool);
      let row = await db.selectOne(TABLE_STOP, ['*'], {'frag': 'stop_30'});
      assert.strictEqual(row, null);
    });
  });

  describe('#find', function() {
    it('should find record', async() => {
      let db = new DB(pool);
      let row = await db.find(TABLE_STOP, {'frag': 'stop_1'});
      assert.strictEqual(row['name'], 'Stop 1');
    });
    it('should raise error', async() => {
      let db = new DB(pool);
      let err_count = 0;
      try {
        let row = await db.find(TABLE_STOP, {'frag': 'stop_20'});
      }
      catch (err) {
        err_count++;
      }
      assert.strictEqual(err_count, 1);
    });
  });

  describe('#genericSelect', function() {
    it('should select rows', async() => {
      let db = new DB(pool);
      let sql = 'SELECT * FROM ' + TABLE_STOP + ' WHERE frag like $1';
      let rows = await db.genericSelect(sql, ['stop_%']);
      assert.strictEqual(rows.length, 10);
    });
    it('should select 2 rows', async() => {
      let db = new DB(pool);
      let sql = 'SELECT * FROM ' + TABLE_STOP + ' WHERE frag like $1';
      let rows = await db.genericSelect(sql, ['stop_1%']);
      assert.strictEqual(rows.length, 2);
    });
    it('should select 0 rows', async() => {
      let db = new DB(pool);
      let sql = 'SELECT * FROM ' + TABLE_STOP + ' WHERE frag like $1';
      let rows = await db.genericSelect(sql, ['stop_90%']);
      assert.strictEqual(rows.length, 0);
    });
  });

  describe('#genericExec', function() {
    it('should execute query', async() => {
      let db = new DB(pool);
      let sql = 'UPDATE ' + TABLE_STOP + ' SET name = $1';
      await db.genericExec(sql, ['Stop 11']);
      let rows = await getRows('Stop 11');
      assert.strictEqual(rows.length, 10);
    });
  });
});

