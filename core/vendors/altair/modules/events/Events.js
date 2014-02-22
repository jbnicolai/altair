/**
 * Test module
 */
define(['dojo/_base/declare',
        'altair/modules/events/mixins/_HasEventsMixin',
        'altair/events/Emitter'
], function (declare,
             _HasEventsMixin,
             Emitter) {

    return declare('altair/modules/events/Events', [_HasEventsMixin, Emitter], {

        startup: function () {
            return this.inherited(arguments);
        }

    });
});