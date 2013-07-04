'use strict';

define([
    'gl-matrix',
    'layout/LargestInscribedRectangle',
  ], function(glMatrix, Solver) {

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

