/*
 * Copyright (c) 2008 Greg Weber greg at gregweber.info
 * Dual licensed under the MIT and GPL licenses
 *
 * jquery plugin
 * make an html table editable by the user
 *   user clicks on a cell, edits the value,
 *   then presses enter or clicks on any cell to save the new value
 *   pressing escape returns the cell text to its orignal text
 *
 * documentation at http://gregweber.info/projects/uitableedit
 * 
 * var t = $('table')
 * $.uiTableEdit( t ) // returns t
 *
 * options : off, mouseDown, find, dataEntered, dataVerify, editDone
 *   off : turns off table editing
 *   find : defaults to tbody > tr > td
 *   mousedown : called in context of the table cell (as a normal event would be)
 *     if mouseDown returns false, cell will not become editable
 *   dataVerify : called in context of the cell,
 *     if dataVerify returns false, cell will stay in editable state
 *     if dataVerify returns text, that text will replace the cell's text
 *     arguments are the cell's text, original text, event, jquery object for the cell
 *   editDone : invoked on completion
 *     arguments: td cell's new text, original text, event, and jquery element for the td cell
*/
jQuery.uiTableEdit = function(jq, options){
  function unbind(){
    return jq.find( options.find ).die('mousedown.uiTableEdit');
  }
  options = options || {}
  options.find = options.find || 'tbody > tr > td'
  if( options.off ){
    unbind().find('form').each( function(){ var f = $(this);
      f.parents("td:first").text( f.find(':text').attr('value') );
      f.remove();
    });
    return jq;
  }

  function bind_mouse_down( mouseDn ){
    unbind().live('mousedown.uiTableEdit', mouseDn );
  }
  function td_edit(){
    var td = jQuery(this);

    function restore(e){
      var val = td.find(':text').attr('value')
      if( options.dataVerify ){
        var value = options.dataVerify.call(td, val, orig_text, e);
        if( value === false ){ return false; }
        if( value !== null && value !== undefined ) val = value;
      }
      td.empty().text( val );
      td.css( orig_css );
      if( options.editDone ) options.editDone(val,orig_text,e,td)
      bind_mouse_down( td_edit_wrapper );
    }

    function checkEscape(e){
      if (e.keyCode === 27) {
        td.empty().text( orig_text );
        // gmiranda: restore style
        td.css( orig_css );
      if (e.keyCode === 9 && !e.shiftKey) {
		restore();
        var next = td.nextAll('.editable:visible:first');
		if (next.length>0) {
			next.trigger('mousedown');
		}
		// check for next in the next row
		else {
			next = td.parent().next().children('td.editable:visible:first');
			if (next.length>0) {
				next.trigger('mousedown');
			}
		}
      }
      else if (e.shiftKey) {
		restore();
        var prev = td.prevAll('.editable:visible:first');
		if (prev.length>0) {
			prev.trigger('mousedown');
		}
		// check for next in the prev row
		else {
			prev = td.parent().prev().children('td.editable:visible:last');
			if (prev.length>0) {
				prev.trigger('mousedown');
			}
		}
      }
        bind_mouse_down( td_edit_wrapper );
      }
    }

    var orig_text = td.text();
    // gmiranda <gmiranda@lsi.upc.edu> {: save the original style, too.
    var w = td.width();
    var h = td.height();
    // I keep the new style in this object to copy the keys that we need to
    // restore later on.
    var new_css = {width: w + "px", height: h + "px", padding: "0", margin: "0"};
    var orig_css = new Object();
    for( var propertyName in new_css ){
      var value = td.css( propertyName );
      orig_css[ propertyName ] = value;
    }
    td.css( new_css );
    // }gmiranda
    td.html( '<form name="td-editor" action="javascript:void(0);">' +
      '<input type="text" name="td_edit" value="' +
    td.text() + '"' + ' style="margin:0px;padding:0px;border:0px;width: ' +
      w  + 'px;">' + '</input></form>' )
      .find('form').submit( restore ).mousedown(restore).blur( restore ).keypress( checkEscape );
	$('input', td).blur( restore );

    function focus_text(){ td.find('input:text').get(0).focus() }

    // focus bug (seen in FireFox) fixed by small delay
    setTimeout(focus_text, 50);

    /* TODO: investigate removing bind_mouse_down
     I also got rid of bind_mouse_down(restore),
     because now that you can refocus on fields that have been blurred,
     you can have multiple edits going simultaneously
    */
    bind_mouse_down( restore );
  }

  var td_edit_wrapper = !options.mouseDown ? td_edit : function(){
    if( options.mouseDown.apply(this,arguments) == false ) return false;
    td_edit.apply(this,arguments);
  };
  bind_mouse_down( td_edit_wrapper );
  return jq;
}
