let assert = require('assert');
const TableRowValidator = require('../../../app/validators/table_row_validator.js');

describe('TableRowValidator', function() {
  describe('#validateAdd', function() {
    it('should return error when with_geometry is 1 and geometry is not set', function() {
      let input = {'with_geometry': '1'};
      let validator = new TableRowValidator(input);
      let errors = validator.validateAdd();
      assert.strictEqual(errors.length, 1);
    });
    it('should return error when with_geometry is 1 and geometry is empty', function() {
      let input = {'with_geometry': '1', 'geometry': ''};
      let validator = new TableRowValidator(input);
      let errors = validator.validateAdd();
      assert.strictEqual(errors.length, 1);
    });
    it('should return error when geometry is not valid (no semicolon)', function() {
      let input = {'with_geometry': '1', 'geometry': 'SRID=4326POINT(78 78)'};
      let validator = new TableRowValidator(input);
      let errors = validator.validateAdd();
      errors = errors.filter(err => err.indexOf('ewkt string') > -1);
      assert.strictEqual(errors.length, 1);
    });
    it('should return error when geometry is not valid (wrong srid)', function() {
      let input = {'with_geometry': '1', 'geometry': 'SRID=3857;POINT(78 78)'};
      let validator = new TableRowValidator(input);
      let errors = validator.validateAdd();
      errors = errors.filter(err => err.indexOf('srid') > -1);
      assert.strictEqual(errors.length, 1);
    });
    it('should return error when geometry is not valid (geometry type)', function() {
      let input = {'with_geometry': '1', 'geometry': 'SRID=4326;POLYHEDRALSURFACE(78 78)'};
      let validator = new TableRowValidator(input);
      let errors = validator.validateAdd();
      errors = errors.filter(err => err.indexOf('geometry type') > -1);
      assert.strictEqual(errors.length, 1);
    });
    it('should not return errors for valid geometry value', function() {
      let input = {'with_geometry': '1', 'geometry': 'SRID=4326;POINT(78 78)'};
      let validator = new TableRowValidator(input);
      let errors = validator.validateAdd();
      assert.strictEqual(errors.length, 0);
    });
    it('should not return error when with_geometry is not set', function() {
      let validator = new TableRowValidator({});
      let errors = validator.validateAdd();
      assert.strictEqual(errors.length, 0);
    });
    it('should not return error when with_geometry is not 1', function() {
      let validator = new TableRowValidator({'with_geometry': '0'});
      let errors = validator.validateAdd();
      assert.strictEqual(errors.length, 0);
    });
  });

  describe('#validateUpdate', function() {
    it('should return error when column is not present', function() {
      let validator = new TableRowValidator({});
      let errors = validator.validateUpdate();
      assert.strictEqual(errors.length, 1);
    });
    it('should return error when column is empty', function() {
      let validator = new TableRowValidator({'column': ''});
      let errors = validator.validateUpdate();
      assert.strictEqual(errors.length, 1);
    });
    it('should return error when geometry is invalid', function() {
      let validator = new TableRowValidator({'column': 'the_geom', 'value': 'asdfa'});
      let errors = validator.validateUpdate();
      assert.strictEqual(errors.length, 1);
    });
    it('should not return error when column is not the_geom', function() {
      let validator = new TableRowValidator({'column': 'name', 'value': 'something'});
      let errors = validator.validateUpdate();
      assert.strictEqual(errors.length, 0);
    });
    it('should not return error when column is the_geom and value is not set', function() {
      let validator = new TableRowValidator({'column': 'the_geom'});
      let errors = validator.validateUpdate();
      assert.strictEqual(errors.length, 0);
    });
    it('should not return error when column is the_geom and value is empty', function() {
      let validator = new TableRowValidator({'column': 'the_geom', 'value': ''});
      let errors = validator.validateUpdate();
      assert.strictEqual(errors.length, 0);
    });
    it('should not return error when column is the_geom and value is valid', function() {
      let validator = new TableRowValidator({'column': 'the_geom', 'value': 'SRID=4326;POINT(20 20)'});
      let errors = validator.validateUpdate();
      assert.strictEqual(errors.length, 0);
    });
  });
});
