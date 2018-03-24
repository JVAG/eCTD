$(function(){
   
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