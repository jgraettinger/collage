'use strict';

define([
  'gl-matrix',
  'largest_rectangle/Transform',
  'text!collage/shaders/main.vert',
  'text!collage/shaders/main.frag',
], function (
  glMatrix,
  Transform,
  vertexShaderSource,
  fragmentShaderSource) {
  var mat4 = glMatrix.mat4;

  var Controller = function ($scope, webgl, $window) {
    this._scope = $scope;

    this._scope.awesomeThings = [
      'HTML5 Boilerplate',
      'AngularJS',
      'Karma'
    ];
    this._transform = Transform.basic();

    // Compile and install vertex & fragment shaders.
    this._vertexShader = webgl.buildVertexShader(vertexShaderSource);
    this._fragmentShader = webgl.buildFragmentShader(fragmentShaderSource);
    this._shaderProgram = webgl.buildShaderProgram(this._vertexShader,
      this._fragmentShader);
    webgl.useShaderProgram(this._shaderProgram);

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

    // As we're drawing a strip, re-order the counter-clockwise transform order.
    var v = this._transform.localCoordinates();
    var buf = [
      v[0][0], v[0][1], v[0][2],
      v[1][0], v[1][1], v[1][2],
      v[3][0], v[3][1], v[3][2],
      v[2][0], v[2][1], v[2][2]
    ];
    buf.itemSize = 3;
    this._vertexBuffer = webgl.buildBuffer(buf);

    buf = [
      0.0, 1.0,
      0.0, 0.0,
      1.0, 1.0,
      1.0, 0.0
    ];
    buf.itemSize = 2;
    this._texture0Buffer = webgl.buildBuffer(buf);

    this._texture = webgl.loadTexture('images/test-pattern-1024x768.png');

    var self = this;
    setTimeout(function () {
      webgl.draw(self);
    }, 500);
    angular.element($window).bind('resize',
      function () {
        webgl.draw(self);
      });
  };

  Controller.prototype.draw = function (gl) {
    // Load the perspective and modelview matrices.
    var m = mat4.create();
    this._transform.modelViewMatrix(m);
    gl.uniformMatrix4fv(this._shaderProgram.mvMatrixUniform, false, m);
    this._transform.perspectiveMatrix(m);
    gl.uniformMatrix4fv(this._shaderProgram.pMatrixUniform, false, m);

    gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexBuffer);
    gl.vertexAttribPointer(this._shaderProgram.vPositionAttribute,
      this._vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, this._texture0Buffer);
    gl.vertexAttribPointer(this._shaderProgram.vTexture0Attribute,
      this._texture0Buffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this._texture);
    gl.uniform1i(this._shaderProgram.samplerUniform, 0);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0,
      this._vertexBuffer.length / this._vertexBuffer.itemSize);

    console.log('finished controller.draw()');
  };
  Controller.$inject = ['$scope', 'webgl', '$window'];
  return Controller;
});
