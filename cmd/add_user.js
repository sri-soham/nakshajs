const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const Questionnaire = require('../app/helpers/questionnaire.js');
const Helper = require('../app/helpers/helper.js');
const DbHelper = require('../app/helpers/db_helper.js');
const constants = require('../app/helpers/constants.js');

class AddUser {
    async exec() {
        let answers = await this.getAnswers();
        let db = DbHelper.getAdminUserConn();
        if (!await this.isUsernameAvailable(db, answers[2])) {
            console.log('Username "' + answers[1] + '" is taken');
            process.exit(1);
        }
        await this.updateDb(db, answers);
    }

    async getAnswers() {
        let answers = await Questionnaire([
            {'question': 'Name', 'mandatory': true, 'default_answer': '', 'max_length': 64},
            {'question': 'Username', 'mandatory': true, 'default_answer': '', 'max_length': 32},
            {'question': 'Password', 'mandatory': true, 'default_answer': '', 'min_length': 8}
        ]);

        return answers;
    }

    async isUsernameAvailable(db, username) {
        let where = {'username': username}
        let count = await db.getCount(constants.MSTR_USER, where);

        return (count == 0);
    }

    async updateDb(db, answers) {
        let schema_name = Helper.randomSchemaName(8);
        let values = {
            'name': answers[0],
            'username': answers[1],
            'password': bcrypt.hashSync(answers[2], 10),
            'schema_name': schema_name
        };

        let query;
        let client = await db.getClient();
        try {
            await client.beginTransaction();

            query = 'CREATE SCHEMA ' + schema_name;
            await client.genericExec(query, []);

            query = 'GRANT ALL PRIVILEGES ON SCHEMA ' + schema_name + ' TO ' + process.env.DB_APP_USER;
            await client.genericExec(query, []);

            query = 'GRANT USAGE ON SCHEMA ' + schema_name + ' TO ' + process.env.DB_API_USER;
            await client.genericExec(query, []);

            query = 'GRANT SELECT ON public.mstr_table TO ' + process.env.DB_API_USER;
            await client.genericExec(query, []);

            query = 'GRANT SELECT ON public.mstr_layer TO ' + process.env.DB_API_USER;
            await client.genericExec(query, []);

            query = 'GRANT SELECT ON ALL TABLES IN SCHEMA ' + schema_name + ' TO ' + process.env.DB_API_USER;
            await client.genericExec(query, []);

            query = 'ALTER DEFAULT PRIVILEGES FOR USER ' + process.env.DB_APP_USER + ' IN SCHEMA ' + schema_name + ' GRANT SELECT ON tables TO ' + process.env.DB_API_USER;
            await client.genericExec(query, []);

            await client.insert(constants.MSTR_USER, values, '');
            await client.commitTransaction();

            console.log('User added');
        } catch (e) {
            await client.rollbackTransaction();
            throw(e);
        } finally {
            client.release();
        }
    }
}

let add_user = new AddUser();
add_user.exec().then((result) => {
}).catch((error) => {
    console.log(error);
    console.log('Could not add user');
});

