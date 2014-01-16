define(['doh/runner', 'altair/Altair', 'altair/cartridges/Foundry', 'dojo/_base/lang'], function (runner, Altair, Foundry, lang) {

    /**
     * Dependencies
     */
    var options   = {
            cartridges: [
                {
                    "name": "Mock",
                    "path": "altair/cartridges/Mock",
                    "options": {
                        foo: "bar"
                    }
                }
            ]
        };


    runner.register('cartridges', [

        /**
         * Make sure we can construct a Foundry instance
         */
        function () {

            var altair  = new Altair(),
                foundry = new Foundry(altair);

            runner.assertTrue(!!foundry);

        },


        /**
         * Build some cartridges and test to make sure they are started up
         */
        function () {

            var altair      = new Altair(),
                foundry     = new Foundry(altair),
                deferred    = new doh.Deferred();

            foundry.build(options.cartridges).then(deferred.getTestCallback(lang.hitch(this, function (cartridges) {

                var mock = cartridges[0];

                runner.assertEqual(1, cartridges.length, 'Wrong number of cartridges created.');
                runner.assertEqual('bar', mock.options.foo, 'Options were not passed through to cartridge');
                runner.assertFalse(mock.startedUp, 'Cartridge should not be started up.');


            })));


            runner.assertTrue(!!foundry);

            return deferred;

        }

    ]);


});