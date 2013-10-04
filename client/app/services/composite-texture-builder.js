'use strict';

define([
  'text!collage/shaders/composite-texture.vert',
  'text!collage/shaders/composite-texture.frag',
], function (vertShaderSource, fragShaderSource) {
  var Factory = function (webgl) {
    var gl = webgl.getGl();

    function CompositeTextureBuilder() {
      this._vertShader = webgl.buildVertexShader(vertShaderSource);
      this._fragShader = webgl.buildFragmentShader(fragShaderSource);
      this._program = webgl.buildShaderProgram(
        this._vertShader, this._fragShader);

      this._program.vPosition = webgl.checkedGetAttribLocation(
        this._program, 'vPosition');
      gl.enableVertexAttribArray(this._program.vPosition);

      this._program.uSamplerHigh = webgl.checkedGetUniformLocation(
        this._program, 'uSamplerHigh');
      this._program.uSamplerLow = webgl.checkedGetUniformLocation(
        this._program, 'uSamplerLow');

      var vertexData = [
        -1.0, -1.0, 0,
        -1.0, 1.0, 0,
        1.0, -1.0, 0,
        1.0, 1.0, 0,
      ];
      vertexData.itemSize = 3;
      this._vertexBuffer = webgl.buildBuffer(vertexData);

      this._supported = gl.getSupportedExtensions();

      this._halfFloatExt = gl.getExtension('OES_texture_half_float');
      this._halfFloatLinearExt = gl.getExtension(
        'OES_texture_half_float_linear');

      this._floatExt = gl.getExtension('OES_texture_float');
      this._floatLinearExt = gl.getExtension(
        'OES_texture_float_linear');
    };

    CompositeTextureBuilder.prototype.build = function (
        width, height, highBitsTexture, lowBitsTexture) {

      webgl.useShaderProgram(this._program);

      // Create a texture to capture the composite.
      var compositeTexture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, compositeTexture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGB,
        256,
        256,
        0,
        gl.RGB,
        //this._halfFloatExt.HALF_FLOAT_OES,
        gl.FLOAT,
        null);

      // Create the framebuffer, mapped to our render texture.
      var framebuffer = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
      gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0,
        gl.TEXTURE_2D,
        compositeTexture,
        0);
      gl.bindTexture(gl.TEXTURE_2D, null);

      var check = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
      if (check !== gl.FRAMEBUFFER_COMPLETE) {
        throw new Error('Framebuffer setup failed: ' + check);
      }
      gl.viewport(0, 0, 256, 256);

      gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexBuffer);
      gl.vertexAttribPointer(this._program.vPosition,
          this._vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, highBitsTexture);
      gl.uniform1i(this._program.uSamplerHigh, 0);

      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, lowBitsTexture);
      gl.uniform1i(this._program.uSamplerLow, 0);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0,
        this._vertexBuffer.length / this._vertexBuffer.itemSize);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, null);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, null);

      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.bindRenderbuffer(gl.RENDERBUFFER, null);
      gl.deleteFramebuffer(framebuffer);

      return compositeTexture;
    };
    return new CompositeTextureBuilder();
  };
  Factory.$inject = ['webgl'];
  return Factory;
});
