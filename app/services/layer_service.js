const BaseService = require('./base_service.js');
const constants = require('../helpers/constants.js');

const TYPE_LAYER = 'lyr';

const SRS_MERC = "+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0.0 +k=1.0 +units=m +nadgrids=    @null +wktext +no_defs +over";

const MAP_STYLE_XML = `
<Map>
  <Style name="{table}">
    {rules}
  </Style>
</Map>
`;

class LayerService extends BaseService {
    constructor(db) {
        super(db);
        this.handleRequest = this.handleRequest.bind(this);
    }

    handleRequest(request, response) {
        let tile_request, layer_data 

        tile_request = this._tileRequest(request);
        if (!tile_request.is_valid) {
            return this.errorResult([tile_request.error]);
        }
        layer_data = this._layerData(tile_request.hash);
        if (!layer_data.is_valid) {
            return this.errorResult([layer_data.error]);
        }
    }

    _tileRequest(request) {
        let parts, last, tmp_parts, data;

        data = {
            x: 0,
            y: 0,
            z: 0,
            ext: '',
            callback: '',
            is_valid: false,
            hash: '',
            update_hash: '',
            error: ''
        };

        parts = request.path.split('/');
        if (parts.length != 6) {
            data.error = 'invalid parts. length is ' + parts.length;
            return data;
        }

        if (request.query && request.query.callback && request.query.callback.length > 0) {
            data.callback = request.query.callback;
        }

        last = parts.pop();
        tmp_parts = last.split('.');
        if (tmp_parts.length !== 2) {
            data.error = 'Invalid extension';
            return data;
        }
        data.ext = tmp_parts.pop();

        if (tmp_parts[0].replace(/\d+/, '').length === 0) {
            data.y = tmp_parts[0];
        }
        else {
            data.error = 'Invalid value for y';
            return data;
        }

        last = parts.pop();
        if (last.replace(/\d+/, '').length === 0) {
            data.x = last;
        }
        else {
            data.error = 'Invalid value for x';
            return data;
        }

        last = parts.pop();
        if (last.replace(/\d+/, '').length === 0) {
            data.z = last;
        }
        else {
            data.error = 'Invalid value for z';
            return data;
        }

        last = parts.pop();
        tmp_parts = last.split('-');
        if (tmp_parts.length !== 2) {
            data.error = 'Invalid hash values';
            return data;
        }

        data.update_hash = tmp_parts.pop();
        data.hash = tmp_parts.pop();

        last = parts.pop();
        if (last !== TYPE_LAYER) {
            data.error = 'Invalid type. Type should be ' + TYPE_LAYER;
            return data;
        }

        data.is_valid = true;

        return data;
    }

    async _layerData(hash) {
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
                    , ml.table_name
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
            data.table = rows[0]['table'];
            data.geometry_column = rows[0]['geometry_column'];
            data.query = rows[0]['query'];
            data.style = rows[0]['style']
            data.is_valid = true;
        }
        else {
            data.error = 'No such layer';
        }

        return data;
    }
}

