
var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var ObjectID = require('mongodb').ObjectID;

////////////////////////////////////////////////////////////////////////////////////////////////
// CONNECTING
////////////////////////////////////////////////////////////////////////////////////////////////

// pending connection
mongoose.connect('mongodb://localhost/test');

// actually connect
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log("Connected to mongo!");
});

////////////////////////////////////////////////////////////////////////////////////////////////
// DEFINE SCHEMA
////////////////////////////////////////////////////////////////////////////////////////////////

var nameSchema = mongoose.Schema({
    first: {
        type: String,
        required: true
    },
    last: {
        type: String,
        required: true
    }
});

var personSchema = mongoose.Schema({
    name: {
        first: {
            type: String,
            required: true
        },
        last: {
            type: String,
            required: true
        }
    },
    age: Number,
    gender: String
});

var Person = mongoose.model('Person', personSchema);

// Create a schema
var kittySchema = mongoose.Schema({
  name: {
      type: String,
      validate: {
          validator: function(value) {
              return value.trim().length;
          },
          message: '`{VALUE}` is not a valid name!'
      },
      // `required` validation runs before any custom `validate` functions
      required: [true, 'All kittens need names!']
  },
  age: {
      type: Number,
      required: [true, 'Why no age?']
  },
  owner: {type: mongoose.Schema.Types.ObjectId, ref: 'Person'}
});

var puppySchema = mongoose.Schema({
    name: String,
    age: Number
});

// NOTE: methods must be added to the schema before compiling it with mongoose.model()
// Functions added to the methods property of a schema get compiled into the Model prototype and exposed on each document instance
kittySchema.methods.speak = function () {
  var greeting = this.name
    ? "Meow name is " + this.name
    : "I don't have a name";
  console.log(greeting);
}

// Compile the schema into a model
// A model is a class with which we create documents
var Kitten = mongoose.model('Kitten', kittySchema);
var Puppy = mongoose.model('Puppy', puppySchema);

////////////////////////////////////////////////////////////////////////////////////////////////
// ROUTES
////////////////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////// Saving ///////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////

router.post('/kittens', function(req, res) {
    var fluffy = new Kitten({ name: 'fluffy' });
    console.log(fluffy.name);
    fluffy.speak(); // "Meow name is fluffy"

    fluffy.save(function (err, fluffy) {
      if (err) {
          res.status(500).json(err);
          return;
      }
      fluffy.speak()
      res.status(200).send("Success!");
    });
});

////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////// Finding ///////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////

router.get('/kittens', function(req, res) {
    // We can access all kittens we've saved through our kitten model
    Kitten.find(function (err, kittens) {
      if (err) return console.error(err);
      res.status(200).json(kittens);
    }).lean();
});

router.get('/kittens2', function(req, res) {
    // We can access all kittens we've saved through our kitten model
    Kitten.find().lean().exec(function (err, kittens) {
      if (err) return console.error(err);
      res.status(200).json(kittens);
    });
});

router.get('/kittens/Fluff', function(req, res) {
    // Finds all kittens whose names start with "Fluff" (which is zero!)
    Kitten.find({ name: /^Fluff/ }, function(err, kittens) {
      if (err) return console.error(err);
      res.status(200).json(kittens);
    });
});

// Test: saving two documents, one after the other
router.get('/pair', function(req, res) {
    var id = new ObjectID();
    var keith = new Person({_id: id, name: "Keith", age: 23});
    var yoda = new Kitten({name: "Yoda", owner: id});

    keith.save(function(err) {
        if (err) {
            res.send(err);
            return;
        }
        yoda.save(function(err) {
            if (err) {
                res.send(err);
                return;
            }
            res.send('Saved keith and yoda');
        });
    });
});

////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////// Updating //////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////

// Test: update without specifying any search parameters to find the document
// -- are all documents updated?
// Result: updates the first document in the collection, but none of the others :(
router.get('/updateAll', function(req, res) {
    Kitten
    .update({}, { name: 'Yodsie' })
    .exec(function(err) {
        if (err) {
            res.send(err);
        } else {
            res.send('success - check documents');
        }
    });
});

// Test: update a nonexistent field
// Result: success, but does not update document :/
router.get('/updateBadField', function(req, res) {
    Kitten
    .update({}, { color: 'white' })
    .exec(function(err) {
        if (err) {
            res.send(err);
        } else {
            res.send('success - check documents');
        }
    });
});

// Test: update a nonexistent field and one that does exist
// Result: success - updates the field that does exist, does nothing with the other field
router.get('/updateMix', function(req, res) {
    Kitten
    .update({}, { color: 'white', name: "YODA" })
    .exec(function(err) {
        if (err) {
            res.send(err);
        } else {
            res.send('success - check documents');
        }
    });
});

////////////////////////////////////////////////////////////////////////////////////
////////////////////////////// Optional expansion //////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////

router.get('/expandYoda', function(req, res) {
    getYoda('owner', function(err, yoda) {
        if (err) {
            res.send(err);
            return;
        }
        res.send(yoda);
    });
});

router.get('/dontExpandYoda', function(req, res) {
    getYoda('', function(err, yoda) {
        if (err) {
            res.send(err);
            return;
        }
        res.send(yoda);
    });
});

function getYoda(expansions, callback) {
    Kitten
    .find({name: 'Yoda'})
    .populate(expansions)
    .exec(callback);
}

////////////////////////////////////////////////////////////////////////////////////
//////////////// What can and can't be saved? (Validation aside) ///////////////////
////////////////////////////////////////////////////////////////////////////////////

// Test: try to save with fields not defined in schema
// Result: no error; saves only fields defined in schema :/
router.get('/saveUndefinedFields', function(req, res) {
    var invalidKitten = new Kitten({ color: "white", name: "yoda" });
    invalidKitten.save(function(err, kitten) {
        if (err) {
            res.send(err);
            return;
        }
        res.send(kitten);
    });
});

// Test: try to save a number in string format for a field of type Number
// Result: works! Parses out the number :/
router.get('/saveWrongType', function(req, res) {
    var invalidKitten = new Kitten({ name: "yoda", age: "12" });
    invalidKitten.save(function(err, kitten) {
        if (err) {
            res.send(err);
            return;
        }
        res.send(kitten);
    });
});

// Test: try to save a string for a field of type Number (when using mongoose validation)
// Result: fails with ValidationError (CastError)
router.get('/saveStringForNumber', function(req, res) {
    var invalidKitten = new Kitten({ name: "yoda", age: "a" });
    invalidKitten.save(function(err, kitten) {
        if (err) {
            res.send(err);
            return;
        }
        res.send(kitten);
    });
});

// Test: try to save a string for a field of type Number (when NOT using mongoose validation)
// Result: fails with ValidationError (CastError)
router.get('/saveStringForNumber2', function(req, res) {
    var invalidPuppy = new Puppy({ name: "spot", age: "a" });
    invalidPuppy.save(function(err, puppy) {
        if (err) {
            res.send(err);
            return;
        }
        res.send(puppy);
    });
});

////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////// Mongoose Validation ///////////////////////////////
////////////////////////////////////////////////////////////////////////////////////


// Test: try to save without a required field
// Result: error :)
router.get('/saveWithoutName', function(req, res) {
    var invalidKitten = new Kitten({ age: 3 });
    invalidKitten.save(function(err, kitten) {
        if (err) {
            res.send(err);
            return;
        }
        res.send(kitten);
    });
});

// Test: try to save without multiple required fields
// Result: returns an error for each missing field :)
router.get('/saveWithoutNameOrAge', function(req, res) {
    var invalidKitten = new Kitten({});
    invalidKitten.save(function(err, kitten) {
        if (err) {
            res.send(err);
            return;
        }
        res.send(kitten);
    });
});

// Test: try to save an empty string for a required field
// Result: Returns error :)
router.get('/saveEmptyName', function(req, res) {
    var invalidKitten = new Kitten({ name: "", age: 12 });
    invalidKitten.save(function(err, kitten) {
        if (err) {
            res.send(err);
            return;
        }
        res.send(kitten);
    });
});

// Test mongoose validation
// Result: Returns error :)
router.get('/saveNullName', function(req, res) {
    var invalidKitten = new Kitten({ name: null, age: 12 });
    invalidKitten.save(function(err, kitten) {
        if (err) {
            res.send(err);
            return;
        }
        res.send(kitten);
    });
});

// Test mongoose validation
// Result: No error :(
router.get('/saveSpacesForName', function(req, res) {
    var invalidKitten = new Kitten({ name: "  ", age: 12 });
    invalidKitten.save(function(err, kitten) {
        if (err) {
            res.send(err);
            return;
        }
        res.send(kitten);
    });
});

// Test mongoose validation
// Result: No error :(
router.get('/saveSpacesForName', function(req, res) {
    var invalidKitten = new Kitten({ name: "  ", age: 12 });
    invalidKitten.save(function(err, kitten) {
        if (err) {
            res.send(err);
            return;
        }
        res.send(kitten);
    });
});

/*********************** Validation on nested objects **************************/

// Test: First name included but no last name
// Result: no error. Creates person with a first name and no last name :(
router.get('/noLastName', function(req, res) {
    var invalidPerson = new Person({ name: { first: "Keith" } });
    invalidPerson.save(function(err, person) {
        if (err) {
            res.send(err);
            return;
        }
        res.send(person);
    });
});

// Test: No name whatsoever
// Result: error, name is required :)
router.get('/noName', function(req, res) {
    var invalidPerson = new Person({});
    invalidPerson.save(function(err, person) {
        if (err) {
            res.send(err);
            return;
        }
        res.send(person);
    });
});

// CHANGE: Added validation on nameSchema's first and last names

// Test: no last name
// Result: error, name.last is required :)
router.get('/noLastName2', function(req, res) {
    var invalidPerson = new Person({ name: { first: "Keith" } });
    invalidPerson.save(function(err, person) {
        if (err) {
            res.send(err);
            return;
        }
        res.send(person);
    });
});

// CHANGE: remove requirement on name

// Test: see if an error is still thrown due to nested requirements on first and last
// Result: no error :)
router.get('/noName2', function(req, res) {
    var invalidPerson = new Person({});
    invalidPerson.save(function(err, person) {
        if (err) {
            res.send(err);
            return;
        }
        res.send(person);
    });
});

// CHANGE: remove nameSchema and place the following in person schema
/*
name: {
    first: {
        type: String,
        required: true
    },
    last: {
        type: String,
        required: true
    }
}
*/

// Test: see if same result as first and last name being in nameSchema
// Result: two errors thrown, one for first and one for last! :)
router.get('/noName2', function(req, res) {
    var invalidPerson = new Person({});
    invalidPerson.save(function(err, person) {
        if (err) {
            res.send(err);
            return;
        }
        res.send(person);
    });
});

// Conclusion: If you want nested fields to be required, you have two options:
// 1. Leave them in the main schema and add `required` to them
// 2. Move them to their own schema, make them required there, and make their parent required in the main schema, e.g.
/*
name: {
  type: nameSchema,
  required: true
}
*/

/************************** Validation with updates ****************************/

// Test: update a document with fields that don't exist
// Result: success, but does not update anything :/
router.get('/updateValBadFields', function(req, res) {
    Kitten
    .update({}, { color: 'white' }, { runValidators: true })
    .exec(function(err) {
        if (err) {
            res.send(err);
        } else {
            res.send("success - check document in db")
        }
    });
});

// Test: valid update
// Result: success :)
router.get('/updateValValid', function(req, res) {
    Kitten
    .update({}, { age: 3, name: "Mr. Floof" }, { runValidators: true })
    .exec(function(err) {
        if (err) {
            res.send(err);
        } else {
            res.send("success - check document in db")
        }
    });
});

// Test: invalid update
// Result: error :)
router.get('/updateValInvalid', function(req, res) {
    Kitten
    .update({}, { name: "" }, { runValidators: true })
    .exec(function(err) {
        if (err) {
            res.send(err);
        } else {
            res.send("success - check document in db")
        }
    });
});

module.exports = router;
