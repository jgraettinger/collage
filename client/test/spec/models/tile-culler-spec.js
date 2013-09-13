/*jshint bitwise: false*/
'use strict';

define([
  'gl-matrix',
  'collage/models/tile',
  'collage/models/tile-culler',
], function (glMatrix, Tile, TileCuller) {
  var mat4 = glMatrix.mat4,
    vec4 = glMatrix.vec4;

  describe('collage/models/tile-culler', function () {
    it('has a helper for bounding-box tests', function () {
      // xMin & yMin are inclusive, xMax & yMax exlusive.
      var box = new TileCuller._BoundingBox(10, 20, 30, 40);
      expect(box.test([15, 35])).toBeTruthy();
      expect(box.test([25, 45])).toBeFalsy();

      expect(box.test([9, 35])).toBeFalsy();
      expect(box.test([10, 35])).toBeTruthy();
      expect(box.test([20, 35])).toBeFalsy();
      expect(box.test([19, 35])).toBeTruthy();

      expect(box.test([15, 29])).toBeFalsy();
      expect(box.test([15, 30])).toBeTruthy();
      expect(box.test([15, 40])).toBeFalsy();
      expect(box.test([15, 39])).toBeTruthy();
    });

    it('projects tile coordinates to screen coordinates', function () {
      var mvMatrix = mat4.create(),
        pMatrix = mat4.create(),
        photo = {
          width: 1024,
          height: 768,
        },
        rootTile = Tile.buildRootTile(photo);
      // Set up a modelview and ortho projection
      // which quarters and centers the photo.
      mat4.identity(mvMatrix);
      mat4.scale(mvMatrix, mvMatrix, [0.5, 0.5, 1]);
      mat4.translate(mvMatrix, mvMatrix, [-512, -384, -2]);
      mat4.ortho(pMatrix, -512, 512, -384, 384, 1, 3);

      var culler = new TileCuller(mvMatrix, pMatrix, 1024, 768);

      expect(culler.toScreen(rootTile.level, 0, 0)).toEqual(
        vec4.fromValues(256, 192, 0, 1));

      expect(culler.toScreen(rootTile.level - 1, 1, 1)).toEqual(
        vec4.fromValues(512, 448, 0, 1));

      // Note this isn't 
      expect(culler.toScreen(rootTile.level, 1, 1)).toEqual(
        vec4.fromValues(768, 704, 0, 1));
    });
  });
});
