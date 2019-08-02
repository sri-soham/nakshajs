const path = require('path');
const fs = require('fs');
const FunctionalHelper = require('../helpers/functional_helper.js');
const DbHelper = require('../../app/helpers/db_helper.js');
const Helper = require('../../app/helpers/helper.js');
const constants = require('../../app/helpers/constants.js');

module.exports = {
  beforeEach: function(browser) {
    FunctionalHelper.login(browser);
  },
  afterEach: async function(browser, done) {
    FunctionalHelper.clearSessionFiles(process.env.TMP_DIR);
    let db = DbHelper.getAppUserConn();
    let sql = 'SELECT * FROM ' + constants.MSTR_TABLE;
    let rows = await db.genericSelect(sql, []);
    for (let row of rows) {
        sql = 'DROP TABLE IF EXISTS ' + Helper.schemaTableFromDetails(row);
        await db.genericExec(sql, []);
    }
    sql = 'DELETE FROM ' + constants.MSTR_TABLE;
    await db.genericExec(sql, []);
    done();
  },
  'Import': function(browser) {
    browser.click('xpath', '//div[@id="content"]//a[@href="/tables/add"]')
           .waitForElementVisible('#frm_table_add');
    
    let shp_path = path.resolve(__dirname, '..', 'integration', 'importer', 'empty_two.zip');
    browser.setValue('#frm_table_add input[name=name]', 'Empty Two')
           .setValue('#frm_table_add input[name=file]', shp_path)
           .click('#frm_table_add input[name=submit1]')
           .pause(2000)
           .assert.cssClassNotPresent('#import-message-holder', 'disp-none')
           .pause(2500)
           .click('#import-message-holder h5')
           .useXpath()
           .expect.element('//div[@id="import-message-container"]').text.to.contain('Import completed');
    browser.end();
  }
};

