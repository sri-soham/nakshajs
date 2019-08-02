const FunctionalHelper = require('../helpers/functional_helper.js');

module.exports = {
  beforeEach: function(browser) {
  },
  afterEach: function(browser) {
    FunctionalHelper.clearSessionFiles(process.env.TMP_DIR);
  },
  'Demo Test': function(browser) {
    browser.url(browser.launchUrl)
           .waitForElementVisible('body')
           .assert.title('Naksha')
           .end();
  },
  'Log In and Out': function(browser) {
    FunctionalHelper.login(browser);
    browser.click('#menu-links > a:last-child')
           .waitForElementVisible('div#login-div', 1000);
    browser.end();
  }
};

