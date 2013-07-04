'use strict';

var EPSILON = 0.0001;

function Solution(cornerOne, cornerTwo, solver) {
  this.xMin = Math.min(cornerOne[0], cornerTwo[0]);
  this.xMax = Math.max(cornerOne[0], cornerTwo[0]);
  this.yMin = Math.min(cornerOne[1], cornerTwo[1]);
  this.yMax = Math.max(cornerOne[1], cornerTwo[1]);
  this.area = (this.xMax - this.xMin) * (this.yMax - this.yMin);
  this.slope = (this.yMax - this.yMin) / (this.xMax - this.xMin);
  this.solver = solver;
}

function Segment(begin, end) {
  // Determine the plane parameterization of the segment, with a normal
  // rotated 90' to the left. For a polygon given in counter-clockwise
  // order, points inside the polygon will have positive distance to
  // all of the polygon's segments.
  var vector = vec2.subtract(vec2.create(), end, begin);
  var normal = vec2.fromValues(-1 * vector[1], vector[0]);
  vec2.scale(normal, normal, 1.0 / vec2.length(normal));

  this.vector = vector;
  this.begin = begin;
  this.end = end;

  this.normal = normal;
  this.b = -1 * (begin[0] * normal[0] + begin[1] * normal[1]);

  // Determine the (order-invariant) slope of the line this segment defines.
  if (begin[0] <= end[0]) {
    this.slope = (end[1] - begin[1]) / (end[0] - begin[0]);
  } else {
    this.slope = (begin[1] - end[1]) / (begin[0] - end[0]);
  }
}

// Returns the point's distance from the plane parameterized by this segment.
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

function Model(vertices) {
  if (vertices.length != 4) {
    throw new Error('Expected four verticies');
  }
  var segments;
  if (new Segment(vertices[0], vertices[1]).inside(vertices[2])) {
    // Vertices are already in counter-clockwise order.
    segments = [
      new Segment(vertices[0], vertices[1]),
      new Segment(vertices[1], vertices[2]),
      new Segment(vertices[2], vertices[3]),
      new Segment(vertices[3], vertices[0])
    ];
  } else {
    // Verticies are in reverse (clockwise) order.
    segments = [
      new Segment(vertices[0], vertices[3]),
      new Segment(vertices[3], vertices[2]),
      new Segment(vertices[2], vertices[1]),
      new Segment(vertices[1], vertices[0])
    ];
  }
  this.lowerLeftChain = [];
  this.lowerRightChain = [];
  this.upperRightChain = [];
  this.upperLeftChain = [];
  for (var i = 0; i != segments.length; ++i) {
    var s = segments[i];
    // Use slope and the segment vector to characterize
    // which chain the segment falls into.
    if (s.slope <= 0) {
      if (s.vector[0] > 0) {
        this.lowerLeftChain.push(s);
      } else {
        this.upperRightChain.push(s);
      }
    } else {
      if (s.vector[1] > 0) {
        this.lowerRightChain.push(s);
      } else {
        this.upperLeftChain.push(s);
      }
    }
  }
}
Model.prototype.midpoint = function (chain) {
  if (chain[0].end === chain[1].begin) {
    return chain[0].end;
  } else {
    return chain[1].end;
  }
};
Model.prototype.boundaryTest = function (solution) {
  var check = function (point, chain) {
    for (var i = 0; i != chain.length; ++i) {
      if (!chain[i].inside(point)) {
        return false;
      }
    }
    return true;
  };
  return check([solution.xMin, solution.yMin], this.lowerLeftChain) &&
    check([solution.xMax, solution.yMin], this.lowerRightChain) &&
    check([solution.xMax, solution.yMax], this.upperRightChain) &&
    check([solution.xMin, solution.yMax], this.upperLeftChain);
};

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
  var system = mat4.create();
  // Fix ll.y = lr.y
  system[0] = ll.vector[1];
  system[4] = -lr.vector[1];
  system[8] = 0;
  system[12] = 0;

  // Fix lr.x = ur.x
  system[1] = 0;
  system[5] = lr.vector[0];
  system[9] = -ur.vector[0];
  system[13] = 0;

  // Fix ur.y = ul.y
  system[2] = 0;
  system[6] = 0;
  system[10] = ur.vector[1];
  system[14] = -ul.vector[1];

  // Fix ul.x = ll.x
  system[3] = -ll.vector[0];
  system[7] = 0;
  system[11] = 0;
  system[15] = ul.vector[0];
  mat4.invert(system, system);

  var offsets = vec4.create();
  offsets[0] = lr.begin[1] - ll.begin[1];
  offsets[1] = ur.begin[0] - lr.begin[0];
  offsets[2] = ul.begin[1] - ur.begin[1];
  offsets[3] = ll.begin[0] - ul.begin[0];

  var parameters = vec4.create();
  vec4.transformMat4(parameters, offsets, system);

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
  offsets[2] = l3.begin[1] - l1.begin[1] - l2.begin[0] * targetSlope + l1.begin[
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
  var s1ty = (lx.vector[1] * s1tx + lx.begin[1] - ly.begin[1]) / ly.vector[1];
  // Project from v to ly, and from ly to lx.
  var s2ty = (v[1] - ly.begin[1]) / ly.vector[1];
  var s2tx = (ly.vector[0] * s2ty + ly.begin[0] - lx.begin[0]) / lx.vector[0];

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

function draw(canvas, context, timeStamp) {

  var rotate = quat.create();
  quat.rotateX(rotate, rotate, timeStamp * 0.4);
  quat.rotateY(rotate, rotate, timeStamp * 0.5);
  quat.rotateZ(rotate, rotate, timeStamp * 0.6);
  quat.rotateZ(rotate, rotate, 0.05);
  var translate = vec3.fromValues(0, 0, -10);

  var mvMatrix = mat4.create();
  mat4.fromRotationTranslation(mvMatrix, rotate, translate);

  var pMatrix = mat4.create();
  mat4.perspective(pMatrix, Math.PI / 7, canvas.width / canvas.height, -1, -10);

  context.clearRect(0, 0, canvas.width, canvas.height);

  var corners = [
    vec4.fromValues(-1.0, 1.4, 0, 1),
    vec4.fromValues(-1.0, -1.4, 0, 1),
    vec4.fromValues(1.0, -1.4, 0, 1),
    vec4.fromValues(1.0, 1.4, 0, 1),
  ];

  var first = true;
  for (var i = 0; i != corners.length; ++i) {
    var v = corners[i];
    vec4.transformMat4(v, v, mvMatrix);
    vec4.transformMat4(v, v, pMatrix);
    vec4.scale(v, v, -1.0 / v[3]);
    v[0] = (0.5 + v[0] / 2.0) * canvas.width;
    v[1] = (0.5 + v[1] / 2.0) * canvas.height;
  }

  var model = new Model(corners);

  var drawChain = function (color, chain) {
    context.strokeStyle = color;
    for (var i = 0; i != chain.length; ++i) {
      var l = chain[i];
      context.beginPath();
      context.moveTo(l.begin[0], canvas.height - l.begin[1]);
      context.lineTo(l.end[0], canvas.height - l.end[1]);
      context.closePath();
      context.stroke();
      //console.log(chain[i]);
    }
  };
  drawChain('#FF0000', model.lowerLeftChain);
  drawChain('#00FF00', model.lowerRightChain);
  drawChain('#0000FF', model.upperRightChain);
  drawChain('#FF00FF', model.upperLeftChain);

  var solver = new Solver();

  var ll = model.lowerLeftChain,
    lr = model.lowerRightChain,
    ur = model.upperRightChain,
    ul = model.upperLeftChain;

  // Look for a 4-segment solution.
  if (ll.length == 1 && lr.length == 1 && ur.length == 1 && ul.length == 1) {
    solver.find4L(ll[0], lr[0], ur[0], ul[0]);
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
    for (var i = 0; i != c1.length; ++i) {
      for (var j = 0; j != c2.length; ++j) {
        for (var k = 0; k != c3.length; ++k) {
          solver.find3L(c1[i], c2[j], c3[k]);
        }
      }
    }
  });

  // Look for a 1-vertex, 1-line solution between opposing chains.
  _.each([
    [ll, ur],
    [ur, ll],
    [lr, ul],
    [ul, lr],
  ], function (chains) {
    var c1 = chains[0], c2 = chains[1];
    if (c1.length != 2) {
      return;
    }
    var v = model.midpoint(c1);
    for (var i = 0; i != c2.length; ++i) {
      solver.findV1L(v, c2[i]);
    }
  });

  var byLength = [ll, lr, ur, ul];
  byLength.sort(function (c1, c2) {
    return c2.length - c1.length;
  });

  if (byLength[0].length == 2) {
    var v1 = model.midpoint(byLength[0]);
    if (byLength[1].length == 2) {
      // Look for a 2-vertex solution between these chain midpoints.
      var v2 = model.midpoint(byLength[1]);
      solver.find2V(v1, v2);
    } else {
      // Look for a 1-vertex, 2-line solution.
      solver.findV2L(v1, byLength[1][0], byLength[2][0]);
    }
  }

  var solutions = _.filter(solver.solutions, model.boundaryTest, model);

  var plotSolution = function (s, color) {
    //console.log(s);
    context.strokeStyle = color;
    context.beginPath();
    context.moveTo(s.xMin, canvas.height - s.yMin);
    context.lineTo(s.xMax, canvas.height - s.yMin);
    context.lineTo(s.xMax, canvas.height - s.yMax);
    context.lineTo(s.xMin, canvas.height - s.yMax);
    context.lineTo(s.xMin, canvas.height - s.yMin);
    context.stroke();
  };
  solutions.sort(function (a, b) {
    return b.area - a.area;
  });
  if (solutions.length > 1) {
    plotSolution(solutions[1], '#dddddd');
  }
  plotSolution(solutions[0], '#000000');

  //_.each(solutions, function(s) {
  //  console.log(s);
  //});
}

function main() {
  var canvas = document.getElementById("test");
  var context = canvas.getContext('2d');

  context.fillStyle = '#FF0000';
  context.fillRect(100, 100, 200, 200);

  var drawLoop;
  drawLoop = function () {
    var time = new Date()
      .getTime() / 20000;
    //time = 68631602.1557 ;

    draw(canvas, context, time);
    window.setTimeout(drawLoop, 10);
  };
  drawLoop();
  document.getElementById('curTime')
    .innerHTML = new Date()
    .getTime() / 20000;
}
window.onload = main;
