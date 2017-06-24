define(['gl-matrix'], function(glMat) {
  'use strict';
  return function(canvas) {
    try {
      var gl = canvas.getContext('experimental-webgl');
      gl.viewportWidth = canvas.width;
      gl.viewportHeight = canvas.height;
    } catch (e) {
      console.log(e);
    }
    if (!gl) {
      alert("Failed to initialize a WebGL context.");
    }

    // Initialize modelview and projection matricies.
    gl.mvMatrix = glMat.mat4.create();
    gl.pMatrix = glMat.mat4.create();

    // Type should be one of gl.FRAGMENT_SHADER or gl.VERTEX_SHADER.
    gl.buildShaderFromSource = function(type, sourceCode) {
      var shader = gl.createShader(type);
      gl.shaderSource(shader, sourceCode);
      gl.compileShader(shader);

      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        throw new Error(gl.getShaderInfoLog(shader));
      }
      return shader;
    }

    gl.buildShaderProgram = function(vertexShader, fragmentShader) {
      var program = gl.createProgram();
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);

      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error(gl.getShaderInfoLog(program));
      }
      return program;
    }

    gl.setShaderProgram = function(program) {
      gl.useProgram(program);

      program.vertexAttribute = gl.getAttribLocation(program, "aVertex");
      gl.enableVertexAttribArray(program.vertexAttribute);

      program.pMatrix = gl.getUniformLocation(program, "uPMatrix");
      program.mvMatrix = gl.getUniformLocation(program, "uMVMatrix");
    }
    return gl;
  }
});
