define(['altair/facades/declare',
        'altair/plugins/node!path',
        './_Base'],

    function (declare,
              pathUtil,
              _Base) {



    return declare([_Base], {

        key: 'path',
        options: {
        },


        /**
         * You shall always get back a string honoring your options.
         *
         * @param value
         * @param options
         * @param config
         * @returns {*}
         */
        toJsValue: function (value, options, config) {

            var results;

            //get most common check out of the way
            if(typeof value === 'string') {
                results = value;
            } else if(value) {
                results = value.toString();
            }

            return results;
        },


        fromCliValue: function (value, options, config) {

            var resolved = value;

            if(value[0] !== '/') {
                resolved = pathUtil.join(process.cwd(), value);
            }

            return resolved;
        }

    });

});
