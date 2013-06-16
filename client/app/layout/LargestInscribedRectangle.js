'use strict';

define([
    'gl-matrix',
    'underscore',
  ], function(glMatrix, _) {

  var vec2 = glMatrix.vec2;
  var EPSILON = 0.000001;

  function Vertex(x, y) {
    this.position = vec2.fromValues(x, y);
    this.slopeMin = Number.MAX_VALUE;
    this.slopeMax = -Number.MAX_VALUE;
  };
  Vertex.prototype.distance = function(segment) {
    return segment.distance(this.position[0], this.position[1]);
  };
  Vertex.prototype.inside = function(segment) {
    return segment.inside(this.position[0], this.position[1]);
  };

  function Segment(begin, end) {
    var beginP = begin.position, endP = end.position;
    // Determine the plane parameterization of the segment, with a normal
    // rotated 90' to the left. For a polygon given in counter-clockwise
    // order, points inside the polygon will have positive distance to
    // all of the polygon's segments.
    var vector = vec2.subtract(vec2.create(), endP, beginP);
    var normal = vec2.fromValues(-1 * vector[1], vector[0]);
    vec2.scale(normal, normal, 1.0 / vec2.length(normal));

    this.begin = begin;
    this.end = end;
    this.normal = normal;
    this.b = -1 * (beginP[0] * normal[0] + beginP[1] * normal[1]);

    // Determine the (order-invariant) slope of the line this segment defines.
    if (beginP[0] <= endP[0]) {
      this.slope = (endP[1] - beginP[1]) / (endP[0] - beginP[0]);
    } else {
      this.slope = (beginP[1] - endP[1]) / (beginP[0] - endP[0]);
    }
  };
  // Returns the point's distance from the plane parameterized by this segment.
  Segment.prototype.distance = function(x, y) {
    return this.normal[0] * x + this.normal[1] * y + this.b;
  };
  // Returns whether the point is on the 'inside' (positive distance) of the
  // segment's plane parameterization. Distances within EPSILON of the plane
  // are assumed to be rounding error, and considered 'inside' the plane.
  Segment.prototype.inside = function(x, y) {
    return this.distance(x, y) >= -EPSILON;
  };

  function Solver() {
    this.vertices = [];
    this.segments = [];
  };
  Solver.prototype.addVertex = function(x, y) {
    var vertex = new Vertex(x,y);
    var segment;
    if (this.vertices.length != 0) {
      segment = new Segment(_.last(this.vertices), vertex);
    }
    // Convexity checks.
    if (this.segments.length != 0) {
      if (!_.last(this.segments).inside(x, y)) {
        throw new Error('Vertex must be on the inside of the last segment.');
      }
      if (segment && !this.vertices[0].inside(segment)) {
        throw new Error('Initial vertex would be outside of this segment.');
      }
    }
    this.vertices.push(vertex);
    if (segment) {
      this.segments.push(segment);
    }
  };
  Solver.prototype.buildChords = function() {


  };
  Solver.prototype.Vertex = Vertex;
  Solver.prototype.Segment = Segment;

  return Solver;
});
