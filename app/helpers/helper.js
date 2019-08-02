const path = require('path');

let Helper = (function() {
    var thisClass = {};

    var BASE_MAP_OSM = 'o-osm';

    thisClass.schemaTableFromDetails = function(details) {
        return details['schema_name'] + '.' + details['table_name'];
    };

    thisClass.getBaseLayers = function() {
        var base_layers = {};
        base_layers[BASE_MAP_OSM] = 'OpenStreetMap';
        base_layers['o-osmbw'] = 'OpenstreetMap Grayscale'
        base_layers['o-carto-light'] = 'OpenStreetMap Carto Light'
        base_layers['o-carto-dark'] = 'OpenStreetMap Carto Dark'
        base_layers['o-stamen-toner'] = 'OpenStreetMap Stamen Toner'
        base_layers['o-stamen-toner-hybrid'] = 'OpenStreetMap Stamen Toner Hybrid'
        base_layers['o-stamen-toner-labels'] = 'OpenStreetMap Stamen Toner Labels'
        base_layers['o-stamen-toner-lines'] = 'OpenStreetMap Stamen Toner Lines'
        base_layers['o-stamen-toner-background'] = 'OpenStreetMap Stamen Toner Background'
        base_layers['o-stamen-toner-lite'] = 'OpenStreetMap Stamen Toner Lite'
        base_layers['o-stamen-watercolor'] = 'OpenStreetMap Stamen Water Color'
        base_layers['o-stamen-terrain'] = 'OpenStreetMap Stamen Terrain'
        base_layers['o-stamen-terrain-background'] = 'OpenStreetMap Stamen Terrain Background'

        base_layers['g-roadmap'] = 'Google Maps - Road Map'
        base_layers['g-satellite'] = 'Google Maps - Satellite'
        base_layers['g-terrain'] = 'Google Maps - Terrain'
        base_layers['g-hybrid'] = 'Google Maps - Hybrid'

        base_layers['b-Aerial'] = 'Bing Maps - Aerial'
        // 2017-08-31: BirdsEye view is not working
        // At this line
        // var r = meta.resourceSets[0].resources[0];
        // in /assets/leaflet/Bing.js : initMetadata
        // r is empty when type/imageSet is BirdsEye
        // base_layers['b-BirdsEye'] = 'Bing Maps - Birds Eye'

        base_layers['b-Road'] = 'Bing Maps - Road'
        base_layers['b-CanvasDark'] = 'Bing Maps - Canvas Dark'
        base_layers['b-CanvasLight'] = 'Bing Maps - Canvas Light'
        base_layers['b-CanvasGray'] = 'Bing Maps - Canvas Gray'

        base_layers['y-map'] = 'Yandex - Map'
        base_layers['y-satellite'] = 'Yandex - Satellite'
        base_layers['y-hybrid'] = 'Yandex - Hybrid'
        base_layers['y-publicMap'] = 'Yandex - Public Map'
        base_layers['y-publicMapHybrid'] = 'Yandex - Public Map Hybrid'

        return base_layers
    };

    thisClass.getDefaultBaseLayer = function() {
        return BASE_MAP_OSM;
    };

    thisClass.isGoogleMapsBaseLayer = function(base_layer) {
        return base_layer[0] === 'g';
    };

    thisClass.isBingMapsBaseLayer = function(base_layer) {
        return base_layer[0] === 'b';
    };

    thisClass.isYandexMapsBaseLayer = function(base_layer) {
        return base_layer[0] === 'y';
    };

    thisClass.getCurrentTimestamp = function() {
        let dt, str;

        dt = new Date();
        str = dt.getFullYear() + '-' + (dt.getMonth() + 1) + '-' + dt.getDate();
        str += ' ';
        str += dt.getHours() + ':' + dt.getMinutes() + ':' + dt.getSeconds();

        return str;
    };

    thisClass.randomString = function(of_length) {
        let chars, i, k, random_str;

        chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        random_str = '';
        for (i=0; i<of_length; ++i) {
            k = Math.floor((Math.random() * 100) % chars.length);
            random_str += chars[k];
        }

        return random_str;
    };

    thisClass.randomSchemaName = function(of_length) {
        let chars_first, chars_rest, i, k, random_str;

        chars_first = 'abcdefghijklmnopqrstuvwxyz';
        chars_rest = 'abcdefghijklmnopqrstuvwxyz0123456789';
        random_str = '';
        k = Math.floor((Math.random() * 100) % chars_first.length);
        random_str += chars_first[k];

        for (i=1; i<of_length; ++i) {
            k = Math.floor((Math.random() * 100) % chars_rest.length);
            random_str += chars_rest[k];
        }

        return random_str;
    };

    thisClass.hashForMapUrl = function() {
        return thisClass.randomString(32) + '_' + Math.floor(new Date().getTime() / 1000);
    };

    thisClass.hashFromName = function(name) {
        hash = name.toLowerCase();
        hash = hash.replace(/\s+/g, '-');
        hash = hash.replace(/[^a-z0-9_-]+/gi, '');

        return hash;
    };

    // columns in an array
    thisClass.infowindowStringFromColumns = function(columns) {
        let infowindow = {fields: columns};
        return JSON.stringify(infowindow);
    };

    thisClass.dateForView = function(dt) {
        var parts = [], tmp, str;
        parts.push(dt.getFullYear());
        tmp = dt.getMonth();
        tmp++;
        if (tmp < 10) {
            tmp = '0' + tmp;
        }
        parts.push(tmp);
        tmp = dt.getDate();
        if (tmp < 10) {
            tmp = '0' + tmp;
        }
        parts.push(tmp);
        str = parts.join('-');

        parts = [];
        tmp = dt.getHours();
        if (tmp < 10) {
            tmp = '0' + tmp;
        }
        parts.push(tmp);

        tmp = dt.getMinutes();
        if (tmp < 10) {
            tmp = '0' + tmp;
        }
        parts.push(tmp);

        tmp = dt.getSeconds();
        if (tmp < 10) {
            tmp = '0' + tmp;
        }
        parts.push(tmp);

        return str + ' ' + parts.join(':');
    };

    thisClass.logsDirectory = function() {
        return path.join(process.env.TMP_DIR, 'logs');
    };

    thisClass.exportsDirectory = function() {
        return path.join(process.env.TMP_DIR, 'exports');
    };

    thisClass.importsDirectory = function() {
        return path.join(process.env.TMP_DIR, 'imports');
    };

    return thisClass;
})();

module.exports = Helper;
