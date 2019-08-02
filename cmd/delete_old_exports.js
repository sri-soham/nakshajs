const path = require('path');
const fs = require('fs');
const Helper = require('../app/helpers/helper.js');
const DbHelper = require('../app/helpers/db_helper.js');
const constants = require('../app/helpers/constants.js');

let argv, older_than;

argv = require('minimist')(process.argv.slice(2));
if (argv['older-than'] && argv['older-than'].toString().length > 0) {
    older_than = parseInt(argv['older-than']);
}
else {
    older_than = 3;
}
if (older_than < 2) {
    console.log('Only the exports older than 2 days can be deleted');
    process.exit(0);
}

class DeleteOldExports {
    async exec(older_than) {
        let db = DbHelper.getAppUserConn();
        let old_exports = await this.getExportsOlderThan(db, older_than);
        console.log('old-exports = ' + old_exports);
        await this.deleteOldExports(db, Helper.exportsDirectory(), old_exports);
    }

    async getExportsOlderThan(db, older_than) {
        let query, old_exports;

        query = 'SELECT * FROM ' + constants.MSTR_EXPORT + ' WHERE updated_at <= (CURRENT_DATE - INTERVAL \'' + older_than + ' day\')';
        console.log('query = ' + query);
        old_exports = await db.genericSelect(query, []);

        return old_exports;
    }

    async deleteOldExports(db, exports_dir, old_exports) {
        let ids, i, export_path, query;

        ids = [];
        console.log('2- old-exports = ' + old_exports);
        for (i=0; i<old_exports.length; ++i) {
            export_path = path.join(exports_dir, old_exports[i]['hash']);
            ids.push(old_exports[i]['id']);
            console.log('Export: ' + export_path);
            if (fs.existsSync(export_path)) {
                fs.readdirSync(export_path).forEach(function(file, inex) {
                    fs.unlinkSync(path.join(export_path, file));
                });
                fs.rmdirSync(export_path);
            }
        }

        if (ids.length > 0) {
            query = 'DELETE FROM ' + constants.MSTR_EXPORT + ' WHERE id IN (' + ids.join(',') + ')';
            await db.genericExec(query, []);
        }
        console.log('Done');
    }
}

let deleter = new DeleteOldExports();
deleter.exec(older_than).then((result) => {
  process.exit(0);
}).catch((error) => {
    console.log(error);
    console.log('could not delete exports');
});

