/**
 * The Foundry is where modules are made. Pass the build() method the options it needs to do its building (see comments
 * above build())
 *
 * Here is how you should structure your modules directory:
 *
 * {{vendorname}}/modules/{{modulename}}/Module.js
 * {{vendorname}}/modules/{{modulename}}/package.json
 *
 * Altair likes to call the folder "vendors," but it does not need to be
 */
define(['altair/facades/declare',
        'dojo/_base/lang',
        'altair/facades/hitch',
        'altair/facades/all',
        'altair/Deferred',
        'altair/events/Event',
        'altair/facades/glob',
        'altair/plugins/node!path',
        'altair/facades/__',
        'lodash',
        'require'],
                         function (declare,
                                   lang,
                                   hitch,
                                   all,
                                   Deferred,
                                   Event,
                                   glob,
                                   path,
                                   __,
                                   _,
                                   require) {




    return declare(null, {


        /**
         * We will delegate all events through this deletate
         */
        _eventDelegate: null,
        _alreadyInstalled: null,

        packageName: 'package.json',

        /**
         * @param options
         */
        constructor: function (options) {

            var _options = options || {};

            this._alreadyInstalled = [];
            this._eventDelegate = _options.eventDelegate || null;

        },

        /**
         * Build modules by looking in paths you pass. The modules that come back will *not* be started up.
         *
         * @param _options - {
         *      paths:              ['path/to/dir/holding/modules'],
         *      modules:            ['vendor:ModuleOne','vendor:Module2'], //if missing, all modules will be created
         *      instantiate:        true //if false, returns paths to modules
         *      alreadyInstalled:  [array of modules you have already installed (they will be considered when sorting dependencies)],
         *      loadDependencies:   true
         * }
         *
         * @returns {dojo.Deferred}
         */
        build: function (options) {

            var deferred        = new Deferred(),
                _options        = options || {},
                instantiate     = _.has(_options, 'instantiate') ? _options.instantiate : true,
                paths;

            if(_options.alreadyInstalled) {
                this._alreadyInstalled = _options.alreadyInstalled;
            }

            try {

                if(_options.eventDelegate) {
                    this._eventDelegate = _options.eventDelegate;
                }

                //they want to restrict the modules being created
                _options.modules = (_options && _options.modules) ? _options.modules : '*';

                if(!_options.paths || _options.paths.length === 0) {
                    deferred.reject(new Error("You must pass an array of paths for the Module Foundry to search and parse."));
                    return deferred;
                }

                //take every path we have received and glob them for our module pattern
                paths = _options.paths.map(function (_path) {
                    return path.join(require.toUrl(_path), '/*/*.js');
                });


                //glob all the dirs
                deferred = glob( paths ).then( hitch( this, function ( files ) {

                    var _paths = this._filterPaths( files, _options.modules),
                        missing = [];

                    //all modules failed?
                    if( !_paths || _paths.length === 0 || (_options.modules !== '*' && _paths.length < _options.modules.length)) {

                        missing = _.filter(_options.modules, function (name) {

                            var path = this.moduleNameToPath(name),
                                found = false;

                            _.each(_paths, function (p) {
                                if(p.indexOf(path) > -1) {
                                    found = true;
                                    return false;
                                }
                            });


                            return !found;

                        }, this);

                        throw new Error("Failed to load " + missing.length + " modules: " + missing.join(', ') + ' from paths: ' + paths.join(', ') + '. Check for other errors as to why they failed and make sure they are included in modules:[].');
                    }

                    return this._sortByDependencies(_paths, options);


                })).then(hitch(this, function (sorted) {

                    if(!sorted) {
                        throw new Error('No modules found to build in Foundry. Checked ' + paths);
                    } else if(!instantiate) {

                        return sorted;
                        
                    } else {

                        //we have our sorted list, lets build each module
                        var list    = sorted.map(hitch(this, 'forgeOne'));

                        return all(list);

                    }


                }));

            } catch (e) {

                deferred.reject(e);

            }

            return deferred;

        },

        /**
         * Emit our event through our delegate
         *
         * @param name
         * @param data
         * @returns {*}
         */
        delegateEmit: function (name, data) {

            var d;

            if(this._eventDelegate) {
                d = this._eventDelegate.emit(name, data);
            } else {
                d = new Deferred();
                d.resolve(new Event(name, data));
            }

            return d;

        },

        /**
         * Filters all the paths you pass down to only those who match the passed module names
         *
         * @param paths
         * @param moduleNames
         * @private
         */
        _filterPaths: function (paths, moduleNames) {
            if(moduleNames === '*') {
                return paths;
            }

            return paths.filter(hitch(this, function (path) {
                var name = this.pathToModuleName(path);
                return moduleNames.indexOf(name) > -1;
            }));
        },

        /**
         * Will read every module's package.json to read its dependencies, then tries to sort the list accordingly. Currently
         * is stupid, does not handle versions, and only handles altairDepenencies as an object (meaning you must set a
         * version).
         *
         * @param paths
         * @private
         */
        _sortByDependencies: function (paths, options) {

            var list                    = [],
                pathsByName             = {},
                packagesByName          = {},
                _options                = options || {},
                skipMissingDependencies = _.has(_options, 'skipMissingDependencies') ? _options.skipMissingDependencies: false,
                deferred                = new Deferred(),
                def;

            //build up paths
            paths.forEach(hitch(this, function (_path) {

                var name        = this.pathToModuleName(_path),
                    packagePath = path.resolve(require.toUrl(_path), '../', 'package'),
                    module      = {
                        name: name,
                        path: _path,
                        dependencies: null
                    };

                //already exists
                if(pathsByName[name]) {
                    throw new Error(name + ' exists in 2 places. ' + pathsByName[name] + ' AND ' + _path);
                }

                packagesByName[name] = module;
                pathsByName[name] = _path;


                //manage our deferreds
                def = new Deferred();
                list.push(def);

                require(['altair/plugins/config!' + packagePath], hitch(this, function (config) {

                    if(!config) {
                        def.reject(__('could not parse config at %s', packagePath));
                        return;
                    }


                    if(config.altairDependencies) {
                        module.dependencies = Object.keys(config.altairDependencies);
                        module.dependencies.forEach(function (dep) {
                            if(!lang.isString(dep) && !def.isRejected()) {
                                deferred.reject('Make sure your altairDependencies have a version number. Module in question is ' + module.name);
                                return;
                            }
                        });
                    }
                    if(!deferred.isRejected()) {
                        def.resolve(module);
                    }
                }));

            }));

            //make sure they all resolve, flatten the list, then order them by putting unshift()'ing dependent modules
            all(list).then(hitch(this, function (results) {

                var sorted = [],
                    sortDependencies = function (pack) {

                        if(pack.dependencies) {

                            pack.dependencies.forEach(function (name) {


                                if(_.indexOf(this._alreadyInstalled, name) === -1) {

                                    var p       = pathsByName[name],
                                        _pack   = packagesByName[name];

                                    if(!p && !skipMissingDependencies) {
                                        deferred.reject(new Error(pack.name + ' is missing a dependent module named ' + name));
                                        return;
                                    } else if (p) {

                                        //go through the dependency's dependencies
                                        sortDependencies(_pack);

                                        //now drop in dependent to list
                                        if(sorted.indexOf(p) === -1) {
                                            sorted.push(p);
                                        }

                                    }

                                }



                            }, this);
                        }

                    }.bind(this);

                results.forEach(hitch(this, function (pack) {

                    sortDependencies(pack);

                    if(sorted.indexOf(pack.path) === -1) {
                        sorted.push(pack.path);
                    }

                }));

                deferred.resolve(sorted);

            }));


            return deferred;

        },


        /**
         * Pass the full path to a Module.js and get back its name.
         *
         * @param modulePath
         * @returns {string}
         */
        pathToModuleName: function (modulePath) {

            //HACK TO BREAK DEPENDENCY ON FOLDER STRUCTURE
            var p       = path.join(modulePath, '..', this.packageName),
                config  = require.nodeRequire(p);

            return config.name;

        },

        /**
         * The inverse of above, the default path
         *
         * @param name the name of any module name returned from this.pathToModuleName
         * @returns {string}
         */
        moduleNameToPath: function (name) {

            var parts = name.split(':');

            return path.join('vendors', parts[0],'modules', parts[1].toLowerCase());

        },

        /**
         * Pass /absolute/path/to/Module.js and I'll load it up
         *
         * @param path
         */
        forgeOne: function (modulePath) {

            var deferred    = new Deferred(),

                //before any module is required, we have to setup some paths in the AMD loader
                dir         = path.dirname(modulePath),
                name        = this.pathToModuleName(modulePath),
                nameParts   = name.split(':'),
                alias       = nameParts[0] + '/modules/' + nameParts[1].toLowerCase(),
                paths    = {};

            paths[alias] = dir;

            require({
                paths: paths
            });

            require([modulePath], hitch(this, function (Module) {

                //emit will build
                this.delegateEmit('will-forge-module', {
                    Module: Module
                }).then(hitch(this, function (e) {

                    var module      = new (e.get('Module'))();
                        module.dir  = path.join(dir, '/');
                        module.name = name;

                    return this.delegateEmit('did-forge-module', {
                        module: module
                    });

                })).then(function (e) {
                    deferred.resolve(e.get('module'));
                }).otherwise(function (err) {
                    deferred.reject(err);
                });

            }));

            return deferred;
        }

    });


});