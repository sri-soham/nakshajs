const fs = require('fs');
const path = require('path');

let FunctionalHelper = (function() {
  let thisClass = {};

  thisClass.clearSessionFiles = function(tmp_dir) {
    let sessions_path = path.join(tmp_dir, 'sessions');
    fs.readdirSync(sessions_path).forEach(function(file, index) {
      fs.unlinkSync(path.join(sessions_path, file));
    });
  };

  thisClass.login = function(browser) {
    browser.url(browser.launchUrl)
           .waitForElementVisible('body')
           .setValue('input[name="username"]', 'tester')
           .setValue('input[name="password"]', 'tester')
           .click('input[name="submit1"]')
           .waitForElementVisible('#page-title', 1000)
           .expect.element('#page-title').text.to.equal('Dashboard');
  };

  return thisClass;
})();

module.exports = FunctionalHelper;
