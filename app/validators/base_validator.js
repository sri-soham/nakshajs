class BaseValidator {
    constructor(input) {
        this._input = input;
        this._errors = [];
    }

    getErrors() {
        return this._errors;
    }

    required(field, label) {
        if (!this._input[field] || this._input[field].length === 0) {
            this.appendError(label + ' is required');
        }
    }

    requiredMaxLength(field, label, max_length) {
        if (!this._input[field] || this._input[field].length === 0) {
            this.appendError(label + ': is required');
        }
        else {
            if (this._input[field].length > max_length) {
                this.appendError(label + ': max-length is ' + max_length); 
            }
        }
    }

    maxLength(field, label, max_length) {
        if (this._input[field] && this._input[field].length > max_length) {
            this.appendError(label + ': max-length is ' + max_length); 
        }
    }

    minLength(field, label, min_length) {
        if (this._input[field] && this._input[field].length > 0 && this._input[field].length < min_length) {
            this.appendError(label + ': min-length is ' + min_length);
        }
    }

    exactLength(field, label, length) {
        if (this._input[field] && this._input[field].length > 0 && this._input[field].length !== length) {
            this.appendError(label + ': allowed length is ' + length);
        }
    }

    equals(field1, label1, field2, label2) {
        if (this._input[field1] && this._input[field2] && this._input[field1] !== this._input[field2]) {
            this.appendError(label1 + ' does not equal ' + label2);
        }
    }

    inArray(field, label, values) {
        if (this._input[field] && this._input[field].length > 0 && values.indexOf(this._input[field]) < 0) {
            this.appendError(label + ': invalid value');
        }
    }

    digits(field, label) {
        if (this._input[field] && this._input[field].length > 0 &&
            this._input[field].replace(/[0-9]/g, '').length > 0) {
            this.appendError(label + ': only digits are allowed');
        }
    }

    integer(field, label) {
        if (this._input[field] && this._input[field].length > 0 &&
            (this._input[field].replace(/[0-9-]/g, '').length > 0 ||
            this._input[field].indexOf('-') > 0)) {
            this.appendError(label + ': only integers are allowed');
        }
    }

    date(field, label, format_options) {
        var parts, day, month, year, dt;

        if (!format_options) {
            format_options = {
                separator: '/',
                day_index: 2,
                month_index: 1,
                year_index: 0
            };
        }
        if (this._input[field] && this._input[field].length > 0) {
            parts = this._input[field].split(format_options.separator);
            if (parts.length === 3) {
                if (parts[format_options.year_index].length === 4 &&
                    parts[format_options.month_index].length === 2 &&
                    parts[format_options.day_index].length === 2 &&
                    parts[format_options.year_index].replace(/[0-9]/g, '').length === 0 &&
                    parts[format_options.month_index].replace(/[0-9]/g, '').length === 0 &&
                    parts[format_options.day_index].replace(/[0-9]/g, '').length === 0) {

                    day = parseInt(parts[format_options.day_index]);
                    month = parseInt(parts[format_options.month_index]) - 1;
                    year = parseInt(parts[format_options.year_index]);
                    dt = new Date(year, month, day);
                    if (isNaN(dt.valueOf()) ||
                        dt.getFullYear() !== year ||
                        dt.getMonth() !== month ||
                        dt.getDate() !== day) {
                        this.appendError(label + ': invalid date');
                    }
                }
                else {
                    this.appendError(label + ': invalid date');
                }
            }
            else {
                this.appendError(label + ': invalid date');
            }
        }
    }

    appendError(err) {
        this._errors.push(err);
    }
}

module.exports = BaseValidator;

