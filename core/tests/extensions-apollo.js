define(['doh/runner',
        'core/tests/support/boot'],
    function (doh,
              boot) {

        var cartridges = [
            {
                path: 'altair/cartridges/apollo/Apollo',
                options: {

                }
            },
            {
                path: 'altair/cartridges/nexus/Nexus',
                options: {

                }
            },
            {
                path: 'altair/cartridges/module/Module',
                options: {
                    paths: ['core/tests/modules/altair'],
                    modules: ['altair:Mock']
                }
            },
            {
                path: 'altair/cartridges/extension/Extension',
                options: {
                    extensions: [
                        "altair/cartridges/extension/extensions/Paths",
                        "altair/cartridges/extension/extensions/Config",
                        "altair/cartridges/extension/extensions/Package",
                        "altair/cartridges/extension/extensions/Deferred",
                        "altair/cartridges/extension/extensions/Apollo",
                        "altair/cartridges/extension/extensions/Nexus",
                        "altair/cartridges/extension/extensions/Events",
                        "altair/cartridges/extension/extensions/Foundry"
                    ]
                }
            }
        ];



        doh.register('extensions-apollo', {

             "test apollo schema on module": function (t) {

                return boot.nexus(cartridges).then(function (nexus) {

                    var module = nexus('altair:Mock');

                    t.is('bar', module.get('foo'), 'altair:Mock did not get a schema.');


                });


            }

        });


    });