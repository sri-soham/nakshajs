const BaseDB = require('./base_db.js');

class Client extends BaseDB {
    async beginTransaction() {
        await this._conn.query('BEGIN');
    }

    async commitTransaction() {
        await this._conn.query('COMMIT');
    }

    async rollbackTransaction() {
        await this._conn.query('ROLLBACK');
    }

    release() {
        this._conn.release();
    }
}

module.exports = Client;
