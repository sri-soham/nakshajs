class ServiceResult {
    constructor(is_success) {
        this._isSuccess = is_success;
        this._data = {};
        this._errors = [];
    }

    isSuccess() {
        return this._isSuccess;
    }

    setErrors(errors) {
        this._errors = errors;
    }

    getErrors() {
        return this._errors;
    }

    set(key, value) {
        this._data[key] = value;
    }

    get(key) {
        if (this._data.hasOwnProperty(key)) {
            return this._data[key];
        }
        else {
            return '';
        }
    }

    jsonResponse(include_keys=[]) {
        var i, j, resp;

        if (include_keys.length === 0) {
            include_keys = Object.keys(this._data);
        }

        resp = {};
        if (this._isSuccess) {
            resp['status'] = 'success';
            for (i in this._data) {
                resp[i] = this._data[i];
            }
        }
        else {
            resp['status'] = 'error';
            resp['errors'] = this._errors;
        }

        return resp;
    }
}

