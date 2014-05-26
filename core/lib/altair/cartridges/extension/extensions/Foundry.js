/**
 * The foundry plugin gives each module a foundry(className) method that instantiates a class
 * relative to our module.dir, sets name and module, and optionally calls startup on it.
 *
 * Or, you can pass your own instantiationCallback to do something of your own to instance
 *
 * Example from inside your module
 *
 * this.forge('adapters/Smtp', {...options...}).then(function (smtp)) {
 *
 *      console.log(smtp.name) --> Vendor:Module::adapters/Smtp
 *      console.log(smtp.module) --> instance of Vendor:Module
 *
 * });
 *
 *
 */
define(['altair/facades/declare',
        './_Base',
        'altair/facades/hitch',
        'altair/facades/when',
        'altair/Deferred',
        'altair/plugins/node!fs',
        'altair/plugins/node!path',
        'lodash'
], function (declare,
             _Base,
             hitch,
             when,
             Deferred,
             fs,
             pathUtil,
             _) {

    //instantiation callback for every foundry call, assums everything is a subcomponent
    var defaultFoundry = function (Class, options, config) {

        return config.extensions.extend(Class, config.type).then(function (Class) {

            var a       = new Class(options),
                parent  = config.parent,
                dir     = config.dir,
                nexus   = config.nexus,
                name    = config.name || '__unnamed';

            //setup basics if they are missing
            if(!a.name) {
                a.name = name;
            }

            a.parent    = parent;
            a.dir       = dir;
            a._nexus    = nexus;

            return config.extensions.execute(a, config.type);

        });



    };

    return declare([_Base], {

        name: 'foundry',

        startup: function () {

            if(!this.cartridge.hasExtension('paths')) {
                this.deferred = new this.Deferred();
                this.deferred.reject(new Error("The foundry extension needs the paths extension loaded first."));
            } else if(!this.cartridge.hasExtension('nexus')) {
                this.deferred = new this.Deferred();
                this.deferred.reject(new Error("The foundry extension needs the paths extension loaded first."));
            }

            return this.inherited(arguments);

        },

        extend: function (Module) {

            //mixin our extensions
            Module.extendOnce({

                forge: function (className, options, config) {

                    config = config || {};

                    var d = new Deferred(),
                        parent        = _.has(config, 'parent') ? config.parent : this.parent || this,
                        path,
                        parts,
                        name          = _.has(config, 'name') ? config.name : null,
                        foundry       = _.has(config, 'foundry') ? config.foundry : defaultFoundry,
                        shouldStartup = _.has(config, 'startup') ? config.startup : true,
                        type          = _.has(config, 'type') ? config.type : 'subComponent';


                    //are we pointing to a relative directiory?
                    if(className[0] === '.') {
                        className = pathUtil.join(this.dir, className).replace(parent.dir, '');
                    }
                    //it's a full nexus path
                    else if(className.search(':') > 0) {
                        parts       = className.split('/');
                        parent      = this.nexus(parts[0]);
                        className   = className.replace(parts[0] + '/', '');
                    }

                    //detect name
                    if(!name) {

                        if(!parent) {
                            d.reject('Could not resolve parent for ' + className + ' in Foundry extension. Parent is required if you do not pass a name.');
                            return d;
                        }

                        name = className;

                        //the path is relative to parent, lets try and resolve it
                        //this is safe to change, just make sure to test alfred and controllers
                        if(name.search(/\.\./) > -1) {
                            name = parent.name.split(':')[0] + ':' + pathUtil.join(parent.name.split(':')[1], '..', name);
                        } else {
                            name = (name[0] === '/') ? name : parent.name + '/' + name; //keep absolute path?
                        }

                    }

                    //path from newly resolved classname
                    path = (parent) ? parent.resolvePath(className + '.js') : this.resolvePath(className + '.js');

                    //does this file exist?
                    fs.exists(path, hitch(this, function (exists) {

                        if(!exists) {
                            d.reject(new Error('Could not create ' + type + ' at ' + path));
                        } else {


                            require([path], hitch(this, function (Child) {

                                try {

                                    var a       = foundry(Child, options, {
                                        parent:     parent,
                                        name:       name,
                                        nexus:      (parent) ? parent._nexus : this._nexus,
                                        type:       type,
                                        dir:        pathUtil.join(pathUtil.dirname(path), '/'),
                                        defaultFoundry: defaultFoundry,
                                        extensions: this.nexus('cartridges/Extension')
                                    });

                                    //extend this object
                                    when(a).then(hitch(this, function (a) {

                                        //startup the module
                                        if(a.startup && shouldStartup) {
                                            a.startup(options).then(hitch(d, 'resolve')).otherwise(hitch(d, 'reject'));
                                        } else {
                                            d.resolve(a);
                                        }

                                    })).otherwise(hitch(d, 'reject'));


                                } catch(err) {
                                    d.reject(err);
                                }
                            }));


                        }

                    }));

                    return d;

                }

            });

            return this.inherited(arguments);
        }

    });


});