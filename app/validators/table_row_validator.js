const BaseValidator = require('./base_validator.js');

class TableRowValidator extends BaseValidator {
    validateAdd() {
        if (this._input['with_geometry'] && this._input['with_geometry'] == '1') {
            if (this._input['geometry'] && this._input['geometry'].length > 0) {
                this.geomEwktString(this._input['geometry']);
            }
            else {
                this.appendError('Geometry is required');
            }
        }

        return this.getErrors();
    }

    validateUpdate() {
        this.required('column', 'Column');
        if (this.getErrors().length === 0) {
            if (this._input['column'] === 'the_geom') {
                if (this._input['value'] && this._input['value'].length > 0) {
                    this.geomEwktString(this._input['value']);
                }
            }
        }

        return this.getErrors();
    }

    geomEwktString(geom_string) {
        let parts, geom_type;
        
        parts = geom_string.split(';');
        if (parts.length === 2) {
            if (parts[0] === 'SRID=4326') {
                geom_type = parts[1].split('(').shift();
                if (['POLYGON', 'MULTIPOLYGON', 'POINT', 'MULTIPOINT', 'LINESTRING', 'MULTILINESTRING'].indexOf(geom_type) < 0) {
                    this.appendError('Invalid geometry type');
                }
            }
            else {
                this.appendError('Invalid srid value');
            }
        }
        else {
            this.appendError('Invalid geometry ewkt string');
        }
    }
}

module.exports = TableRowValidator;

