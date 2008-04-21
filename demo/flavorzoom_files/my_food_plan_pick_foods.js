$(function() { 
  var theTable = $('table.food_planner')

  theTable.find("tbody > tr").mousedown(function(){
    $(this).find(":checkbox").click()
  });

  $("#filter").keyup(function() {
    $.uiTableFilter( theTable, this.value );
  })

  $('#filter-form').submit(function(){
    theTable.find("tbody > tr:visible:first").mousedown();
  }).focus(); //Give focus to input field
});  
