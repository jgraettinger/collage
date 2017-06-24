'use strict';

define([
    'collage/largest_rectangle/Transform',
    'collage/largest_rectangle/largest-rectangle',
], function (Transform, largestRectangle) {
  describe('collage/largest_rectangle/largest-rectangle', function () {
    it('solves stuff', function () {
      var transform = Transform.basic().resize(1024, 768).rotateX(Math.PI / 9);

      largestRectangle(transform);

    });
  });
});
