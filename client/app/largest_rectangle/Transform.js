'use strict';

define(['gl-matrix'], function (glMatrix) {
  var vec3 = glMatrix.vec3,
    vec4 = glMatrix.vec4,
    mat4 = glMatrix.mat4,
    quat = glMatrix.quat,
    defaultRotation = quat.create(),
    defaultTranslation = vec3.fromValues(0, 0, 0);

  function Transform() {
    this.rotation = defaultRotation;
    this.translation = defaultTranslation;
    this.zShift = -5;
    this.width = 1;
    this.height = 1;
    this.frustumLeft = -0.2;
    this.frustumRight = 0.2;
    this.frustumTop = 0.2;
    this.frustumBottom = -0.2;
    this.near = 1;
    this.far = 10;
    this.viewMinX = 0;
    this.viewMinY = 0;
    this.viewSpanX = 100;
    this.viewSpanY = 100;
  }
  Transform.basic = function () {
    return new Transform();
  };
  Transform.prototype.clone = function () {
    var transform = new Transform();
    transform.rotation = this.rotation;
    transform.translation = this.translation;
    transform.width = this.width;
    transform.height = this.height;
    transform.frustumLeft = this.frustumLeft;
    transform.frustumRight = this.frustumRight;
    transform.frustumTop = this.frustumTop;
    transform.frustumBottom = this.frustumBottom;
    transform.near = this.near;
    transform.far = this.far;
    transform.viewMinX = this.viewMinX;
    transform.viewMinY = this.viewMinY;
    transform.viewSpanX = this.viewSpanX;
    transform.viewSpanY = this.viewSpanY;
    return transform;
  };
  Transform.prototype.resize = function (width, height) {
    var transform = this.clone();
    transform.width = width;
    transform.height = height;
    return transform;
  };
  Transform.prototype.rotateX = function (r) {
    var transform = this.clone();
    transform.rotation = quat.create();
    quat.rotateX(transform.rotation, transform.rotation, r);
    quat.multiply(transform.rotation, transform.rotation, this.rotation);
    return transform;
  };
  Transform.prototype.rotateY = function (r) {
    var transform = this.clone();
    transform.rotation = quat.create();
    quat.rotateY(transform.rotation, transform.rotation, r);
    quat.multiply(transform.rotation, transform.rotation, this.rotation);
    return transform;
  };
  Transform.prototype.rotateZ = function (r) {
    var transform = this.clone();
    transform.rotation = quat.create();
    quat.rotateZ(transform.rotation, transform.rotation, r);
    quat.multiply(transform.rotation, transform.rotation, this.rotation);
    return transform;
  };
  Transform.prototype.rotate = function (x, y, z) {
    var transform = this.clone();
    transform.rotation = quat.create();
    quat.rotateX(transform.rotation, this.rotation, x);
    quat.rotateY(transform.rotation, transform.rotation, y);
    quat.rotateZ(transform.rotation, transform.rotation, z);
    return transform;
  };
  Transform.prototype.translate = function (x, y, z) {
    var transform = this.clone();
    transform.translation = vec3.clone(this.translation);
    transform.translation[0] += x;
    transform.translation[1] += y;
    transform.translation[2] += z;
    return transform;
  };
  Transform.prototype.viewport = function (x, y, w, h) {
    var transform = this.clone();
    transform.viewMinX = x;
    transform.viewMinY = y;
    transform.viewSpanX = w;
    transform.viewSpanY = h;
    return transform;
  };
  Transform.prototype.modelViewMatrix = function (mvMatrix) {
    // Compute the standard model-view, which (in order):
    //  - Scales the rectangle to unit-length along it's maximum span.
    //  - Centers the rectangle about the origin.
    //  - Applies the transform's translation.
    //  - Applies the transform's rotation.
    //  - Shifts the transform by zShift.
    var maxSpan = Math.max(this.width, this.height),
        rotMat = mat4.create();
    mat4.fromQuat(rotMat, this.rotation);

    mat4.identity(mvMatrix);
    mat4.translate(mvMatrix, mvMatrix, [0, 0, this.zShift]);
    mat4.multiply(mvMatrix, mvMatrix, rotMat);
    mat4.translate(mvMatrix, mvMatrix, this.translation);
    mat4.translate(mvMatrix, mvMatrix,
      [-0.5 * this.width / maxSpan, 0.5 * this.height / maxSpan, 0]);
    mat4.scale(mvMatrix, mvMatrix, [1.0 / maxSpan, 1.0 / maxSpan, 1]);
    return mvMatrix;
  };
  Transform.prototype.perspectiveMatrix = function (pMatrix) {
    mat4.frustum(pMatrix,
        this.frustumLeft, this.frustumRight,
        this.frustumBottom, this.frustumTop,
        this.near, this.far);
  };
  Transform.prototype.localCoordinates = function () {
    return [
      vec4.fromValues(0, 0, 0, 1),
      vec4.fromValues(0, -this.height, 0, 1),
      vec4.fromValues(this.width, -this.height, 0, 1),
      vec4.fromValues(this.width, 0, 0, 1),
    ];
  };
  Transform.prototype.viewCoordinates = function () {
    var mvMatrix = mat4.create(),
      coordinates = this.localCoordinates();
    this.modelViewMatrix(mvMatrix);
    for (var i = 0; i !== coordinates.length; ++i) {
      vec4.transformMat4(coordinates[i], coordinates[i], mvMatrix);
    }
    return coordinates;
  };
  Transform.prototype.clipCoordinates = function () {
    var pMatrix = mat4.create(),
      coordinates = this.viewCoordinates();
    this.perspectiveMatrix(pMatrix);
    for (var i = 0; i !== coordinates.length; ++i) {
      vec4.transformMat4(coordinates[i], coordinates[i], pMatrix);
    }
    return coordinates;
  };
  Transform.prototype.normalizedDeviceCoordinates = function () {
    var coordinates = this.clipCoordinates();
    for (var i = 0; i !== coordinates.length; ++i) {
      var v = coordinates[i];
      vec4.scale(v, v, 1.0 / v[3]);
    } return coordinates;
  };
  Transform.prototype.windowCoordinates = function () {
    var coordinates = this.normalizedDeviceCoordinates();
    for (var i = 0; i !== coordinates.length; ++i) {
      var v = coordinates[i];
      v[0] = 0.5 * (v[0] * this.viewSpanX + this.viewSpanX) + this.viewMinX;
      v[1] = 0.5 * (v[1] * this.viewSpanY + this.viewSpanY) + this.viewMinY;
      v[2] = 0.5 * (v[2] * (this.far - this.near) + (this.far + this.near));
    }
    return coordinates;
  };

  Transform.prototype.projectWindowXYToDeviceXY = function (coordinates) {
    var out = new Array(coordinates.length);
    for (var i = 0; i !== coordinates.length; ++i) {
      var v = coordinates[i];
      out[i] = [
        (2.0 * (v[0] - this.viewMinX) / this.viewSpanX) - 1,
        (2.0 * (v[1] - this.viewMinY) / this.viewSpanY) - 1];
    };
    return out;
  };
  Transform.prototype.projectDeviceXYToNearPlaneXY = function (coordinates) {
    var fWidth = this.frustumRight - this.frustumLeft,
        fHeight = this.frustumTop - this.frustumBottom,
        out = new Array(coordinates.length);

    for (var i = 0; i !== coordinates.length; ++i) {
      var v = coordinates[i];
      out[i] = [
        (v[0] * 0.5 + 0.5) * fWidth + this.frustumLeft,
        (v[1] * 0.5 + 0.5) * fHeight + this.frustumBottom,
        -this.near,
        1,
      ];
    }
    return out;
  };
  Transform.prototype.projectNearPlaneXYToLocalXY = function (coordinates) {
    var mvMatrix = mat4.create(),
        mvInverse = mat4.create(),
        origin = vec4.fromValues(0, 0, 0, 1),
        normal = vec4.create(),
        t = 0,
        out = new Array(coordinates.length);

    this.modelViewMatrix(mvMatrix);
    mat4.invert(mvInverse, mvMatrix);
    // Project the camera origin and each coordinate to local space.
    vec4.transformMat4(origin, origin, mvInverse);
    for (var i = 0; i !== coordinates.length; ++i) {
      out[i] = vec4.create();
      vec4.transformMat4(out[i], coordinates[i], mvInverse);
    }
    // For each projected coordinate, form a line between it
    // and the projected origin, and evaluate for Z=0.
    for (var i = 0; i !== out.length; ++i) {
      var v = out[i];
      vec4.subtract(normal, v, origin);
      t = -origin[2] / normal[2];

      v[0] = origin[0] + normal[0] * t;
      v[1] = origin[1] + normal[1] * t;
      v[2] = 0;
    }
    return out;
  };
  return Transform;
});
