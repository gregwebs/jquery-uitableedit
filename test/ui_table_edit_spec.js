// note that the same error should be seen several times
/*td.find("input:text").get(0) has no properties
[Break on this error] function focus_text(){ td.find('input:text').get(0).focus() }
*/
// this is from a thread that is created to focus the input field after a small delay
// for the user.  In testing, we are moving much faster than the delay
Screw.Unit(function() {

  describe('uiTableEdit', function() {
    var  t = $('#testtable')
    var td = t.find("tbody > tr:first > td:first")
    
    after(function(){
      expect($.uiTableEdit(t, {off : true})).to(equal,t)
    });

    // need to check total number of assertions
    /// to verify that callbacks are happening
    it("should call callbacks", function(){
      expect($.uiTableEdit(t, {
        dataVerify : function(){
          expect( $(this).find(':text').val() ).to(equal, "turtle")
        },
        mouseDown : function(){
          expect( $(this).text() ).to(equal, "turtle")
        },
        editDone : function(a,b){
          expect(a).to(equal, b)
        }
      })).to(equal, t)

      td.mousedown().mousedown()
    });

    it("should make the table editable", function(){
      expect( $.uiTableEdit(t) ).to(equal, t)
      expect( td.mousedown().find(":text").val() ).to(equal, "turtle")
      td.find(":text").val("turt")
      td.mousedown()
      expect( td.text() ).to(equal, "turt")
      expect( td.mousedown().find(":text").val() ).to(equal, "turt")
      td.find(":text").val("turtle")
      td.mousedown()
      expect(td.text()).to(equal, "turtle")
    });
  });
});
