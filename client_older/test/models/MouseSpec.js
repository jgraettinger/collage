'use strict';

define([
    'models/Mouse',
  ], function(Mouse) {
  describe('MouseTests', function() {

    it('initializes to the mouse OUT state', function() {
      var mouse = new Mouse();
      expect(mouse.state).toEqual(mouse.StateEnum.OUT);
      expect(mouse.offsetX).toEqual(0);
      expect(mouse.offsetY).toEqual(0);
      expect(mouse.buttons).toEqual(0);
    });

    it('updates from mouseover events', function() {
      var mouse = new Mouse();

      mouse.processEvent(
        {type: 'mouseover',
         clientX: 150,
         clientY: 160,
         buttons: 0}, 10, 15);

      expect(mouse.state).toEqual(mouse.StateEnum.OVER);
      expect(mouse.offsetX).toEqual(140);
      expect(mouse.offsetY).toEqual(145);
    });
  });
});
