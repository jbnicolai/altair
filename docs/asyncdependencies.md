#Loading many dependencies at once, async style

Make sure your module mixes in `altair/Lifecycle` and throw this into `startup()`.

```js
startup: function () {

    var l = {
        _users:         this.entity('User'),
        _foodGroups:    this.entity('FoodGroup'),
        _foods:         this.entity('Food'),
        _meals:         this.entity('Meal'),
        _reminderTypes: this.entity('ReminderType'),
        _content:       this.entity('Content'),
        _promos:        this.entity('Promotion'),
        _supplements:   this.entity('Supplement'),
        _journalEntries:this.entity('JournalEntry'),
        _foodEntries:   this.entity('FoodEntry'),
        _mealEntries:   this.entity('MealEntry'),
        _tokens:        this.model('TokenGenerator')
    };

    //load dependencies
    this.deferred = this.all(l).then(function (dependencies) {

        //mixin everything we have loaded to ourselves (will become properties)
        declare.safeMixin(this, dependencies);

        return this;

    }.bind(this));

    return this.inherited(arguments);

},
```
Every one of those calls is potentially asynchronous and all will run in parallel.