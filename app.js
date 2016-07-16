var express = require('express');
var app = express();
var mongodb = require('./routes/mongodb');
var mongoose = require('./routes/mongoose');

app.use('/mongodb', mongodb);
app.use('/mongoose', mongoose);

app.get('/', function (req, res) {
  res.send('Hello World!');
});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});
