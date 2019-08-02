const BaseValidator = require('./base_validator');

class TableValidator extends BaseValidator {
    validateAddColumn() {
        let tmp, msg;

        this.requiredMaxLength('name', 'Name', 60);
        this.required('data_type', 'Data Type');
        this.inArray('data_type', 'Data Type', ['1', '2', '3', '4']);

        if (this.getErrors().length === 0) {
            tmp = this._input['name'];
            if (tmp.replace(/^[a-z]{1}[a-z0-9_]{1,62}$/, '').length > 0) {
                msg = 'Invalid value for column name. Only lower case alphabets, ' +
                'digits and underscores are allowed. Name m ust begin with lower ' +
                ' case alphabet';
                this.appendError(msg);
            }
        }

        return this.getErrors();
    }

    validateDeleteColumn() {
        this.required('column_name', 'Column Name');
        if (this.getErrors().length === 0) {
            if (['naksha_id', 'the_geom', 'the_geom_webmercator', 'created_at', 'updated_at'].indexOf(this._input['column_name']) >= 0) {
                this.appendError('Column ' + this._input['column_name'] + ' cannot be deleted');
            }
        }

        return this.getErrors();
    }
}

module.exports = TableValidator;

