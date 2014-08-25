/*jshint bitwise: false*/
'use strict';

define([
  'collage/models/tile',
], function (Tile) {
  var Factory = function (webgl) {

    function TileGeometry() {
      this._cache = {};
    }
    TileGeometry.prototype.getGeometry = function (tile) {
      var geometry = this._cache[tile.key()];
      if (geometry !== undefined) {
        return geometry;
      }

      var vertexData = [
        tile.wBegin(), -tile.hBegin(), 0,
        tile.wBegin(), -tile.hEnd(), 0,
        tile.wEnd(), -tile.hBegin(), 0,
        tile.wEnd(), -tile.hEnd(), 0
      ];
      vertexData.itemSize = 3;

      var uMax = (tile.wEnd() - tile.wBegin()) / (1 << (Tile.SHIFT + tile.level)),
        vMax = (tile.hEnd() - tile.hBegin()) / (1 << (Tile.SHIFT + tile.level));

      var textureData = [
        0.0, 0.0,
        0.0, 1.0,
        1.0, 0.0,
        1.0, 1.0,
      ];
      textureData.itemSize = 2;

      geometry = {
        vertexBuffer: webgl.buildBuffer(vertexData),
        textureBuffer: webgl.buildBuffer(textureData),
      };
      this._cache[tile.key()] = geometry;
      return geometry;
    };
    return new TileGeometry();
  };
  Factory.$inject = ['webgl'];
  return Factory;
});
