const BaseDB = require('../../../app/db/base_db.js');
const assert = require('assert');

class TestPool {
    // To simulate error while running query, do not set rows
    constructor(rows) {
        this._sqls = [];
        this._values = [];
        this._rows = rows;
        this._is_find = false;
    }

    isFind() {
      this._is_find = true;
    }

    getClient(rows) {
        return new TestPool(rows);
    }

    query(sql, values, callback) {
        this._sqls.push(sql);
        this._values.push(values);
        if (this._rows) {
            if (this._is_find) {
              if (this._rows.length > 0) {
                callback(null, {'rows': [this._rows]});
              }
              else {
                callback(new Error('No such record'), {'rows': [this._rows]});
              }
            }
            else {
              callback(null, {'rows': [this._rows]});
            }
        }
        else {
            callback(new Error('some error'), {'rows': [this._rows]});
        }
    }

    equalsSql(index, sql) {
        return this._sqls[index].trim() === sql.trim();
    }

    equalsValues(index, values) {
        if (this._values[index].length !== values.length) {
            return false;
        }
        else {
            let i, valid_length;
            valid_length = 0;
            for (i=0; i<values.length; ++i) {
                if (this._values[index][i] === values[i]) {
                    valid_length++;
                }
            }

            return valid_length === values.length;
        }
    }

    sqlsCount(count) {
        return this._sqls.length === count;
    }

    getSql(index) {
        return this._sqls[index].trim();
    }
}

describe('DB', function() {
  describe('#insert', function() {
    it('should insert row without autoincrement', async() => {
      let pool = new TestPool({});
      let db = new BaseDB(pool);
      let result = await db.insert('tbl_user', {'name': 'John', 'email': 'john.doe@gmail.com'});
      let expected_sql = 'INSERT INTO tbl_user (name, email) VALUES ($1, $2) ';
      assert(pool.equalsSql(0, expected_sql));
      assert(pool.equalsValues(0, ['John', 'john.doe@gmail.com']));
    });
    it('should insert row with autoincrement', async() => {
      let pool = new TestPool({'id': 1});
      let db = new BaseDB(pool);
      let result = await db.insert('tbl_user', {'name': 'John', 'email': 'john.doe@gmail.com'}, 'id');
      let expected_sql = 'INSERT INTO tbl_user (name, email) VALUES ($1, $2)  RETURNING id';
      assert(pool.equalsSql(0, expected_sql));
      assert(pool.equalsValues(0, ['John', 'john.doe@gmail.com']));
      assert(result['id'] === 1);
    });
    it('should not insert without autoincrement on error', async() => {
      let pool = new TestPool();
      let db = new BaseDB(pool);
      let result, err_count;
      err_count = 0;
      try {
        result = await db.insert('tbl_user', {'name': 'John', 'email': 'john.doe@gmail.com'});
      }
      catch (err) {
        err_count++;
      }
      assert(err_count === 1);
    });
    it('should not insert with autoincrement on error', async() => {
      let pool = new TestPool();
      let db = new BaseDB(pool);
      let result, err_count;
      err_count = 0;
      try {
        result = await db.insert('tbl_user', {'name': 'John', 'email': 'john.doe@gmail.com'}, 'id');
      }
      catch (err) {
        err_count++;
      }
      assert(err_count === 1);
    });
    it('should insert row without autoincrement and with geometry', async() => {
      let pool = new TestPool({});
      let db = new BaseDB(pool);
      let values = {'name': 'John', 'the_geom': 'SRID=4326;POINT(17 84)'};
      let result = await db.insert('tbl_user', values);
      let expected_sql = 'INSERT INTO tbl_user (name, the_geom) VALUES ($1, ST_GeomFromEWKT($2)) ';
      assert(pool.equalsSql(0, expected_sql));
      assert(pool.equalsValues(0, ['John', 'SRID=4326;POINT(17 84)']));
    });
  });

  describe('#update', function() {
    it('should update values', async() => {
      let pool = new TestPool({});
      let db = new BaseDB(pool);
      let values = {'name': 'John Doe', 'email': 'john.doe@gmail.com'};
      let where = {'id': 1};
      let result = await db.update('tbl_user', values, where);
      let expected_sql = 'UPDATE tbl_user SET name = $1, email = $2 WHERE id = $3 ';
      assert(pool.equalsSql(0, expected_sql));
      assert(pool.equalsValues(0, ['John Doe', 'john.doe@gmail.com', 1]));
    });
    it('should not update on error', async() => {
      let pool = new TestPool();
      let db = new BaseDB(pool);
      let values = {'name': 'John Doe', 'email': 'john.doe@gmail.com'};
      let where = {'id': 1};
      let result, err_count = 0;
      try {
        result = await db.update('tbl_user', values, where);
      }
      catch(e) {
        err_count++;
      }
      assert(err_count === 1);
    });
  });

  describe('#updateGeometry', function() {
    it('should set geometry', async() => {
      let pool = new TestPool({});
      let db = new BaseDB(pool);
      let result = await db.updateGeometry('a3kler49.census_wards', 'SRID=4326;POINT(17 19)', {'id': 1});
      let expected_sql = 'UPDATE a3kler49.census_wards SET the_geom = ST_GeomFromEWKT($1)  WHERE id = $2';
      assert(pool.equalsSql(0, expected_sql));
      assert(pool.equalsValues(0, ['SRID=4326;POINT(17 19)', 1]));
    });
    it('should set geometry to null', async() => {
      let pool = new TestPool({});
      let db = new BaseDB(pool);
      let result = await db.updateGeometry('a3kler49.census_wards', '', {'id': 1});
      let expected_sql = 'UPDATE a3kler49.census_wards SET the_geom = NULL  WHERE id = $1';
      assert(pool.equalsSql(0, expected_sql));
      assert(pool.equalsValues(0, [1]));
    });
    it('should not set geometry on error', async() => {
      let pool = new TestPool();
      let db = new BaseDB(pool);
      let result, err_count = 0;
      try {
        result = await db.updateGeometry('a3kler49.census_wards', 'SRID=4326;POINT(10 10)', {'id': 1});
      }
      catch(e) {
        err_count++;
      }
      assert(err_count === 1);
    });
  });

  describe('#deleteWhere', function() {
    it('should delete rows', async() => {
      let pool = new TestPool({});
      let db = new BaseDB(pool);
      let result = await db.deleteWhere('tbl_user', {'id': 1, 'table_id': 2});
      let expected_sql = 'DELETE FROM tbl_user WHERE id = $1 AND table_id = $2';
      assert(pool.equalsSql(0, expected_sql));
      assert(pool.equalsValues(0, [1, 2]));
    });
    it('should not delete on error', async() => {
      let pool = new TestPool();
      let db = new BaseDB(pool);
      let result, err_count = 0;
      try {
        result = await db.deleteWhere('tbl_user', {'id': 1});
      }
      catch(e) {
       err_count++;
      }
      assert(err_count === 1);
    });
  });

  describe('#selectAll', function() {
    it('should select all rows all columns with order by', async() => {
      let rows = [{'id': 1, 'name': 'One'}, {'id': 2, 'name': 'Two'}];
      let pool = new TestPool(rows);
      let db = new BaseDB(pool);
      let result = await db.selectAll('tbl_user', ['*'], 'id');
      let expected_sql = 'SELECT * FROM tbl_user ORDER BY id';
      assert(pool.equalsSql(0, expected_sql));
      assert(rows, result['rows']);
    });
    it('should select all rows specific columns without order by', async() => {
      let rows = [{'id': 1}, {'id': 2}];
      let pool = new TestPool(rows);
      let db = new BaseDB(pool);
      let result = await db.selectAll('tbl_user', ['id']);
      let expected_sql = 'SELECT id FROM tbl_user';
      assert(pool.equalsSql(0, expected_sql));
      assert(rows, result['rows']);
    });
    it('should not select rows on error', async() => {
      let pool = new TestPool();
      let db = new BaseDB(pool);
      let result, err_count = 0;
      try {
        result = await db.selectAll('tbl_user', ['*']);
      }
      catch(err) {
        err_count++;
      }
      assert(err_count === 1);
    });
  });

  describe('#selectWhere', function() {
    it('should select with where', async() => {
      let pool = new TestPool({});
      let db = new BaseDB(pool);
      let result = await db.selectWhere('tbl_user', ['*'], {'id': 1});
      let expected_sql = 'SELECT * FROM tbl_user WHERE id = $1';
      assert(pool.equalsSql(0, expected_sql));
      assert(pool.equalsValues(0, [1]));
    });
    it('should select with where, order-by', async() => {
      let pool = new TestPool({});
      let db = new BaseDB(pool);
      let result = await db.selectWhere('tbl_user', ['*'], {'id': 1}, 'name');
      let expected_sql = 'SELECT * FROM tbl_user WHERE id = $1 ORDER BY name';
      assert(pool.equalsSql(0, expected_sql));
      assert(pool.equalsValues(0, [1]));
    });
    it('should select with where, order-by, limit', async() => {
      let pool = new TestPool({});
      let db = new BaseDB(pool);
      let result = await db.selectWhere('tbl_user', ['*'], {'id': 1}, 'name', 10);
      let expected_sql = 'SELECT * FROM tbl_user WHERE id = $1 ORDER BY name LIMIT 10';
      assert(pool.equalsSql(0, expected_sql));
      assert(pool.equalsValues(0, [1]));
    });
    it('should select with where, order-by, limit, offset', async() => {
      let pool = new TestPool({});
      let db = new BaseDB(pool);
      let result = await db.selectWhere('tbl_user', ['*'], {'id': 1}, 'name', 10, 20);
      let expected_sql = 'SELECT * FROM tbl_user WHERE id = $1 ORDER BY name LIMIT 10 OFFSET 20';
      assert(pool.equalsSql(0, expected_sql));
      assert(pool.equalsValues(0, [1]));
    });
    it('should select with without where; with order-by, limit, offset', async() => {
      let pool = new TestPool({});
      let db = new BaseDB(pool);
      let result = await db.selectWhere('tbl_user', ['*'], {}, 'name', 10, 20);
      let expected_sql = 'SELECT * FROM tbl_user ORDER BY name LIMIT 10 OFFSET 20';
      assert(pool.equalsSql(0, expected_sql));
      assert(pool.equalsValues(0, []));
    });
    it('should not select where on error', async() => {
      let pool = new TestPool();
      let db = new BaseDB(pool);
      let result, err_count = 0;
      try {
        result = await db.selectWhere('tbl_user', ['*'], {'id': 10}, 'name', 30, 30);
      }
      catch(err) {
        err_count++;
      }
      assert(err_count === 1);
    });
  });

  describe('#getCount', function() {
    it('should get count', async() => {
      let pool = new TestPool({});
      let db = new BaseDB(pool);
      let result = await db.getCount('tbl_user', {'id': 10});
      let expected_sql = 'SELECT COUNT(*) AS cnt FROM tbl_user WHERE id = $1';
      assert(pool.equalsSql(0, expected_sql));
      assert(pool.equalsValues(0, [10]));
    });
    it('should get count without where', async() => {
      let pool = new TestPool({});
      let db = new BaseDB(pool);
      let result = await db.getCount('tbl_user', {});
      let expected_sql = 'SELECT COUNT(*) AS cnt FROM tbl_user';
      assert(pool.equalsSql(0, expected_sql));
      assert(pool.equalsValues(0, []));
    });
    it('should not get count on error', async() => {
      let pool = new TestPool();
      let db = new BaseDB(pool);
      let err_count = 0;
      try {
        await db.getCount('tbl_user', {'id': 1, 'user_id': 4});
      }
      catch(err) {
        err_count++;
      }
      assert(err_count === 1);
    });
  });

  describe('#selectOne', function() {
    it('should select one row', async() => {
      let pool = new TestPool({});
      let db = new BaseDB(pool);
      let result = await db.selectOne('tbl_user', ['*'], {'id': 4});
      let expected_sql = 'SELECT * FROM tbl_user WHERE id = $1 LIMIT 1';
      assert(pool.equalsSql(0, expected_sql));
      assert(pool.equalsValues(0, [4]));
    });
    it('should not select one row on error', async() => {
      let pool = new TestPool();
      let db = new BaseDB(pool);
      let err_count = 0;
      try {
        await db.selectOne('tbl_user', ['*'], {'id': 1});
      }
      catch(err) {
        err_count++;
      }
      assert(err_count === 1);
    });
  });

  describe('#find', function() {
    it('should find row', async() => {
      let pool = new TestPool([{'id': 4}]);
      let db = new BaseDB(pool);
      let result = await db.find('tbl_user', {'id': 4});
      let expected_sql = 'SELECT * FROM tbl_user WHERE id = $1';
      assert(pool.equalsSql(0, expected_sql));
      assert(pool.equalsValues(0, [4]));
    });
    it('should raise error when no rows', async() => {
      let pool = new TestPool([]);
      pool.isFind();
      let db = new BaseDB(pool);
      let err_count = 0;
      try {
        let result = await db.find('tbl_user', {'id': 4});
      }
      catch (err) {
        err_count++;
      }
      assert(err_count === 1);
    });
    it('should not find on error', async() => {
      let pool = new TestPool();
      let db = new BaseDB(pool);
      let err_count = 0;
      try {
        let result = await db.find('tbl_user', {'id': 4});
      }
      catch (err) {
        err_count++;
      }
      assert(err_count === 1);
    });
  });

  describe('#genericSelect', function() {
    it('should get rows', async() => {
      let pool = new TestPool([{'id': 1}, {'id': 2}]);
      let db = new BaseDB(pool);
      let sql = 'SELECT id FROM tbl_user WHERE id = $1';
      let result = await db.genericSelect(sql, [10]);
      assert(pool.equalsSql(0, sql));
      assert(pool.equalsValues(0, [10]));
    });
    it('should not get rows on error', async() => {
      let pool = new TestPool();
      let db = new BaseDB(pool);
      let err_count = 0;
      try {
        await db.genericSelect('SELECT id FROM tbl_user', []);
      }
      catch (err) {
        err_count++;
      }
    });
  });

  describe('genericExec', function() {
    it('should execute query', async() => {
      let pool = new TestPool({});
      let db = new BaseDB(pool);
      let sql = 'UPDATE tbl_user SET name = $1 WHERE id = $2';
      let values = ['John', 10];
      let result = await db.genericExec(sql, values);
      assert(pool.equalsSql(0, sql));
      assert(pool.equalsValues(0, values));
    });
    it('should not execute query on error', async() => {
      let pool = new TestPool();
      let db = new BaseDB(pool);
      let err_count = 0;
      try {
        await db.genericExec('UPDATE tbl_user SET name = $1 WHERE id = $2', ['John', 2]);
      }
      catch(err) {
        err_count++;
      }
      assert(err_count === 1);
    });
  });
});

