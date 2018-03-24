'use strict';

var express = require('express');
var router = express.Router();
var path = require('path');
var fs = require('fs-extra');
var dirToJson = require('dir-to-json');
var util = require('util');
var dossiers = require('./dossiers');

router.get('/dossier/:id',function(req,res) {
    let user = req.session.user;
    dossiers.findAll( { user:user, dossierId: req.params.id }, {}, function(err,dossiers) {
        var curDossier = dossiers && dossiers.length && dossiers[0];
        if(!curDossier){
          res.status(500).send('Sorry! Something went wrong. Please try again');
        }
        else {
          res.render('edit_dossier', {'user':user, 'dossier':curDossier });
        }
    });
});

router.post('/dossier/:id', function(req, res){
    let user = req.session.user;
    res.render('edit_dossier', {'user':user, 'dossier':req.body });
});

module.exports = router;