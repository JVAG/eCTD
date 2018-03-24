$(function() {
  $.get('/home/dossiers',function(data) {
    if(data.user){
      $('#welcome').html('Welcome, ' + data.user["First Name"]);
      $('#userProfileLink').attr('href','user/'+data.user["_id"]);
    }
    if( data.dossiers.length == 0 ){
      $('#ErrorNoDossiers').css('display','block');
      $('#dossierTable').css('display','none');
    }
    else {
      let allKeys = Array.from(Object.keys(data.dossiers[0]));
      let displayKeys = [
        "Title",
        "Current Sequence",
        "Status",
        "Drug Product",
        "Last Modified By",
        "Last Modified On",
        "Due Date",
        "Customer"
      ];
      for(let k=0; k<displayKeys.length; k++){
        let th = '<th>' + displayKeys[k] + '</th>'
        $('#headRow').append(th);
      }
      for( let r=0; r<data.dossiers.length; r++ ) {
        $('#rows').append('<tr></tr>');
        for( let k=0; k<displayKeys.length; k++ ) {
          let cellContent = getCellContent(displayKeys[k], data.dossiers[r][displayKeys[k]]);
          let td = '<td>' +  cellContent  + '</td>';
          let lastRow = $('#rows tr:last-child').append(td);
        }
        let dossierId = data.dossiers[r]._id;
        $('#rows tr:last-child').append('<td><a href="/home/dossiers/id/' + dossierId + '" class="btn btn-success">Open</a></td>');
        $('#rows tr:last-child').append('<td><a href="/update/dossier/' + dossierId + '" class="btn btn-warning">Edit</a></td>');
        $('#rows tr:last-child').append('<td><button class="btn btn-danger" onclick="deleteDossier(`' + dossierId + '`)">Delete</button></td>');
      }

      deleteDossier = function(dossierId) {
        if(dossierId){
          let delOk = confirm('Do you really want to delete the selected dossier?');
          if(delOk){
            $.ajax({
              url:'/home/dossier/id/'+dossierId,
              type:'DELETE',
              success:function(result){
                console.log('Deleted ', result);
                window.location = '/home';
              }
            });
          }
        }
      };
    }
  });
});

function getCellContent(key, cellValue){
  if( key == 'Due Date' || key == 'Last Modified On' ){
    return new Date(cellValue).toLocaleString();
  }
  else if(key == 'Last Modified By'){
    return cellValue['First Name'] + ' ' + cellValue['Last Name'];
  }
  else if(key == 'Status'){
    return cellValue;
  }
  else {
    return cellValue;
  }
}
