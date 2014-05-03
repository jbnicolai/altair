/**
 * ONLY AND AND OR ARE SUPPORTED. IN & NIN
 */

define(['altair/facades/declare',
        'altair/facades/mixin',
        'lodash',
        'dojo/_base/lang'
], function (declare,
             mixin,
             _,
             lang) {

    return declare(null, {

        _currentJoin:   'and',
        _queryPath:     '', //dot style identifier for setting proper spots in the query
        _callback:      null,
        _clauses:       null,

        constructor: function (callback) {

            //we always at least have a where clause (or two)
            this._clauses   = {
                where: {}
            };

            this._callback  = callback;
        },

        where: function (name, operator, operand) {

            var condition = {}, // the final condition that is added to the local _query
                subCondition, // when checking if we are under another predicate
                _queryPath; //junk

            switch(operator.toLowerCase()) {
                case '=':
                case '==':
                case '===':
                    condition[name] = operand;
                    break;
                case '>':
                case '<':
                case '>=':
                case '<=':
                case 'like':
                    condition[name] = {};
                    condition[name]['$' + operator] = operand;
                    break;
                default:
                    throw new Error('Unknown operator "' + operator + '". Supported include =,==,>,<,>=,<=,LIKE');
            }

            if(this._currentJoin === 'and') {

                if(this._queryPath === '') {

                    this._clauses.where = mixin(this._clauses.where, condition);

                }
                //if we are deeper in the query, set the value there
                else {

                    subCondition  = lang.getObject(this._queryPath, true, this._clauses.where);
                    _queryPath    = this._queryPath;

                    //this is an "OR" since its an array. so lets add it to the array
                    if(_.isArray(subCondition)) {
                        _queryPath       = _queryPath + '.' + (subCondition.length - 1); //we we are in the query more precisely
                        subCondition     = mixin(subCondition.pop(), condition);
                    }
                    //we are already in part of an "AND"
                    else {
                        subCondition     = mixin(subCondition, condition);
                    }


                    lang.setObject(_queryPath, subCondition, this._clauses.where);
                }

            }
            //now OR
            else {

                if(!this._queryPath) {

                    this._clauses.where = {
                        '$OR': [
                            this._clauses.where,
                            condition
                        ]
                    };

                    this._queryPath = '$OR';

                } else {

                    subCondition = lang.getObject(this._queryPath, true, this._clauses.where);

                    //we are already part of an OR (because we're an array)
                    if(_.isArray(subCondition)) {
                        subCondition.push(condition);
                    }
                    //wrap in outer OR
                    else {

                        throw new Error('not finished');

                    }

                }

            }

            return this;


        },

        and: function () {
            this._currentJoin = 'and';
            return this;
        },

        or: function () {

            this._currentJoin = 'or';

            return this;

        },

        clauses: function () {
            return _.cloneDeep(this._clauses);
        },

        clause: function (named) {

            if(_.has(this._clauses, named)) {
                return _.cloneDeep(this._clauses[named]);
            } else {
                return undefined;
            }

        },

        limit: function (limit) {
            this._clauses.limit = limit;
            return this;
        },

        skip: function (skip) {
            this._clauses.skip = skip;
            return this;
        },


        set: function (name, value) {

            var clause = this._clauses.set || {};

            if(_.isString(name)) {

                clause[name] = value;

            } else if(_.isArray(name)) {

                clause = name;

            } else {

                clause = mixin(clause, name);
            }

            this._clauses.set = clause;

            return this;

        },

        execute: function () {

            if(this._callback) {
                return this._callback(this);
            }

        }

    });

});