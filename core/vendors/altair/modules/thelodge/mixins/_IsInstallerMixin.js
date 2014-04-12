define(['altair/facades/declare',
        'altair/facades/hitch',
        'altair/events/Emitter',
        'altair/Lifecycle'
], function (declare,
             hitch,
             Emitter,
             Lifecycle) {


    return declare([Emitter, Lifecycle], {

        type: null,

        startup: function (options) {

            var _options = options || this.options;

            if(!_options.type) {
                throw new Error('You must pass installers for thelodge a type (such as modules, themes, widgets, etc.)');
            }

            this.type = _options.type;

            return this.inherited(arguments);
        },

        install: function (from, to) {
            throw new Error('Your installer must implement install(from, to).');
        },


        unInstall: function (obj) {
            throw new Error('Your installer must implement unInstall(obj).');
        }



    });

});
