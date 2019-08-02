const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const constants = require('../app/helpers/constants.js');
const DbHelper = require('../app/helpers/db_helper.js');

class ImportDb {
    async exec() {
        let sqls_dir = this.getSqlsDir();
        let db = DbHelper.getAdminUserConn();
        await this.createMigrationsTableIff(db);
        let max_version = await this.getMaxImportedVersion(db);
        let sql_files = this.getSqlFilesToBeImported(sqls_dir, max_version);
        await this.importFiles(db, sqls_dir, sql_files);
    }

    getSqlsDir() {
        let sqls_dir = path.join(__dirname, '..', 'sqls');
        if (!fs.existsSync(sqls_dir)) {
            console.log('sqls directory does not exist');
            process.exit(1);
        }
        
        return sqls_dir;
    }

    async createMigrationsTableIff(db) {
        let count, query, table;

        table = constants.MSTR_MIGRATION.split('.').pop();
        count = await db.getCount('information_schema.tables', {'table_schema': 'public', 'table_name': table});
        if (count == 0) {
            query = 'CREATE TABLE ' + constants.MSTR_MIGRATION + ' (version VARCHAR(16), PRIMARY KEY(version));';
            await db.genericExec(query, []);
        }
    }

    async getMaxImportedVersion(db) {
        let query, rows;

        query = 'SELECT MAX(version) AS mversion FROM ' + constants.MSTR_MIGRATION;
        rows = await db.genericSelect(query, []);

        return rows[0]['mversion'];
    }

    getSqlFilesToBeImported(sqls_dir, max_version) {
        let version, sql_files;

        sql_files = [];
        fs.readdirSync(sqls_dir).forEach(function(file, index) {
            if (path.extname(file).toLowerCase() == '.sql') {
                version = path.basename(file, '.sql');
                if (version > max_version) {
                    sql_files.push(file);
                }
            }
        });

        return sql_files;
    }

    async importFiles(db, sqls_dir, sql_files) {
        let conn_str, i, psql, full_path, has_error, version;

        conn_str = DbHelper.dbConnStringForCsvAdmin();
        for (i=0; i<sql_files.length; ++i) {
            full_path = path.join(sqls_dir, sql_files[i]);
            psql = spawnSync('psql', [conn_str, '-f', full_path]);
            if (psql.status > 0) {
                console.log('1- Could not import ' + full_path + '. output = ' + psql.stdout + ', error = ' + psql.stderr);
                break;
            }
            has_error = false;
            if (psql.stderr.indexOf('ERROR') > -1 || psql.stdout.indexOf('ERROR') > -1) {
                has_error = true;
            }
            if (psql.stdout.indexOf('WARNING') > -1 || psql.stdout.indexOf('WARNING') > -1) {
                has_error = true;
            }
            if (has_error) {
                console.log('2- Could not import ' + full_path + '. output = ' + psql.stdout + ', error = ' + psql.stderr);
                break;
            }
            version = path.basename(full_path, '.sql');
            await db.insert(constants.MSTR_MIGRATION, {'version': version}, '');
            console.log('Imported: ' + full_path);
        }
    }
}

let importdb = new ImportDb();
importdb.exec().then((result) => {
}).catch((error) => {
    console.log(error);
});;

