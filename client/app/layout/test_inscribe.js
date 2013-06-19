'use strict';

  var EPSILON = 0.0001;

  function Solution(cornerOne, cornerTwo, solver) {
    this.xMin = Math.min(cornerOne[0], cornerTwo[0]);
    this.xMax = Math.max(cornerOne[0], cornerTwo[0]);
    this.yMin = Math.min(cornerOne[1], cornerTwo[1]);
    this.yMax = Math.max(cornerOne[1], cornerTwo[1]);
    this.solver = solver;
    this.area = (this.xMax - this.xMin) * (this.yMax - this.yMin);
  };

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
  };
  // Returns the point's distance from the plane parameterized by this segment.
  Segment.prototype.distance = function(v) {
    return this.normal[0] * v[0] + this.normal[1] * v[1] + this.b;
  };
  // Returns whether the point is on the 'inside' (positive distance) of the
  // segment's plane parameterization. Distances within EPSILON of the plane
  // are assumed to be rounding error, and considered 'inside' the plane.
  Segment.prototype.inside = function(v) {
    return this.distance(v) >= -EPSILON;
  };

  function Solver(vertices) {
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
        new Segment(vertices[3], vertices[0])];
    } else {
      // Verticies are in reverse (clockwise) order.
      segments = [
        new Segment(vertices[0], vertices[3]),
        new Segment(vertices[3], vertices[2]),
        new Segment(vertices[2], vertices[1]),
        new Segment(vertices[1], vertices[0])];
    }

    this.A = [];
    this.B = [];
    this.C = [];
    this.D = [];
    for (var i = 0; i != segments.length; ++i) {
      var s = segments[i];
      if (s.slope <= 0) {
        // Must be in A or C.
        if (s.vector[0] > 0) {
          this.A.push(s);
        } else {
          this.C.push(s);
        }
      } else {
        if (s.vector[1] > 0) {
          this.B.push(s);
        } else {
          this.D.push(s);
        }
      }
    }
  }
  Solver.prototype.isUnitBounded = function(p) {
    return p > -EPSILON && p < 1.0 + EPSILON;
  }
  Solver.prototype.find4L = function(A, B, C, D, solutions) {
    // Create a system which fixes A.y = B.y,
    // B.x = C.x, C.y = D.y, and D.x = A.x
    var system = mat4.create();
    system[0] = A.vector[1]; // Avy
    system[4] = -B.vector[1]; // -Bvy
    system[8] = 0;
    system[12] = 0;

    system[1] = 0;
    system[5] = B.vector[0]; // Bvx
    system[9] = -C.vector[0]; // -Cvx
    system[13] = 0;

    system[2] = 0;
    system[6] = 0;
    system[10] = C.vector[1]; // Cvy
    system[14] = -D.vector[1]; // -Dvy

    system[3] = -A.vector[0]; // -Avx
    system[7] = 0;
    system[11] = 0;
    system[15] = D.vector[0]; // Dvx
    mat4.invert(system, system);

    var input = vec4.create();
    input[0] = B.begin[1] - A.begin[1]; // Boy - Aoy
    input[1] = C.begin[0] - B.begin[0]; // Cox - Box
    input[2] = D.begin[1] - C.begin[1]; // Doy - Coy
    input[3] = A.begin[0] - D.begin[0]; // Aox - Dox

    var parameters = vec4.create();
    vec4.transformMat4(parameters, input, system);

    // Require parameterizations to fall in [0, 1].
    if (!_.all(parameters, this.isUnitBounded)) {
      return;
    }
    var v1 = vec2.create(), v2 = vec2.create();
    vec2.lerp(v1, A.begin, A.end, parameters[0]);
    vec2.lerp(v2, C.begin, C.end, parameters[2]);
    solutions.push(new Solution(v1, v2, '4L'));
  }
  Solver.prototype.findV2L = function(v, l1, l2, solutions) {
    // Identify which line is more-aligned with the X-axis, and which with Y.
    var X, Y;
    if (Math.abs(l1.slope) < Math.abs(l2.slope)) {
      X = l1;
      Y = l2;
    } else {
      X = l2;
      Y = l1;
    }
    // Project from V to X, and from X to Y.
    var s1tx = (v[0] - X.begin[0]) / X.vector[0];
    var s1ty = (X.vector[1] * s1tx + X.begin[1] - Y.begin[1]) / Y.vector[1];
    // Project from V to Y, and from Y to X.
    var s2ty = (v[1] - Y.begin[1]) / Y.vector[1];
    var s2tx = (Y.vector[0] * s2ty + Y.begin[0] - X.begin[0]) / X.vector[0];

    var v2 = vec2.create();
    if (this.isUnitBounded(s1tx) && this.isUnitBounded(s1ty)) {
      vec2.lerp(v2, Y.begin, Y.end, s1ty);
      solutions.push(new Solution(v, v2, 'V2Lxy'));
    }
    if (this.isUnitBounded(s2ty) && this.isUnitBounded(s2tx)) {
      vec2.lerp(v2, X.begin, X.end, s2tx);
      solutions.push(new Solution(v, v2, 'V2Lyx'));
    }
  }
  Solver.prototype.find3L = function(A, B, C, solutions) {
    // If B has negative slope, we want to project along X to A rather than Y.
    // The linear system used here projects along Y to A, so flip them.
    if (B.slope < 0) {
      var t = A;
      A = C;
      C = t;
    }
    // Compute the slope of the largest inscribed rectangle,
    // which is a function of the slopes of A, B, and C.
    var mMax, mMin;
    if (Math.abs(A.slope) > Math.abs(C.slope)) {
      mMax = A.slope;
      mMin = C.slope;
    } else {
      mMax = C.slope;
      mMin = A.slope;
    }
    var m = -mMax * (mMin - B.slope) / (mMax - B.slope);

    // Create a system which fixes A.y = B.y, B.x = C.x,
    // and C.y = A.y + m*(B.x-A.x)
    var system = mat3.create();
    system[0] = A.vector[1]; // Avy
    system[3] = -B.vector[1]; // -Bvy
    system[6] = 0;

    system[1] = 0;
    system[4] = B.vector[0]; // Bvx
    system[7] = -C.vector[0]; // -Cvx

    system[2] = A.vector[1] - A.vector[0] * m; // Avy - Avx*m;
    system[5] = B.vector[0] * m; // Bvx * m
    system[8] = -C.vector[1]; // -Cvy
    mat3.invert(system, system);

    var input = vec3.create();
    input[0] = B.begin[1] - A.begin[1]; // Boy - Aoy
    input[1] = C.begin[0] - B.begin[0]; // Cox - Box
    input[2] = C.begin[1] - A.begin[1] - B.begin[0] * m + A.begin[0] * m; // Coy - Aoy*m - Box*m + Aox*m

    var parameters = vec3.create();
    vec3.transformMat3(parameters, input, system);

    // Require parameterizations to fall in [0, 1].
    if (!_.all(parameters, this.isUnitBounded)) {
      return;
    }
    // We're not sure which of A, C is lower-left vs upper-right.
    var v1 = vec2.create(), v2 = vec2.create();
    vec2.lerp(v1, A.begin, A.end, parameters[0]);
    vec2.lerp(v2, C.begin, C.end, parameters[2]);
    solutions.push(new Solution(v1, v2, '3L'));
  }
  Solver.prototype.findV1L = function(v, A, solutions) {
    // Identify the parameterization of the projection of V onto A.
    var v2 = vec2.create();
    vec2.subtract(v2, v, A.begin);
    var t = vec2.dot(v2, A.vector) / vec2.squaredLength(A.vector);

    if (this.isUnitBounded(t)) {
      vec2.lerp(v2, A.begin, A.end, t);
      solutions.push(new Solution(v, v2, 'V1L'));
    }
  }
  Solver.prototype.find2V = function(v1, v2, solutions) {
    solutions.push(new Solution(v1, v2, '2V'));
  }

function draw(canvas, context, t) {

  var r = quat.create();
  quat.rotateX(r, r, t * 0.4)
  quat.rotateY(r, r, t * 0.5)
  quat.rotateZ(r, r, t * 0.6)
  quat.rotateZ(r, r, 0.05)
  var t = vec3.fromValues(0, 0, -10);

  var mvMatrix = mat4.create();
  mat4.fromRotationTranslation(mvMatrix, r, t);

  var pMatrix = mat4.create();
  mat4.perspective(pMatrix, Math.PI / 7, canvas.width / canvas.height, -1, -10);

  context.clearRect(0, 0, canvas.width, canvas.height);

  var corners = [
    vec4.fromValues(-1.0,  1.4, 0, 1),
    vec4.fromValues(-1.0, -1.4, 0, 1),
    vec4.fromValues( 1.0, -1.4, 0, 1),
    vec4.fromValues( 1.0,  1.4, 0, 1),
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

  var s = new Solver(corners);

  context.strokeStyle = '#FF0000';
  for (var i = 0; i != s.A.length; ++i) {
    var A = s.A[i];
    context.beginPath();
    context.moveTo(A.begin[0], canvas.height - A.begin[1]);
    context.lineTo(A.end[0], canvas.height - A.end[1]);
    context.closePath();
    context.stroke();
  }
  context.strokeStyle = '#00FF00';
  for (var i = 0; i != s.B.length; ++i) {
    var B = s.B[i];
    context.beginPath();
    context.moveTo(B.begin[0], canvas.height - B.begin[1]);
    context.lineTo(B.end[0], canvas.height - B.end[1]);
    context.closePath();
    context.stroke();
  }
  context.strokeStyle = '#0000FF';
  for (var i = 0; i != s.C.length; ++i) {
    var C = s.C[i];
    context.beginPath();
    context.moveTo(C.begin[0], canvas.height - C.begin[1]);
    context.lineTo(C.end[0], canvas.height - C.end[1]);
    context.closePath();
    context.stroke();
  }
  context.strokeStyle = '#FF00FF';
  for (var i = 0; i != s.D.length; ++i) {
    var D = s.D[i];
    context.beginPath();
    context.moveTo(D.begin[0], canvas.height - D.begin[1]);
    context.lineTo(D.end[0], canvas.height - D.end[1]);
    context.closePath();
    context.stroke();
  }

  var solutions = [];

  var midpoint = function(chain) {
    if (chain[0].end === chain[1].begin) {
      return chain[0].end;
    } else {
      return chain[1].end;
    }
  }

  // Solutions at chain A.
  if (s.A.length == 2) {
    var v = midpoint(s.A);
    for (var c = 0; c != s.C.length; ++c) {
      s.findV1L(v, s.C[c], solutions);
    }
    if (s.C.length == 2) {
      // 2-point solution.
    }
  }
  // Solutions at chain B.
  if (s.B.length == 2) {
    var v = midpoint(s.B);
    for (var d = 0; d != s.D.length; ++d) {
      s.findV1L(v, s.D[d], solutions);
    }
    if (s.D.length == 2) {
      // 2-point solution
    }
  } else if (s.B.length == 1) {
  }
  // Solutions at chain C.
  if (s.C.length == 2) {
    var v = midpoint(s.C);
    for (var a = 0; a != s.A.length; ++a) {
      s.findV1L(v, s.A[a], solutions);
    }
  }
  // Solutions at chain D.
  if (s.D.length == 2) {
    var v = midpoint(s.D);
    for (var b = 0; b != s.B.length; ++b) {
      s.findV1L(v, s.B[b], solutions);
    }
  }


  var chains = [s.A, s.B, s.C, s.D];
  chains.sort(function(a,b) { return b.length - a.length; })

  if (chains[0].length == 2) {
    if (chains[1].length == 2) {
      // Largest isothetic rectangle runs between these points.
      var v1;
      if (chains[0][0].end === chains[0][1].begin) {
        v1 = chains[0][0].end;
      } else {
        v1 = chains[0][1].end;
      }
      var v2;
      if (chains[1][0].end === chains[1][1].begin) {
        v2 = chains[1][0].end;
      } else {
        v2 = chains[1][1].end;
      }
      s.find2V(v1, v2, solutions);

    } else {
      var v;
      if (chains[0][0].end === chains[0][1].begin) {
        v = chains[0][0].end;
      } else {
        v = chains[0][1].end;
      }
      s.findV2L(v, chains[1][0], chains[2][0], solutions);
    }
  }
  {
    for (var a = 0; a != s.A.length; ++a) {
      for (var b = 0; b != s.B.length; ++b) {
        for (var c = 0; c != s.C.length; ++c) {
          s.find3L(s.A[a], s.B[b], s.C[c], solutions);
          for (var d = 0; d != s.D.length; ++d) {
            s.find4L(s.A[0], s.B[0], s.C[0], s.D[0], solutions);
          }
        }
        for (var d = 0; d != s.D.length; ++d) {
          s.find3L(s.D[d], s.A[a], s.B[b], solutions);
        }
      }
      for (var c = 0; c != s.C.length; ++c) {
        for (var d = 0; d != s.D.length; ++d) {
          s.find3L(s.C[c], s.D[d], s.A[a], solutions);
        }
      }
    }
    for (var b = 0; b != s.B.length; ++b) {
      for (var c = 0; c != s.C.length; ++c) {
        for (var d = 0; d != s.D.length; ++d) {
          s.find3L(s.B[b], s.C[c], s.D[d], solutions);
        }
      }
    }
  }
  _.each(solutions, function(s) {
    //console.log(s);
    context.strokeStyle = '#00FFFF';
    context.beginPath();
    context.moveTo(s.xMin, canvas.height - s.yMin);
    context.lineTo(s.xMax, canvas.height - s.yMin);
    context.lineTo(s.xMax, canvas.height - s.yMax);
    context.lineTo(s.xMin, canvas.height - s.yMax);
    context.lineTo(s.xMin, canvas.height - s.yMin);
    context.stroke();
  });
}

function main() {
  var canvas = document.getElementById("test");
  var context = canvas.getContext('2d');

  context.fillStyle = '#FF0000';
  context.fillRect(100, 100, 200, 200);

  var drawLoop;
  drawLoop = function() {
    var time = new Date().getTime() / 20000;
    //time = 68580849.5425 ;

    draw(canvas, context, time);
    window.setTimeout(drawLoop, 10);
  }
  drawLoop();
  document.getElementById('curTime').innerHTML = new Date().getTime() / 20000;
};
window.onload = main;
