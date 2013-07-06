define([
    'gl-matrix',
], function (glMatrix) {
  'use strict';

  var vec3 = glMatrix.vec3,
    vec4 = glMatrix.vec4,
    mat4 = glMatrix.mat4,
    quat = glMatrix.quat;

  var defaultRotation = quat.create(),
    defaultTranslation = vec3.fromValues(0, 0, -5),
    defaultFov = Math.PI / 8;

  function Transform() {
    this.rotation = defaultRotation;
    this.translation = defaultTranslation;
    this.width = 1;
    this.height = 1;
    this.fovNegX = defaultFov;
    this.fovNegY = defaultFov;
    this.fovPosX = defaultFov;
    this.fovPosY = defaultFov;
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
    transform.fovPosX = this.fovPosX;
    transform.fovNegX = this.fovNegX;
    transform.fovNegX = this.fovNegX;
    transform.fovNegY = this.fovNegY;
    transform.near = this.near;
    transform.far = this.far;
    transform.viewMinX = this.viewMinX;
    transform.viewMinY = this.viewMinY;
    transform.viewSpanX = this.viewSpanX;
    transform.viewSpanY = this.viewSpanY;
    return transform;
  };
  Transform.prototype.rotateX = function (r) {
    var transform = this.clone();
    transform.rotation = quat.create();
    quat.rotateX(transform.rotation, this.rotation, r);
    return transform;
  };
  Transform.prototype.rotateY = function (r) {
    var transform = this.clone();
    transform.rotation = quat.create();
    quat.rotateY(transform.rotation, this.rotation, r);
    return transform;
  };
  Transform.prototype.rotateZ = function (r) {
    var transform = this.clone();
    transform.rotation = quat.create();
    quat.rotateZ(transform.rotation, this.rotation, r);
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
  Transform.prototype.viewport = function(x, y, w, h) {
    var transform = this.clone();
    transform.viewMinX = x;
    transform.viewMinY = y;
    transform.viewSpanX = w;
    transform.viewSpanY = h;
    return transform;
  };
  Transform.prototype.localCoordinates = function () {
    return [
      vec4.fromValues(-this.width / 2, this.height / 2, 0, 1),
      vec4.fromValues(this.width / 2, this.height / 2, 0, 1),
      vec4.fromValues(this.width / 2, -this.height / 2, 0, 1),
      vec4.fromValues(-this.width / 2, -this.height / 2, 0, 1), ];
  };
  Transform.prototype.viewCoordinates = function () {
    var mvMatrix = mat4.create(),
      coordinates = this.localCoordinates();
    mat4.fromRotationTranslation(mvMatrix, this.rotation, this.translation);
    for (var i = 0; i != coordinates.length; ++i) {
      vec4.transformMat4(coordinates[i], coordinates[i], mvMatrix);
    }
    return coordinates;
  };
  Transform.prototype.clipCoordinates = function () {
    var pMatrix = mat4.create(),
      coordinates = this.viewCoordinates(),
      xMin = -Math.tan(this.fovNegX) * this.near,
      xMax = Math.tan(this.fovPosX) * this.near,
      yMin = -Math.tan(this.fovNegY) * this.near,
      yMax = Math.tan(this.fovPosY) * this.near;
    mat4.frustum(pMatrix, xMin, xMax, yMin, yMax, this.near, this.far);
    for (var i = 0; i != coordinates.length; ++i) {
      vec4.transformMat4(coordinates[i], coordinates[i], pMatrix);
    }
    return coordinates;
  };
  Transform.prototype.normalizedDeviceCoordinates = function () {
    var coordinates = this.clipCoordinates();
    for (var i = 0; i != coordinates.length; ++i) {
      var v = coordinates[i];
      vec4.scale(v, v, 1.0 / v[3]);
    }
    return coordinates;
  };
  Transform.prototype.windowCoordinates = function () {
    var coordinates = this.normalizedDeviceCoordinates();
    for (var i = 0; i != coordinates.length; ++i) {
      var v = coordinates[i];
      v[0] = 0.5 * (v[0] * this.viewSpanX + this.viewSpanX) + this.viewMinX;
      v[1] = 0.5 * (v[1] * this.viewSpanY + this.viewSpanY) + this.viewMinY;
      v[2] = 0.5 * (v[2] * (this.far - this.near) + (this.far + this.near));
    }
    return coordinates;
  };
  return Transform;
});
