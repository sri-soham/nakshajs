function define(name, value) {
    Object.defineProperty(exports, name, {
        value: value,
        enumerable: true,
        writable: false,
        configurable: false
    });
}

define('IMPORT_UPLOADED', 10);
define('IMPORT_IMPORTED', 20);
define('IMPORT_UPDATED', 30);
define('IMPORT_READY', 40);
define('IMPORT_ERROR', -10);
define('PRIMARY_KEY', 'naksha_id');

define('MSTR_TABLE', 'public.mstr_table');
define('MSTR_LAYER', 'public.mstr_layer');
define('MSTR_USER', 'public.mstr_user');
define('MSTR_EXPORT', 'public.mstr_export');
define('MSTR_MAP', 'public.mstr_map');
define('MSTR_MAP_LAYER', 'public.mstr_map_layer');
define('MSTR_MIGRATION', 'public.mstr_migration');

define('SESSION_EXPORTS_KEY', 'exports');
define('SESSION_IMPORTS_KEY', 'imports');

