/**
 * Gives modules on/emit that are tied into nexus for wicked awesome cross module referencing.
 *
 * It has 2 supported interfaces
 *
 * this.on('Altair:Jarvis::DID_GESTURE', { 'gesture.type': 'the-force' }).then(lang.hitch(this, function (e) {
 *
 *       //the device that triggered the gesture
 *       var device = e.get('device');
 *
 *       //cheating =)
 *       this.nexus('Altair:Jarvis').device('living-room-lights').toggle();
 *
 *   });
 *
 * //or
 *
 * this.on('Altair:Jarvis::DID_GESTURE', lang.hitch(this, function (e) {
 *
 *       ....
 *
 *   }), { 'gesture.type': 'the-force' });
 *
 *
 *
 */
define(['dojo/_base/declare',
        './_Base',
        'dojo/Deferred',
        'altair/facades/hitch',
        'altair/events/Emitter'],

    function (declare,
              _Base,
              Deferred,
              hitch,
              Emitter) {


        /**
         * Will apply the action to the parent, but use the event name to resolve the parent to
         * something from nexus if necessary
         *
         * @param parent
         * @param event
         * @param action
         * @param args
         * @returns {*}
         */
        function apply(parent, event, action, args) {

            var orgEvent = event;

            if(event.indexOf('::') !== -1) {

                var eventParts = event.split('::');

                parent = parent.nexus(eventParts[0]);
                event  = eventParts[1];

            }

            if(!parent) {
                var def = new Deferred();
                def.reject('Could not ' + action + '(' + orgEvent + ') because it could not be found.');
                return def;
            }

            //pass in new event name as first
            args.unshift(event);

            return parent[action].apply(parent, args);

        }

    return declare('altair/cartridges/module/plugins/Events',[_Base], {

        startup: function () {

            this.deferred = new Deferred();

            if(!this.cartridge.hasPlugin('altair/cartridges/module/plugins/Nexus')) {
                this.deferred.reject("The module event plugin needs the nexus plugin loaded first.");
            } else {
                this.deferred.resolve(this);
            }

            return this.inherited(arguments);

        },

        execute: function (module) {

            //if they are an event emmiter
            if(module.isInstanceOf(Emitter)) {
    
                declare.safeMixin(module, {

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


                        return apply(this, event, 'on', [callback, query, config]);
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