const path = require('path');
const express = require('express');
const express_session = require('express-session');
const file_store = require('session-file-store')(express_session);
const body_parser = require('body-parser');
const file_upload = require('express-fileupload');

const app = express();
const routers = require('./app/app.js');

let sessions_path = path.join(process.env.TMP_DIR, 'sessions');
app.use(express_session({
    store: new file_store({
        path: sessions_path
    }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    name: process.env.COOKIE_NAME
}));
app.use(body_parser.urlencoded({extended: true}));
app.use(file_upload({
    limits: {fileSize: 4 * 1024 * 1024},
    abortOnLimit: true
}));

app.use('/', routers.index);
app.use('/tables', routers.table);
app.use('/table_rows', routers.table_row);
app.use('/lyr', routers.layer);
app.use('/exports', routers.exports);
app.use('/maps', routers.map);
app.use('/p', routers.public_map);

if (process.env.NODE_ENV === 'production') {
    app.use(express.static('public'));
    app.listen(process.env.SERVER_PORT, '127.0.0.1');
}
else {
    app.use('/assets', routers.asset);
    app.listen(process.env.SERVER_PORT, '0.0.0.0');
}

