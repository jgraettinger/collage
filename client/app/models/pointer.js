'use strict';

define([
    'gl-matrix',
    'underscore',
], function (glMatrix, _) {
  var vec2 = glMatrix.vec2;
  
  function Pointer() {
    this._tick = 0;

    this.inProgressDrag = undefined;
    this.completedDrag = undefined;
    this.presses = {};

    this._digest = undefined;
  };
  Pointer.LEFT_BUTTON = 0;
  Pointer.RIGHT_BUTTON = 2;
  Pointer.MIDDLE_BUTTON = 1;

  Pointer.prototype.processEvent = function (event) {
    this._tick += 1;

    switch (event.type) {
    case 'mousedown':
      this.presses[event.button] = {
        tick: this._tick,
        clientX: event.clientX,
        clientY: event.clientY,
      };
      break;
    case 'mouseup':
      var press = this.presses[event.button];

      var travel = vec2.distance(
          vec2.fromValues(press.clientX, press.clientY),
          vec2.fromValues(event.clientX, event.clientY));

      if (event.button != Pointer.LEFT_BUTTON || travel < 5) {
        this.click = {
          tick: this._tick,
          button: event.button,
          clientX: press.clientX,
          clientY: press.clientY,
        };
      } else {
        this.completedDrag = {
          tick: this._tick,
          beginClientX: press.clientX,
          beginClientY: press.clientY,
          endClientX: event.clientX,
          endClientY: event.clientY,
        };
      }

      this.presses[event.button] = undefined;
      this.inProgressDrag = undefined;
      break;
    case 'mousemove':
      var press = this.presses[Pointer.LEFT_BUTTON];

      if (press) {
        var travel = vec2.distance(
            vec2.fromValues(press.clientX, press.clientY),
            vec2.fromValues(event.clientX, event.clientY));

        if (travel < 5) {
          this.inProgressDrag = null;
        } else {
          this.inProgressDrag = {
            tick: this._tick,
            beginClientX: press.clientX,
            beginClientY: press.clientY,
            endClientX: event.clientX,
            endClientY: event.clientY,
          }
        }
      }
      break;
    case 'mouseleave':
      if (this.inProgressDrag) {
        this.inProgressDrag = null;
      }
      break;
    };

    // Ideally we'd use offsetX/Y directly here. Firefox doesn't support it,
    // so require that the target element's getBoundingClientRect().left/top
    // be passed in.
    //var rect = (event.target || event.srcElement).getBoundingClientRect();
    //this.offsetX = event.clientX;
    //this.offsetY = event.clientY;

    if (this._digest) {
      this._digest();
    }
  };
  Pointer.prototype.bindTo = function (element) {
    _.each([
        'mousedown',
        'mouseup',
        'mousemove',
        'mouseleave',
    ], function (eventName) {
      element.bind(eventName, _.bind(this.processEvent, this));
    }, this);
  };
  Pointer.prototype.setOwningScope = function (scope) {
    this._digest = _.bind(scope.$digest, scope);
  };
  return Pointer;
});
