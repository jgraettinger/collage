define([
    'largest_rectangle/Segment',
], function (Segment) {
  'use strict';

  describe('Model', function () {
    it('characterizes member segments within the polygon', function () {

      var verticies = [
        [-1.0, 1.0],
        [-1.0, -1.0],
        [0.5, -1.2],
        [1.0, 1.0]
      ];

      var segment = new Segment([1, 2], [2, 3]);

      // Points on the plane have a distance of 0.
      expect(segment.distance(-1, 0)).toEqual(0);
      expect(segment.distance(1, 2)).toEqual(0);
      expect(segment.distance(2, 3)).toEqual(0);
      expect(segment.distance(5, 6)).toEqual(0);

      // Points on the LHS of the segment have positive distance.
      expect(segment.distance(4, 10)).toBeCloseTo(3.536, 3);
      expect(segment.distance(4, -10)).toBeCloseTo(-10.607, 3);
    });
    it('computes inside-ness from the plane parameterization', function () {
      var segment = new Segment([1, 2], [2, 3]);

      // Only points on the LHS of the segment are 'inside'.
      expect(segment.inside(4, 10)).toBeTruthy();
      expect(segment.inside(4, -10)).toBeFalsy();

      // Points on or very near the plane are inside.
      expect(segment.inside(5, 6)).toBeTruthy();
      expect(segment.inside(5, 6.000001)).toBeTruthy();
      expect(segment.inside(5, 5.999999)).toBeTruthy();
    });
    it('determines the slope', function () {
      var slope = function (p0, p1) {
        return new Segment([p0[0], p0[1]], [p1[0], p1[1]]).slope;
      };
      expect(slope([-1, 0], [1, 0])).toEqual(0);
      expect(slope([-1, -1], [1, 1])).toEqual(1);
      expect(slope([-1, 1], [1, -1])).toEqual(-1);

      // Slope is invariant to order.
      expect(slope([1, 0], [-1, 0])).toEqual(0);
      expect(slope([1, 1], [-1, -1])).toEqual(1);
      expect(slope([1, -1], [-1, 1])).toEqual(-1);

      expect(slope([1, 1], [1, 3])).toEqual(Infinity);
    });
  });
}
