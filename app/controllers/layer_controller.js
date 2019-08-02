const express = require('express');
const mapnik = require('mapnik');
const sphericalmercator = require('@mapbox/sphericalmercator');
const BaseController = require('./base_controller.js');
const constants = require('../helpers/constants.js');
const logger = require('../helpers/logger.js');

const TYPE_LAYER = 'lyr';

const TILE_HEIGHT = 256;
const TILE_WIDTH  = 256;
const MAX_ZOOM_LEVEL = 20;

const SRS_MERC = "+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0.0 +k=1.0 +units=m +nadgrids=    @null +wktext +no_defs +over";

const MAP_STYLE_XML = `
<Map>
  <Style name="{table}">
    {rules}
  </Style>
</Map>
`;

const mercator = new sphericalmercator({
    size: TILE_WIDTH
});

class MapTile {
    constructor(db_host, db_name, db_user, db_pass, layer_data) {
        this._db_host = db_host;
        this._db_name = db_name;
        this._db_user = db_user;
        this._db_pass = db_pass;
        this._layer_data = layer_data;
        this._map = null;
    }

    genTile(x, y, z, response) {
        let box, im;

        this._setMap();
        box = mercator.bbox(x, y, z, false, '900913');
        this._map.zoomToBox(box);

        im = new mapnik.Image(TILE_WIDTH, TILE_HEIGHT);
        this._map.render(im, function(err, im) {
            if (err) throw err;

            im.encode('png', function(err, buffer) {
                if (err) throw err;

                response.type('png');
                response.send(buffer);
            });
        });
    }

    genGrid(x, y, z, response, callback) {
        let box, grid;

        this._setMap();
        box = mercator.bbox(x, y, z, false, '900913');
        this._map.zoomToBox(box);

        grid = new mapnik.Grid(TILE_WIDTH, TILE_HEIGHT, {key: 'naksha_id'});
        this._map.render(grid, {layer: 0, fields: []}, function(err, grid) {
            if (err) throw err;

            grid.encode({format: 'utf'}, function(err, buffer) {
                if (err) throw err;

                var output = JSON.stringify(buffer, null, 4);
                if (callback) {
                    output = callback + '(' + output + ')';
                }
                response.type('json');
                response.send(output);
            });
        });
    }

    _setMap() {
        this._map = new mapnik.Map(TILE_WIDTH, TILE_HEIGHT, SRS_MERC);
        this._setStyles();
        this._addLayer();
    }

    _setStyles() {
        let style;

        this._map.background = new mapnik.Color(255, 255, 255, 0);
        if (this._layer_data.style.length > 0) {
            style = MAP_STYLE_XML.replace('{table}', this._layer_data.table);
            style = style.replace('{rules}', this._layer_data.style);
            this._map.fromStringSync(style);
        }
    }

    _addLayer() {
        let postgis, layer;

        postgis = {
            'type': 'postgis',
            'dbname': this._db_name,
            'host': this._db_host,
            'user': this._db_user,
            'password': this._db_pass,
            'table': '(' + this._layer_data.query + ') AS ' + this._layer_data.table,
            'geometry_field': this._layer_data.geometry_column
        };

        layer = new mapnik.Layer(this._layer_data.table, SRS_MERC);
        layer.datasource = new mapnik.Datasource(postgis);
        layer.styles = [this._layer_data.table];
        this._map.add_layer(layer);
    }
}

class LayerController extends BaseController {
    constructor(db) {
        super();
        this._db = db;
        this.handleRequest = this.handleRequest.bind(this);
        this._layerData = this._layerData.bind(this);
    }

    setDb(db) {
        this._db = db;
    }

    async handleRequest(request, response) {
        let layer_data, map_tile, that, where;

        that = this;
        if (request.query.where && request.query.where.length > 0) {
            where = request.query.where;
        }
        else {
            where = '';
        }
        this._layerData(request.params.hash, where)
            .then(function(layer_data) {
                if (!layer_data.is_valid) {
                    this._renderText(response, layer_data.error, 503);
                }
                map_tile = new MapTile(
                    process.env.DB_HOST, process.env.DB_NAME,
                    process.env.DB_API_USER, process.env.DB_API_PASSWORD, layer_data
                );
                if (request.params.ext === 'png') {
                    map_tile.genTile(
                        request.params.x, request.params.y, request.params.z, response
                    );
                }
                else {
                    map_tile.genGrid(
                        request.params.x, request.params.y, request.params.z, response, request.query.callback
                    );
                }
            })
            .catch(function(error) {
                logger.error(error);
                that._renderText(response, 'could not get tile data', 503);
            });
    }

    async _layerData(hash, where) {
        let data, sql, rows;

        data = {
            table: '',
            geometry_column: '',
            query: '',
            style: '',
            is_valid: false,
            info_fields: ['naksha_id'],
            error: ''
        };

        sql = `SELECT ml.id
                    , mt.table_name
                    , ml.geometry_column
                    , ml.query
                    , ml.style
                    , ml.options
                 FROM ${constants.MSTR_LAYER} AS ml
           INNER JOIN ${constants.MSTR_TABLE} AS mt
                   ON ml.table_id = mt.id
                WHERE ml.hash = $1`;
                
        rows = await this._db.genericSelect(sql, [hash]);
        if (rows.length == 1) {
            data.table = rows[0]['table_name'];
            data.geometry_column = rows[0]['geometry_column'];
            data.query = rows[0]['query'];
            data.style = rows[0]['style']
            data.is_valid = true;
            if (where.length > 0) {
                data.query += ' WHERE ' + where;
            }
        }
        else {
            data.error = 'No such layer';
        }

        return data;
    }
}

module.exports = LayerController;

