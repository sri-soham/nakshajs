var assert = require('assert');
const TableValidator = require('../../../app/validators/table_validator.js');

describe('TableValidator', function() {
  describe('#validateAddColumn', function() {
    function get_add_column_input(name) {
      // only the regex of the name validation is tested.
      // other validations are tested in base validator test
      return {
        'name': name,
        'data_type': '1'
      };
    }

    it('should not allow name that starts with non alphabetical character (digit)', function() {
      let input = get_add_column_input('1user');
      let validator = new TableValidator(input);
      let errors = validator.validateAddColumn();
      assert.strictEqual(errors.length, 1);
    });
    it('should not allow name that starts with non alphabetical character (underscore)', function() {
      let input = get_add_column_input('_user');
      let validator = new TableValidator(input);
      let errors = validator.validateAddColumn();
      assert.strictEqual(errors.length, 1);
    });
    it('should not allow uppercase names', function() {
      let input = get_add_column_input('Age');
      let validator = new TableValidator(input);
      let errors = validator.validateAddColumn();
      assert.strictEqual(errors.length, 1);
    });
    it('should not allow non alphanumeric names (underscore allowed)', function() {
      let input = get_add_column_input('user-name');
      let validator = new TableValidator(input);
      let errors = validator.validateAddColumn();
      assert.strictEqual(errors.length, 1);
    });
    it('should allow alphabetical name', function() {
      let input = get_add_column_input('username');
      let validator = new TableValidator(input);
      let errors = validator.validateAddColumn();
      assert.strictEqual(errors.length, 0);
    });
    it('should allow alphanumeric name', function() {
      let input = get_add_column_input('address1');
      let validator = new TableValidator(input);
      let errors = validator.validateAddColumn();
      assert.strictEqual(errors.length, 0);
    });
    it('should allow name with underscore', function() {
      let input = get_add_column_input('first_name');
      let validator = new TableValidator(input);
      let errors = validator.validateAddColumn();
      assert.strictEqual(errors.length, 0);
    });
  });

  describe('#validateDeleteColumn', function() {
    it('should not allow naksha_id to be deleted', function() {
      let input = {'column_name': 'naksha_id'};
      let validator = new TableValidator(input);
      let errors = validator.validateDeleteColumn();
      assert.strictEqual(errors.length, 1);
    });
    it('should not allow the_geom to be deleted', function() {
      let input = {'column_name': 'the_geom'};
      let validator = new TableValidator(input);
      let errors = validator.validateDeleteColumn();
      assert.strictEqual(errors.length, 1);
    });
    it('should not allow the_geom_webmercator to be deleted', function() {
      let input = {'column_name': 'the_geom_webmercator'};
      let validator = new TableValidator(input);
      let errors = validator.validateDeleteColumn();
      assert.strictEqual(errors.length, 1);
    });
    it('should not allow created_at to be deleted', function() {
      let input = {'column_name': 'created_at'};
      let validator = new TableValidator(input);
      let errors = validator.validateDeleteColumn();
      assert.strictEqual(errors.length, 1);
    });
    it('should not allow updated_at to be deleted', function() {
      let input = {'column_name': 'updated_at'};
      let validator = new TableValidator(input);
      let errors = validator.validateDeleteColumn();
      assert.strictEqual(errors.length, 1);
    });
    it('should allow other columns to be deleted', function() {
      let input = {'column_name': 'username'};
      let validator = new TableValidator(input);
      let errors = validator.validateDeleteColumn();
      assert.strictEqual(errors.length, 0);
    });
  });
});
