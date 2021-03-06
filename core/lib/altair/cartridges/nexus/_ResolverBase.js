/**
 * This is the base resolver class. You don't have to use it, just make sure you implement every method defined below.
 * Nexus uses resolvers to help engineers gain access to different components
 */
define(['altair/facades/declare'], function (declare) {

    return declare(null, {

        resolve: function (key, options, config) {},
        handles: function (key) {
            return false;
        }


    });


});