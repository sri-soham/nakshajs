#!/bin/bash

test_file()
{
    DOTENV_CONFIG_PATH=.testing.env node -r dotenv/config node_modules/.bin/mocha $1
}

test_dir()
{
    DOTENV_CONFIG_PATH=.testing.env node -r dotenv/config node_modules/.bin/mocha --recursive $1
}

test_functional()
{
    DOTENV_CONFIG_PATH=.testing.env node -r dotenv/config node_modules/.bin/nightwatch test/functional/
}

usage()
{
    echo "usage: test.sh unit|integration|functional|one <file-name.js>|unit-controllers|unit-db|unit-services|unit-validators"
}

case "$1" in
    "one" )
        test_file $2
    ;;
    "unit" )
        test_dir "test/unit/**/*_test.js"
    ;;
    "integration" )
        test_dir "test/integration/**/*_test.js"
    ;;
    "functional" )
        test_functional
    ;;
    "all" )
        test_dir "test/unit/**/*_test.js"
        test_dir "test/integration/**/*_test.js"
        test_functional
    ;;
    "unit-controllers" )
        test_dir "test/unit/controllers/*_test.js"
    ;;
    "unit-db" )
        test_dir "test/unit/db/*_test.js"
    ;;
    "unit-services" )
        test_dir "test/unit/services/*_test.js"
    ;;
    "unit-validators" )
        test_dir "test/unit/validators/*_test.js"
    ;;
    "integration-db" )
        test_dir "test/integration/db/*_test.js"
    ;;
    "integration-exporter" )
        test_dir "test/integration/exporter/*_test.js"
    ;;
    "integration-importer" )
        test_dir "test/integration/importer/*_test.js"
    ;;
    * )
        usage
        exit 1
esac

