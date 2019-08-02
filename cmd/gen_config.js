const path = require('path');
const fs = require('fs');
const Helper = require('../app/helpers/helper.js');

let Questionnaire = require('../app/helpers/questionnaire.js');

let env = `NODE_ENV=production
DB_HOST=127.0.0.1
DB_NAME=#db_name#
DB_PORT=5432
DB_APP_USER=#app_user#
DB_APP_PASSWORD=#app_password#
DB_API_USER=#api_user#
DB_API_PASSWORD=#api_password#
DB_ADMIN_USER=#admin_user#
DB_ADMIN_PASSWORD=#admin_password#
SERVER_PORT=#server_port#
COOKIE_NAME=nakshajs.sid
TMP_DIR=#app_path#/tmp
SESSION_SECRET=#session_secret#
`;

let sql = `
create database #db_name#;
\\connect #db_name#;
revoke all on schema public from public;
create extension postgis;
create user #admin_user# with password '#admin_password#';
create user #app_user# with password '#app_password#';
create user #api_user# with password '#api_password#';
grant all privileges on database #db_name# to #admin_user#;
grant all privileges on schema public to #admin_user#;
grant usage on schema public to #app_user#;
grant usage on schema public to #api_user#;
alter default privileges for user #admin_user# in schema public grant select, insert, update, delete, trigger on tables to #app_user#;
alter default privileges for user #admin_user# in schema public grant usage, select, update on sequences to #app_user#;
alter default privileges for user #admin_user# in schema public grant execute on functions to #app_user#;
grant #app_user# to #admin_user#;
`;

let forever_config = `
{
    "append": true,
    "watch": false,
    "uid": "nakshajs",
    "script": "server.js",
    "sourceDir": "#app_path#",
    "logFile": "#app_path#/tmp/logs/forever.log",
    "outFile": "#app_path#/tmp/logs/out.log",
    "errFile": "#app_path#/tmp/logs/err.log",
    "pidFile": "#app_path#/tmp/pids/naksha.pid",
    "command": "#node_path# -r dotenv/config"
}
`;

let apache_config = `
<VirtualHost *:80>
    ServerName #domain_name#
    DocumentRoot #app_path#/public

    ProxyPass /assets/ !
    ProxyPass "/" "http://127.0.0.1:#server_port#/"
    ProxyPassReverse "/" "http://127.0.0.1:#server_port#/"

    <Directory #app_path#/public>
        Options +ExecCGI
        Allow from all
        Require all granted
    </Directory>

    SetEnvIf REQUEST_URI "^/assets/_([a-zA-Z0-9]{16})/" ASSET_CACHE_HEADERS=TRUE
    Header always Set Cache-Control "public, max-age=2592000" env=ASSET_CACHE_HEADERS

    SetEnvIf REQUEST_URI "^/assets/libs/" LIB_ASSET_CACHE_HEADERS=TRUE
    Header always Set Cache-Control "public, max-age=31536000" env=LIB_ASSET_CACHE_HEADERS

    RewriteEngine On
    RewriteRule ^/assets/_([a-zA-Z0-9]{16})/(.*)$ /assets/$2 [NE,L]

    SetEnvIf REQUEST_URI "^/lyr/" LAYER_CACHE_HEADERS=TRUE
    Header Set Cache-Control "public, max-age=86400" env=LAYER_CACHE_HEADERS

    ErrorLog \${APACHE_LOG_DIR}/naksha-error.log
    LogLevel warn
    CustomLog \${APACHE_LOG_DIR}/naksha-access.log combined
</VirtualHost>
`;

class GenConfig {
    async exec() {
        let answers;

        answers = await this.getAnswers();
        answers = this.answersAsHash(answers);

        console.log('========================================');
        this.writeNakshaEnvFile(answers);
        this.writeSqlFile(answers);
        this.writeForverConfigFile(answers);
        this.writeApacheConfigFile(answers);
    }

    async getAnswers() {
        let answers = await Questionnaire([
            {'question': 'Domain (or public ip address) from which application will be accessed', 'mandatory': true, 'default_answer': ''},
            {'question': 'Database name', 'mandatory': true, 'default_answer': 'nakshajs_db'},
            {'question': 'DB admin user', 'mandatory': true, 'default_answer': 'nakshajs_admin_user', 'max_length': 60},
            {'question': 'DB admin user password', 'mandatory': true, 'min_length': 8},
            {'question': 'DB app user', 'mandatory': true, 'default_answer': 'nakshajs_app_user', 'max_length': 60},
            {'question': 'DB app user password', 'mandatory': true, 'min_length': 8},
            {'question': 'DB api user', 'mandatory': true, 'default_answer': 'nakshajs_api_user', 'max_length': 60},
            {'question': 'DB api user password', 'mandatory': true, 'min_length': 8},
            {'question': 'Preferred server port', 'mandatory': false, 'default_answer': '31000', 'max_length': 5}
        ]);

        return answers;
    }

    answersAsHash(answers) {
        return {
            'domain_name': answers[0],
            'db_name': answers[1],
            'db_admin_user': answers[2],
            'db_admin_password': answers[3],
            'db_app_user': answers[4],
            'db_app_password': answers[5],
            'db_api_user': answers[6],
            'db_api_password': answers[7],
            'server_port': answers[8],
            'app_path': path.join(__dirname, '..')
        };
    }

    writeNakshaEnvFile(answers) {
        var str = env;

        str = str.replace(/#db_name#/g, answers.db_name);
        str = str.replace(/#app_user#/g, answers.db_app_user);
        str = str.replace(/#app_password#/g, answers.db_app_password);
        str = str.replace(/#api_user#/g, answers.db_api_user);
        str = str.replace(/#api_password#/g, answers.db_api_password);
        str = str.replace(/#admin_user#/g, answers.db_admin_user);
        str = str.replace(/#admin_password#/g, answers.db_admin_password);
        str = str.replace(/#server_port#/g, answers.server_port);
        str = str.replace(/#app_path#/g, answers.app_path);
        var session_secret = Helper.randomString(32);
        session_secret = session_secret.toLowerCase();
        str = str.replace(/#session_secret#/g, session_secret);

        let env_path = path.join(answers.app_path, '.env');
        if (fs.existsSync(env_path)) {
            let env_bkup_path = path.join(answers.app_path, '.env.bkup');
            fs.renameSync(env_path, env_bkup_path);
        }
        fs.writeFileSync(path.join(answers.app_path, '.env'), str);
        console.log('naksha env file written as .env');
    }

    writeSqlFile(answers) {
        var str = sql;

        str = str.replace(/#db_name#/g, answers.db_name);
        str = str.replace(/#admin_user#/g, answers.db_admin_user);
        str = str.replace(/#admin_password#/g, answers.db_admin_password);
        str = str.replace(/#app_user#/g, answers.db_app_user);
        str = str.replace(/#app_password#/g, answers.db_app_password);
        str = str.replace(/#api_user#/g, answers.db_api_user);
        str = str.replace(/#api_password#/g, answers.db_api_password);

        fs.writeFileSync(path.join(answers.app_path, 'db.sql'), str);

        console.log('sql file written as db.sql');
    }

    writeForverConfigFile(answers) {
        var str = forever_config;

        str = str.replace(/#app_path#/g, answers.app_path);
        str = str.replace(/#node_path#/g, process.execPath);

        fs.writeFileSync(path.join(answers.app_path, 'forever.json'), str);

        console.log('forever config file written as forever.json');
    }

    writeApacheConfigFile(answers) {
        var str = apache_config;

        str = str.replace(/#domain_name#/g, answers.domain_name);
        str = str.replace(/#app_path#/g, answers.app_path);
        str = str.replace(/#server_port#/g, answers.server_port);

        fs.writeFileSync(path.join(answers.app_path, 'apache.vhost.conf'), str);

        console.log('apache config file written as apache.vhost.conf');
    }
}

let gen_config = new GenConfig();
gen_config.exec();
