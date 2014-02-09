/**
 * Bootstrap Altair contexts based on a config
 */
require(['altair/TestRunner',
         'altair/plugins/config!core/config/test.json'], function (TestRunner, config) {


    var runner = new TestRunner();

    runner.startup(config).then(function () {

        console.log('-- Tests Loaded--');

        runner.execute().then(function () {
            console.log('-- Tests Finished --');
        }).otherwise(function () {
            console.error('-- Tests Failed --');
        });

    }).otherwise(function (err) {
        console.error(err);
    });


});