define([
  'gl-matrix',
  'init_gl_context',
  'text!shader/image_editor.vert',
  'text!shader/image_editor.frag',
  ], function(glMat, initGLContext, vertexSource, fragmentSource) {
  'use strict';
  return function(canvas, imageSrc) {
    var gl = initGLContext(canvas);

    var vertexShader = gl.buildShaderFromSource(gl.VERTEX_SHADER, vertexSource);
    var pixelShader = gl.buildShaderFromSource(gl.FRAGMENT_SHADER, fragmentSource);
    var program = gl.buildShaderProgram(vertexShader, pixelShader);

    gl.setShaderProgram(program);

    //////////////////////////////////////////////////////////////////////
		var texture = gl.createTexture();
		texture.image = new Image();
		texture.image.onload = function() {
			gl.bindTexture(gl.TEXTURE_2D, texture);
			gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
			gl.bindTexture(gl.TEXTURE_2D, null);
		}
		texture.image.src = imageSrc;

    //////////////////////////////////////////////////////////////////////

    var squareVertexPositionBuffer;

    squareVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexPositionBuffer);
    vertices = [
       1.0,  1.0,  0.0,
      -1.0,  1.0,  0.0,
       1.0, -1.0,  0.0,
      -1.0, -1.0,  0.0
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    squareVertexPositionBuffer.itemSize = 3;
    squareVertexPositionBuffer.numItems = 4;

    squareVertexTextureBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexTextureBuffer);
    vertices = [
			 0.0, 0.0,
			 1.0, 0.0,
			 1.0, 1.0,
			 0.0, 1.0,
		];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    squareVertexPositionBuffer.itemSize = 2;
    squareVertexPositionBuffer.numItems = 4;
  
    var drawScene = function() {
      gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  
      glMat.mat4.perspective(gl.pMatrix, 45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0);
  
      glMat.mat4.identity(gl.mvMatrix);
      glMat.mat4.translate(gl.mvMatrix, gl.mvMatrix, [-1.5, 0.0, -7.0]);
  
			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, texture);
			gl.uniformli(shaderProgram.samplerUniform, 0);

    
      glMat.mat4.translate(gl.mvMatrix, gl.mvMatrix, [3.0, 0.0, 0.0]);
      gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexPositionBuffer);
      gl.vertexAttribPointer(program.vertexPositionAttribute, squareVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
      gl.uniformMatrix4fv(program.pMatrix, false, gl.pMatrix);
      gl.uniformMatrix4fv(program.mvMatrix, false, gl.mvMatrix);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, squareVertexPositionBuffer.numItems);
    }
  
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);
  
    drawScene();
    return gl;
  }
});


