'use strict';

  var EPSILON = 0.0001;

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
  Solver.prototype.findABC = function(canvas, context, A, B, C) {
    var m = -A.slope * (C.slope - B.slope) / (A.slope - B.slope);

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

    var output = vec3.create();
    vec3.transformMat3(output, input, system);

    var p1 = vec3.create();
    vec3.lerp(p1, A.begin, A.end, output[0]);
    var p2 = vec3.create();
    vec3.lerp(p2, B.begin, B.end, output[1]);
    var p3 = vec3.create();
    vec3.lerp(p3, C.begin, C.end, output[2]);

    context.strokeStyle = '#FF0000';
    context.beginPath();
    context.moveTo(p1[0], canvas.height - p1[1]);
    context.lineTo(p2[0], canvas.height - p2[1]);
    context.lineTo(p3[0], canvas.height - p3[1]);
    context.lineTo(p1[0], canvas.height - p3[1]);
    context.lineTo(p1[0], canvas.height - p1[1]);
    context.stroke();
  }
  Solver.prototype.findABD = function(canvas, context, A, B, D) {
    var m = -B.slope * (D.slope - A.slope) / (B.slope - A.slope);

    var system = mat3.create();
    system[0] = A.vector[1]; // Avy
    system[3] = -B.vector[1]; // -Bvy
    system[6] = 0;

    system[1] = A.vector[0]; // Avx
    system[4] = 0
    system[7] = -D.vector[0]; // -Dvx

    system[2] = m * A.vector[0]; // Avx * m
    system[5] = B.vector[1] - m * B.vector[0]; // Bvy - Bvx*m
    system[8] = -D.vector[1]; // -Dvy

    mat3.invert(system, system);

    var input = vec3.create();
    input[0] = B.begin[1] - A.begin[1]; // Boy - Aoy
    input[1] = D.begin[0] - A.begin[0]; // Dox - Aox
    input[2] = D.begin[1] - B.begin[1] - A.begin[0] * m + B.begin[0] * m; // Doy - Boy - Aox*m + Box*m

    var output = vec3.create();
    vec3.transformMat3(output, input, system);

    var p1 = vec3.create();
    vec3.lerp(p1, A.begin, A.end, output[0]);
    var p2 = vec3.create();
    vec3.lerp(p2, B.begin, B.end, output[1]);
    var p3 = vec3.create();
    vec3.lerp(p3, D.begin, D.end, output[2]);

    context.strokeStyle = '#00FF00';
    context.beginPath();
    context.moveTo(p1[0], canvas.height - p1[1]);
    context.lineTo(p2[0], canvas.height - p2[1]);
    context.lineTo(p2[0], canvas.height - p3[1]);
    context.lineTo(p3[0], canvas.height - p3[1]);
    context.lineTo(p1[0], canvas.height - p1[1]);
    context.stroke();
  }
  Solver.prototype.findACD = function(canvas, context, A, C, D) {
    var m = -C.slope * (A.slope - D.slope) / (C.slope - D.slope);
    //console.log('findACD ' + m);

    var system = mat3.create();
    system[0] = A.vector[0]; // Avx
    system[3] = 0;
    system[6] = -D.vector[0]; // -Dvx

    system[1] = 0;
    system[4] = C.vector[1]; // Cvy
    system[7] = -D.vector[1]; // -Dvy

    system[2] = A.vector[1]; // Avy
    system[5] = m * C.vector[0] - C.vector[1]; // Cvx*m - Cvy
    system[8] = -D.vector[0]; // -Dvx

    mat3.invert(system, system);

    var input = vec3.create();
    input[0] = D.begin[0] - A.begin[0]; // Dox - Aox
    input[1] = D.begin[1] - C.begin[1]; // Doy - Coy
    input[2] = C.begin[1] - A.begin[1] - C.begin[0] * m + D.begin[0] * m; // Coy - Aoy - Cox*m + Dox*m

    var output = vec3.create();
    vec3.transformMat3(output, input, system);

    var p1 = vec3.create();
    vec3.lerp(p1, A.begin, A.end, output[0]);
    var p2 = vec3.create();
    vec3.lerp(p2, C.begin, C.end, output[1]);
    var p3 = vec3.create();
    vec3.lerp(p3, D.begin, D.end, output[2]);

    //console.log((p3[1] - p1[1]) / (p2[0] - p1[0]))

    context.strokeStyle = '#000000';
    context.beginPath();
    context.moveTo(p1[0], canvas.height - p1[1]);
    context.lineTo(p2[0], canvas.height - p1[1]);
    context.lineTo(p2[0], canvas.height - p2[1]);
    context.lineTo(p3[0], canvas.height - p3[1]);
    context.lineTo(p1[0], canvas.height - p1[1]);
    context.stroke();
  }
  Solver.prototype.findBCD = function(canvas, context, B, C, D) {
    var m = -B.slope * (D.slope - C.slope) / (B.slope - C.slope);

    var system = mat3.create();
    system[0] = -B.vector[0]; // -Bvx
    system[3] = C.vector[0]; // Cvx
    system[6] = 0;

    system[1] = 0;
    system[4] = C.vector[1] // Cvy
    system[7] = -D.vector[1]; // -Dvy

    system[2] = B.vector[1]; // Bvy
    system[5] = -C.vector[0] * m; // -Cvx*m
    system[8] = D.vector[0] * m - D.vector[1]; // Dvx*m - Dvy

    mat3.invert(system, system);

    var input = vec3.create();
    input[0] = B.begin[0] - C.begin[0]; // Box - Cox
    input[1] = D.begin[1] - C.begin[1]; // Doy - Coy
    input[2] = D.begin[1] - B.begin[1] - D.begin[0] * m + C.begin[0] * m; // Doy - Boy - Dox*m + Cox*m

    var output = vec3.create();
    vec3.transformMat3(output, input, system);

    var p1 = vec3.create();
    vec3.lerp(p1, B.begin, B.end, output[0]);
    var p2 = vec3.create();
    vec3.lerp(p2, C.begin, C.end, output[1]);
    var p3 = vec3.create();
    vec3.lerp(p3, D.begin, D.end, output[2]);

    context.strokeStyle = '#0000FF';
    context.beginPath();
    context.moveTo(p1[0], canvas.height - p1[1]);
    context.lineTo(p2[0], canvas.height - p2[1]);
    context.lineTo(p3[0], canvas.height - p3[1]);
    context.lineTo(p3[0], canvas.height - p1[1]);
    context.lineTo(p1[0], canvas.height - p1[1]);
    context.stroke();
  }
  Solver.prototype.findABCD = function(canvas, context, A, B, C, D) {

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

    var output = vec4.create();
    vec4.transformMat4(output, input, system);

    var p1 = vec3.create();
    vec3.lerp(p1, A.begin, A.end, output[0]);
    var p2 = vec3.create();
    vec3.lerp(p2, B.begin, B.end, output[1]);
    var p3 = vec3.create();
    vec3.lerp(p3, C.begin, C.end, output[2]);
    var p4 = vec3.create();
    vec3.lerp(p4, D.begin, D.end, output[3]);

    context.strokeStyle = '#00FFFF';
    context.beginPath();
    context.moveTo(p1[0], canvas.height - p1[1]);
    context.lineTo(p2[0], canvas.height - p2[1]);
    context.lineTo(p3[0], canvas.height - p3[1]);
    context.lineTo(p4[0], canvas.height - p4[1]);
    context.lineTo(p1[0], canvas.height - p1[1]);
    context.stroke();
  }
  Solver.prototype.findV2L = function(canvas, context, v, l1, l2) {
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

    var s1 = vec3.create();
    vec3.lerp(s1, Y.begin, Y.end, s1ty);

    var s2 = vec3.create();
    vec3.lerp(s2, X.begin, X.end, s2tx);

    var tx, ty;
    if (X.inside(s1) && Y.inside(s1)) {
      tx = s1tx;
      ty = s1ty;

      context.strokeStyle = '#000000';
      context.beginPath();
      context.moveTo(v[0], canvas.height - v[1]);
      context.lineTo(s1[0], canvas.height - v[1]);
      context.lineTo(s1[0], canvas.height - s1[1]);
      context.lineTo(v[0], canvas.height - s1[1]);
      context.lineTo(v[0], canvas.height - v[1]);
      context.stroke();

    } else if(X.inside(s2) && Y.inside(s2)) {
      tx = s2tx;
      ty = s2ty;

      context.strokeStyle = '#000000';
      context.beginPath();
      context.moveTo(v[0], canvas.height - v[1]);
      context.lineTo(s2[0], canvas.height - v[1]);
      context.lineTo(s2[0], canvas.height - s2[1]);
      context.lineTo(v[0], canvas.height - s2[1]);
      context.lineTo(v[0], canvas.height - v[1]);
      context.stroke();
    }
  }
  Solver.prototype.find3L = function(canvas, context, A, B, C, test) {
    // If B has negative slope, we want to project along X to A rather than Y.
    // The linear system used here projects along Y to A, so flip them.
    if (B.slope < 0) {
      var t = A;
      A = C;
      C = t;
    }

    var mMax, mMin;
    if (Math.abs(A.slope) > Math.abs(C.slope)) {
      mMax = A.slope;
      mMin = C.slope;
    } else {
      mMax = C.slope;
      mMin = A.slope;
    }

    var m = -mMax * (mMin - B.slope) / (mMax - B.slope);

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

    var output = vec3.create();
    vec3.transformMat3(output, input, system);

    var p1 = vec3.create();
    vec3.lerp(p1, A.begin, A.end, output[0]);
    var p2 = vec3.create();
    vec3.lerp(p2, B.begin, B.end, output[1]);
    var p3 = vec3.create();
    vec3.lerp(p3, C.begin, C.end, output[2]);
    var p4 = vec3.create();
    p4[0] = p1[0];
    p4[1] = p3[1];

    if (test !== undefined) {
      if (!test.inside(p1) || !test.inside(p2) || !test.inside(p3) || !test.inside(p4)) {
        return;
      }
    }

    context.strokeStyle = '#FF0000';
    context.beginPath();
    context.moveTo(p1[0], canvas.height - p1[1]);
    context.lineTo(p2[0], canvas.height - p2[1]);
    context.lineTo(p3[0], canvas.height - p3[1]);
    context.lineTo(p1[0], canvas.height - p3[1]);
    context.lineTo(p1[0], canvas.height - p1[1]);
    context.stroke();

    //console.log('area 3L: ' + (p1[0] - p3[0]) * (p1[1] - p3[1]))
  }
  Solver.prototype.findV1L = function(canvas, context, v, l) {

    var tmp = vec2.create();
    vec2.subtract(tmp, v, l.begin);
    vec2.scale(tmp, l.normal, vec2.dot(tmp, l.normal));

    var p4 = vec2.create();
    vec2.subtract(p4, v, tmp);

    context.strokeStyle = '#555555';
    context.beginPath();
    context.moveTo(v[0], canvas.height - v[1]);
    context.lineTo(p4[0], canvas.height - v[1]);
    context.lineTo(p4[0], canvas.height - p4[1]);
    context.lineTo(v[0], canvas.height - p4[1]);
    context.lineTo(v[0], canvas.height - v[1]);
    context.stroke();

    //console.log('area V1L: ' + (v[0] - p4[0]) * (v[1] - p4[1]))
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
    //console.log('view coordinates: ' + v[0] + ' ' + v[1] + ' ' + v[2] + ' ' + v[3]);

    vec4.transformMat4(v, v, pMatrix);
    //console.log('clip coordinates: ' + v[0] + ' ' + v[1] + ' ' + v[2] + ' ' + v[3]);

    vec4.scale(v, v, -1.0 / v[3]);
    //console.log('NDC: ' + v[0] + ' ' + v[1] + ' ' + v[2] + ' ' + v[3]);

    //console.log(canvas.width + ' ' + canvas.height);
    v[0] = (0.5 + v[0] / 2.0) * canvas.width;
    v[1] = (0.5 + v[1] / 2.0) * canvas.height;
    //console.log('after viewport: ' + v[0] + ' ' + v[1]);
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
      s.findV1L(canvas, context, v, s.C[c]);
    }
    if (s.C.length == 2) {
      // 2-point solution.
    }
  }
  // Solutions at chain B.
  if (s.B.length == 2) {
    var v = midpoint(s.B);
    for (var d = 0; d != s.D.length; ++d) {
      s.findV1L(canvas, context, v, s.D[d]);
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
      s.findV1L(canvas, context, v, s.A[a]);
    }
  }
  // Solutions at chain D.
  if (s.D.length == 2) {
    var v = midpoint(s.D);
    for (var b = 0; b != s.B.length; ++b) {
      s.findV1L(canvas, context, v, s.B[b]);
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
      context.strokeStyle = '#FF00FF';
      context.beginPath();
      context.moveTo(v1[0], canvas.height - v1[1]);
      context.lineTo(v1[0], canvas.height - v2[1]);
      context.lineTo(v2[0], canvas.height - v2[1]);
      context.lineTo(v2[0], canvas.height - v1[1]);
      context.lineTo(v1[0], canvas.height - v1[1]);
      context.stroke();

    } else {
      var v;
      if (chains[0][0].end === chains[0][1].begin) {
        v = chains[0][0].end;
      } else {
        v = chains[0][1].end;
      }
      s.findV2L(canvas, context, v, chains[1][0], chains[2][0]);
    }
  }
  {
    for (var a = 0; a != s.A.length; ++a) {
      for (var b = 0; b != s.B.length; ++b) {
        for (var c = 0; c != s.C.length; ++c) {
          s.find3L(canvas, context, s.A[a], s.B[b], s.C[c], s.D[0]);
          for (var d = 0; d != s.D.length; ++d) {
            s.findABCD(canvas, context, s.A[0], s.B[0], s.C[0], s.D[0])
          }
        }
        for (var d = 0; d != s.D.length; ++d) {
          s.find3L(canvas, context, s.D[d], s.A[a], s.B[b], s.C[0]);
        }
      }
      for (var c = 0; c != s.C.length; ++c) {
        for (var d = 0; d != s.D.length; ++d) {
          //console.log('RAN');
          s.find3L(canvas, context, s.C[c], s.D[d], s.A[a], s.B[0]);
        }
      }
    }
    for (var b = 0; b != s.B.length; ++b) {
      for (var c = 0; c != s.C.length; ++c) {
        for (var d = 0; d != s.D.length; ++d) {
          s.find3L(canvas, context, s.B[b], s.C[c], s.D[d], s.A[0]);
        }
      }
    }
  }


  /*
  for (var a = 0; a != s.A.length; ++a) {
    for (var b = 0; b != s.B.length; ++b) {
      for (var c = 0; c != s.C.length; ++c) {
        //s.findABC(canvas, context, s.A[a], s.B[b], s.C[c]);
        //for (var d = 0; d != s.D.length; ++d) {
        //  s.findABCD(canvas, context, s.A[0], s.B[0], s.C[0], s.D[0])
        //}
      }
      for (var d = 0; d != s.D.length; ++d) {
        //s.findABD(canvas, context, s.A[a], s.B[b], s.D[d]);
      }
    }
    for (var c = 0; c != s.C.length; ++c) {
      for (var d = 0; d != s.D.length; ++d) {
        s.findACD(canvas, context, s.A[a], s.C[c], s.D[d]);
      }
    }
  }
  for (var b = 0; b != s.B.length; ++b) {
    for (var c = 0; c != s.C.length; ++c) {
      for (var d = 0; d != s.D.length; ++d) {
        //s.findBCD(canvas, context, s.B[b], s.C[c], s.D[d]);
      }
    }
  }
 */


  /*
  console.log('A.begin ' + A.begin[0] + ' ' + A.begin[1]);
  console.log('A.end ' + A.end[0] + ' ' + A.end[1]);
  console.log('A.vector ' + A.vector[0] + ' ' + A.vector[1]);

  var m = -A.slope * (C.slope - B.slope) / (A.slope - B.slope);
  console.log('mA ' + A.slope + ' mB ' + B.slope + ' mC ' + C.slope + ' mD ' + D.slope);
  console.log('m: ' + m);

  var system = mat3.create();
  system[0] = A.vector[1]; // Avy
  system[3] = -B.vector[1]; // -Bvy
  system[6] = 0;

  system[1] = 0;
  system[4] = B.vector[0]; // Bvx
  system[7] = -C.vector[0]; // -Cvx

  system[2] = A.vector[1] - A.vector[0] * m; // Avy - Avx * m;
  system[5] = B.vector[0] * m; // Bvx * m
  system[8] = -C.vector[1]; // -Cvy

  mat3.invert(system, system);

  var input = vec3.create();
  input[0] = B.begin[1] - A.begin[1]; // Boy - Aoy
  input[1] = C.begin[0] - B.begin[0]; // Cox - Box
  input[2] = C.begin[1] - A.begin[1] - B.begin[0] * m + A.begin[0] * m; // Coy - Box * m + Aox * m + Aoy

  var output = vec3.create();
  vec3.transformMat3(output, input, system);
  console.log(output);

  var p1 = vec3.create();
  vec3.lerp(p1, A.begin, A.end, output[0]);
  var p2 = vec3.create();
  vec3.lerp(p2, B.begin, B.end, output[1]);
  var p3 = vec3.create();
  vec3.lerp(p3, C.begin, C.end, output[2]);

  console.log(p1);
  console.log(p2);
  console.log(p3);

  console.log('Area: ' + Math.abs((p2[0] - p1[0]) * (p3[1] - p2[1])));


  context.strokeStyle = '#000000';
  context.beginPath();
  context.moveTo(p1[0], canvas.height - p1[1]);
  context.lineTo(p2[0], canvas.height - p2[1]);
  context.lineTo(p3[0], canvas.height - p3[1]);
  context.lineTo(p1[0], canvas.height - p3[1]);
  context.lineTo(p1[0], canvas.height - p1[1]);
  context.stroke();

  //console.log('ta ' + output[0] + ' tb ' + output[1] + ' tc ' + output[2]);
  */
}

function main() {
  var canvas = document.getElementById("test");
  var context = canvas.getContext('2d');

  context.fillStyle = '#FF0000';
  context.fillRect(100, 100, 200, 200);

  var drawLoop;
  drawLoop = function() {
    var time = new Date().getTime() / 20000;
    //time = 68567735.00075 ;

    draw(canvas, context, time);
    window.setTimeout(drawLoop, 10);
  }
  drawLoop();
  document.getElementById('curTime').innerHTML = new Date().getTime() / 20000;
};
window.onload = main;
