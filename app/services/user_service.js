const bcrypt = require('bcrypt');
const BaseService = require('./base_service.js');
const constants = require('../helpers/constants.js');
const UserValidator = require('../validators/user_validator.js');

class UserService extends BaseService {
    constructor(db) {
        super(db);
        this.login = this.login.bind(this);
        this.userById = this.userById.bind(this);
        this.changePassword = this.changePassword.bind(this);
        this.updateMapKeys = this.updateMapKeys.bind(this);
    }

    async login(request) {
        let result, validator, errors, user, is_valid;

        validator = new UserValidator(request.body);
        errors = validator.validateLogin();

        if (errors.length === 0) {
            try {
                user = await this._db.selectOne(constants.MSTR_USER, ['*'], {username: request.body.username});
                if (user === null) {
                    result = this.errorResult(['No such user']);
                }
                else {
                    is_valid = await bcrypt.compareSync(request.body.password, user.password);
                    if (is_valid) {
                        result = this.successResult({user: user});
                    }
                    else {
                        result = this.errorResult(['password mismatch']);
                    }
                }
            }
            catch (err) {
                result = this.errorResult(['Query failed']);
            }
        }
        else {
            result = this.errorResult(errors);
        }

        return result;
    }

    async userById(user_id) {
        let user = await this._db.selectOne(constants.MSTR_USER, ['*'], {id: user_id});
        return this.successResult({user: user});
    }

    async changePassword(request) {
        let result, validator, errors, user, values, where;

        validator = new UserValidator(request.body);
        errors = validator.validatePassword();
        if (errors.length === 0) {
            user = await this._db.selectOne(constants.MSTR_USER, ['*'], {id: request.session.user_id});
            if (bcrypt.compareSync(request.body.current_password, user.password)) {
                where = {id: user.id};
                values = {password: bcrypt.hashSync(request.body.new_password, 10)};
                await this._db.update(constants.MSTR_USER, values, where);
            }
            else {
                errors.push('Password mismatch');
            }
        }

        if (errors.length === 0) {
            result = this.successResult();
        }
        else {
            result = this.errorResult(errors);
        }

        return result;
    }

    async updateMapKeys(request) {
        let validator, errors, values, where, result;

        validator = new UserValidator(request.body);
        errors = validator.validateMapKeys();
        if (errors.length === 0) {
            values = {};
            values[request.body.key] = request.body.value;
            where = {id: request.session.user_id};
            await this._db.update(constants.MSTR_USER, values, where);

            result = this.successResult();
        }
        else {
            result = this.errorResult(errors);
        }

        return result;
    }
}

module.exports = UserService;
