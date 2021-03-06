define(['dojo/_base/declare',
        './_Base'],

    function (declare,
              _Base) {



    return declare([_Base], {

        key: 'primary',

        /**
         * You shall always get back a string honoring your options.
         *
         * @param value
         * @param options
         * @param config
         * @returns {*}
         */
        toJsValue: function (value, options, config) {
            return value && value !== '' ? value : null;
        },

        toDatabaseValue: function (value, options, config) {
            return value && value !== '' ? value : null;
        },

        toHttpResponseValue: function (value) {

            return value.toString();

        }

    });

});
