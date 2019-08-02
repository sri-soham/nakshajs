const BaseValidator = require('./base_validator.js');

class UserValidator extends BaseValidator {
    constructor(input) {
        super(input);
    }

    validateLogin() {
        this.required('username', 'User Name');
        this.required('password', 'Password');

        return this.getErrors();
    }

    validatePassword() {
        this.required('current_password', 'Current Password');
        this.required('new_password', 'New Password');
        this.required('confirm_password', 'Confirm Password');
        this.minLength('new_password', 'New Password', 8);
        this.minLength('confirm_password', 'Confirm Password', 8);
        this.equals('new_password', 'New Password', 'confirm_password', 'Confirm Password');

        return this.getErrors();
    }

    validateMapKeys() {
        this.required('key', 'Key');
        this.inArray('key', 'Key', ['bing_maps_key', 'google_maps_key']);
        this.maxLength('value', 'Value', 128);

        return this.getErrors();
    }
}

module.exports = UserValidator;

