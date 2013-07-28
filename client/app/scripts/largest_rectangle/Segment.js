'use strict';

angular.module('collage.largest_rectangle.Segment', [
  'vendor',
  'collage.largest_rectangle.Constants'
])
  .factory('collage.largest_rectangle.Segment', [
    'vendor.gl-matrix.vec2',
    'collage.largest_rectangle.Constants.EPSILON',
    function (vec2, EPSILON) {

      function Segment(begin, end) {
        // Determine the plane parameterization of the segment, with a normal
        // rotated 90' to the left. For a polygon given in counter-clockwise
        // order, points inside the polygon will have positive distance to
        // all of the polygon's segments.
        var vector = [end[0] - begin[0], end[1] - begin[1]],
          normal = [-1 * vector[1], vector[0]];
        vec2.scale(normal, normal, 1.0 / vec2.length(normal));

        this.vector = vector;
        this.begin = begin;
        this.end = end;

        this.normal = normal;
        this.b = -1 * (begin[0] * normal[0] + begin[1] * normal[1]);

        // Determine the (order-invariant) slope of the line this segment defines.
        if (begin[0] < end[0] || (begin[0] === end[0] && end[1] > begin[1])) {
          this.slope = (end[1] - begin[1]) / (end[0] - begin[0]);
        } else {
          this.slope = (begin[1] - end[1]) / (begin[0] - end[0]);
        }
      }
      /** Returns the point's distance from the plane parameterized by this segment.
       */
      Segment.prototype.distance = function (v) {
        return this.normal[0] * v[0] + this.normal[1] * v[1] + this.b;
      };
      /** Returns whether the point is on the 'inside' (positive distance) of the
       * segment's plane parameterization. Distances within EPSILON of the plane
       * are assumed to be rounding error, and considered 'inside' the plane.
       */
      Segment.prototype.inside = function (v) {
        return this.distance(v) >= -EPSILON;
      };
      return Segment;
    }
  ]);
