const path = require('path');
const dotenv = require('dotenv');

let env_path = path.join(__dirname, '.testing.env');
dotenv.config({path: env_path})

module.exports = (function(settings) {
  settings.launch_url = 'http://127.0.0.1:' + process.env.SERVER_PORT + '/';

  return settings;
})(require('./nightwatch.json'));
