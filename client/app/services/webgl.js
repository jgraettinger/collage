'use strict';
/*jshint bitwise: false*/

define([
  'angular',
  'underscore',
  'webgl-debug',
  'collage/models/pointer',
], function (angular, _, WebglDebug, Pointer) {

  var Factory = function ($window, $rootScope, mainContextPointer) {

    /* Constructor */
    function throwOnError(err, funcName, args) {
      throw WebglDebug.glEnumToString(err) + " was cased by call to: " + funcName;
    };

    function Webgl() {
      this._canvas = angular.element('<canvas>');
      mainContextPointer.bindTo(this._canvas, $rootScope);

      /*
      this._gl = WebglDebug.makeDebugContext(
        this._canvas[0].getContext('webgl'), throwOnError);
      */
      this._gl = this._canvas[0].getContext('webgl');
      //console.log(this._gl.getSupportedExtensions());
      if (!this._gl) {
        throw new Error('Failed to initialize a WebGL context');
      }
    }
    Webgl.prototype.getGl = function() {
      return this._gl;
    };
    Webgl.prototype.buildFragmentShader = function (sourceCode) {
      return this._buildShader(this._gl.FRAGMENT_SHADER, sourceCode);
    };
    Webgl.prototype.buildVertexShader = function (sourceCode) {
      return this._buildShader(this._gl.VERTEX_SHADER, sourceCode);
    };
    Webgl.prototype._buildShader = function (type, sourceCode) {
      var shader = this._gl.createShader(type);
      this._gl.shaderSource(shader, sourceCode);
      this._gl.compileShader(shader);

      if (!this._gl.getShaderParameter(shader, this._gl.COMPILE_STATUS)) {
        throw new Error(this._gl.getShaderInfoLog(shader));
      }
      return shader;
    };

    Webgl.prototype.buildShaderProgram = function (vertexShader, fragShader) {
      var program = this._gl.createProgram();
      this._gl.attachShader(program, vertexShader);
      this._gl.attachShader(program, fragShader);
      this._gl.linkProgram(program);

      if (!this._gl.getProgramParameter(program, this._gl.LINK_STATUS)) {
        throw new Error(this._gl.getProgramInfoLog(program));
      }
      return program;
    };

    Webgl.prototype.buildBuffer = function (data) {
      var handle = this._gl.createBuffer();
      this._gl.bindBuffer(this._gl.ARRAY_BUFFER, handle);
      this._gl.bufferData(this._gl.ARRAY_BUFFER, new Float32Array(data),
        this._gl.STATIC_DRAW);
      var err = this._gl.getError();
      if (err !== this._gl.NO_ERROR) {
        throw new Error('GL Error: ' + err);
      }
      handle.itemSize = data.itemSize;
      handle.length = data.length;
      return handle;
    };

    Webgl.prototype.checkedGetAttribLocation = function (program, name) {
      var handle = this._gl.getAttribLocation(program, name);
      if (handle === -1) {
        throw new Error(name + ' not found in program: ' + this._gl.getError());
      }
      return handle;
    };

    Webgl.prototype.checkedGetUniformLocation = function (program, name) {
      var handle = this._gl.getUniformLocation(program, name);
      if (handle === null) {
        throw new Error(name + ' not found in program: ' + this._gl.getError());
      }
      return handle;
    };

    Webgl.prototype.useShaderProgram = function (program) {
      this._gl.validateProgram(program);
      if (!this._gl.getProgramParameter(program, this._gl.VALIDATE_STATUS)) {
        throw new Error(this._gl.getProgramInfoLog(program));
      }
      this._gl.useProgram(program);
    };

    // Response handler for window resize or CSS changes which
    // potentially affect the canvas's layout size.
    Webgl.prototype.possiblyResized = function () {
      console.log('possiblyResized called');
    };

    Webgl.prototype.loadTexture = function (imageSrc) {
      var texture = this._gl.createTexture();
      texture.image = new Image();

      var gl = this._gl;
      texture.image.onload = function () {
        gl.bindTexture(gl.TEXTURE_2D, texture);

        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
        gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);

        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA,
          gl.RGBA, gl.UNSIGNED_BYTE, texture.image);

        gl.texParameteri(gl.TEXTURE_2D,
          gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D,
          gl.TEXTURE_MIN_FILTER, gl.LINEAR);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        gl.bindTexture(gl.TEXTURE_2D, null);
      };
      texture.image.src = imageSrc;
      return texture;
    };

    Webgl.prototype.draw = function (sceneGraph) {
      console.log('Webgl.draw called');
      // Update the canvas size if the client size has changed since the last frame.
      var canvas = this._canvas[0];
      if (canvas.width !== canvas.clientWidth ||
        canvas.height !== canvas.clientHeight) {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
        console.log('updated canvas size to: ' + canvas.width + ' ' +
          canvas.height);
      }
      this._gl.enable(this._gl.DEPTH_TEST);
      this._gl.clearColor(0, 0, 0, 1);
      this._gl.viewport(0, 0, canvas.width, canvas.height);
      //this._gl.clear(this._gl.COLOR_BUFFER_BIT | this._gl.DEPTH_BUFFER_BIT);

      sceneGraph.draw(this._gl, canvas.width, canvas.height);
      this.checkError();
    };
    Webgl.prototype.checkError = function () {
      var err = this._gl.getError();
      if (err !== this._gl.NO_ERROR) {
        throw new Error('GL Error: ' + err);
      }
    }

    var instance = new Webgl();
    angular.element($window).bind('resize',
      _.bind(instance.possiblyResized, instance));
    return instance;
  };
  Factory.$inject = ['$window', '$rootScope', 'mainContextPointer'];
  return Factory;
});
