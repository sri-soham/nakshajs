let assert = require('assert');
const MapValidator = require('../../../app/validators/map_validator.js');

describe('MapValidator', function() {
  describe('#validateBaseLayerUpdate', function() {
    it('should return "required" error when base_layer is not set', function() {
      let validator = new MapValidator({});
      let errors = validator.validateBaseLayerUpdate({});
      errors = errors.filter(err => err.indexOf('required') > -1);
      assert.strictEqual(errors.length, 1);
    });
    it('should return "required" error when base_layer is empty', function() {
      let validator = new MapValidator({'base_layer': ''});
      let errors = validator.validateBaseLayerUpdate({});
      errors = errors.filter(err => err.indexOf('required') > -1);
      assert.strictEqual(errors.length, 1);
    });
    it('should return "Invalid" error when base_layer is not valid', function() {
      let validator = new MapValidator({'base_layer': 'a-roadmap'});
      let errors = validator.validateBaseLayerUpdate({});
      errors = errors.filter(err => err.indexOf('Invalid value') > -1);
      assert.strictEqual(errors.length, 1);
    });
    it('should return "google maps key" error when google maps baselayer is selected and user did not set  google maps key', function() {
      let validator = new MapValidator({'base_layer': 'g-roadmap'});
      let errors = validator.validateBaseLayerUpdate({'google_maps_key': ''});
      errors = errors.filter(err => err.indexOf('google maps key') > -1);
      assert.strictEqual(errors.length, 1);
    });
    it('should return "bing maps key" error when bing maps baselayer is selected and user did not set  bing maps key', function() {
      let validator = new MapValidator({'base_layer': 'b-Road'});
      let errors = validator.validateBaseLayerUpdate({'bing_maps_key': ''});
      errors = errors.filter(err => err.indexOf('bing maps key') > -1);
      assert.strictEqual(errors.length, 1);
    });
    it('should not return errors for valid osm map selection', function() {
      let validator = new MapValidator({'base_layer': 'o-osm'});
      let errors = validator.validateBaseLayerUpdate({});
      assert.strictEqual(errors.length, 0);
    });
    it('should not return errors for valid yandex map selection', function() {
      let validator = new MapValidator({'base_layer': 'y-map'});
      let errors = validator.validateBaseLayerUpdate({});
      assert.strictEqual(errors.length, 0);
    });
    it('should not return errors for valid google maps selection', function() {
      let validator = new MapValidator({'base_layer': 'g-roadmap'});
      let errors = validator.validateBaseLayerUpdate({'google_maps_key': 'asldjkfasdf'});
      assert.strictEqual(errors.length, 0);
    });
    it('should not return errors for valid bing maps selection', function() {
      let validator = new MapValidator({'base_layer': 'b-Road'});
      let errors = validator.validateBaseLayerUpdate({'bing_maps_key': 'asldjkfasdf'});
      assert.strictEqual(errors.length, 0);
    });
  });

  describe('#validateUpdateHash', function() {
    it('should return "required" error when hash is not set', function() {
      let validator = new MapValidator({});
      let errors = validator.validateUpdateHash();
      assert.strictEqual(errors.length, 1);
      assert.strictEqual(errors[0], 'Hash is required');
    });
    it('should return "required" error when hash is empty', function() {
      let validator = new MapValidator({'hash': ''});
      let errors = validator.validateUpdateHash();
      assert.strictEqual(errors.length, 1);
      assert.strictEqual(errors[0], 'Hash is required');
    });
    it('should return "length" error when hash is longer than 64', function() {
      let validator = new MapValidator({'hash': 'a'.repeat(65)});
      let errors = validator.validateUpdateHash();
      errors = errors.filter(err => err.indexOf('length') > -1);
      assert.strictEqual(errors.length, 1);
    });
    it('should return "alphanumeric" error when hash contains non alphanumeric characters other than - or _', function() {
      let validator = new MapValidator({'hash': 'a9034.'});
      let errors = validator.validateUpdateHash();
      errors = errors.filter(err => err.indexOf('alphanumeric') > -1);
      assert.strictEqual(errors.length, 1);
    });
    it('should not return errors for valid value 1', function() {
      let validator = new MapValidator({'hash': 'city-roads'});
      let errors = validator.validateUpdateHash();
      assert.strictEqual(errors.length, 0);
    });
    it('should not return errors for valid value 2', function() {
      let validator = new MapValidator({'hash': 'rivers'});
      let errors = validator.validateUpdateHash();
      assert.strictEqual(errors.length, 0);
    });
    it('should not return errors for valid value 3', function() {
      let validator = new MapValidator({'hash': 'post_offices'});
      let errors = validator.validateUpdateHash();
      assert.strictEqual(errors.length, 0);
    });
  });
});

