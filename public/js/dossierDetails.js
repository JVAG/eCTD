
$(document).ready(function() {

  let dossierTitle = JSON.parse($("#hiddenJSON").html());
  let url = '/home/dossier/dirtree?' + $.param({'dossier_title' : encodeURI(dossierTitle) });
  $('#dossier_tree').jstree({
    "core":{
      "data": {
        "url":url,
      }
    },
    "search": {
      "case_insensitive": true,
      "show_only_matches" : true
    },
    "contextmenu": {
      "items" :customMenu
    },
    "plugins":[ "search","contextmenu"]
  });

  $('#dossier_tree').on("changed.jstree", function (e, data) {
    if( data.node.original.icon ) {
      var fileName = data.selected[0];
      var relPath = data.node.original.parent;
      var fileurl = '/home/dossier/file/'+encodeURI(fileName) + '?';
      fileurl += $.param({
        'dossierPath': encodeURI(dossierPath),
        'relPath': encodeURI(relPath)
      });
      $('#currentPdf').attr('src',fileurl);
    }
  });

  $("#search-input").keyup(function(){
    var searchStr = $(this).val();
    $('#dossier_tree').jstree('search',searchStr);
  });

  $('#prepValidate').click(function(){
    var dossierstr = $(this).attr('data-dossier');
    var url = '/validate/dossier/' + $(this).data('dossierid');
    $.ajax(url,{
      method:'POST',
      data: { "dossierstr": dossierstr },
      dataType:'xml',
    }).done(function(data, status){
      console.log('In success ', status, data);
    }).fail(function(req, status, error){
      alert(status + ': ' + error);
      console.log(status, req.responseText);
    });
  });

  $('#show_edit').click(function(){
    if($('.edit_form').css('display')=='block'){
      $('.edit_form').slideUp(function(){
        $('#pdf_container').removeClass('col-sm-6');
        $('#pdf_container').addClass('col-sm-9');
      });
    }
    else {
      $('#pdf_container').removeClass('col-sm-9');
      $('#pdf_container').addClass('col-sm-6');
      $('.edit_form').slideDown();
    }
  });
  
});

function customMenu(node){
  var items = {
    "upload": {
      "label":"Upload File(s)",
      "action": function(obj) {
        let nodeId = obj && obj.reference && obj.reference[0] && obj.reference[0].text;
        let nodeObj = $('#dossier_tree').jstree().get_node(nodeId);
        console.log(obj, nodeObj);
        let targetPath = '';
        if( typeof(nodeObj.icon) == 'string' ){
          // Target is a file. Upload option will be removed
        }
        else {
          targetPath = $('#dossier_tree').jstree().get_path(nodeObj.id,'/');
        }
        $("#targetPath4").val(targetPath);
        $("#launch4").trigger('click');
        sessionStorage.selectedNode = nodeId;
      },
      "separator_after":true
    },
    "create": {
      "label":"New Folder",
      "action": function(obj) {
        let nodeId = obj && obj.reference && obj.reference[0] && obj.reference[0].text;
        let nodeObj = $('#dossier_tree').jstree().get_node(nodeId);
        let targetPath = '';
        if( typeof(nodeObj.icon) == 'string' ){
          // Target is a file. Upload option will be removed
        }
        else {
          targetPath = $('#dossier_tree').jstree().get_path(nodeObj.id,'/');
        }
        $("#targetPath2").val(targetPath);
        $("#launch2").trigger('click');
        sessionStorage.selectedNode = nodeId;
      }
    },
    "rename": {
      "label":"Rename",
      "action": function(obj) {
        let nodeId = obj && obj.reference && obj.reference[0] && obj.reference[0].text;
        let nodeObj = $('#dossier_tree').jstree().get_node(nodeId);
        let targetPath = $('#dossier_tree').jstree().get_path(nodeObj.id,'/');
        $("#oldName").val(nodeObj.id);
        $("#targetPath3").val(targetPath);
        $("#launch3").trigger('click');
        sessionStorage.selectedNode = nodeId;
      }
    },
    "delete": {
      "label":"Delete",
      "action": function(obj) {
        let nodeId = obj && obj.reference && obj.reference[0] && obj.reference[0].text;
        let nodeObj = $('#dossier_tree').jstree().get_node(nodeId);
        let targetPath = $('#dossier_tree').jstree().get_path(nodeObj.id,'/');
        let isFile = typeof(nodeObj.icon) == 'string' ? 'true' : 'false';
        $("#isFile").val(isFile);
        $("#targetPath1").val(targetPath);
        $("#launch1").trigger('click');
        sessionStorage.selectedNode = nodeId;
      }
    }
  };
  if(isFile(node)){
    delete items["upload"];
    delete items["create"];
  }
  return items;
}

function isFile(node) {
  return typeof(node.icon) == 'string';
}
