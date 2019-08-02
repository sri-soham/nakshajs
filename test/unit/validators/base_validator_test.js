let assert = require('assert');
const BaseValidator = require('../../../app/validators/base_validator.js');

describe('BaseValidator', function() {
  describe('#required', function() {
    it('should return 1 error', function() {
      let validator = new BaseValidator({});
      validator.required('name', 'Name');
      let errors = validator.getErrors();
      assert.strictEqual(errors.length, 1);
    });
    it('should return no errors', function() {
      let validator = new BaseValidator({'name': 'John Doe'});
      validator.required('name', 'Name');
      let errors = validator.getErrors();
      assert.strictEqual(errors.length, 0);
    });
  });

  describe('#requiredMaxLength', function() {
    it('should have "required" error', function() {
      let validator = new BaseValidator({});
      validator.requiredMaxLength('name', 'Name', 16);
      let errors = validator.getErrors();
      errors = errors.filter(err => err.indexOf('required') > -1);
      assert.strictEqual(errors.length, 1);
    });
    it('should have "max-length" error', function() {
      let validator = new BaseValidator({'name': 'John Doe'});
      validator.requiredMaxLength('name', 'Name', 4);
      let errors = validator.getErrors();
      errors = errors.filter(err => err.indexOf('max-length') > -1);
      assert.strictEqual(errors.length, 1);
    });
    it('should not have any errors', function() {
      let validator = new BaseValidator({'name': 'John Doe'});
      validator.requiredMaxLength('name', 'Name', 16);
      let errors = validator.getErrors();
      assert.strictEqual(errors.length, 0);
    });
  });

  describe('#maxLength', function() {
    it('should return error when length is more', function() {
      let validator = new BaseValidator({'name': 'John Doe'});
      validator.maxLength('name', 'Name', 4);
      let errors = validator.getErrors();
      assert.strictEqual(errors.length, 1);
    });
    it('should not return any error when field is not set', function() {
      let validator = new BaseValidator({});
      validator.maxLength('name', 'Name', 16);
      let errors = validator.getErrors();
      assert.strictEqual(errors.length, 0);
    });
    it('should not return any error when field is empty', function() {
      let validator = new BaseValidator({'name': ''});
      validator.maxLength('name', 'Name', 16);
      let errors = validator.getErrors();
      assert.strictEqual(errors.length, 0);
    });
    it('should not return errors for valid value', function() {
      let validator = new BaseValidator({'name': 'John Doe'});
      validator.maxLength('name', 'Name', 16);
      let errors = validator.getErrors();
      assert.strictEqual(errors.length, 0);
    });
  });

  describe('#minLength', function() {
    it('should return error when length is less', function() {
      let validator = new BaseValidator({'name': 'John Doe'});
      validator.minLength('name', 'Name', 16);
      let errors = validator.getErrors();
      assert.strictEqual(errors.length, 1);
    });
    it('should not any error when field is not set', function() {
      let validator = new BaseValidator({});
      validator.minLength('name', 'Name', 16);
      let errors = validator.getErrors();
      assert.strictEqual(errors.length, 0);
    });
    it('should not any error when field is empty', function() {
      let validator = new BaseValidator({'name': ''});
      validator.minLength('name', 'Name', 16);
      let errors = validator.getErrors();
      assert.strictEqual(errors.length, 0);
    });
    it('should not return errors for valid value', function() {
      let validator = new BaseValidator({'name': 'John Doe'});
      validator.minLength('name', 'Name', 8);
      let errors = validator.getErrors();
      assert.strictEqual(errors.length, 0);
    });
  });

  describe('#exactLength', function() {
    it('should return error when length is greater', function() {
      let validator = new BaseValidator({'name': 'John Doe'});
      validator.exactLength('name', 'Name', 16);
      let errors = validator.getErrors();
      assert.strictEqual(errors.length, 1);
    });
    it('should return error when length is lesser', function() {
      let validator = new BaseValidator({'name': 'John Doe'});
      validator.exactLength('name', 'Name', 6);
      let errors = validator.getErrors();
      assert.strictEqual(errors.length, 1);
    });
    it('should not return any error when field is not set', function() {
      let validator = new BaseValidator({});
      validator.exactLength('name', 'Name', 6);
      let errors = validator.getErrors();
      assert.strictEqual(errors.length, 0);
    });
    it('should not return any error when field is empty', function() {
      let validator = new BaseValidator({'name': ''});
      validator.exactLength('name', 'Name', 6);
      let errors = validator.getErrors();
      assert.strictEqual(errors.length, 0);
    });
    it('should not return any error for valid value', function() {
      let validator = new BaseValidator({'name': 'Johnny'});
      validator.exactLength('name', 'Name', 6);
      let errors = validator.getErrors();
      assert.strictEqual(errors.length, 0);
    });
  });

  describe('#equals', function() {
    it('should return error when values are not equal', function() {
      let validator = new BaseValidator({'name1': 'John', 'name2': 'Jack'});
      validator.equals('name1', 'Name 1', 'name2', 'Name 2');
      let errors = validator.getErrors();
      assert.strictEqual(errors.length, 1);
    });
    it ('should not return error when first field is not set', function() {
      let validator = new BaseValidator({'name2': 'Jack'});
      validator.equals('name1', 'Name 1', 'name2', 'Name 2');
      let errors = validator.getErrors();
      assert.strictEqual(errors.length, 0);
    });
    it ('should not return error when second field is not set', function() {
      let validator = new BaseValidator({'name1': 'Jack'});
      validator.equals('name1', 'Name 1', 'name2', 'Name 2');
      let errors = validator.getErrors();
      assert.strictEqual(errors.length, 0);
    });
    it('should not return error for when both values are set and equal', function() {
      let validator = new BaseValidator({'name1': 'John', 'name2': 'John'});
      validator.equals('name1', 'Name 1', 'name2', 'Name 2');
      let errors = validator.getErrors();
      assert.strictEqual(errors.length, 0);
    });
  });

  describe('#inArray', function() {
    it('should return error when value is not in array', function() {
      let validator = new BaseValidator({'language': 'javascript'});
      validator.inArray('language', 'Language', ['php', 'python', 'ruby', 'java']);
      let errors = validator.getErrors();
      assert.strictEqual(errors.length, 1);
    });
    it('should not return error when field is not set', function() {
      let validator = new BaseValidator({});
      validator.inArray('language', 'Language', ['php', 'python', 'ruby', 'java']);
      let errors = validator.getErrors();
      assert.strictEqual(errors.length, 0);
    });
    it('should not return error when field is empty', function() {
      let validator = new BaseValidator({'language': ''});
      validator.inArray('language', 'Language', ['php', 'python', 'ruby', 'java']);
      let errors = validator.getErrors();
      assert.strictEqual(errors.length, 0);
    });
    it('should not return error for valid value', function() {
      let validator = new BaseValidator({'language': 'javascript'});
      validator.inArray('language', 'Language', ['php', 'python', 'ruby', 'javascript']);
      let errors = validator.getErrors();
      assert.strictEqual(errors.length, 0);
    });
  });

  describe('#digits', function() {
    it('should return error value contains non digits in middle', function() {
      let validator = new BaseValidator({'data_type': '13a45'});
      validator.digits('data_type', 'Data Type');
      let errors = validator.getErrors();
      assert.strictEqual(errors.length, 1);
    });
    it('should return error value contains non digits at start', function() {
      let validator = new BaseValidator({'data_type': '-1345'});
      validator.digits('data_type', 'Data Type');
      let errors = validator.getErrors();
      assert.strictEqual(errors.length, 1);
    });
    it('should return error value contains non digits at end', function() {
      let validator = new BaseValidator({'data_type': '1345$'});
      validator.digits('data_type', 'Data Type');
      let errors = validator.getErrors();
      assert.strictEqual(errors.length, 1);
    });
    it('should not return error when field is not set', function() {
      let validator = new BaseValidator({});
      validator.digits('data_type', 'Data Type');
      let errors = validator.getErrors();
      assert.strictEqual(errors.length, 0);
    });
    it('should not return error when field is empty', function() {
      let validator = new BaseValidator({'data_type': ''});
      validator.digits('data_type', 'Data Type');
      let errors = validator.getErrors();
      assert.strictEqual(errors.length, 0);
    });
    it('should not return error for valid value', function() {
      let validator = new BaseValidator({'data_type': '934'});
      validator.digits('data_type', 'Data Type');
      let errors = validator.getErrors();
      assert.strictEqual(errors.length, 0);
    });
  });

  describe('#integer', function() {
    it('should return error when alphabets are present', function() {
      let validator = new BaseValidator({'data_type': '123sdf'});
      validator.integer('data_type', 'Data Type');
      let errors = validator.getErrors();
      assert.strictEqual(errors.length, 1);
    });
    it('should return error when - is present but not at start 1', function() {
      let validator = new BaseValidator({'data_type': '123-'});
      validator.integer('data_type', 'Data Type');
      let errors = validator.getErrors();
      assert.strictEqual(errors.length, 1);
    });
    it('should return error when - is present but not at start 2', function() {
      let validator = new BaseValidator({'data_type': '123-456'});
      validator.integer('data_type', 'Data Type');
      let errors = validator.getErrors();
      assert.strictEqual(errors.length, 1);
    });
    it('should return error when + is present', function() {
      let validator = new BaseValidator({'data_type': '+123'});
      validator.integer('data_type', 'Data Type');
      let errors = validator.getErrors();
      assert.strictEqual(errors.length, 1);
    });
    it('should not return error when field is not set', function() {
      let validator = new BaseValidator({});
      validator.integer('data_type', 'Data Type');
      let errors = validator.getErrors();
      assert.strictEqual(errors.length, 0);
    });
    it('should not return error when field is empty', function() {
      let validator = new BaseValidator({'data_type': ''});
      validator.integer('data_type', 'Data Type');
      let errors = validator.getErrors();
      assert.strictEqual(errors.length, 0);
    });
    it('should not return error for negative integer', function() {
      let validator = new BaseValidator({'data_type': '-343'});
      validator.integer('data_type', 'Data Type');
      let errors = validator.getErrors();
      assert.strictEqual(errors.length, 0);
    });
    it('should not return error for integer', function() {
      let validator = new BaseValidator({'data_type': '743'});
      validator.integer('data_type', 'Data Type');
      let errors = validator.getErrors();
      assert.strictEqual(errors.length, 0);
    });
  });

  describe('#date', function() {
    it('should return error for invalid date 1', function() {
      let validator = new BaseValidator({'start_date': '2010/02/29'});
      validator.date('start_date', 'Start Date');
      let errors = validator.getErrors();
      assert.strictEqual(errors.length, 1);
    });
    it('should return error for invalid date 2', function() {
      let validator = new BaseValidator({'start_date': '2010/04/31'});
      validator.date('start_date', 'Start Date');
      let errors = validator.getErrors();
      assert.strictEqual(errors.length, 1);
    });
    it('should return error for less than 3 parts', function() {
      let validator = new BaseValidator({'start_date': '2010/04'});
      validator.date('start_date', 'Start Date');
      let errors = validator.getErrors();
      assert.strictEqual(errors.length, 1);
    });
    it('should return error for more than 3 parts', function() {
      let validator = new BaseValidator({'start_date': '2010/04/01/04'});
      validator.date('start_date', 'Start Date');
      let errors = validator.getErrors();
      assert.strictEqual(errors.length, 1);
    });
    it('should return error for invalid separator', function() {
      let validator = new BaseValidator({'start_date': '2018-02-02'});
      validator.date('start_date', 'Start Date');
      let errors = validator.getErrors();
      assert.strictEqual(errors.length, 1);
    });
    it('should return error when year length is more than 4', function() {
      let validator = new BaseValidator({'start_date': '20180/02/02'});
      validator.date('start_date', 'Start Date');
      let errors = validator.getErrors();
      assert.strictEqual(errors.length, 1);
    });
    it('should return error when year length is less than 4', function() {
      let validator = new BaseValidator({'start_date': '201/02/02'});
      validator.date('start_date', 'Start Date');
      let errors = validator.getErrors();
      assert.strictEqual(errors.length, 1);
    });
    it('should return error when month length is more than 2', function() {
      let validator = new BaseValidator({'start_date': '2018/023/02'});
      validator.date('start_date', 'Start Date');
      let errors = validator.getErrors();
      assert.strictEqual(errors.length, 1);
    });
    it('should return error when month length is less than 2', function() {
      let validator = new BaseValidator({'start_date': '2018/2/02'});
      validator.date('start_date', 'Start Date');
      let errors = validator.getErrors();
      assert.strictEqual(errors.length, 1);
    });
    it('should return error when day length is more than 2', function() {
      let validator = new BaseValidator({'start_date': '2018/02/023'});
      validator.date('start_date', 'Start Date');
      let errors = validator.getErrors();
      assert.strictEqual(errors.length, 1);
    });
    it('should return error when day length is less than 2', function() {
      let validator = new BaseValidator({'start_date': '2018/02/2'});
      validator.date('start_date', 'Start Date');
      let errors = validator.getErrors();
      assert.strictEqual(errors.length, 1);
    });
    it('should not return error when field is not set', function() {
      let validator = new  BaseValidator({});
      validator.date('start_date', 'Start Date');
      let errors = validator.getErrors();
      assert.strictEqual(errors.length, 0);
    });
    it('should not return error when field is empty', function() {
      let validator = new  BaseValidator({'start_date': ''});
      validator.date('start_date', 'Start Date');
      let errors = validator.getErrors();
      assert.strictEqual(errors.length, 0);
    });
    it('should not return error for valid date with default format [yyyy/mm/dd]', function() {
      let validator = new  BaseValidator({'start_date': '2019/02/09'});
      validator.date('start_date', 'Start Date');
      let errors = validator.getErrors();
      assert.strictEqual(errors.length, 0);
    });
    it('should not return error for valid date with - separator', function() {
      let validator = new  BaseValidator({'start_date': '2019-03-31'});
      let format = {
        separator: '-',
        day_index: 2,
        month_index: 1,
        year_index: 0
      };
      validator.date('start_date', 'Start Date', format);
      let errors = validator.getErrors();
      assert.strictEqual(errors.length, 0);
    });
    it('should not return error for valid date in dd-mm-yyyy format', function() {
      let validator = new  BaseValidator({'start_date': '31-08-2019'});
      let format = {
        separator: '-',
        day_index: 0,
        month_index: 1,
        year_index: 2
      };
      validator.date('start_date', 'Start Date', format);
      let errors = validator.getErrors();
      assert.strictEqual(errors.length, 0);
    });
    it('should not return error for valid date in mm/dd/yyyy format', function() {
      let validator = new  BaseValidator({'start_date': '04/30/2019'});
      let format = {
        separator: '/',
        day_index: 1,
        month_index: 0,
        year_index: 2
      };
      validator.date('start_date', 'Start Date', format);
      let errors = validator.getErrors();
      assert.strictEqual(errors.length, 0);
    });
  });
});

