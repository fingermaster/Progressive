


// Local Storage
$("#save-search").on("click", function() {
    var i = window.localStorage.length;
    var val = $(".save-search-input").val();
    var storeName = "searchItem" + [i++];
    localStorage.setItem(storeName, val);
});

$("#open-saved-searches").on("click", function() { 
  $(".saved-search-list-dialog").velocity("fadeIn", { duration: 500 });
  $(".result-neutral").velocity("transition.bounceIn", 500);
  if (!window.localStorage.length) { $("#saved-searches").append("<li>No searches stored.</li>");}  
  for (var i = 0; i < localStorage.length; i++){
        ct = localStorage.getItem('searchItem'+[i]);
        $("#saved-searches").append("<li>" + ct + "</li>");
 }
});
$("#clear-list").on("click", function() {
  $("#saved-searches").html("");
});



// Move rows to and from schedule tables
$(document).ready(function() {

    clearLoader();

    $(".filtered tbody").on("click","tr.filtered-row td:last-child", function() {
      var tr = $(this).closest("tr").velocity("transition.slideLeftOut", 750).remove().clone();
      $(tr).appendTo(".ranked tbody").velocity("transition.slideLeftIn", 750);
    });
    $('.ranked tbody').on("click","tr.filtered-row td:last-child", function() {
      var tr = $(this).closest("tr").remove().clone();
      $(tr).appendTo(".filtered tbody").velocity("transition.slideRightIn", 750);
    }); 

    $(".all-schedules tbody").on("click","tr.all-row td:last-child", function() {
      var tr = $(this).closest("tr").remove().clone();
      $(tr).appendTo(".ranked tbody").velocity("transition.slideLeftIn", 750);
      //.velocity("fadeIn", {delay: 100, duration: 500});
    });
    $('.ranked tbody').on("click","tr.all-row td:last-child", function() {
      var tr = $(this).closest("tr").remove().clone();
      $(tr).appendTo(".all-schedules tbody").velocity("transition.slideRightIn", 750);
    }); 
});

$(".ranked-row").hover().find("i").addClass("rotateIcon");



$(".openPrintable").click(function(){
  window.open('print-me.html');
  return false;
});


$(function () { $('table').footable(); });
  

// Spinner
var loader = $(".loading");
loader.velocity({
    rotateZ: "360"
}, {
    duration: 1000,
    loop: true
});
// Function to remove the loader
function clearLoader() {
      $(".overlay").velocity({
          opacity: 0,
          duration: 500
      }, {
          display: "none"
      });
      loader.velocity('stop');
}
// Spinner END

// Close Any (starts-with-"result") Dialog on ESC or X-click
function closeAny() {
    $("div[class*='result-']").velocity("transition.bounceOut", 500);
    $(".overlay").velocity("fadeOut", {delay: 500, duration: 250});
}
$(document).keydown(function(e) {
    if (e.keyCode == 27) {
       closeAny();
       clearLoader();
    }
});


// Overlays
$("#save-results").on("click", function () {
    $(".save-results-dialog").velocity("fadeIn", { duration: 500 });
    $(".result-positive").velocity("transition.bounceIn", 500);
});
$("#clear-results").on("click", function () {
    $(".clear-results-dialog").velocity("fadeIn", { duration: 500 });
    $(".result-negative").velocity("fadeIn");
    $(".result-negative").velocity("callout.shake");
});
$("#open-save-search").on("click", function () {
    $(".save-search-dialog").velocity("fadeIn", { duration: 500 });
    $(".result-neutral").velocity("transition.bounceIn", 500);
});
// $("#saved-searches").on("click", function () {
//     $(".saved-search-list-dialog").velocity("fadeIn", { duration: 500 });
//     $(".result-neutral").velocity("transition.bounceIn", 500);
// });

$(".close-overlay").on("click", function () {
  closeAny();
});

// Open Choose Day Overlay
$(".day-add").on("click", function () {
    $(".day-add-dialog").velocity("fadeIn", { duration: 500 });
    $(".result-neutral").velocity("transition.bounceIn", 500);
});
// Open Type Overlay
$(".type-add").on("click", function () {
    $(".type-add-dialog").velocity("fadeIn", { duration: 500 });
    $(".result-neutral").velocity("transition.bounceIn", 500);
});
$("#close-type, #save-type, #close-type, #save-type").on("click", function () {
  // TODO: If #close - clear day choices first
  closeAny();
});
$("#close-days-off, #save-search").on("click", function () {
  // TODO: If #close - clear day choices first
  closeAny();
});

// $("div[id^='opt-']").prop( "checked", false );



//------------------------------------------------------
// Add days to list and uncheck the dialog checks
$("label[for^='opt-']").each(function (i,e) {
  normalizeLabel(e);
});
function normalizeLabel(e) {
  $(e).click(function() {
      var w = $(this).attr('for') + '-on';
      var k = w.toString();
      $("div[id='"+k+"']").toggle();  
   });
}
// Add/Remove Day / Type
$(".day-remove, .type-remove").on("click", function () {
    var findId = $(this).parent("div").attr("id").substr(0, 7);
    $("label[for='"+findId+"']").siblings("input").prop( "checked", false );
    $(this).parent("div").css("display", "none");
});
//------------------------------------------------------


//Temp clear loader
$(".loading").on("click", function () {
  clearLoader();
});


// Add/Remove Day Off Filter
$("#add-day-off").on("click", function () {
    $(this).addClass("disabled");
    $(".day-off-container").velocity("transition.expandIn", 500);
    $(this).prop("disabled", true);
});
$(".day-off-container .remove-filter").on("click", function () {
    $(".day-off-container").velocity("transition.expandOut", 500);
    $("#add-day-off").prop("disabled", false).removeClass("disabled");
});

// Add/Remove Type Filter
$("#add-type").on("click", function () {
    $(this).addClass("disabled");
    $(".type-container").velocity("transition.expandIn", 500);
    $(this).prop("disabled", true);
});
$(".type-container .remove-filter").on("click", function () {
    $(".type-container").velocity("transition.expandOut", 500);
    $("#add-type").prop("disabled", false).removeClass("disabled");
});

// Add/Remove Start Filter
$("#add-start").on("click", function () {
    $(this).addClass("disabled");
    $(".start-container").velocity("transition.expandIn", 500);
    $(this).prop("disabled", true);
});
$(".start-container .remove-filter").on("click", function () {
    $(".start-container").velocity("transition.expandOut", 500);
    $("#add-start").prop("disabled", false).removeClass("disabled");
});

// Add/Remove End Filter
$("#add-end").on("click", function () {
    $(this).addClass("disabled");
    $(".end-container").velocity("transition.expandIn", 500);
    $(this).prop("disabled", true);
});
$(".end-container .remove-filter").on("click", function () {
    $(".end-container").velocity("transition.expandOut", 500);
    $("#add-end").prop("disabled", false).removeClass("disabled");
});

$("#reset-all").on("click", function () {
    $(".day-off-container, .type-container, .start-container, .end-container").velocity("transition.expandOut", 500);
    $("#add-end, #add-start, #add-type, #add-day-off").prop("disabled", false).removeClass("disabled");
});




