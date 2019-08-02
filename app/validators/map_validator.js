const BaseValidator = require('./base_validator.js');
const Helper = require('../helpers/helper.js');

class MapValidator extends BaseValidator {
    validateAdd() {
        this.requiredMaxLength('name', 'Name', 64);
        this.required('layer', 'Layer');
        this.digits('layer', 'Layer');

        return this.getErrors();
    }

    validateUpdate() {
        this.requiredMaxLength('name', 'Name', 64);

        return this.getErrors();
    }

    validateBaseLayerUpdate(user_details) {
        let base_layers, errors, base_layer;

        base_layers = Helper.getBaseLayers();
        errors = [];
        if (this._input['base_layer'] && this._input['base_layer'].length > 0) {
            base_layer = this._input['base_layer'];
            if (base_layers[base_layer]) {
                if (Helper.isGoogleMapsBaseLayer(base_layer) && user_details['google_maps_key'].length === 0) {
                    errors.push('Please add google maps key on profile page');
                }
                if (Helper.isBingMapsBaseLayer(base_layer) && user_details['bing_maps_key'].length === 0) {
                    errors.push('Please add bing maps key on profile page');
                }
            }
            else {
                errors.push('Invalid value for base layer');
            }
        }
        else {
            errors.push('Base layer is required');
        }

        return errors;
    }

    validateAddLayer() {
        this.required('layer_id', 'Layer ID');
        this.digits('layer_id', 'Layer ID');

        return this.getErrors();
    }

    validateDeleteLayer() {
        this.required('layer_id', 'Layer ID');
        this.digits('layer_id', 'Layer ID');

        return this.getErrors();
    }

    validateUpdateHash() {
        let errors, hash;

        errors = [];
        if (this._input['hash'] && this._input['hash'].length > 0) {
            hash = this._input['hash'];
            if (hash.length > 64) {
                errors.push('Max. allowed length is 64');
            }
            else {
                hash = hash.replace(/[a-z0-9_-]+/gi, '');
                if (hash.length > 0) {
                    errors.push('Only alphanumeric values, underscore and hash are allowed');
                }
            }
        }
        else {
            errors.push('Hash is required');
        }

        return errors;
    }
}

module.exports = MapValidator;

