var express = require('express');
var app = express();
var mongodb = require('./routes/mongodb');

app.use('/mongodb', mongodb);

app.get('/', function (req, res) {
  res.send('Hello World!');
});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});
