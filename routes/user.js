'use strict';

var express = require('express');
var router = express.Router();
var fs = require('fs');
var mongojs = require('mongojs');
var db = mongojs('ectd',['users']);

router.get('/', function(req,res){
  db.users.find({},{}, function(err, users){
    if(err){
      console.log(err);
    }
    else {
      res.render('users',{
        user: req.session.user,
        users:users
      });
    }
  });
});

router.post('/login', function(req,res){
  let user = {"Email":req.body.email, "Password":req.body.password };
  db.users.findOne(user, function(err, result) {
    if(err) {
      res.render('index',{
        err:err.message
      });
    }
    else if(!result){
      res.render('index',{
        err:'Invalid username or password'
      });
    }
    else {
      req.session.user = result
      res.redirect('/home');
    }
  });
});

router.post('/register', function(req,res){
  let user = {
    "First Name": req.body.firstName,
    "Last Name": req.body.lastName,
    "Email": req.body.email,
    "Password": req.body.password,
    "User Role": req.body.role
  };
  db.users.insert(user, function(err,result){
    if(err){
      console.log(err);
      res.render('index',{
        err:err.message
      });
    }
    else {
      req.session.user = user;
      res.status(200).send(user);
    }
  });
});

router.get('/:userId', function(req,res){
  var ObjectId = mongojs.ObjectId;
  db.users.findOne({ "_id": ObjectId(req.params.userId) }, function(err, result) {
    if(err){
      console.log(err);
      res.end(err.message);
    }
    else {
      res.end(JSON.stringify(result));
    }

  });
});

router.delete('/:userId', function(req,res){
  res.send('User DELETE ' + req.method);
});

/* Utility Functions */
function getProps(obj) {
  let arr = [];
  for( let key in obj ){
    if( typeof obj[key] != 'function' && typeof obj[key] != 'object' ){
      arr.push(key + ':' + obj[key]);
    }
  }
  return arr;
}

module.exports = router;
