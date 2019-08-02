const BaseDB = require('./base_db.js');
const Client = require('./client.js');

class DB extends BaseDB {
    async getClient() {
        let pg_client = await this._conn.connect();
        return new Client(pg_client);
    }
}

module.exports = DB;
