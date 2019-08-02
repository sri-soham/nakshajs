const { Pool } = require('pg');
const DB = require('../db/db.js');

let DbHelper = (function() {
    var thisClass = {};

    thisClass.getAppUserConn = function() {
        let pool = new Pool({
            user: process.env.DB_APP_USER,
            host: process.env.DB_HOST,
            password: process.env.DB_APP_PASSWORD,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT
        });

        return new DB(pool);
    };

    thisClass.getApiUserConn = function() {
        let pool = new Pool({
            user: process.env.DB_API_USER,
            host: process.env.DB_HOST,
            password: process.env.DB_API_PASSWORD,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT
        });

        return new DB(pool);
    };

    thisClass.getAdminUserConn = function() {
        let pool = new Pool({
            user: process.env.DB_ADMIN_USER,
            host: process.env.DB_HOST,
            password: process.env.DB_ADMIN_PASSWORD,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT
        });

        return new DB(pool);
    };

    thisClass.dbConnStringForOgr2Ogr = function() {
        return 'PG:host=' + process.env.DB_HOST + ' user=' + process.env.DB_APP_USER + ' dbname=' + process.env.DB_NAME + ' password=' + process.env.DB_APP_PASSWORD;
    };

    thisClass.dbConnStringForCsv = function() {
        return 'postgresql://' +
               process.env.DB_APP_USER + ':' + process.env.DB_APP_PASSWORD +
               '@' + process.env.DB_HOST +
               '/' + process.env.DB_NAME +
               '?sslmode=disable';
    };

    thisClass.dbConnStringForCsvAdmin = function() {
        return 'postgresql://' +
               process.env.DB_ADMIN_USER + ':' + process.env.DB_ADMIN_PASSWORD +
               '@' + process.env.DB_HOST +
               '/' + process.env.DB_NAME +
               '?sslmode=disable';
    };

    return thisClass;

})();

module.exports = DbHelper;

