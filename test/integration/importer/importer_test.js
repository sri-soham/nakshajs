const assert = require('assert');
const path = require('path');
const fs = require('fs-extra');
const constants = require('../../../app/helpers/constants.js');
const DbHelper = require('../../../app/helpers/db_helper.js');
const Importer = require('../../../app/importer/importer.js');
const TestHelper = require('../../helpers/test_helper.js');

describe('Importer', function() {
  let db = DbHelper.getAppUserConn();

  async function clear_tables() {
      // without this "wait" call, tests are failing.
      await TestHelper.wait(0.5);
      let sql;
      let client = await db.getClient();
      await client.beginTransaction();
      sql = 'DROP TABLE IF EXISTS empty_two';
      await client.genericExec(sql, []);
      sql = 'DELETE FROM mstr_table';
      await client.genericExec(sql, []);
      await client.commitTransaction();
      client.release();
  }

  async function getCount() {
    let count = await db.getCount(constants.MSTR_TABLE, {});

    return count;
  }

  beforeEach(function() {
    return new Promise((resolve) => {
      setTimeout(function() {
        resolve();
      }, 100);
    });
  });

  afterEach(function() {
    return new Promise((resolve) => {
      setTimeout(async function() {
        await clear_tables();
        resolve();
      }, 100);
    });
  });

  describe('#shape-file', function() {
    it('should import shape file', async() => {
      let shape_path = path.resolve(__dirname, 'empty_two.zip');
      let file = {
        file_path: shape_path,
        name: 'empty_two.zip',
        truncated: false,
        mv: function(destination_path, callback) {
          fs.copySync(this.file_path, destination_path);
          callback();
        }
      };
      let request = {
        files: {
          file: file
        },
        body: {
          name: 'Empty Two'
        },
        query: {},
        session: {
          user_id: 1,
          schema_name: 'public'
        }
      };

      let count1 = await getCount();
      count1 = parseInt(count1);
      importer = new Importer(request, db);
      await importer.handleAddTable();
      let count2 = await getCount();
      count2 = parseInt(count2);
      assert.strictEqual(count2, count1+1);
    });
  });

  describe('#geojson', function() {
    it('should import geojson file', async() => {
      let file_path = path.resolve(__dirname, 'empty_two.geojson');
      let file = {
        file_path: file_path,
        name: 'empty_two.geojson',
        truncated: false,
        mv: function(destination_path, callback) {
          fs.copySync(this.file_path, destination_path);
          callback();
        }
      };
      let request = {
        files: {
          file: file
        },
        body: {
          name: 'Empty Two'
        },
        query: {},
        session: {
          user_id: 1,
          schema_name: 'public'
        }
      };

      let count1 = await getCount();
      count1 = parseInt(count1);
      importer = new Importer(request, db);
      await importer.handleAddTable();
      let count2 = await getCount();
      count2 = parseInt(count2);
      assert.strictEqual(count2, count1+1);
    });
  });

  describe('#kml', function() {
    it('should import kml file', async() => {
      let file_path = path.resolve(__dirname, 'empty_two.kml');
      let file = {
        file_path: file_path,
        name: 'empty_two.kml',
        truncated: false,
        mv: function(destination_path, callback) {
          fs.copySync(this.file_path, destination_path);
          callback();
        }
      };
      let request = {
        files: {
          file: file
        },
        body: {
          name: 'Empty Two'
        },
        query: {},
        session: {
          user_id: 1,
          schema_name: 'public'
        }
      };

      let count1 = await getCount();
      count1 = parseInt(count1);
      importer = new Importer(request, db);
      await importer.handleAddTable();
      let count2 = await getCount();
      count2 = parseInt(count2);
      assert.strictEqual(count2, count1+1);
    });
  });

  describe('#csv', function() {
    it('should import csv file', async() => {
      let file_path = path.resolve(__dirname, 'empty_two.csv');
      let file = {
        file_path: file_path,
        name: 'empty_two.csv',
        truncated: false,
        mv: function(destination_path, callback) {
          fs.copySync(this.file_path, destination_path);
          callback();
        }
      };
      let request = {
        files: {
          file: file
        },
        body: {
          name: 'Empty Two'
        },
        query: {},
        session: {
          user_id: 1,
          schema_name: 'public'
        }
      };

      let count1 = await getCount();
      count1 = parseInt(count1);
      importer = new Importer(request, db);
      await importer.handleAddTable();
      let count2 = await getCount();
      count2 = parseInt(count2);
      assert.strictEqual(count2, count1+1);
    });

    it('should import csv zip file', async() => {
      let file_path = path.resolve(__dirname, 'empty_two.csv.zip');
      let file = {
        file_path: file_path,
        name: 'empty_two.csv.zip',
        truncated: false,
        mv: function(destination_path, callback) {
          fs.copySync(this.file_path, destination_path);
          callback();
        }
      };
      let request = {
        files: {
          file: file
        },
        body: {
          name: 'Empty Two'
        },
        query: {},
        session: {
          user_id: 1,
          schema_name: 'public'
        }
      };

      let count1 = await getCount();
      count1 = parseInt(count1);
      importer = new Importer(request, db);
      await importer.handleAddTable();
      let count2 = await getCount();
      count2 = parseInt(count2);
      assert.strictEqual(count2, count1+1);
    });
  });
});

