'use strict';

var express = require('express');
var mongojs = require('mongojs');
var db = mongojs('ectd',['dossiers']);

module.exports.findAll = function(query, fields, callback) {
  if( query.dossierId ) {
    let ObjectId = mongojs.ObjectId;
    query = { _id: ObjectId(query.dossierId) };
  }
  else {
    query = {};
  }
  db.dossiers.find(query, fields, function(err, dossiers){
    if(err){
      console.log(err);
      callback(err);
    }
    else {
      if( Object.keys(fields).length == 0 || ( Object.keys(fields).length>0 && fields.Sequences ) ){
        dossiers = dossiers.map(function(dossier){
          console.log(dossier.Sequences);
          dossier["Current Sequence"] = dossier.Sequences[dossier.Sequences.length-1];
          return dossier;
        });
      }
      callback(null, dossiers);
    }
  });
};

module.exports.insert = function(dossier, callback ){
  db.dossiers.insert(dossier, function(err,result) {
    callback(err,result["_id"]);
  });
};

module.exports.delete = function(dossierId, callback){
  let ObjectId = mongojs.ObjectId;
  let query = { _id: ObjectId(dossierId) };
  db.dossiers.remove(query, function(err,result){
    callback(err,result);
  });
};

module.exports.createDossierObject = function(reqBody, drugSubsData, user){
  return {
    "Title":reqBody.title,
    "Description":reqBody.description,
    "Path":reqBody.title,
    "Region":reqBody.region,
    "Drug Substance":drugSubsData,
    "Drug Product":reqBody.drugProdBrandName + " (" + reqBody.drugProdGenericName + ")",
    "Product Manufacturer":reqBody.drugProdManu,
    "Product Category":reqBody.drugProdCategory,
    "Dosage Form":reqBody.dosageForm,
    "Customer":reqBody.customer,
    "Onwer":user,
    "Creation Date":new Date(),
    "Due Date":new Date(reqBody.dueDate),
    "Sequences": ['0000'],
    "Last Modified By":user,
    "Last Modified On":new Date(),
    "Status":reqBody.Status,
    "Application Type":reqBody.applicationType
  };
};
