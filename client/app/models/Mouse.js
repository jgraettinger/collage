'use strict';

define([], function() {
  var StateEnum = {
    OUT: {value: 0, name: "Mouse Out"},
    OVER: {value: 1, name: "Mouse Over"},
  };

  function Mouse() {
    this.state = StateEnum.OUT;
    this.offsetX = 0;
    this.offsetY = 0;
    this.buttons = 0;
  };
  Mouse.prototype.StateEnum = StateEnum;

  Mouse.prototype.processEvent = function(event, relativeLeft, relativeTop) {
    switch(event.type) {
      case 'mouseover':
        this.state = StateEnum.OVER;
        break;
      case 'mouseout':
        this.state = StateEnum.OUT;
        break;
    };

    // Ideally we'd use offsetX/Y directly here. Firefox doesn't support it,
    // so require that the target element's getBoundingClientRect().left/top
    // be passed in.
    //var rect = (event.target || event.srcElement).getBoundingClientRect();
    this.offsetX = event.clientX - relativeLeft;
    this.offsetY = event.clientY - relativeTop;

    this.buttons = event.buttons;
  };
  return Mouse;
});
