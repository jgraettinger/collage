'use strict';

define([
  'gl-matrix',
  'collage/largest_rectangle/Model',
  'collage/largest_rectangle/Segment',
  'collage/largest_rectangle/Solver',
  'collage/largest_rectangle/Transform',
  'collage/models/tile',
  'collage/models/tile-culler',
  'text!collage/shaders/main.frag',
  'text!collage/shaders/main.vert',
], function (
  glMatrix,
  Model,
  Segment,
  Solver,
  Transform,
  Tile,
  TileCuller,
  fragmentShaderSource,
  vertexShaderSource) {
  var mat4 = glMatrix.mat4;

  var Controller = function (
      $scope,
      $window,
      tileGeometry,
      tileTextures,
      webgl) {
    this._scope = $scope;

    this._scope.lodBias = '-2';
    this._scope.zDistance = '-0.75';
    this._scope.activeTiles = 0;
    this._scope.gamma = '0.4545';
    this._scope.pixelsToRadians = 500.0;

    this._scope.awesomeThings = [
      'HTML5 Boilerplate',
      'AngularJS',
      'Karma'
    ];

    this._scope.applyRotation = _.bind(this.applyRotation, this);
    this._scope.rotate90 = _.bind(this.rotate90, this);

    this._tileGeometry = tileGeometry;
    this._tileTextures = tileTextures;

    this._webgl = webgl;

    // Compile and install vertex & fragment shaders.
    this._vertexShader = webgl.buildVertexShader(vertexShaderSource);
    this._fragmentShader = webgl.buildFragmentShader(fragmentShaderSource);
    this._shaderProgram = webgl.buildShaderProgram(this._vertexShader,
      this._fragmentShader);

    // Collect handles to shader inputs.
    this._shaderProgram.vPositionAttribute = webgl.checkedGetAttribLocation(
      this._shaderProgram, 'vPosition');
    webgl._gl.enableVertexAttribArray(this._shaderProgram.vPositionAttribute);

    this._shaderProgram.vTexture0Attribute = webgl.checkedGetAttribLocation(
      this._shaderProgram, 'vTexture0');
    webgl._gl.enableVertexAttribArray(this._shaderProgram.vTexture0Attribute);

    this._shaderProgram.mvMatrixUniform = webgl.checkedGetUniformLocation(
      this._shaderProgram, 'mvMatrix');
    this._shaderProgram.pMatrixUniform = webgl.checkedGetUniformLocation(
      this._shaderProgram, 'pMatrix');
    this._shaderProgram.samplerUniform = webgl.checkedGetUniformLocation(
      this._shaderProgram, 'uSampler');

    this._shaderProgram.gammaUniform = webgl.checkedGetUniformLocation(
        this._shaderProgram, 'gamma');

    this._shaderProgram.clip1Uniform = webgl.checkedGetUniformLocation(
        this._shaderProgram, 'clip1');
    this._shaderProgram.clip2Uniform = webgl.checkedGetUniformLocation(
        this._shaderProgram, 'clip2');
    this._shaderProgram.clip3Uniform = webgl.checkedGetUniformLocation(
        this._shaderProgram, 'clip3');
    this._shaderProgram.clip4Uniform = webgl.checkedGetUniformLocation(
        this._shaderProgram, 'clip4');

    var self = this;
    setTimeout(function () {
      webgl.draw(self);
    }, 500);
    angular.element($window).bind('resize', function () {
      webgl.draw(self);
    });

    ///////////////////////////////////////////////////////////////////////////
    //
    this._photo = {
      id: "foozing",
      width: 5216,
      height: 3472,
    };
    this._rootTile = Tile.buildRootTile(this._photo);

    this._transform = Transform.basic()
      .resize(this._photo.width, this._photo.height);
    /*
      .rotateZ(Math.PI / 4)
      .rotateX(Math.PI / 4)
      .rotateY(Math.PI / 4);
      */

    //glMatrix.quat.rotateZ(this._scope.rotation, this._scope.rotation, 0.15);
    //glMatrix.quat.rotateY(this._scope.rotation, this._scope.rotation, 0.25);

    this.updateBestFit();

    this._scope.$watch('lodBias', function () {
      webgl.draw(self);
    }, true);
    this._scope.$watch('zDistance', function () {
      webgl.draw(self);
    }, true);
    this._scope.$watch('gamma', function () {
      webgl.draw(self);
    }, true);

    this._scope.$watch('pointer.inProgressDrag', function () {
      webgl.draw(self);
    }, true);
  };

  Controller.prototype.applyRotation = function (pixels) {
      var radians = pixels / this._scope.pixelsToRadians;
      switch (this._scope.axis) {
      case 'x':
        this._transform = this._transform.rotateX(radians);
        break;
      case 'y':
        this._transform = this._transform.rotateY(radians);
        break;
      case 'z':
        this._transform = this._transform.rotateZ(radians);
        break;
      }
    this.updateBestFit();
  };
  Controller.prototype.rotate90 = function () {
    this._transform = this._transform.rotateZ(Math.PI / 2);
    this.updateBestFit();
  };

  Controller.prototype.updateBestFit = function() {
    var transform = this._transform,
      device = transform.normalizedDeviceCoordinates(),
      nearXY = transform.projectDeviceXYToNearPlaneXY(device);

    // Solve for ideal rectangle size in near-plane XY coordinates,
    // the solution for which defines the ideal frustum size.
    var model = new Model(nearXY);

    var bestFit = new Solver().findBestFitSolution(model);

    // Map the solution to local photo coordinates.
    var localFit = transform.projectNearPlaneXYToLocalXY([
      [bestFit.xMin, bestFit.yMax, -transform.near, 1],
      [bestFit.xMin, bestFit.yMin, -transform.near, 1],
      [bestFit.xMax, bestFit.yMin, -transform.near, 1],
      [bestFit.xMax, bestFit.yMax, -transform.near, 1]]);

    var gl = this._webgl.getGl();
    this._webgl.useShaderProgram(this._shaderProgram);

    var s = new Segment(localFit[0], localFit[1]);
    gl.uniform3f(this._shaderProgram.clip1Uniform, s.normal[0], s.normal[1], s.b);
    s = new Segment(localFit[1], localFit[2]);
    gl.uniform3f(this._shaderProgram.clip2Uniform, s.normal[0], s.normal[1], s.b);
    s = new Segment(localFit[2], localFit[3]);
    gl.uniform3f(this._shaderProgram.clip3Uniform, s.normal[0], s.normal[1], s.b);
    s = new Segment(localFit[3], localFit[0]);
    gl.uniform3f(this._shaderProgram.clip4Uniform, s.normal[0], s.normal[1], s.b);

    this._bestFit = bestFit;
    console.log(bestFit);

    //  Compute clip lines to pass to fragment shader.
  };
  Controller.prototype.draw = function (gl, viewportWidth, viewportHeight) {
    this._webgl.useShaderProgram(this._shaderProgram);

    // Load the perspective and modelview matrices.
    var mvMatrix = mat4.create(),
        pMatrix = mat4.create();

    var transform = this._transform
      .viewport(0, 0, viewportWidth, viewportHeight);

    var viewAspect = viewportWidth / viewportHeight;

    var photoWidth = this._bestFit.xMax - this._bestFit.xMin,
        photoHeight = this._bestFit.yMax - this._bestFit.yMin,
        photoAspect = photoWidth / photoHeight,
        ratio = photoAspect / viewAspect;

    if (ratio > 1) {
      transform.frustumLeft = this._bestFit.xMin;
      transform.frustumRight = this._bestFit.xMax;

      var yCenter = (this._bestFit.yMax + this._bestFit.yMin) / 2.0,
          ySpan = 0.5 * photoHeight * ratio;

      transform.frustumTop = yCenter + ySpan;
      transform.frustumBottom = yCenter - ySpan;
    } else {
      var xCenter = (this._bestFit.xMax + this._bestFit.xMin) / 2.0,
          xSpan = 0.5 * photoWidth / ratio;

      transform.frustumLeft = xCenter - xSpan;
      transform.frustumRight = xCenter + xSpan;

      transform.frustumTop = this._bestFit.yMax;
      transform.frustumBottom = this._bestFit.yMin;
    }

    // update frustum with best-fit.

    transform.modelViewMatrix(mvMatrix);
    transform.perspectiveMatrix(pMatrix);

    gl.uniformMatrix4fv(this._shaderProgram.mvMatrixUniform, false, mvMatrix);
    gl.uniformMatrix4fv(this._shaderProgram.pMatrixUniform, false, pMatrix);

    var tileCuller = new TileCuller(mvMatrix, pMatrix,
      viewportWidth, viewportHeight);

    var viewableTiles = tileCuller.viewableTiles(
      this._rootTile, parseFloat(this._scope.lodBias));
    this._scope.activeTiles = viewableTiles.length;

    for (var i = 0; i !== viewableTiles.length; ++i) {
      this.drawTile(gl, viewableTiles[i]);
    }
  };

  Controller.prototype.drawTile = function (gl, tile) {

    var geometry = this._tileGeometry.getGeometry(tile);
    var texture = this._tileTextures.getTexture(tile);

    gl.bindBuffer(gl.ARRAY_BUFFER, geometry.vertexBuffer);
    gl.vertexAttribPointer(this._shaderProgram.vPositionAttribute,
      geometry.vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, geometry.textureBuffer);
    gl.vertexAttribPointer(this._shaderProgram.vTexture0Attribute,
      geometry.textureBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(this._shaderProgram.samplerUniform, 0);

    var gamma = parseFloat(this._scope.gamma);
    gl.uniform4fv(this._shaderProgram.gammaUniform, [gamma, gamma, gamma, 1.0]);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0,
      geometry.vertexBuffer.length / geometry.vertexBuffer.itemSize);
  };

  Controller.$inject = [
    '$scope',
    '$window',
    'tileGeometry',
    'tileTextures',
    'webgl',
  ];
  return Controller;
});
