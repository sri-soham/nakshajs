class BaseService {
    constructor(db) {
        this._db = db;
    }

    invalidRequest() {
        return this.errorResult(['Invalid request']);
    }

    successResult(values) {
        if (values) {
            values['status'] = 'success';
        }
        else {
            values = {'status': 'success'};
        }

        return values;
    }

    errorResult(errors) {
        return {
            'status': 'error',
            'errors': errors
        };
    }
}

module.exports = BaseService;
