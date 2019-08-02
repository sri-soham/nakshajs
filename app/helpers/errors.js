class NakshaError extends Error {
    constructor(message) {
        super(message);
        this.name = 'NakshaError';
    }
}

module.exports = {
    'NakshaError': NakshaError
};

