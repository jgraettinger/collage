'use strict';

angular.module('collage.largest_rectangle.Solver', [
  'collage.largest_rectangle.Constants',
  'collage.largest_rectangle.Solution',
  'vendor',
])
  .factory('collage.largest_rectangle.Solver', [
    'collage.largest_rectangle.Constants.EPSILON',
    'collage.largest_rectangle.Solution',
    'vendor.gl-matrix.mat2',
    'vendor.gl-matrix.mat3',
    'vendor.gl-matrix.mat4',
    'vendor.gl-matrix.vec2',
    'vendor.gl-matrix.vec3',
    'vendor.gl-matrix.vec4',
    'vendor.numericjs',
    'vendor.underscore',
    function (epsilon, Solution, mat2, mat3, mat4, vec2, vec3, vec4,
      numeric, _) {

      function generalizedInverse(system) {
        var svd = numeric.svd(system),
          tmp = numeric.transpose(svd.U),
          cutoff = svd.S[0] * epsilon;
        for (var i = 0; i !== svd.S.length; ++i) {
          var s = 0;
          if (svd.S[i] > cutoff) {
            s = 1.0 / svd.S[i];
          } else {
            s = 0;
          }
          for (var j = 0; j !== tmp[i].length; ++j) {
            tmp[i][j] *= s;
          }
        }
        return numeric.dot(svd.V, tmp);
      }

      function Solver() {
        this.solutions = [];
      }
      Solver.prototype.isUnitBounded = function (p) {
        return p > -epsilon && p < 1.0 + epsilon;
      };
      /** Attempts to find a solution with corners on four line segments.
       *
       * @param {Segment} ll Segment bounding the lower-left solution corner.
       * @param {Segment} lr Segment bounding the lower-right solution corner.
       * @param {Segment} ur Segment bounding the upper-right solution corner.
       * @param {Segment} ul Segment bounding the upper-left solution corner.
       */
      Solver.prototype.find4L = function (ll, lr, ur, ul) {
        // Create a system which finds points on ll, lr, ur, and ul such that
        // left and right segment points are each other's projection along
        // the X axis, and upper and lower segments are each other's projection
        // along the Y axis.
        var system = [
          // Fix ll.y = lr.y
          [ll.vector[1], -lr.vector[1], 0, 0],
          // Fix lr.x = ur.x
          [0, lr.vector[0], -ur.vector[0], 0],
          // Fix ur.y = ul.y
          [0, 0, ur.vector[1], -ul.vector[1]],
          // Fix ul.x = ll.x
          [-ll.vector[0], 0, 0, ul.vector[0]],
        ];
        var offsets = [
          lr.begin[1] - ll.begin[1],
          ur.begin[0] - lr.begin[0],
          ul.begin[1] - ur.begin[1],
          ll.begin[0] - ul.begin[0],
        ];
        var parameters = numeric.dot(generalizedInverse(system), offsets);

        // Require parameterizations to fall in [0, 1].
        if (!_.all(parameters, this.isUnitBounded)) {
          return;
        }
        var v1 = [0, 0],
          v2 = [0, 0];
        vec2.lerp(v1, ll.begin, ll.end, parameters[0]);
        vec2.lerp(v2, ur.begin, ur.end, parameters[2]);
        this.solutions.push(new Solution(v1, v2, '4L'));
      };
      /** Attempts to find a solution with corners on three line segments.
       *
       * Arguments l1, l2, and l3 describe sequential Segments, upon each of which
       * a solution corner will lay. l1 and l3 must be roughly parallel, while
       * l2 is roughly orthogonal to both.
       *
       * @param {Segment} l1 Segment bounding a solution corner.
       * @param {Segment} l2 Segment bounding a solution corner.
       * @param {Segment} l3 Segment bounding a solution corner.
       */
      Solver.prototype.find3L = function (l1, l2, l3) {
        // If l2 has negative slope, we want to project along X to l1 rather than Y.
        // The linear system used here projects along Y to l1, so flip them.
        if (l2.slope < 0) {
          var t = l1;
          l1 = l3;
          l3 = t;
        }

        var slopeMax, slopeMin;
        if (Math.abs(l1.slope) > Math.abs(l3.slope)) {
          slopeMax = l1.slope;
          slopeMin = l3.slope;
        } else {
          slopeMax = l3.slope;
          slopeMin = l1.slope;
        }
        // Compute the slope of the largest inscribed rectangle, which is a
        // function of the slopes of l1, l2, and l3. See Lemma 2.3 of "Computing
        // the largest inscribed isothetic rectangle", Alt et all.
        var targetSlope = -slopeMax * (slopeMin - l2.slope) / (slopeMax -
          l2.slope);

        // Create a system which finds a point on l2, and projects it along the
        // Y-axis to l1 and X-axis to l3, such that the line formed by the l1, l3
        // projections form a solution with slope targetSlope.
        var system = [
          // Fix l1.y = l2.y
          [l1.vector[1], -l2.vector[1], 0],
          // Fix l2.x = l3.x
          [0, l2.vector[0], -l3.vector[0]],
          // Fix l3.y = l1.y + slope * (l2.x - l1.x)
          [l1.vector[1] - l1.vector[0] * targetSlope,
            l2.vector[0] * targetSlope, -l3.vector[1]
          ],
        ],
          offsets = [
            l2.begin[1] - l1.begin[1],
            l3.begin[0] - l2.begin[0],
            l3.begin[1] - l1.begin[1] - l2.begin[0] * targetSlope + l1.begin[
              0] *
            targetSlope,
          ];
        var parameters = numeric.dot(generalizedInverse(system), offsets);

        // Require parameterizations to fall in [0, 1].
        if (!_.all(parameters, this.isUnitBounded)) {
          return;
        }
        // Parameterzations on l1 and l3 describe opposite corners of the solution.
        var v1 = [0, 0],
          v2 = [0, 0];
        vec2.lerp(v1, l1.begin, l1.end, parameters[0]);
        vec2.lerp(v2, l3.begin, l3.end, parameters[2]);
        this.solutions.push(new Solution(v1, v2, '3L'));
      };
      /* Attempts to find a solution with corners on a vertex and two segments.
       *
       * The argument vertex is projected along the X and Y-axis onto l1 and l2
       * to form a solution.
       *
       * @param {vec2} v Vertex fixing a solution corner.
       * @param {Segment} l1 Segment bounding a solution corner.
       * @param {Segment} l2 Segment bounding a solution corner.
       */
      Solver.prototype.findV2L = function (v, l1, l2) {
        // Identify which line is more-aligned with the X-axis, and which with Y.
        var lx, ly;
        if (Math.abs(l1.slope) < Math.abs(l2.slope)) {
          lx = l1;
          ly = l2;
        } else {
          lx = l2;
          ly = l1;
        }
        // Project from v to lx, and from lx to ly.
        var s1tx = (v[0] - lx.begin[0]) / lx.vector[0];
        var s1ty = (lx.vector[1] * s1tx + lx.begin[1] - ly.begin[1]) /
          ly.vector[1];
        // Project from v to ly, and from ly to lx.
        var s2ty = (v[1] - ly.begin[1]) / ly.vector[1];
        var s2tx = (ly.vector[0] * s2ty + ly.begin[0] - lx.begin[0]) /
          lx.vector[0];

        var v2 = [0, 0];
        // Solution projected from v to lx to ly.
        if (this.isUnitBounded(s1tx) && this.isUnitBounded(s1ty)) {
          vec2.lerp(v2, ly.begin, ly.end, s1ty);
          this.solutions.push(new Solution(v, v2, 'V2Lvxy'));
        }
        // Solution projected from v to ly to lx.
        if (this.isUnitBounded(s2ty) && this.isUnitBounded(s2tx)) {
          vec2.lerp(v2, lx.begin, lx.end, s2tx);
          this.solutions.push(new Solution(v, v2, 'V2Lvyx'));
        }
        // Solution projected from v to lx, and from v to ly.
        if (this.isUnitBounded(s1tx) && this.isUnitBounded(s2ty)) {
          var v3 = [0, 0];
          vec2.lerp(v2, lx.begin, lx.end, s1tx);
          vec2.lerp(v3, ly.begin, ly.end, s2ty);
          this.solutions.push(new Solution(v2, v3, 'V2Lvxvy'));
        }
      };
      /* Attempts to find a solution with diagonal corners on a vertex and one
       * segment.
       *
       * @param {vec2} v Vertex fixing a solution corner.
       * @param {Segment} l1 Segment bounding a solution corner.
       */
      Solver.prototype.findV1L = function (v, l1) {
        // The largest rectangle will have a slope equal to the
        // negative slope of l1. Create a system to find the
        // parametized intersection of l1 and the line formed from
        // v with such a slope.
        var system = mat2.create();
        system[0] = 1;
        system[2] = -l1.vector[0];

        system[1] = l1.slope;
        system[3] = l1.vector[1];
        mat2.invert(system, system);

        var offsets = vec2.create();
        offsets[0] = l1.begin[0] - v[0];
        offsets[1] = v[1] - l1.begin[1];

        var parameters = vec2.create();
        vec2.transformMat2(parameters, offsets, system);

        if (this.isUnitBounded(parameters[1])) {
          var v2 = vec2.create();
          vec2.lerp(v2, l1.begin, l1.end, parameters[1]);
          this.solutions.push(new Solution(v, v2, 'V1L'));
        }
      };
      /* Attempts to find a solution with diagonal corners fixed by two verticies.
       *
       * @param {vec2} v1 Vertex fixing a solution corner.
       * @param {vec2} v2 Vertex fixing a solution corner.
       */
      Solver.prototype.find2V = function (v1, v2) {
        this.solutions.push(new Solution(v1, v2, '2V'));
      };
      /* Finds all potential solutions, by enumerating every combination of
       * vertices and segments which could form a largest incribed rectangle.
       *
       * @param {Model} model Model describing the polygon.
       */
      Solver.prototype.findPotentialSolutions = function (model) {
        var ll = model.lowerLeftChain,
          lr = model.lowerRightChain,
          ur = model.upperRightChain,
          ul = model.upperLeftChain;
        // Look for a 4-segment solution.
        if (ll.length === 1 && lr.length === 1 &&
          ur.length === 1 && ul.length === 1) {
          this.find4L(ll[0], lr[0], ur[0], ul[0]);
        }
        // Look for a 3-segment solution by checking each permutation of
        // three consecutive chains in the characterization.
        _.each([
          [ll, lr, ur],
          [ll, ur, ul],
          [ll, lr, ul],
          [lr, ur, ul],
          [ur, ul, ll],
          [ul, ll, lr],
        ], function (chains) {
          var c1 = chains[0],
            c2 = chains[1],
            c3 = chains[2];
          for (var i = 0; i !== c1.length; ++i) {
            for (var j = 0; j !== c2.length; ++j) {
              for (var k = 0; k !== c3.length; ++k) {
                this.find3L(c1[i], c2[j], c3[k]);
              }
            }
          }
        }, this);
        // Look for a 1-vertex, 1-line solution between opposing chains.
        _.each([
          [ll, ur],
          [ur, ll],
          [lr, ul],
          [ul, lr],
        ], function (chains) {
          var c1 = chains[0],
            c2 = chains[1];
          if (c1.length !== 2) {
            return;
          }
          var v = model.midpoint(c1);
          for (var i = 0; i !== c2.length; ++i) {
            this.findV1L(v, c2[i]);
          }
        }, this);
        // Look for a 2-vertex solution between two opposing chains of length 2, or
        // a 1-vertex / 2-segment solution between the middle vertex of a length-2
        // chain, and two opposing chains.
        var byLength = [ll, lr, ur, ul];
        byLength.sort(function (c1, c2) {
          return c2.length - c1.length;
        });
        if (byLength[0].length === 2) {
          var v1 = model.midpoint(byLength[0]);
          if (byLength[1].length === 2) {
            // Look for a 2-vertex solution between these chain midpoints.
            var v2 = model.midpoint(byLength[1]);
            this.find2V(v1, v2);
          } else {
            // Look for a 1-vertex, 2-segment solution.
            this.findV2L(v1, byLength[1][0], byLength[2][0]);
          }
        }
      };
      return Solver;
    }
  ]);
