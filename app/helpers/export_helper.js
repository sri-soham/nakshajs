let ExportHelper = (function() {
    var thisClass = {};

    const ST_IN_QUEUE =   0;
    const ST_SUCCESS  =  10;
    const ST_ERROR    = -10;

    const SHAPE_FILE   = 10;
    const CSV_FILE     = 20;
    const GEOJSON_FILE = 30;
    const KML_FILE     = 40;

    thisClass.getAvailableFormats = function() {
        var formats = {};
        formats[SHAPE_FILE] = 'ESRI Shape File';
        formats[CSV_FILE] = 'CSV File';
        formats[GEOJSON_FILE] = 'GeoJSON File';
        formats[KML_FILE] = 'KML File';

        return formats;
    };

    thisClass.isValidFormat = function(format) {
        let is_valid;
        if (format) {
            format = parseInt(format);
            is_valid = ([SHAPE_FILE, CSV_FILE, GEOJSON_FILE, KML_FILE].indexOf(format) >= 0);
        }
        else {
            is_valid = false;
        }

        return is_valid;
    };

    return thisClass;
})();

module.exports = ExportHelper;
