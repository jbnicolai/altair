/**
 * Apollo schemas are meant to be VERY lightweight.
 *
 * In altair
 *
 * var schema = this.nexus('cartridges/Apollo').createSchema({
 *  'properties' => {
 *      'fieldName' => {
 *          'type' => 'string',
 *          'options' => [
 *              'label'         => 'My cool field',
 *              'description'   => 'What the eff dude?',
 *              'required'      => true
 *          ]
 *      }
 * });
 *
 */
define(['dojo/_base/declare',
        'dojo/_base/lang',
        'lodash'

], function (declare, lang, _) {

    "use strict";

    return declare(null, {

        _data:           null,
        _propertyTypes:   null,
        _optionsByField: null,
        _typeCache:      null,

        /**
         * Pass through straight config... assume its setup how we like it.
         *
         * @param schema
         */
        constructor: function (schema, propertyTypes) {

            if (!schema || !propertyTypes) {
                throw "You must pass a schema literal and an array of apollo/fieldtypes/_Base instances";
            }

            this._propertyTypes      = {};
            this._data              = schema;
            this._optionsByField    = {};
            this._typeCache         = {};

            if(!this._data.properties) {
                this._data.properties = {};
            }

            //make sure each property has a name in it as well
            _.each(this._data.properties, function (prop, name) {
                prop.name = name;
            });

            if (propertyTypes instanceof Array) {

                propertyTypes.forEach(lang.hitch(this, function (type) {
                    this._propertyTypes[type.key] = type;
                }));

            } else {
                this._propertyTypes = propertyTypes;
            }


        },

        /**
         * Does a schema have a field by this name?
         *
         * @param propertyName
         * @returns {boolean}
         */
        has: function (propertyName) {
            return (this._data.properties.hasOwnProperty(propertyName));
        },

        /**
         * Tells you the type of a particular property (firstName would return string)
         *
         * @param propertyName
         * @returns {string}
         */
        typeFor: function (propertyName) {
            return this._data.properties[propertyName].type;
        },

        /**
         * Set a single option for a property
         *
         * @param propertyName
         * @param optionName
         * @param optionValue
         * @returns {this}
         */
        setOptionFor: function (propertyName, optionName, optionValue) {
            this._data.properties[propertyName].options[optionName] = optionValue;
            return this;
        },

        /**
         * A property by a particular name
         *
         * @param named
         * @returns {{}}
         */
        property: function (named) {
            return this._data.properties[named];
        },

        /**
         * I single option for a property
         *
         * @param propertyName
         * @param optionName
         * @returns {*}
         */
        optionFor: function (propertyName, optionName) {

            if(!_.has(this._data.properties, propertyName)) {
                throw new Error('no property called ' + propertyName + ' found on schema.');
            }

            return this._data.properties[propertyName].options[optionName];
        },
        /**
         * Get you all the options for this field mixed in with all options for the field type.
         *
         * @param propertyName
         * @param mixinAll optional
         * @returns {string} all options for that field type
         */
        optionsFor: function (propertyName, mixinAll) {

            if (propertyName in this._data.properties) {

                var property = this._data.properties[propertyName],
                    options = property.options;

                if (!options) {
                    throw propertyName + " has no options. add it to your schema";
                }

                //if we are doing a simple (lightweight) get of options
                if (mixinAll === false) {
                    return options;
                }

                if (!this._optionsByField[propertyName]) {

                    var type = this.propertyType(property.type);
                    this._optionsByField[propertyName] = type.normalizeOptions(options);

                }


            } else {

                throw propertyName + ' does not exist on ' + this.declaredClass;
            }

            return this._optionsByField[propertyName];

        },

        option: function (named) {
            return this._data[named];
        },

        data: function () {
            return this._data;
        },

        primaryProperty: function () {
            return _.where(this._data.properties, { type: 'primary' }).pop();
        },

        /**
         * All the properties on this schema
         *
         * @returns {};
         */
        properties: function () {
            return this.option('properties');
        },

        /**
         * Gets all properties in this schema, but returns an array
         *
         * @returns {Array}
         */
        propertiesAsArray: function () {

            var properties = [];

            Object.keys(this._data.properties).forEach(lang.hitch(this, function (name) {

                var property = lang.mixin({}, this._data.properties[name], {
                    name: name
                });

                properties.push(property);

            }));

            return properties;

        },

        /**
         * Returns you a propertytype by a particular key, e.g. string, email, bool
         *
         * @param key
         * @returns {*}
         */
        propertyType: function (key) {

            if (!(key in this._propertyTypes)) {
                throw new Error('No property type of ' + key + ' found in schema.');
            }

            return this._propertyTypes[key];

        },

        /**
         * Tries all the methods passed on the property propertyType, first one wins.
         *
         * Example:
         *
         *  schema.applyOnProperty(['toSolrValue', 'toStringValue'], 'firstName', 'Taylo®™', { maxLength: 35 }
         *
         * @param named
         * @returns {*}
         */
        applyOnProperty: function (methodNames, propertyName, value, options, config) {

            //by convention, these are null and will not be casted
            if (value === null || value === undefined) {
                return null;
            }

            var property = this._data.properties[propertyName],
                type = property.type,
                propertyType = this.propertyType(type),
                c,
                methodName;


            //normalize options
            options = lang.mixin({}, this.optionsFor(propertyName), options || {});

            //normalize for many
            value = propertyType.normalizeMany(value, options, config);


            for (c = 0; c < methodNames.length; c++) {

                methodName = methodNames[c];

                if (methodName in propertyType) {

                    //make sure it's not an array when {{methodName}} is called
                    if (propertyType.makeValuesSingular) {

                        var wasArray = false;

                        if (value instanceof Array) {

                            wasArray = true;

                        } else {

                            value = [value];

                        }

                        var finalValue = [];

                        value.forEach(function (_value) {
                            finalValue.push(propertyType[methodName](_value, options, config));
                        });

                        return wasArray ? finalValue : finalValue[0];

                    }
                    //we want the raw value passed to method name
                    else {

                        return propertyType[methodName](value, options, config);

                    }


                }
            }


            throw 'Could not find methods (' + methodNames.join(', ') + ') for property named ' + propertyName + '.';

        },

        /**
         * Add a new property to this schema.
         *
         * @param name
         * @param type
         * @param options
         */
        append: function (name, type, options) {
            
            this._data.properties[name] = {
                type:       type,
                name:       name,
                options:    options
            };

            return this;
        },

        /**
         * Helpful printing
         * @returns {string}
         */
        toString: function () {
            return '[object Schema]';
        }

    });
});
