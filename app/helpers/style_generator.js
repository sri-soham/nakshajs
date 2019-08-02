class StyleGenerator {
    constructor(input) {
        this._input = input;
    }

    polygonStyle() {
        let poly, line, fields_attrs;

        fields_attrs = {'fill': 'fill', 'fill_opacity': 'fill-opacity'};
        poly = this._getSymbolizer('PolygonSymbolizer', fields_attrs);
        fields_attrs = {'stroke': 'stroke', 'stroke_width': 'stroke-width', 'stroke_opacity': 'stroke-opacity'}
        line = this._getSymbolizer('LineSymbolizer', fields_attrs);

        return '<Rule>' + poly + line + '</Rule>';
    }

    linestringStyle() {
        let line, fields_attrs;

        fields_attrs = {'stroke': 'stroke', 'stroke_width': 'stroke-width', 'stroke_opacity': 'stroke-opacity'};
        line = this._getSymbolizer('LineSymbolizer', fields_attrs);
        return '<Rule>' + line + '</Rule>';
    }

    pointStyle() {
        let marker, fields_attrs, default_attrs;

        fields_attrs = {
            'fill': 'fill',
            'fill_opacity': 'opacity',
            'stroke': 'stroke',
            'stroke_width': 'stroke-width',
            'stroke_opacity': 'stroke-opacity',
            'width': 'width',
            'height': 'height'
        };
        default_attrs = {
            'market-type': 'ellipse',
            'placement': 'point',
            'allow-overlap': 'true'
        };
        marker = this._getSymbolizer('MarkersSymbolizer', fields_attrs, default_attrs);

        return '<Rule>' + marker + '</Rule>';
    }

    _getSymbolizer(symbolizer_tag, fields_attrs, default_attrs) {
        let i, f, out;

        out = '<' + symbolizer_tag + ' ';
        for (i in fields_attrs) {
            out += fields_attrs[i] + '="' + this._input[i] + '" ';
        }
        if (default_attrs) {
            for (i in default_attrs) {
                out += i + '="' + default_attrs[i] + '" ';
            }
        }
        out += ' />';

        return out;
    }
}

module.exports = StyleGenerator;

