let assert = require('assert');
const StyleValidator = require('../../../app/validators/style_validator.js');

describe('StyleValidator', function() {
  function get_point_input() {
    return {
      'fill': '#003403',
      'fill_opacity': '0.50',
      'stroke': '#0f0f0f',
      'stroke_opacity': '0.75',
      'stroke_width': '2.5',
      'width': '4',
      'height': '4'
    };
  }

  describe('#invalidgeometry', function() {
    it('should return errors for invalid geometry type', function() {
      let validator = new StyleValidator({}, 'polyline');
      let errors = validator.validate();
      assert.strictEqual(errors.length, 1);
    });
  });

  // fill and stroke use the same internal method. only fill is being tested
  describe('#fill', function() {
    it('should return "required" error when fill is not set', function() {
      let input = get_point_input();
      delete input['fill'];
      let validator = new StyleValidator(input, 'point');
      let errors = validator.validate();
      errors = errors.filter(err => err.indexOf('required') > -1);
      assert.strictEqual(errors.length, 1);
    });
    it('should return "required" error when fill is empty', function() {
      let input = get_point_input();
      input['fill'] = '';
      let validator = new StyleValidator(input, 'point');
      let errors = validator.validate();
      errors = errors.filter(err => err.indexOf('required') > -1);
      assert.strictEqual(errors.length, 1);
    });
    it('should return "7 characters" error when fill is longer than 7 characters', function() {
      let input = get_point_input();
      input['fill'] = '12345678';
      let validator = new StyleValidator(input, 'point');
      let errors = validator.validate();
      errors = errors.filter(err => err.indexOf('7 characters') > -1);
      assert.strictEqual(errors.length, 1);
    });
    it('should return "7 characters" error when fill is shorter than 7 characters', function() {
      let input = get_point_input();
      input['fill'] = '123456';
      let validator = new StyleValidator(input, 'point');
      let errors = validator.validate();
      errors = errors.filter(err => err.indexOf('7 characters') > -1);
      assert.strictEqual(errors.length, 1);
    });
    it('should return "invalid format" error when fill doesn\'t start with #', function() {
      let input = get_point_input();
      input['fill'] = '1234567';
      let validator = new StyleValidator(input, 'point');
      let errors = validator.validate();
      errors = errors.filter(err => err.indexOf('invalid format') > -1);
      assert.strictEqual(errors.length, 1);
    });
    it('should return "invalid value" error when fill is uppercase hexadecimal', function() {
      let input = get_point_input();
      input['fill'] = '#A34567';
      let validator = new StyleValidator(input, 'point');
      let errors = validator.validate();
      errors = errors.filter(err => err.indexOf('invalid value') > -1);
      assert.strictEqual(errors.length, 1);
    });
    it('should return "invalid value" error when fill is not hexadecimal', function() {
      let input = get_point_input();
      input['fill'] = '#a3b5g7';
      let validator = new StyleValidator(input, 'point');
      let errors = validator.validate();
      errors = errors.filter(err => err.indexOf('invalid value') > -1);
      assert.strictEqual(errors.length, 1);
    });
    it('should not return errors for valid value', function() {
      let input = get_point_input();
      let validator = new StyleValidator(input, 'point');
      let errors = validator.validate();
      assert.strictEqual(errors.length, 0);
    });
  });

  // fill_opacity and stroke_opacity use the same internal method; so, only fill_opacity is being tested.
  describe('#fill_opacity', function() {
    it('should return "required" error when fill_opacity is not set', function() {
      let input = get_point_input();
      delete input['fill_opacity'];
      let validator = new StyleValidator(input, 'point');
      let errors = validator.validate();
      errors = errors.filter(err => err.indexOf('required') > -1);
      assert.strictEqual(errors.length, 1);
    });
    it('should return "required" error when fill_opacity is empty', function() {
      let input = get_point_input();
      input['fill_opacity'] = '';
      let validator = new StyleValidator(input, 'point');
      let errors = validator.validate();
      errors = errors.filter(err => err.indexOf('required') > -1);
      assert.strictEqual(errors.length, 1);
    });
    it('should return "max length" error when fill_opacity is longer than 4 characters', function() {
      let input = get_point_input();
      input['fill_opacity'] = '0.353';
      let validator = new StyleValidator(input, 'point');
      let errors = validator.validate();
      errors = errors.filter(err => err.indexOf('max length') > -1);
      assert.strictEqual(errors.length, 1);
    });
    it('should return "invalid value" error when fill_opacity is negative', function() {
      let input = get_point_input();
      input['fill_opacity'] = '-0.5';
      let validator = new StyleValidator(input, 'point');
      let errors = validator.validate();
      errors = errors.filter(err => err.indexOf('invalid value') > -1);
      assert.strictEqual(errors.length, 1);
    });
    it('should return "invalid value" error when fill_opacity is more than 1', function() {
      let input = get_point_input();
      input['fill_opacity'] = '1.01';
      let validator = new StyleValidator(input, 'point');
      let errors = validator.validate();
      errors = errors.filter(err => err.indexOf('invalid value') > -1);
      assert.strictEqual(errors.length, 1);
    });
    it('should not return errors for valid value 1.00', function() {
      let input = get_point_input();
      input['fill_opacity'] = '1.00';
      let validator = new StyleValidator(input, 'point');
      let errors = validator.validate();
      assert.strictEqual(errors.length, 0);
    });
    it('should not return errors for valid value 0.00', function() {
      let input = get_point_input();
      input['fill_opacity'] = '0.00';
      let validator = new StyleValidator(input, 'point');
      let errors = validator.validate();
      assert.strictEqual(errors.length, 0);
    });
    it('should not return errors for valid value 0 and 1', function() {
      let input = get_point_input();
      input['fill_opacity'] = '0.59';
      let validator = new StyleValidator(input, 'point');
      let errors = validator.validate();
      assert.strictEqual(errors.length, 0);
    });
  });

  describe('#stroke_width', function() {
    it('should return "required" error when stroke_width is not set', function() {
      let input = get_point_input();
      delete input['stroke_width'];
      let validator = new StyleValidator(input, 'point');
      let errors = validator.validate();
      errors = errors.filter(err => err.indexOf('required') > -1);
      assert.strictEqual(errors.length, 1);
    });
    it('should return "required" error when stroke_width is empty', function() {
      let input = get_point_input();
      input['stroke_width'] = '';
      let validator = new StyleValidator(input, 'point');
      let errors = validator.validate();
      errors = errors.filter(err => err.indexOf('required') > -1);
      assert.strictEqual(errors.length, 1);
    });
    it('should return "numeric value" error when stroke_width is not numeric', function() {
      let input = get_point_input();
      input['stroke_width'] = '1.a';
      let validator = new StyleValidator(input, 'point');
      let errors = validator.validate();
      errors = errors.filter(err => err.indexOf('invalid value') > -1);
      assert.strictEqual(errors.length, 1);
    });
    it('should return "invalid value" error when stroke_width is negative', function() {
      let input = get_point_input();
      input['stroke_width'] = '-1';
      let validator = new StyleValidator(input, 'point');
      let errors = validator.validate();
      errors = errors.filter(err => err.indexOf('invalid value') > -1);
      assert.strictEqual(errors.length, 1);
    });
    it('should not return errors for integer value', function() {
      let input = get_point_input();
      input['stroke_width'] = '1';
      let validator = new StyleValidator(input, 'point');
      let errors = validator.validate();
      assert.strictEqual(errors.length, 0);
    });
    it('should not return errors for float point number', function() {
      let input = get_point_input();
      input['stroke_width'] = '2.5';
      let validator = new StyleValidator(input, 'point');
      let errors = validator.validate();
      assert.strictEqual(errors.length, 0);
    });
  });

  // width and height are validated with same internal function. so, only width is being tested
  describe('#width', function() {
    it('should return "required" error when width is not set', function() {
      let input = get_point_input();
      delete input['width'];
      let validator = new StyleValidator(input, 'point');
      let errors = validator.validate();
      errors = errors.filter(err => err.indexOf('required') > -1);
      assert.strictEqual(errors.length, 1);
    });
    it('should return "required" error when width is empty', function() {
      let input = get_point_input();
      input['width'] = '';
      let validator = new StyleValidator(input, 'point');
      let errors = validator.validate();
      errors = errors.filter(err => err.indexOf('required') > -1);
      assert.strictEqual(errors.length, 1);
    });
    it('should return "positive integer" error when width is alphanumeric', function() {
      let input = get_point_input();
      input['width'] = '1a';
      let validator = new StyleValidator(input, 'point');
      let errors = validator.validate();
      errors = errors.filter(err => err.indexOf('positive integer') > -1);
      assert.strictEqual(errors.length, 1);
    });
    it('should return "positive integer" error when width is real number', function() {
      let input = get_point_input();
      input['width'] = '1.5';
      let validator = new StyleValidator(input, 'point');
      let errors = validator.validate();
      errors = errors.filter(err => err.indexOf('positive integer') > -1);
      assert.strictEqual(errors.length, 1);
    });
    it('should return "positive integer" error when width is negative integer', function() {
      let input = get_point_input();
      input['width'] = '-1';
      let validator = new StyleValidator(input, 'point');
      let errors = validator.validate();
      errors = errors.filter(err => err.indexOf('positive integer') > -1);
      assert.strictEqual(errors.length, 1);
    });
    it('should not return errors for valid value 1', function() {
      let input = get_point_input();
      input['width'] = '4';
      let validator = new StyleValidator(input, 'point');
      let errors = validator.validate();
      assert.strictEqual(errors.length, 0);
    });
    it('should not return errors for valid value 2', function() {
      let input = get_point_input();
      input['width'] = '49';
      let validator = new StyleValidator(input, 'point');
      let errors = validator.validate();
      assert.strictEqual(errors.length, 0);
    });
  });
});

