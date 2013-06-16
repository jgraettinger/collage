'use strict';

define([
    'gl-matrix',
    'layout/LargestInscribedRectangle',
  ], function(glMatrix, Solver) {

  var vec2 = glMatrix.vec2;
  var Vertex = Solver.prototype.Vertex;
  var Segment = Solver.prototype.Segment;

  describe('Vertex', function() {
    it('populates position', function() {
      var vertex = new Vertex(1.0, 2.0);
      expect(vertex.position).toEqual(vec2.fromValues(1.0, 2.0));
    });
    it('delegates distance', function() {
      var segment = new Segment(new Vertex(1, 2), new Vertex(1, 3));
      expect(new Vertex(0, 4).distance(segment)).toEqual(1);
      expect(new Vertex(2, 5).distance(segment)).toEqual(-1);
    });
  });
  describe('Segment', function() {
    it('computes the plane parameterization', function() {
      var segment = new Segment(new Vertex(1, 2), new Vertex(2, 3));

      // Points on the plane have a distance of 0.
      expect(segment.distance(-1, 0)).toEqual(0);
      expect(segment.distance(1, 2)).toEqual(0);
      expect(segment.distance(2, 3)).toEqual(0);
      expect(segment.distance(5, 6)).toEqual(0);

      // Points on the LHS of the segment have positive distance.
      expect(segment.distance(4, 10)).toBeCloseTo(3.536, 3);
      expect(segment.distance(4, -10)).toBeCloseTo(-10.607, 3);
    }); 
    it('computes inside-ness from the plane parameterization', function() {
      var segment = new Segment(new Vertex(1, 2), new Vertex(2, 3));

      // Only points on the LHS of the segment are 'inside'.
      expect(segment.inside(4, 10)).toBeTruthy();
      expect(segment.inside(4, -10)).toBeFalsy();

      // Points on or very near the plane are inside.
      expect(segment.inside(5, 6)).toBeTruthy();
      expect(segment.inside(5, 6.000001)).toBeTruthy();
      expect(segment.inside(5, 5.999999)).toBeTruthy();
    });
    it('determines the slope', function() {
      var slope = function(p0, p1) {
        return new Segment(new Vertex(p0[0], p0[1]),
                           new Vertex(p1[0], p1[1])).slope;
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
  describe('Solver', function() {
    it('accepts a convex polygon', function() {
      var solver = new Solver();
      solver.addVertex(-1, 1);
      solver.addVertex(-1, -1);
      solver.addVertex(1, -1);
      solver.addVertex(0.5, -0.5);
      // Note this is on the plane of the last segment.
      solver.addVertex(0, 0);
    });

    it('refuses a concave polygon', function() {
      var solver = new Solver();
      solver.addVertex(1, 0);
      solver.addVertex(1, -1);
      expect(function() {solver.addVertex(0, -2);}).toThrow(
        'Vertex must be on the inside of the last segment.');

      solver = new Solver();
      solver.addVertex(-1, 1);
      solver.addVertex(-1, -1);
      solver.addVertex(1, -1);
      solver.addVertex(1, 1);
      expect(function() {solver.addVertex(0, 0.9);}).toThrow(
        'Initial vertex would be outside of this segment.')
    });

  });
});

