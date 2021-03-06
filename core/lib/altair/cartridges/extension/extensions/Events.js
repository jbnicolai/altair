/**
 * Gives modules on/emit that are tied into nexus for wicked awesome cross module referencing.
 *
 * It has 2 supported interfaces
 *
 * this.on('altair:Jarvis::DID_GESTURE', { 'gesture.type': 'the-force' }).then(lang.hitch(this, function (e) {
 *
 *       //the device that triggered the gesture
 *       var device = e.get('device');
 *
 *       //cheating =)
 *       this.nexus('altair:Jarvis').device('living-room-lights').toggle();
 *
 *   });
 *
 * //or
 *
 * this.on('altair:Jarvis::did-gesture', lang.hitch(this, function (e) {
 *
 *       ....
 *
 *   }), { 'gesture.type': 'the-force' });
 *
 *
 *
 */
define(['altair/facades/declare',
        './_Base',
        'altair/Deferred',
        'lodash',
        'altair/facades/hitch',
        'altair/events/Emitter'],

    function (declare,
              _Base,
              Deferred,
              _,
              hitch,
              Emitter) {


        /**
         * Will apply the action to the parent, but use the event name to resolve a new parent from nexus if necessary
         *
         * @param parent
         * @param event
         * @param action
         * @param args
         * @returns {*}
         */
        function apply(parent, event, action, args) {

            var orgEvent = event;

            if(_.isString(event) && event.indexOf('::') !== -1) {

                var eventParts = event.split('::');

                parent = parent.nexus(eventParts[0]);
                event  = eventParts[1];

            }

            if(!parent) {
                var def = new Deferred();
                def.reject('Could not execute ' + action + '(' + orgEvent + ') because it could not be found.');
                return def;
            }

            //pass in new event name as first
            args.unshift(event);

            return parent[action].apply(parent, args);

        }

    return declare([_Base], {

        name: 'events',
        startup: function () {

            if(!this.cartridge.hasExtension('nexus')) {
                this.deferred = new this.Deferred();
                this.deferred.reject(new Error("The events event extension needs the nexus extension loaded first."));
            }


            return this.inherited(arguments);

        },

        extend: function (Module) {

            //if they are an event emmiter
            if(Module.prototype.isInstanceOf(Emitter)) {
    
                Module.extend({

                    /**
                     * We interject Nexus support into the event system.
                     *
                     * @param event
                     * @param callback
                     * @param query
                     * @param config
                     * @returns {*}
                     */
                    on: function (event, callback, query, config) {

                        //if we are skipping on the nexus resolution call the
                        //standard emitter's on()
                        if(config && config.skipNexus) {
                            return this.inherited(arguments);
                        }

                        //setup config with skipNexus
                        if(!config) {
                            config = {};
                        }

                        config.skipNexus = true;


                        try {
                            return apply(this, event, 'on', [callback, query, config]);
                        } catch (e) {
                            console.log(e);
                            return null;
                        }
                    },

                    /**
                     * Remove a listener
                     *
                     * @param event
                     * @param deferred
                     * @returns {*}
                     */
                    removeEventListener: function (event, deferred, config) {

                        //if we are skipping on the nexus resolution call the
                        //standard emitter's on()
                        if(config && config.skipNexus) {
                            return this.inherited(arguments);
                        }

                        //setup config with skipNexus
                        if(!config) {
                            config = {};
                        }

                        config.skipNexus = true;


                        return apply(this, event, 'removeEventListener', [deferred, config]);

                    },

                    /**
                     * So you can emit events through nexus
                     *
                     * @param event
                     * @param data
                     * @param callback
                     * @param config
                     */
                    emit: function(event, data, callback, config) {


                        //if we are skipping on the nexus resolution call the
                        //standard emitter's emit()
                        if(config && config.skipNexus) {
                            return this.inherited(arguments);
                        }

                        //setup config with skipNexus
                        if(!config) {
                            config = {};
                        }

                        config.skipNexus = true;

                        return apply(this, event, 'emit', [data, callback, config]);

                    }

                });

            }
            return this.inherited(arguments);
        }

    });


});