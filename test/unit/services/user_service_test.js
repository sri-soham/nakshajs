const assert = require('assert');
const sandbox = require('sinon').createSandbox();
const UserService = require('../../../app/services/user_service.js');
const DB = require('../../../app/db/db.js');

describe('UserService', function() {
  afterEach(function() {
    sandbox.restore();
  });

  describe('#login', function() {
    it('should return error when validation fails', async() => {
      let service = new UserService({});
      let request = {'body': {}};
      let result = await service.login(request);
      assert.ok(result['status'] === 'error');
      assert.ok(result['errors'].length > 0);
    });
    it('should return error when username does not exist', async() => {
      let db = sandbox.createStubInstance(DB);
      db.selectOne.returns(null);
      let service = new UserService(db);
      let request = {'body': {'username': 'johndoe', 'password': 'Something'}};
      let result = await service.login(request);
      assert.ok(result['status'] === 'error');
      assert.ok(result['errors'][0].indexOf('No such user') > -1);
    });
    it('should return error when password does not match', async() => {
      let db = sandbox.createStubInstance(DB);
      db.selectOne.returns({'password': 'lasdl9klsdf320434'});
      let service = new UserService(db);
      let request = {'body': {'username': 'johndoe', 'password': 'something'}};
      let result = await service.login(request);
      assert.ok(result['status'] === 'error');
      assert.ok(result['errors'][0].indexOf('password mismatch') > -1);
    });
    it('should return user when login is successfull', async() => {
      let db = sandbox.createStubInstance(DB);
      db.selectOne.returns({'id': '1', 'username': 'johndoe', 'password': '$2b$10$HDBLpphFvpgf.XeMGI8MOOUufFlrxY2flmBGd9A.osuR4aVmF0k76'});
      let service = new UserService(db);
      let request = {'body': {'username': 'johndoe', 'password': 'JohnDoe123'}};
      let result = await service.login(request);
      assert.ok(result['status'] === 'success');
      assert.ok('user' in result);
    });
  });

  describe('#userById', function() {
    it('should return user', async() => {
      let db = sandbox.createStubInstance(DB);
      db.selectOne.returns({});
      let service = new UserService(db);
      let result = await service.userById(1);
      assert.ok(result['status'] === 'success');
      assert.ok('user' in result);
    });
  });

  describe('#changePassword', function() {
    it('should return error when validation fails', async() => {
      let service = new UserService({});
      let request = {'body': {}};
      let result = await service.changePassword(request);
      assert.ok(result['status'] === 'error');
      assert.ok(result['errors'].length > 0);
    });
    it('should return error when current password does not match', async() => {
      let db = sandbox.createStubInstance(DB);
      db.selectOne.returns({'id': '1', 'username': 'johndoe', 'password': 'laksdflakjfaskfad'});
      let service = new UserService(db);
      let request = {'body': {'current_password': 'somepass', 'new_password': 'abcdefghij', 'confirm_password': 'abcdefghij'}, 'session': {'user_id': '1'}};
      let result = await service.changePassword(request);
      assert.ok(result['status'] === 'error');
      assert.ok(result['errors'][0].indexOf('mismatch') > -1);
    });
    it('should change password', async() => {
      let db = sandbox.createStubInstance(DB);
      db.selectOne.returns({'id': '1', 'username': 'johndoe', 'password': '$2b$10$HDBLpphFvpgf.XeMGI8MOOUufFlrxY2flmBGd9A.osuR4aVmF0k76'});
      let service = new UserService(db);
      let request = {'body': {'current_password': 'JohnDoe123', 'new_password': 'abcdefghij', 'confirm_password': 'abcdefghij'}, 'session': {'user_id': '1'}};
      let result = await service.changePassword(request);
      assert.ok(result['status'] === 'success');
    });
  });

  describe('#updateMapKeys', function() {
    it('should return error when validation fails', async() => {
      let service = new UserService({});
      let request = {'body': {}};
      let result = await service.updateMapKeys(request);
      assert.ok(result['status'] === 'error');
      assert.ok(result['errors'].length > 0);
    });
    it('should update map keys', async() => {
      let db = sandbox.createStubInstance(DB);
      db.update.returns(null);
      let service = new UserService(db);
      let request = {'body': {'key': 'bing_maps_key', 'value': 'some value'}, 'session': {'user_id': '1'}};
      let result = await service.updateMapKeys(request);
      assert.ok(result['status'] === 'success');
      assert.ok(db.update.calledOnce);
    });
  });
});

