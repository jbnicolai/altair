#!/usr/bin/env node

/**
 * This file exists to bootstrap the dojo environment, which in turn bootstraps altair. Because you can pass any bootstrap
 * file you want with --bootstrap
 *
 * @type {exports}
 */


var path = require('path'),
    argv = require('optimist').usage('Altair - Experiences of Everything\n Usage: $0').options('env', {
                'default': 'dev',
                describe: 'specify the environment you want to run'
            }).options('bootstrap', {
                'default': 'core/bootstrap',
                describe: 'change the bootstrap file used by Altair'
            }).boolean('help').alias('help', 'h').describe('help', 'display help').boolean('test').describe('test', 'run our unit tests').argv;

if(argv.help) {
    require('optimist').showHelp();
    return;
}

// Configuration Object for Dojo Loader:
dojoConfig = {
    baseUrl: __dirname, // Where we will put our packages
    async: 1, // We want to make sure we are using the "modern" loader
    hasCache: {
        "host-node": 1, // Ensure we "force" the loader into Node.js mode
        "dom": 0 // Ensure that none of the code assumes we have a DOM
    },
    packages: [
        {
            name: "dojo",
            location: "core/lib/dojo"
        },
        {
            name: "altair",
            location: "core/lib/altair"
        },
        {
            name: "core",
            location: "core"
        },
        {
            name: "doh",
            location: "core/lib/doh"
        },
        {
            name: "apollo",
            location: "core/lib/apollo"
        }
    ],
    deps: [
        argv.bootstrap
    ]
};

if(argv.t || argv.test) {
    dojoConfig.deps = ['core/bootstrap-test'];
}

// Only exists to pass env to the bootstrap script (altair does not access any GLOBALS)
GLOBAL.env =  argv.env;

// Now load the Dojo loader
require("./core/lib/dojo/dojo.js");
