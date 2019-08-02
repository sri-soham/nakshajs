const fs = require('fs');
const path = require('path');
const FunctionalHelper = require('../helpers/functional_helper.js');
const DbHelper = require('../../app/helpers/db_helper.js');
const Helper = require('../../app/helpers/helper.js');
const constants = require('../../app/helpers/constants.js');
const Exporter = require('../../app/exporter/exporter.js');

let db;
module.exports = {
  before: function(browser) {
    db = DbHelper.getAppUserConn();
  },
  beforeEach: async function(browser, done) {
    let sql = `INSERT INTO test_poly (naksha_id, the_geom, the_geom_webmercator, created_at, updated_at) VALUES
(1, '0106000020E610000001000000010300000001000000050000000000000020F04C405D710165BEC9FF3F01000000809E4D405D710165BEC9FF3F01000000809E4D40A64B78D771EDD93F01000000C09B4C40A64B78D771EDD93F0000000020F04C405D710165BEC9FF3F', '0106000020110F0000010000000103000000010000000500000051D05D0FB993584163103014C6000B41D45178D3D127594163103014C6000B41D45178D3D127594109F711183B05E640143F592C104C584109F711183B05E64051D05D0FB993584163103014C6000B41', '2019-05-25 10:34:47', '2019-05-25 10:34:47'),
(2, '0106000020E610000001000000010300000001000000060000000100000000694E400530F3FE4DD50B4001000000C06B4F400530F3FE4DD50B4001000000C06B4F40956070BC1B3A144001000000A0C84E40A895F94DA64C194001000000401A4E40B6F5D6A59BA015400100000000694E400530F3FE4DD50B40', '0106000020110F0000010000000103000000010000000600000064AEE98DCDD359410BF101EF3EA7174124C108358FAF5A410BF101EF3EA7174124C108358FAF5A412DDD0B4B7D332141ABFD106D04255A41EDF8C98AD38725412F7CF6A8EB905941379E63CF3C65224164AEE98DCDD359410BF101EF3EA71741', '2019-05-25 10:35:05', '2019-05-25 10:35:05'),
(3, '0106000020E6100000010000000103000000010000000500000001000000C0B74E40040B5AEEFF93A1BF0100000070075040040B5AEEFF93A1BF01000000700750407A0ED68F565FFDBF01000000A09B4E407A0ED68F565FFDBF01000000C0B74E40040B5AEEFF93A1BF', '0106000020110F00000100000001030000000100000005000000A0E0DC72AF165A4170D791ECB3DBADC09D8400FD193A5B4170D791ECB3DBADC09D8400FD193A5B41973CB9E844F308C18B05867CCCFE5941973CB9E844F308C1A0E0DC72AF165A4170D791ECB3DBADC0', '2019-05-25 10:35:24', '2019-05-25 10:35:24');
    `;
    await db.genericExec(sql, []);

    let ts = Helper.getCurrentTimestamp();
    let values = {
      'user_id': 1,
      'name': 'Test Poly',
      'schema_name': 'public',
      'table_name': 'test_poly',
      'status': '40',
      'created_at': ts,
      'updated_at': ts
    };
    let row = await db.insert(constants.MSTR_TABLE, values, 'id');

    values = {
      'table_id': row['id'],
      'geometry_column': 'the_geom_webmercator',
      'query': 'SELECT * FROM public.test_poly',
      'infowindow': '{"fields": []}',
      'style': '<Rule><PolygonSymbolizer fill="#000000" fill-opacity="0.75" /><LineSymbolizer stroke="#ffffff" stroke-width="0.5" stroke-opacity="1.0" /></Rule>',
      'hash': 'nzzRXVXnxwag4jJQEJHuzmGziPEmd0b5_1558760609',
      'update_hash': '3XgJXxUrssPozZkzof3HohH6LrPpdtSl_1558760724',
      'geometry_type': 'polygon',
      'created_at': ts,
      'updated_at': ts
    };
    await db.insert(constants.MSTR_LAYER, values, 'id');

    FunctionalHelper.login(browser);
    console.log('logged in');

    done();
  },
  afterEach: async function(browser, done) {
    FunctionalHelper.clearSessionFiles(process.env.TMP_DIR);
    let exports_dir = Helper.exportsDirectory();
    let rows = await db.selectAll(constants.MSTR_EXPORT, ['*'], 'id');
    if (rows.length > 0) {
      for (let row of rows) {
        console.log('deleting old export');
        let export_path = path.join(exports_dir, row['hash']);
        if (fs.existsSync(export_path)) {
          fs.readdirSync(export_path).forEach(function(file, inex) {
            fs.unlinkSync(path.join(export_path, file));
          });
          fs.rmdirSync(export_path);
        }
      }
    }
    await db.deleteWhere(constants.MSTR_EXPORT, {});
    await db.deleteWhere(constants.MSTR_TABLE, {});
    await db.deleteWhere(constants.MSTR_LAYER, {});

    let sql = 'DELETE FROM test_poly';
    await db.genericExec(sql, []);

    done();
  },
  'Export': function(browser) {
    browser.useXpath()
           .waitForElementVisible('(//div[@id="tables-list"]/div[@class="table-div"]//a)[1]')
           .expect.element('(//div[@id="tables-list"]/div[@class="table-div"]//a)[1]').to.have.attribute('href').which.contains('show');
    browser.click('xpath', '(//div[@id="tables-list"]/div[@class="table-div"]//a)[1]')
           .useCss()
           .waitForElementNotPresent('#tables-list')
           .waitForElementVisible('#tabs');
    browser.click('#ui-id-5')
           .waitForElementVisible('#actions-tab')
           .click('xpath', '//form[@id="frm_export"]//option[@value="' + Exporter.SHAPE_FILE + '"]')
           .click('#frm_export input[name=submit1]')
           .pause(500)
           .assert.cssClassNotPresent('#msg-div', 'disp-none')
           .expect.element('#msg-div').text.to.contain('Export started');
    browser.assert.cssClassNotPresent('#export-message-holder', 'disp-none')
           .pause(500)
           .click('#export-message-holder h5')
           .useXpath()
           .expect.element('//div[@id="export-message-container"]').text.to.contain('Export completed');
    browser.end();
  }
};

