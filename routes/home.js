'use strict';

var express = require('express');
var router = express.Router();
var path = require('path');
var fs = require('fs-extra');
var dirToJson = require('dir-to-json');
var multiparty = require('multiparty');
var util = require('util');
var dossiers = require('./dossiers');

const BASE_PATH_MAC = '/Users/snehalindurkar/Desktop/Project eCTD/Dossiers';
const BASE_PATH_WIN = 'C:/eCTD/Dossiers/';
const BASE_PATH = BASE_PATH_WIN;

router.get('/',function(req,res) {
  let homePath = path.join(__dirname,'../views/home.html');
  res.sendFile(homePath);
});

router.get('/dossiers',function(req,res){
  let user = req.session.user;
  dossiers.findAll( {}, {}, function(err,dossiers) {
      res.status(200).json({'user':user,'dossiers':dossiers});
  });
});

router.get('/dossiers/create',function(req,res) {
  let htmlPath = path.join(__dirname,'../views/createDossier.html');
  res.sendFile(htmlPath);
});

router.post('/dossiers/create',function(req,res) {
  var templatePath = path.join(BASE_PATH, 'NEWSUBMISSION');
  var dossierPath = path.join(BASE_PATH, req.body.title);
  if(fs.existsSync(dossierPath)){
    console.log(dossierPath);
    res.status(500).json({error:"Error! A dossier by title " + req.body.title + ' already exists', dossier_path:dossierPath});
  }
  else {
    validateDrugSubstances(req.body.drugSubsName, 
      req.body.drugSubsManu, 
      req.body.drugSubsFolder,
      req.body.title, 
      function(err, drugSubsData){
        if(err) {
          res.status(500).json(err);
        }
        else {
          fs.copy( templatePath, dossierPath , function( err ) {
            if( err ) {
              res.status(500).json(err.message);
            }
            else {
              let dossier = dossiers.createDossierObject(req.body, drugSubsData, req.session.user);
              dossiers.insert(dossier, function(err,resultId){
                if(err){
                  res.status(500).json(err);
                }
                else {
                  res.redirect('/home/dossiers/id/' + resultId);
                }
              });
            }
          });
        }
    });
  }
});

function validateDrugSubstances(name, manufacturer, folder, dossierTitle, callback){
  var data = [];
  if(Array.isArray(name) && Array.isArray(manufacturer) && Array.isArray(folder)){
    for(var i=0; i<name.length; i++){
      if(!validateDrugSubstance(name[i], manufacturer[i], folder[i], dossierTitle)){
        callback("Error- Invalid drug substance data for " + folder[i]);
      }
      else{
        data.push(createDrugSubs(name[i], manufacturer[i], folder[i]));
      }
    }
    callback(null, data);
  }
  else if(validateDrugSubstance(name, manufacturer, folder, dossierTitle)){
    data.push(createDrugSubs(name, manufacturer, folder));
    callback(null, data);
  }
  else {
    callback("Error- Invalid drug substance data for " + folder);
  }
}

function validateDrugSubstance(name, manufacturer, folder, dossierTitle){
  return typeof(name)=='string' && 
    typeof(manufacturer)=='string' && 
    typeof(folder)=='string';
}

function createDrugSubs(name, manufacturer, folder){
  return {
    "Name": name,
    "Manufacturer": manufacturer,
    "Folder": folder
  };
}

router.get('/dossiers/id/:dossierId',function(req,res) {
  let user = req.session.user;
  dossiers.findAll( { user:user, dossierId: req.params.dossierId }, {}, function(err,dossiers) {
      var curDossier = dossiers && dossiers.length && dossiers[0];
      if(!curDossier){
        res.status(500).send('Sorry! Something went wrong. Please try again');
      }
      else {
        res.render('dossierDetails', {'user':user, 'dossier':curDossier });
      }
  });
});

router.get('/dossier/dirtree',function(req,res) {

  function mapChildren(node){
    let newNode = { "id": node.name, "text":node.name };
    if(node.parent)
      newNode["parent"] = node.parent;
    if(node.type == 'file')
      newNode["icon"] = "glyphicon glyphicon-file";
    if(node.children){
        newNode.children = node.children.map(mapChildren);
    }
    return newNode;
  }

  dirToJson(path.join(BASE_PATH, decodeURI(req.query.dossier_title),'0000'), function(err, origTree) {
    if(err) {
      console.log(err);
      res.status(500).send(err.message);
    }
    else {
      var dirTree = origTree.children.map(mapChildren);
      res.send(dirTree);
    }
  });
});

router.get('/dossier/file/:fileName',function(req,res) {
  var fileName = decodeURI(req.params.fileName);
  var dossierPath = decodeURI(req.query.dossierPath);
  var relPath = decodeURI(req.query.relPath);
  var fullPath = path.join(BASE_PATH, dossierPath,'0000',relPath,fileName);
  var options = {
    dotfiles: 'deny',
    headers: {
        'x-timestamp': Date.now(),
        'x-sent': true
    }
  };
  console.log('File ' + fullPath + ' exists- ' + fs.existsSync(fullPath));
  res.sendFile(fullPath, options, function (err) {
    if (err) {
      console.log(err);
    }
  });
});

router.post('/dossier/file/upload', function(req,res){
  var form = new multiparty.Form({uploadDir: 'testuploaddir'});
  form.parse(req, function(err, fields, files){
    if(err){
      console.log(err);
      res.status(500).send(err.message);
    }
    else {
      var targetPath = path.join(BASE_PATH, fields.dossierPath[0],'0000',fields.targetPath[0] );
      var firstError = null;
      for(let file of files["uploadInput"] ){
        validateName(fields.targetPath[0], file.originalFilename, function(error){
          if(error && !firstError){
            firstError = error;
            res.status(500).send(error);
          }
          else {
            let newPath = targetPath + '/' + file.originalFilename;
            let err = fs.renameSync(file.path,newPath);
            if(err && !firstError){
              firstError = err;
              console.log(err);
              res.status(500).send(err.message);
            }
          }
        });
      }
      res.redirect('/home/dossiers/id/' + fields.dossierId[0]);
    }
  });
});

router.post('/dossier/file/newfolder', function(req,res){
  if( !req.body.dossierPath || !req.body.targetPath || !req.body.folderName || !req.body.dossierId  ){
    res.status(500).send('Something went wrong. Try again.');
  }
  else {
    let targetPath = path.join(req.body.dossierPath,'0000',req.body.targetPath );
    let destFolderPath = targetPath + '/' + req.body.folderName;
    if(fs.existsSync(destFolderPath)){
      res.status(500).send('This folder already exists. Delete the old one to make a new one.');
    }
    else {
      fs.mkdir(destFolderPath, function(err){
        if(err){
          console.log(err);
          res.status(500).send(err.message);
        }
        else {
          console.log('Folder created: ' + destFolderPath );
          res.redirect('/home/dossiers/id/' + req.body.dossierId );
        }
      });
    }
  }
});

router.post('/dossier/file/rename', function(req,res){
  if( !req.body.dossierPath || !req.body.targetPath || !req.body.newName || !req.body.dossierId || !req.body.oldName ){
    res.status(500).send('Something went wrong. Try again.');
  }
  else {
    let targetPath = path.join(BASE_PATH, req.body.dossierPath,'0000',req.body.targetPath );
    let dotpos = req.body.oldName.lastIndexOf('.');
    if(dotpos >=0 ){
      let ext = req.body.oldName.substr(dotpos+1);
      if(ext=='pdf'){
        req.body.newName += '.pdf';
      }
    }
    let destFolderPath = targetPath.replace(req.body.oldName, req.body.newName);
    fs.rename(targetPath, destFolderPath, function(err){
      if(err){
        console.log(err);
        res.status(500).send(err.message);
      }
      else {
        console.log('Folder renamed from ' + req.body.oldName + ' to ' + req.body.newName );
        res.redirect('/home/dossiers/id/' + req.body.dossierId );
      }
    });
  }
});

router.post('/dossier/file/delete', function(req,res){
  if( !req.body.dossierPath || !req.body.targetPath || !req.body.dossierId  ){
    res.status(500).send('Something went wrong. Try again.');
  }
  else {
    let targetPath = path.join(BASE_PATH, req.body.dossierPath,'0000',req.body.targetPath );
    if(req.body.isFile=='true'){
      fs.unlink(targetPath, function(err){
        if(err){
          console.log(err);
          res.status(500).send(err.message);
        }
        else {
          console.log('Deleted ' + targetPath);
          res.redirect('/home/dossiers/id/' + req.body.dossierId);
        }
      });
    }
    else {
      fs.rmdir(targetPath, function(err){
        if(err){
          console.log(err);
          res.status(500).send(err.message);
        }
        else {
          console.log('Deleted ' + targetPath);
          res.redirect('/home/dossiers/id/' + req.body.dossierId);
        }
      });
    }
  }
});

router.delete('/dossier/id/:dossierId', function(req,res){
  console.log(req.params.dossierId + ' to delete');
  dossiers.findAll({dossierId:req.params.dossierId}, {'Path':true }, function(err, dossier){
    if(err){
      console.log(err);
      res.status(500).send(err.message);
    }
    else {
      dossiers.delete(req.params.dossierId,function(err,result){
        if(err){
          console.log(err);
          res.status(500).send(err.message);
        }
        else {

          fs.remove(path.join(BASE_PATH, dossier[0].Path), function(err){
            if(err){
              console.log(err);
              res.status(500).send(err.message);
            }
            else {
              console.log('Dossier Deleted');
              res.send('success');
            }
          });
        }
      });
    }
  });
});

function validateName(fullPath, name, callback){
  if( name.includes('.') && !name.endsWith('.pdf') && !name.endsWith('.jpg')){
    callback(name + ': Invalid file format ' + name);
  }
  else if(name.length >= 64){
    callback(name + ': File/folder name should have less than 64 characters');
  }
  else if(path.join(fullPath, name).length >= 230){
    callback(name + ': File/folder path should have less than 230 characters');
  }
  else {
    var str = name.substr(0, name.indexOf('.'));
    var patt1 = /[a-z]|[0-9]|\u002D/g;
    var result = str.match(patt1);
    if(result.length != str.length){
      callback(name + ': File/folder name can contain only letters [a-z], digits [0-9] and hyphen [-]');
    }
    else {
      callback();
    }
  }
}

module.exports = router;
