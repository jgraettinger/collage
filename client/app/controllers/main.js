'use strict';

define([
  'gl-matrix',
  'largest_rectangle/Transform',
  'models/tile',
  'models/tile-culler',
  'text!collage/shaders/main.vert',
  'text!collage/shaders/main.frag',
], function (
  glMatrix,
  Transform,
  Tile,
  TileCuller,
  vertexShaderSource,
  fragmentShaderSource) {
  var mat4 = glMatrix.mat4;

  var Controller = function ($scope, $window, tileGeometry, tileTextures,
    webgl) {
    this._scope = $scope;

    this._scope.lodBias = 0;
    this._scope.zDistance = '-0.35';
    this._scope.activeTiles = 0;
    this._scope.gamma = '1.0';

    this._scope.awesomeThings = [
      'HTML5 Boilerplate',
      'AngularJS',
      'Karma'
    ];

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
      id: "foobar",
      width: 5216,
      height: 3472,
    };
    this._rootTile = Tile.buildRootTile(this._photo);

    this._scope.$watch('lodBias', function () {
      webgl.draw(self);
    }, true);
    this._scope.$watch('zDistance', function () {
      webgl.draw(self);
    }, true);
    this._scope.$watch('gamma', function () {
      webgl.draw(self);
    }, true);
  };

  Controller.prototype.draw = function (gl, viewportWidth, viewportHeight) {
    this._webgl.useShaderProgram(this._shaderProgram);
    // Load the perspective and modelview matrices.
    var mvMatrix = mat4.create();
    mat4.identity(mvMatrix);
    mat4.translate(mvMatrix, mvMatrix, [0, 0, parseFloat(this._scope.zDistance)]);
    mat4.rotate(mvMatrix, mvMatrix, 0.3, [0.5, 1, 1.5]);
    //
    var viewAspect = viewportWidth / viewportHeight,
        photoAspect = this._photo.width / this._photo.height;
    mat4.scale(mvMatrix, mvMatrix, [photoAspect / viewAspect, 1.0, 1.0]);

    mat4.translate(mvMatrix, mvMatrix, [-0.5, 0.5 * (this._photo.height /
      this._photo.width), 0]);
    mat4.scale(mvMatrix, mvMatrix, [1.0 / this._photo.width, 1.0 / this._photo
      .width, 1
    ]);

    var pMatrix = mat4.create();
    mat4.perspective(pMatrix, 45, 1.33333, 0.1, 100.0);

    gl.uniformMatrix4fv(this._shaderProgram.mvMatrixUniform, false,
      mvMatrix);
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
