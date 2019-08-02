const express = require('express');
const mapnik = require('mapnik');
const DbHelper = require('./helpers/db_helper.js');
const Helper = require('./helpers/helper.js');
const logger = require('./helpers/logger.js');

const db = DbHelper.getAppUserConn();
const api_db = DbHelper.getApiUserConn();

mapnik.register_default_fonts();
mapnik.register_default_input_plugins();

process.env.ASSET_RANDOM_STR = Helper.randomString(16);

function wrapAsync(fn) {
    return function(req, res) {
        fn(req, res).catch((error) => {
            logger.error(error);
            if (req.xhr) {
                res.writeHead(503, {'Content-Type': 'application/json'});
                let json = JSON.stringify({'status': 'error', 'errors': ['Internal server error']});
                res.end(json);
            }
            else {
                res.writeHead(503, {'Content-Type': 'text/plain'});
                res.end('Internal Server Error');
            }
        });
    };
}

function wrapNext(fn) {
    return function(req, res, next) {
        try {
          fn(req, res, next);
        }
        catch (err) {
            logger.error(err);
            if (req.xhr) {
                res.writeHead(503, {'Content-Type': 'application/json'});
                let json = JSON.stringify({'status': 'error', 'errors': ['Internal server error']});
                res.end(json);
            }
            else {
                res.writeHead(503, {'Content-Type': 'text/plain'});
                res.end('Internal Server Error');
            }
        };
    };
}

function wrapAsyncNext(fn) {
    return function(req, res, next) {
        fn(req, res, next).catch((error) => {
            logger.error(error);
            let msg, response_code;
            if (error.name === 'NakshaError') {
                msg = error.message;
                response_code = 200;
            }
            else {
                msg = 'Internal server error';
                response_code = 503;
            }
            if (req.xhr) {
                res.writeHead(response_code, {'Content-Type': 'application/json'});
                let json = JSON.stringify({'status': 'error', 'errors': [msg]});
                res.end(json);
            }
            else {
                res.writeHead(response_code, {'Content-Type': 'text/plain'});
                res.end(msg);
            }
        });
    };
}

const UserService = require('./services/user_service.js');
const TableService = require('./services/table_service.js');
const TableRowService = require('./services/table_row_service.js');
const ExportService = require('./services/export_service.js');
const MapService = require('./services/map_service.js');
const PublicMapService = require('./services/public_map_service.js');

const user_service = new UserService(db);
const table_service = new TableService(db);
const table_row_service = new TableRowService(db);
const export_service = new ExportService(db);
const map_service = new MapService(db);
const public_map_service = new PublicMapService(db, api_db);

const AssetController = require('./controllers/asset_controller.js');
const ExportController = require('./controllers/export_controller.js');
const IndexController = require('./controllers/index_controller.js');
const LayerController = require('./controllers/layer_controller.js');
const MapController = require('./controllers/map_controller.js');
const PublicMapController = require('./controllers/public_map_controller.js');
const TableController = require('./controllers/table_controller.js');
const TableRowController = require('./controllers/table_row_controller.js');

const asset_controller = new AssetController();
const export_controller = new ExportController(export_service);
const index_controller = new IndexController(user_service, table_service);
const layer_controller = new LayerController(api_db);
const map_controller = new MapController(map_service);
const public_map_controller = new PublicMapController(public_map_service);
const table_controller = new TableController(table_service);
const table_row_controller = new TableRowController(table_row_service);

const asset_router = express.Router();
const index_router = express.Router();
const export_router = express.Router();
const layer_router = express.Router();
const map_router = express.Router();
const public_map_router = express.Router();
const table_router = express.Router();
const table_row_router = express.Router();

asset_router.get('/:random_str(_[a-zA-Z0-9]{16}|libs|images)/:asset_path(*)', asset_controller.serve);

index_router.use(wrapNext(index_controller.authAuth()));
index_router.get('/', wrapAsync(index_controller.index));
index_router.post('/', wrapAsync(index_controller.indexPost));
index_router.get('/dashboard', wrapAsync(index_controller.dashboard));
index_router.get('/logout', wrapAsync(index_controller.logout));
index_router.get('/profile', wrapAsync(index_controller.profile));
index_router.post('/profile', wrapAsync(index_controller.profilePost));
index_router.post('/change_password', wrapAsync(index_controller.changePasswordPost));

export_router.use(wrapAsyncNext(export_controller.authAuth()));
export_router.get('/:id/status', wrapAsync(export_controller.exportStatus));
export_router.get('/:id/download', wrapAsync(export_controller.download));
export_router.get('/index', wrapAsync(export_controller.index));
export_router.post('/:id/delete', wrapAsync(export_controller.deletePost));

layer_router.get('/:hash-:update_hash/:z(\\d+)/:x(\\d+)/:y(\\d+).:ext(png|json)', wrapAsync(layer_controller.handleRequest));

map_router.use(wrapNext(map_controller.authAuth()));
map_router.get('/index', wrapAsync(map_controller.index));
map_router.post('/new', wrapAsync(map_controller.addPost));
map_router.get('/:id/show', wrapAsync(map_controller.show));
map_router.post('/:id/edit', wrapAsync(map_controller.editPost));
map_router.post('/:id/delete', wrapAsync(map_controller.deletePost));
map_router.post('/:id/base_layer', wrapAsync(map_controller.baseLayerPost));
map_router.get('/:id/search_tables', wrapAsync(map_controller.searchTables));
map_router.post('/:id/add_layer', wrapAsync(map_controller.addLayerPost));
map_router.post('/:id/delete_layer', wrapAsync(map_controller.deleteLayerPost));
map_router.post('/:id/hash', wrapAsync(map_controller.hashPost));

public_map_router.get('/m/:id(\\d+)-:hash([A-Za-z0-9_-]{1,64})', wrapAsync(public_map_controller.showMap));
public_map_router.get('/s', wrapAsync(public_map_controller.queryData));
public_map_router.get('/l/:schema/:table', wrapAsync(public_map_controller.layerOfTable));

table_router.use(wrapNext(table_controller.authAuth()));
table_router.get('/add', wrapAsync(table_controller.add));
table_router.post('/add', wrapAsyncNext(table_controller.addPost));
table_router.get('/:id/show', wrapAsync(table_controller.show));
table_router.get('/:id/status', wrapAsync(table_controller.tableStatus));
table_router.post('/:id/styles', wrapAsync(table_controller.stylesPost));
table_router.post('/:id/infowindow', wrapAsync(table_controller.infowindowPost));
table_router.post('/:id/delete', wrapAsync(table_controller.deleteTable));
table_router.post('/:id/add_column', wrapAsync(table_controller.addColumn));
table_router.post('/:id/delete_column', wrapAsync(table_controller.deleteColumn));
table_router.post('/:id/export', wrapAsync(table_controller.exportPost));

table_row_router.use(wrapNext(table_row_controller.authAuth()));
table_row_router.get('/:table_id/data/:page', wrapAsync(table_row_controller.data));
table_row_router.post('/:table_id/add', wrapAsync(table_row_controller.addPost));
table_row_router.post('/:table_id/update/:id', wrapAsync(table_row_controller.update));
table_row_router.get('/:table_id/show/:id', wrapAsync(table_row_controller.show));
table_row_router.post('/:table_id/delete/:id', wrapAsync(table_row_controller.deletePost));

module.exports = {
    asset: asset_router,
    index: index_router,
    table: table_router,
    table_row: table_row_router,
    layer: layer_router,
    exports: export_router,
    map: map_router,
    public_map: public_map_router
};

