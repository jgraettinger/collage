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

      // Bottom left corner (equivalent at multiple levels).
      expect(culler.toScreen(rootTile.level, 0, 0)).toEqual(
        vec4.fromValues(256, 192, 0, 1));
      expect(culler.toScreen(rootTile.level - 1, 0, 0)).toEqual(
        vec4.fromValues(256, 192, 0, 1));
      expect(culler.toScreen(rootTile.level - 2, 0, 0)).toEqual(
        vec4.fromValues(256, 192, 0, 1));
      // Upper left corner
      expect(culler.toScreen(rootTile.level - 2, 0, 3)).toEqual(
        vec4.fromValues(256, 576, 0, 1));
      // Upper-right corner.
      expect(culler.toScreen(rootTile.level - 2, 4, 3)).toEqual(
        vec4.fromValues(768, 576, 0, 1));
      // Lower right corner (equivalent at multiple levels).
      expect(culler.toScreen(rootTile.level - 2, 4, 0)).toEqual(
        vec4.fromValues(768, 192, 0, 1));
      expect(culler.toScreen(rootTile.level - 1, 2, 0)).toEqual(
        vec4.fromValues(768, 192, 0, 1));
      // Horizontal center, two-thirds of vertical.
      expect(culler.toScreen(rootTile.level - 1, 1, 1)).toEqual(
        vec4.fromValues(512, 448, 0, 1));
      expect(culler.toScreen(rootTile.level - 2, 2, 2)).toEqual(
        vec4.fromValues(512, 448, 0, 1));
      // Horizontal center, one-third of vertical.
      expect(culler.toScreen(rootTile.level - 2, 2, 1)).toEqual(
        vec4.fromValues(512, 320, 0, 1));

      // Outside of the screen bounds (note that W is now zero).
      expect(culler.toScreen(rootTile.level - 1, 4, 1)).toEqual(
        vec4.fromValues(1280, 448, 0, 0));
      expect(culler.toScreen(rootTile.level - 1, 1, 3)).toEqual(
        vec4.fromValues(512, 960, 0, 0));
    });
    it('enumerates appropriately-sized and viewable tiles', function () {
      var mvMatrix = mat4.create(),
        pMatrix = mat4.create(),
        photo = {
          width: 2048,
          height: 2048,
        },
        rootTile = Tile.buildRootTile(photo);
      // Set up a modelview and ortho projection which is slightly
      // more than a quarter of the centered the photo.
      mat4.identity(mvMatrix);
      mat4.translate(mvMatrix, mvMatrix, [-1024, -1024, -2]);
      mat4.ortho(pMatrix, -513, 513, -511, 511, 1, 3);

      var culler = new TileCuller(mvMatrix, pMatrix, 512, 384);

      // Gathered tiles are all at level 1. wIndex [0,3] is enumerated,
      // but only hIndex [1,2] is enumerated, because the one-pixel
      // difference in the orth projection causes them to be culled.
      expect(culler.viewableTiles(rootTile, 0)).toEqual([
        new Tile(photo, 1, 3, 2),
        new Tile(photo, 1, 2, 2),
        new Tile(photo, 1, 1, 2),
        new Tile(photo, 1, 0, 2),
        new Tile(photo, 1, 3, 1),
        new Tile(photo, 1, 2, 1),
        new Tile(photo, 1, 1, 1),
        new Tile(photo, 1, 0, 1),
      ]);
      // Passing a lower LOD bias results in level 2 tiles being returned.
      expect(culler.viewableTiles(rootTile, -1)).toEqual([
        new Tile(photo, 2, 1, 1),
        new Tile(photo, 2, 0, 1),
        new Tile(photo, 2, 1, 0),
        new Tile(photo, 2, 0, 0),
      ]);
      // Likewise, culling for a smaller viewport results in level 2 tiles.
      culler = new TileCuller(mvMatrix, pMatrix, 256, 192);
      expect(culler.viewableTiles(rootTile, 0)).toEqual([
        new Tile(photo, 2, 1, 1),
        new Tile(photo, 2, 0, 1),
        new Tile(photo, 2, 1, 0),
        new Tile(photo, 2, 0, 0),
      ]);
    });
  });
});
