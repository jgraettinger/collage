define([
    'gl-matrix',
    'numeric',
    'underscore',
    'largest_rectangle/Solution',
], function (glMatrix, numeric, _, Solution) {
  'use strict';

  var mat4 = glMatrix.mat4,
    vec2 = glMatrix.vec2,
    vec4 = glMatrix.vec4,
    EPSILON = 1e-10;

  function generalizedInverse(system) {
    var svd = numeric.svd(system),
        tmp = numeric.transpose(svd.U),
        cutoff = svd.S[0] * EPSILON;
    for (var i = 0; i != svd.S.length; ++i) {
      var s = 0;
      if (svd.S[i] > cutoff) {
       s = 1.0 / svd.S[i];
      } else {
        s = 0;
      }
      for (var j = 0; j != tmp[i].length; ++j) {
        tmp[i][j] *= s;
      }
    }
    return numeric.dot(svd.V, tmp);
  }

  function Solver() {
    this.solutions = [];
  }
  Solver.prototype.isUnitBounded = function (p) {
    return p > -EPSILON && p < 1.0 + EPSILON;
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
    var v1 = vec2.create(),
      v2 = vec2.create();
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
    var targetSlope = -slopeMax * (slopeMin - l2.slope) / (slopeMax - l2.slope);

    // Create a system which finds a point on l2, and projects it along the
    // Y-axis to l1 and X-axis to l3, such that the line formed by the l1, l3
    // projections form a solution with slope targetSlope.
    var system = mat3.create();
    // Fix l1.y = l2.y
    system[0] = l1.vector[1];
    system[3] = -l2.vector[1];
    system[6] = 0;

    // Fix l2.x = l3.x
    system[1] = 0;
    system[4] = l2.vector[0];
    system[7] = -l3.vector[0];

    // Fix l3.y = l1.y + slope * (l2.x - l1.x)
    system[2] = l1.vector[1] - l1.vector[0] * targetSlope;
    system[5] = l2.vector[0] * targetSlope;
    system[8] = -l3.vector[1];
    mat3.invert(system, system);

    var offsets = vec3.create();
    offsets[0] = l2.begin[1] - l1.begin[1];
    offsets[1] = l3.begin[0] - l2.begin[0];
    offsets[2] = l3.begin[1] - l1.begin[1] - l2.begin[0] * targetSlope + l1
      .begin[
      0] * targetSlope;

    var parameters = vec3.create();
    vec3.transformMat3(parameters, offsets, system);

    // Require parameterizations to fall in [0, 1].
    if (!_.all(parameters, this.isUnitBounded)) {
      return;
    }
    // Parameterzations on l1 and l3 describe opposite corners of the solution.
    var v1 = vec2.create(),
      v2 = vec2.create();
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
    var s1ty = (lx.vector[1] * s1tx + lx.begin[1] - ly.begin[1]) / ly.vector[
      1];
    // Project from v to ly, and from ly to lx.
    var s2ty = (v[1] - ly.begin[1]) / ly.vector[1];
    var s2tx = (ly.vector[0] * s2ty + ly.begin[0] - lx.begin[0]) / lx.vector[
      0];

    var v2 = vec2.create();
    if (this.isUnitBounded(s1tx) && this.isUnitBounded(s1ty)) {
      vec2.lerp(v2, ly.begin, ly.end, s1ty);
      this.solutions.push(new Solution(v, v2, 'V2Lxy'));
    }
    if (this.isUnitBounded(s2ty) && this.isUnitBounded(s2tx)) {
      vec2.lerp(v2, lx.begin, lx.end, s2tx);
      this.solutions.push(new Solution(v, v2, 'V2Lyx'));
    }
    if (this.isUnitBounded(s1tx) && this.isUnitBounded(s2ty)) {
      var v3 = vec3.create();
      vec2.lerp(v2, lx.begin, lx.end, s1tx);
      vec2.lerp(v3, ly.begin, ly.end, s2ty);
      this.solutions.push(new Solution(v2, v3, 'V2Lyx'));
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
  return Solver;
});
