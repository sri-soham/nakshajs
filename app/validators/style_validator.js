const BaseValidator = require('./base_validator.js');

class StyleValidator extends BaseValidator {
    constructor(input, geometry_type) {
        super(input);
        this._geometry_type = geometry_type;
    }

    validate() {
        switch (this._geometry_type) {
            case 'polygon':
                this._validateColor('fill', 'Fill Color');
                this._validateOpacity('fill_opacity', 'Fill Opacity');
                this._validateColor('stroke', 'Stroke Color');
                this._validateOpacity('stroke_opacity', 'Stroke Opacity');
                this._validateStrokeWidth('stroke_width', 'Stroke Width');
            break;
            case 'linestring':
                this._validateColor('stroke', 'Stroke Color');
                this._validateOpacity('stroke_opacity', 'Stroke Opacity');
                this._validateStrokeWidth('stroke_width', 'Stroke Width');
            break;
            case 'point':
                this._validateColor('fill', 'Fill Color');
                this._validateOpacity('fill_opacity', 'Fill Opacity');
                this._validateColor('stroke', 'Stroke Color');
                this._validateOpacity('stroke_opacity', 'Stroke Opacity');
                this._validateStrokeWidth('stroke_width', 'Stroke Width');
                this._validateWidthHeight('width', 'Width');
                this._validateWidthHeight('height', 'Height');
            break;
            default:
                this.appendError('Invalid geometry type');
            break;
        }

        return this.getErrors();
    }

    _validateColor(field, label) {
        if (this._input[field]) {
            let value = this._input[field];
            if (value.length === 0) {
                this.appendError(label + ': is required');
            }
            else if (value.length === 7) {
                if (value[0] === '#') {
                    if (value.substring(1).replace(/[\da-f]{6}/, '').length !== 0) {
                        this.appendError(label + ': invalid value');
                    }
                }
                else {
                    this.appendError(label + ': invalid format');
                }
            }
            else {
                this.appendError(label + ': should be 7 characters long');
            }
        }
        else {
            this.appendError(label + ': is required');
        }
    }

    _validateOpacity(field, label) {
        if (this._input[field]) {
            let value = this._input[field];
            if (value.length === 0) {
                this.appendError(label + ': is required');
            }
            else if (value.length <= 4) {
                if (value.replace(/^(0|1)\.[\d]{1,2}$/, '').length === 0) {
                    value = parseFloat(value);
                    if (value < 0 || value > 1) {
                        this.appendError(label + ': invalid value');
                    }
                }
                else {
                    this.appendError(label + ': invalid value');
                }
            }
            else {
                this.appendError(label + ': max length is 4');
            }
        }
        else {
            this.appendError(label + ': is required');
        }
    }

    _validateStrokeWidth(field, label) {
        if (this._input[field]) {
            let value = this._input[field];
            if (value.length === 0) {
                this.appendError(label + ': is required');
            }
            else {
                if (value.replace(/^[\d]+(\.[\d]+)?$/, '').length !== 0) {
                    this.appendError(label + ': invalid value');
                }
            }
        }
        else {
            this.appendError(label + ': is required');
        }
    }

    _validateWidthHeight(field, label) {
        if (this._input[field]) {
            let value = this._input[field].toString();
            if (value.length === 0) {
                this.appendError(label + ': is required');
            }
            else {
                if (value.replace(/^[\d]+$/, '').length !== 0) {
                    this.appendError(label + ': should be a positive integer');
                }
            }
        }
        else {
            this.appendError(label + ': is required');
        }
    }
}

module.exports = StyleValidator;

