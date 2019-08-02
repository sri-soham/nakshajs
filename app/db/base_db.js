const logger = require('../helpers/logger.js');
const errors = require('../helpers/errors.js');

class BaseDB {
    constructor(conn) {
        // conn can be pool or client
        this._conn = conn;
    }

    insert(table, hash, auto_increment_column) {
        var i, columns, values, params, j, sql, that;

        columns = [];
        values = [];
        params = [];
        j = 0;
        for (i in hash) {
            columns.push(i);
            values.push(hash[i]);
            ++j;
            if (i === 'the_geom') {
                params.push('ST_GeomFromEWKT($' + j + ')');
            }
            else {
                params.push('$' + j);
            }
        }

        sql = 'INSERT INTO ' + table + ' (' + columns.join(', ') + ') VALUES (' + params.join(', ') + ') ';
        if (auto_increment_column && auto_increment_column.length > 0) {
            sql += ' RETURNING ' + auto_increment_column;
        }

        that = this;
        return new Promise(function(resolve, reject) {
            that._conn.query(sql, values, (err, res) => {
                if (err) {
                    logger.error('sql = ' + sql + ':', err);
                    reject(err);
                }
                else {
                    var obj = {};
                    if (auto_increment_column && auto_increment_column.length > 0) {
                        obj[auto_increment_column] = res.rows[0][auto_increment_column];
                    }
                    resolve(obj);
                }
            });
        });
    }

    insertWithGeometry(table, hash, auto_increment_column) {
        var i, columns, values, placeholders, j, sql, that;

        columns = [];
        values = [];
        placeholders = [];
        j = 0;
        for (i in hash) {
            ++j;
            columns.push(i);
            values.push(hash[i]);
            if (i === 'the_geom') {
                placeholders.push('ST_GeomFromEWKT($' + j + ')');
            }
            else {
                placeholders.push('$' + j);
            }
        }

        sql = 'INSERT INTO ' + table + ' (' + columns.join(', ') + ') VALUES (' + placeholders.join(', ') + ') ';
        if (auto_increment_column && auto_increment_column.length > 0) {
            sql += ' RETURNING ' + auto_increment_column;
        }

        that = this;
        return new Promise(function(resolve, reject) {
            that._conn.query(sql, values, (err, res) => {
                if (err) {
                    logger.error('sql = ' + sql + ':', err);
                    reject(err);
                }
                else {
                    var obj = {};
                    if (auto_increment_column && auto_increment_column.length > 0) {
                        obj[auto_increment_column] = res.rows[0][auto_increment_column];
                    }
                    resolve(obj);
                }
            });
        });
    }

    update(table, values_hash, where_hash) {
        let values, sql, that, set_obj, where_obj;

        set_obj = this._placeholdersAndValues(values_hash)
        where_obj = this._placeholdersAndValues(where_hash, set_obj.frags.length);
        values = set_obj.values.concat(where_obj.values);

        sql = 'UPDATE ' + table + ' SET ' + set_obj.frags.join(', ') + ' WHERE ' + where_obj.frags.join(' AND ');
        that = this;
        return new Promise(function(resolve, reject) {
            that._conn.query(sql, values, (err, res) => {
                if (err) {
                    logger.error('sql = ' + sql + ': ', err);
                    reject(err);
                }
                else {
                    resolve();
                }
            });
        });
    }

    updateGeometry(table, value, where_hash) {
        let sql, where_obj, that;

        if (value.length > 0) {
            where_obj = this._placeholdersAndValues(where_hash, 1);
            where_obj.values.unshift(value);
            sql = 'UPDATE ' + table + ' SET the_geom = ST_GeomFromEWKT($1) ';
        }
        else {
            // geometry columns do not accept empty strings
            where_obj = this._placeholdersAndValues(where_hash);
            sql = 'UPDATE ' + table + ' SET the_geom = NULL ';
        }
        sql += ' WHERE ' + where_obj.frags.join(' AND ');

        that = this;
        return new Promise(function(resolve, reject) {
            that._conn.query(sql, where_obj.values, (err, res) => {
                if (err) {
                    logger.error('sql = ' + sql + ': ', err);
                    reject(err);
                }
                else {
                    resolve();
                }
            });
        });
    }

    deleteWhere(table, where) {
        var where_obj, sql, that;

        where_obj = this._placeholdersAndValues(where);

        sql = 'DELETE FROM ' + table;
        if (where_obj.frags.length > 0) {
            sql += ' WHERE ' + where_obj.frags.join(' AND ');
        }
        that = this;
        return new Promise(function(resolve, reject) {
            that._conn.query(sql, where_obj.values, (err, res) => {
                if (err) {
                    logger.error('sql = ' + sql + ': ', err);
                    reject(err);
                }
                else {
                    resolve();
                }
            });
        });
    }

    selectAll(table, columns, order_by) {
        var sql, that;

        sql = 'SELECT ' + columns.join(', ') + ' FROM ' + table;
        if (order_by && order_by.length > 0) {
            sql += ' ORDER BY ' + order_by;
        }

        that = this;
        return new Promise(function(resolve, reject) {
            that._conn.query(sql, [], (err, res) => {
                if (err) {
                    logger.error('sql = ' + sql + ': ', err);
                    reject(err);
                }
                else {
                    resolve(res.rows);
                }
            });
        });
    }

    selectWhere(table, columns, where, order_by, limit, offset) {
        var sql, where_obj, i, that;

        where_obj = {frags: [], values: []};
        if (where) {
            where_obj = this._placeholdersAndValues(where);
        }

        sql = 'SELECT ' + columns.join(', ') + ' FROM ' + table;
        if (where_obj.frags.length > 0) {
            sql += ' WHERE ' + where_obj.frags.join(' AND ');
        }
        if (order_by && order_by.length > 0) {
            sql += ' ORDER BY ' + order_by;
        }
        if (limit) {
            sql += ' LIMIT ' + limit;
        }
        if (offset) {
            sql += ' OFFSET ' + offset;
        }

        that = this;
        return new Promise(function(resolve, reject) {
            that._conn.query(sql, where_obj.values, (err, res) => {
                if (err) {
                    logger.error('sql = ' + sql + ': ', err);
                    reject(err);
                }
                else {
                    resolve(res.rows);
                }
            });
        });
    }

    getCount(table, where) {
        var sql, that, where_obj;

        if (where) {
            where_obj = this._placeholdersAndValues(where);
        }
        else {
            where_obj = {frags: [], values: []};
        }
        sql = 'SELECT COUNT(*) AS cnt FROM ' + table;
        if (where_obj.frags.length > 0) {
            sql += ' WHERE ' + where_obj.frags.join(' AND ');
        }

        that = this;
        return new Promise(function(resolve, reject) {
            that._conn.query(sql, where_obj.values, (err, res) => {
                if (err) {
                    logger.error('sql = ' + sql + ': ', err);
                    reject(err);
                }
                else {
                    resolve(res.rows[0]['cnt']);
                }
            });
        });
    }

    selectOne(table, columns, where) {
        var where_obj, sql, that;

        where_obj = this._placeholdersAndValues(where);
        sql = 'SELECT ' + columns.join(', ') + ' FROM ' + table + ' WHERE ' + where_obj.frags.join(' AND ') + ' LIMIT 1';

        that = this;
        return new Promise(function(resolve, reject) {
            that._conn.query(sql, where_obj.values, (err, res) => {
                if (err) {
                    logger.error('sql = ' + sql + ': ', err);
                    reject(err);
                }
                else {
                    if (res.rows.length > 0) {
                        resolve(res.rows[0]);
                    }
                    else {
                        resolve(null);
                    }
                }
            });
        });
    }

    find(table, where) {
        var where_obj, sql, that;

        if (typeof where === 'object') {
            where_obj = this._placeholdersAndValues(where);
        }
        else {
            where_obj = {frags: ['id = $1'], values: [where]};
        }
        sql = 'SELECT * FROM ' + table + ' WHERE ' + where_obj.frags.join(' AND ' );
        that = this;
        return new Promise(function(resolve, reject) {
            that._conn.query(sql, where_obj.values, (err, res) => {
                if (err) {
                    logger.error('sql = ' + sql + ': ', err);
                    reject(err);
                }
                else {
                    if (res.rows.length > 0) {
                        resolve(res.rows[0]);
                    }
                    else {
                        logger.error('sql = ' + sql + ' - no such record');
                        reject(new errors.NakshaError('No such record'));
                    }
                }
            });
        });
    }

    genericSelect(sql, values) {
        let that = this;

        return new Promise(function(resolve, reject) {
            that._conn.query(sql, values, (err, res) => {
                if (err) {
                    logger.error('sql = ' + sql + ': ', err);
                    reject(err);
                }
                else {
                    resolve(res.rows);
                }
            });
        });
    }

    // Generic update, delete statement
    genericExec(sql, values) {
        let that = this;
        return new Promise(function(resolve, reject) {
            that._conn.query(sql, values, (err, res) => {
                if (err) {
                    logger.error('sql = ' + sql + ': ', err);
                    reject(err);
                }
                else {
                    resolve();
                }
            });
        });
    }

    _placeholdersAndValues(obj, j=0) {
        var i, frags, values;

        frags = [];
        values = [];
        for (i in obj) {
            ++j;
            frags.push(i + ' = $' + j);
            values.push(obj[i]);
        }

        return {frags: frags, values: values};
    }
}

module.exports = BaseDB;
