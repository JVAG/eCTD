$(function(){
    var drugSubs = $("#drugSubsPanel > .panel-heading").data('drugsubsjson');
    for(var i=1; i<drugSubs.length; i++){
        var addBtn = $('div.row.drugSubstance:last > button');
        addNewDrugSubstance(addBtn);
    }
    var drugSubsElements = $("div.row.drugSubstance:not(:last)"); 
    for(var i=0; i<drugSubs.length; i++){
        $(drugSubsElements[i]).find('[name="drugSubsName"]').val(drugSubs[i].Name);
        $(drugSubsElements[i]).find('[name="drugSubsManu"]').val(drugSubs[i].Manufacturer);
        $(drugSubsElements[i]).find('[name="drugSubsFolder"]').val(drugSubs[i].Folder);
    }
});
function addNewDrugSubstance(elem){
    var nextDivHTML = '<div class="row drugSubstance">' +
        $(elem).parent().html() +
        '</div>';
    $(elem).parent().after(nextDivHTML);

    var prevDivHTML = $(elem).parent().prev().html();
    $(elem).parent().html(prevDivHTML);
}

function removeDrugSubs(elem){
    if(!$(elem).parent().data('first')){
        $(elem).parent().remove();
    }
}