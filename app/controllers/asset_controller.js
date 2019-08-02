const fs = require('fs');
const path = require('path');

class AssetController {
    constructor() {
        this.serve = this.serve.bind(this);
    }

    serve(request, response) {
        let asset_path;
        if (['libs', 'images'].indexOf(request.params.random_str) < 0) {
            asset_path = path.join(__dirname, '..', '..', 'public', 'assets', request.params.asset_path);
        }
        else {
            asset_path = path.join(__dirname, '..', '..', 'public', 'assets', request.params.random_str, request.params.asset_path);
        }
        if (fs.existsSync(asset_path)) {
            response.sendFile(asset_path);
        }
        else {
            response.writeHead(404, {'Content-Type': 'text/plain'});
            response.end('Resource not found');
        }
    }
}

module.exports = AssetController;
