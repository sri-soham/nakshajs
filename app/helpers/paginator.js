class Paginator {
    constructor(count, per_page, curr_page, limit) {
        this._count = count;
        this._per_page = per_page;
        this._curr_page = curr_page;
        if (limit) {
            this._limit = limit;
        }
        else {
            this._limit = 4;
        }
        this._setMinMax();
    }

    links(url) {
        var i, links, dbl_limit;

        dbl_limit = this._limit * 2;
        links = [];
        if (this._curr_page > 1 && this._no_of_pages > dbl_limit) {
            links.push('<a href="' + url.replace('{page}', 1) + '" class="pagination-link">&laquo;</a>');
            links.push('<a href="' + url.replace('{page}', this._curr_page - 1) + '" class="pagination-link">&lsaquo;</a>');
        }
        for (i=this._min; i<=this._max; ++i) {
            if (i == this._curr_page) {
                links.push('<span>' + i + '</span>');
            }
            else {
                links.push('<a href="' + url.replace('{page}', i) + '" class="pagination-link">' + i + '</a>');
            }
        }
        if (this._curr_page < this._no_of_pages && this._no_of_pages > dbl_limit) {
            links.push('<a href="' + url.replace('{page}', this._curr_page + 1) + '" class="pagination-link">&rsaquo;</a>');
            links.push('<a href="' + url.replace('{page}', this._no_of_pages) + '" class="pagination-link">&raquo;</a>');
        }

        return links.join('');
    }

    text() {
        var first, last;

        first = (this._curr_page - 1) * this._per_page + 1;
        last = this._curr_page * this._per_page;
        if (last > this._count) {
            last = this._count;
        }
        return '(' + first + ' to ' + last + ' of ' + this._count + ')';
    }

    _setMinMax() {
        var tmp;

        tmp = this._count / this._per_page;
        this._no_of_pages = parseInt(tmp);
        if (this._no_of_pages < tmp) {
            this._no_of_pages = this._no_of_pages + 1;
        }
        this._min = this._curr_page - this._limit;
        if (this._min < 1) {
            this._min = 1;
        }
        this._max = this._min + (2 * this._limit);
        if (this._max > this._no_of_pages) {
            this._max = this._no_of_pages;
            this._min = this._max - (2 * this._limit);
            if (this._min < 1) {
                this._min = 1;
            }
        }
    }
}

module.exports = Paginator;
