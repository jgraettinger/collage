'use strict';

define([
  'collage/largest_rectangle/Segment',
], function (Segment) {
  describe('collage/largest_rectangle/Segment', function () {
    it('computes the plane parameterization', function () {
      var segment = new Segment([1, 2], [2, 3]);

      // Points on the plane have a distance of 0.
      expect(segment.distance([-1, 0])).toEqual(0);
      expect(segment.distance([1, 2])).toEqual(0);
      expect(segment.distance([2, 3])).toEqual(0);
      expect(segment.distance([5, 6])).toEqual(0);

      // Points on the LHS of the segment have positive distance.
      expect(segment.distance([4, 10])).toBeCloseTo(3.536, 3);
      expect(segment.distance([4, -10])).toBeCloseTo(-10.607, 3);

      // Segment is X-axis aligned.
      segment = new Segment([0, 1], [1, 1]);
      expect(segment.distance([4, -10])).toBeCloseTo(-11, 3);

      // Segment is Y-axis aligned.
      segment = new Segment([1, 0], [1, 1]);
      expect(segment.distance([4, -10])).toBeCloseTo(-3, 3);
    });
    it('computes inside-ness from the plane parameterization', function () {
      var segment = new Segment([1, 2], [2, 3]);

      // Only points on the LHS of the segment are 'inside'.
      expect(segment.inside([4, 10])).toBeTruthy();
      expect(segment.inside([4, -10])).toBeFalsy();

      // Points on or very near the plane are inside.
      expect(segment.inside([5, 6])).toBeTruthy();
      expect(segment.inside([5, 6.000001])).toBeTruthy();
      expect(segment.inside([5, 5.999999])).toBeTruthy();
    });
    it('determines the slope', function () {
      expect(new Segment([-1, 0], [1, 0]).slope).toEqual(0);
      expect(new Segment([-1, -1], [1, 1]).slope).toEqual(1);
      expect(new Segment([-1, 1], [1, -1]).slope).toEqual(-1);

      // Slope is invariant to order.
      expect(new Segment([1, 0], [-1, 0]).slope).toEqual(0);
      expect(new Segment([1, 1], [-1, -1]).slope).toEqual(1);
      expect(new Segment([1, -1], [-1, 1]).slope).toEqual(-1);

      // Infinite slope cases are properly handled,
      // and are always positive Infinity.
      expect(new Segment([2, -1], [2, 1]).slope).toEqual(Infinity);
      expect(new Segment([-2, 1], [-2, -1]).slope).toEqual(Infinity);
    });
  });
});
