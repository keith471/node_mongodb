// Uses basic mongodb driver

var express = require('express');
var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectID;
var assert = require('assert');
var router = express.Router();

var url = 'mongodb://localhost:27017/test';

router.get('/test-connection', function(req, res) {
    // Connect to the mongodb instance running at localhost:27017 and switch to the test database
    // The test database need not already exist
    MongoClient.connect(url, function(err, db) {
      assert.equal(null, err);
      console.log("Connected correctly to server.");
      db.close();
      res.send("Done");
    });
});

router.get('/insert', function(req, res) {
    // Connect and insert a document
    MongoClient.connect(url, function(err, db) {
      assert.equal(null, err);
      insertDocument(db, function() {
          db.close();
          res.send("Done");
      });
    });
});

// Define a function to insert a document into the database
var insertDocument = function(db, callback) {
   db.collection('restaurants').insertOne( {
      "address" : {
         "street" : "2 Avenue",
         "zipcode" : "10075",
         "building" : "1480",
         "coord" : [ -73.9557413, 40.7720266 ]
      },
      "borough" : "Manhattan",
      "cuisine" : "Italian",
      "grades" : [
         {
            "date" : new Date("2014-10-01T00:00:00Z"),
            "grade" : "A",
            "score" : 11
         },
         {
            "date" : new Date("2014-01-16T00:00:00Z"),
            "grade" : "B",
            "score" : 17
         }
      ],
      "name" : "Vella",
      "restaurant_id" : "41704620"
   }, function(err, result) {
    assert.equal(err, null);
    console.log("Inserted a document into the restaurants collection.");
    console.log("Insert id: " + result.insertedId);
    callback();
  });
};

router.get('/findAll', function(req, res) {
    MongoClient.connect(url, function(err, db) {
      assert.equal(null, err);
      findRestaurants(db, function() {
          db.close();
          res.send("Done");
      });
    });
});

// Find ALL documents in a collection
var findRestaurants = function(db, callback) {
    // cursor = iterable object that yields documents
   var cursor =db.collection('restaurants').find( );
   cursor.each(function(err, doc) {
      assert.equal(err, null);
      if (doc != null) {
          console.dir(doc);
      } else {
         callback();
      }
   });
};

router.get('/findSome', function(req, res) {
    MongoClient.connect(url, function(err, db) {
      assert.equal(null, err);
      findRestaurantsInManhattan(db, function() {
          db.close();
          res.send("Done");
      });
    });
});

// But maybe we want to provide search criteria...
var findRestaurantsInManhattan = function(db, callback) {
    // borough is a top-level property
   var cursor =db.collection('restaurants').find( { "borough": "Manhattan" } );
   cursor.each(function(err, doc) {
      assert.equal(err, null);
      if (doc != null) {
         console.dir(doc);
      } else {
         callback();
      }
   });
};

router.get('/findAtZipCode', function(req, res) {
    MongoClient.connect(url, function(err, db) {
      assert.equal(null, err);
      findRestaurantsAtZipCode(db, function() {
          db.close();
          res.send("Done");
      });
    });
});

// Searching on nested fields
var findRestaurantsAtZipCode = function(db, callback) {
   var cursor =db.collection('restaurants').find( { "address.zipcode": "10075" } );
   cursor.each(function(err, doc) {
      assert.equal(err, null);
      if (doc != null) {
         console.dir(doc);
      } else {
         callback();
      }
   });
};

router.get('/findWithBGrade', function(req, res) {
    MongoClient.connect(url, function(err, db) {
      assert.equal(null, err);
      findRestaurantsWithBGrade(db, function() {
          db.close();
          res.send("Done");
      });
    });
});

// Searching by things in arrays
// Consider the grades array. It is an array of objects. We can filter for all retaurants that have
// at least one "B" grade as follows
/*
grades:
   [ { date: Tue Sep 30 2014 20:00:00 GMT-0400 (EDT),
       grade: 'A',
       score: 11 },
     { date: Wed Jan 15 2014 19:00:00 GMT-0500 (EST),
       grade: 'B',
       score: 17 } ]
*/
var findRestaurantsWithBGrade = function(db, callback) {
   var cursor =db.collection('restaurants').find( { "grades.grade": "B" } );
   cursor.each(function(err, doc) {
      assert.equal(err, null);
      if (doc != null) {
         console.dir(doc);
      } else {
         callback();
      }
   });
};

module.exports = router;
