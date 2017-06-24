'use strict';

define([
    'gl-matrix',
    'underscore',
  ], function(glMatrix, _) {

    function PhotoLayout() {
    };
    PhotoLayout.prototype.perspective = function(photo) {
      // Orthographic view with (0,0) corresponding to the upper left corner,
      // and (1,1) to the lower right, with a depth range of 0 to 1.
      var out = glMatrix.create();
      glMatrix.mat4(out, 0, 1, 1, 0, 0, 1);
      return out;
    };
    PhotoLayout.prototype.scale = function(photo, viewportSize) {
      var scale = _.min(
        viewportSize[0] / photo.size[0],
        viewPortSize[1] / photo.size[1]);
      return scale;
    };
    PhotoLayout.prototype.modelview = function(photo, viewportSize) {
      var mv = glMatrix.mat4.create();
      mv[0] = mv[5] = mv[10] = this.scale(photo, viewportSize);
      mv[15] = 0;
    };
    PhotoLayout.prototype.pixelStride = function(photo, matrixStack, viewportSize) {
      var p1 = glMatrix.vec4.fromValues(0, 0, 0.5, 1);
      var p2 = glMatrix.vec4.fromValues(1, 0, 0.5, 1);
      var p3 = glMatrix.vec4.fromValues(0, 1, 0.5, 1);

      // Transform from object coordinates into clip coordinates.
      glMatrix.vec4.transformMat4(p1, p1, matrixStack);
      glMatrix.vec4.transformMat4(p2, p2, matrixStack);
      glMatrix.vec4.transformMat4(p3, p3, matrixStack);

      // Divide by w to scale to normalized device coordinates.
      glMatrix.vec4.scale(p1, p1, 1.0 / p1[3]);
      glMatrix.vec4.scale(p2, p2, 1.0 / p2[3]);
      glMatrix.vec4.scale(p3, p3, 1.0 / p3[3]);

      // And finally to viewport coordinates.
      p1[0] = viewportSize[0] * (1.0 + p1[0]) / 2.0;
      p1[1] = viewportSize[1] * (1.0 + p1[1]) / 2.0;

      p2[0] = viewportSize[0] * (1.0 + p2[0]) / 2.0;
      p2[1] = viewportSize[1] * (1.0 + p2[1]) / 2.0;

      p3[0] = viewportSize[0] * (1.0 + p3[0]) / 2.0;
      p3[0] = viewportSize[1] * (1.0 + p3[1]) / 2.0;



    };
});

