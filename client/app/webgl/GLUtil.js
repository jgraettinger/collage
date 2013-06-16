'use strict';

define([], function() {
  return {
    buildShaderFromSource: function(gl, type, sourceCode) {
      var shader = gl.createShader(type);
      gl.shaderSource(shader, sourceCode);
      gl.compileShader(shader);

      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        throw new Error(gl.getShaderInfoLog(shader));
      }
      return shader;
    },
    buildShaderProgram: function(gl, vertexShader, fragmentShader) {
      var program = gl.createProgram();
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);

      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error(gl.getShaderInfoLog(program));
      }
      return program;
    },
    checkedGetAttribLocation: function(gl, program, name) {
      var handle = gl.getAttribLocation(program, name);
      if (handle == -1) {
        throw new Error(name + " not found in program: " + gl.getError());
      }
    },
    checkedGetUniformLocation: function(gl, program, name) {
      var handle = gl.getUniformLocation(program, name);
      if (handle === null) {
        throw new Error(name + " not found in program: " + gl.getError());
      }
    },
  };
  return GLUtil;
});

