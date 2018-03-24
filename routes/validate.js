'use strict'
var express = require('express');
var router = express.Router();
var path = require('path');
var fs = require('fs-extra');
var XMLWriter = require('xml-writer');
var dirToJson = require('dir-to-json');
var dossiers = require('./dossiers');
var folderMapLoader = require('./folderMapLoader.js');
var foldermap = null;

const BASE_PATH_MAC = '/Users/snehalindurkar/Desktop/Project eCTD/Dossiers';
const BASE_PATH_WIN = 'C:/Dossiers/';
const BASE_PATH = BASE_PATH_WIN;

const DTD_FILE_DEV = "file:///Users/snehalindurkar/Desktop/Project eCTD/Dossiers/test2/0000/util/dtd/ich-ectd-3-2.dtd";
const DTD_FILE_PROD = "util/dtd/ich-ectd-3-2.dtd";
const DTD_FILE = DTD_FILE_PROD;

router.post('/dossier/:id',function(req,res) {
  //   var drugSubsFolderPath = path.join(BASE_PATH, dossierTitle, 'm3/32-body-data/32s-drug-sub', folder);
  var dossier = JSON.parse(req.body.dossierstr);
  var curSequence = dossier["Current Sequence"];
  foldermap = folderMapLoader.getFolderMap(dossier["Drug Substance"]);
  var xmlPath = path.join(BASE_PATH, dossier.Title, curSequence, 'index.xml');
  var dirPath = path.join(BASE_PATH, dossier.Title, curSequence);

  var ws = fs.createWriteStream(xmlPath);
  ws.on('close', function(){
    res.sendFile(xmlPath);
  });
  var xml = new XMLWriter(true, function(string, encoding){
    ws.write(string,encoding);
  });
  var attrs = [];
  attrs.push( new XmlAttribute("xmlns:ectd", "http://www.ich.org/ectd") );
  attrs.push( new XmlAttribute("xmlns:xlink", "http://www.w3c.org/1999/xlink") );
  attrs.push( new XmlAttribute( "dtd-version", 3.2 ) );
  xml.startDocument('1.0', 'UTF-8');
  xml.writeDocType('ectd:ectd', null, DTD_FILE);
  writeXmlElement( xml, "ectd:ectd", null, attrs, false );

  dirToJson(dirPath, function(err, treeRoot){
    if(err) {
      console.log(err);
      res.status(500).send(err.message);
    }
    else {
      var ctdPromise = new Promise(function(resolve, reject){
        /* Process M1 module */
        resolve(1);
      });

      ctdPromise.then(function(value){
        processNode(treeRoot.children[1],curSequence);
        return 2;
      }).then(function(value){
        processNode(treeRoot.children[2],curSequence);
        return 3;
      }).then(function(value){
        processNode(treeRoot.children[3],curSequence);
        return 4;
      }).then(function(value){
        processNode(treeRoot.children[4],curSequence);
        return 5;
      }).then(function(value){
        console.log('Then', value);
        xml.endElement();
        xml.endDocument();
        ws.end();
      }).catch(function(err){
        console.log(err);
        ws.end();
      })
    }
  });

  function processNode(treeNode, curSequence) {
    let elemkey = treeNode.path.split("\\").join("/");
    if(foldermap.has(elemkey)) {
      if(treeNode.children.length) {
        /* start directory element() */
        var attributes = [];
        if(elemkey=='m3/32-body-data/32s-drug-sub') {
          attributes.push(new XmlAttribute("substance", foldermap.get(elemkey).subsName));
          attributes.push(new XmlAttribute("manufacturer", foldermap.get(elemkey).subsManu));
        }
        writeXmlElement( xml, foldermap.get(elemkey).element, null, attributes, false );

        /* Iterate through children */
        for(var i=0; i<treeNode.children.length; i++){
          var node = treeNode.children[i];
          if(node.type=='directory'){
            processNode(node, curSequence)
          }
          else {
            if(node.path.endsWith('pdf')){
              writeLeaf(xml, node.path.split("\\").join("/"), curSequence);
            }
          }
          if(i==treeNode.children.length-1){ //After Last Node is processed, execute this code
            xml.endElement();
          }
        }
      }
      else {
        /* start and end directory element with No children */
        writeXmlElement( xml, foldermap.get(elemkey).element , null, [], true );
      }
    }
  }
});

var XmlAttribute = function(name, value) {
  this.name =  name;
  this.value = value;
};

var writeXmlElement = function( xmlWriter, name, content, attrArray, doClose ) {
  xmlWriter.startElement(name);
  for( var i in attrArray ) {
      xmlWriter.writeAttribute( attrArray[i].name, attrArray[i].value );
  }
  if( content ) {
      xmlWriter.text(content);
  }
  if( doClose && doClose == true ) {
    xmlWriter.endElement();
  }
};

var writeLeaf = function( xmlWriter, pathKey, curSequence ) {
  let leafId = createLeafId(pathKey, curSequence);
  try{
    var leafTitle = foldermap.get(pathKey).title;
  }
  catch(ex){
    console.log(ex, pathKey, foldermap.get(pathKey));
  }
  var attrs = [];
  attrs.push( new XmlAttribute("ID",leafId) );
  if(parseInt(curSequence) === 0 ) {
    attrs.push( new XmlAttribute("operation","new") );
  }
  else{
    attrs.push( new XmlAttribute("operation","") );
    attrs.push( new XmlAttribute("modified-file","") );
  }
  attrs.push( new XmlAttribute("xlink:type","simple") );
  attrs.push( new XmlAttribute("checksum-type","md5") );
  attrs.push( new XmlAttribute("checksum",1) );
  attrs.push( new XmlAttribute("xlink:href",pathKey) );
  attrs.push( new XmlAttribute("application-version","PDF 1.4") );
  attrs.push( new XmlAttribute("xmlns:xlink","http://www.w3c.org/1999/xlink") );
  attrs.push( new XmlAttribute("font-library","") );
  attrs.push( new XmlAttribute("keywords","") );
  attrs.push( new XmlAttribute("xlink:role","") );
  attrs.push( new XmlAttribute("xlink:show","new") );
  attrs.push( new XmlAttribute("xml:lang","en") );
  attrs.push( new XmlAttribute("xlink:actuate","onLoad") );
  writeXmlElement( xmlWriter, 'leaf', null, attrs, false );
  writeXmlElement( xmlWriter, 'title', leafTitle, [], true );
  xmlWriter.endElement();
}

function createLeafId(str, seq) {
  let res = '';
  str = str.substring(0,str.indexOf('.'));
  let parts = str.split('/');
  res += parts[parts.length-1];
  for(let i=parts.length-2; i>=0; i--){
    res += parts[i].substring(0,3);
  }
  res += '_' + parseInt(seq)
  return res;
}

module.exports = router;
