/*jshint bitwise: false*/
'use strict';

define([
  'gl-matrix',
  'models/tile',
], function (glMatrix, Tile) {
  var vec2 = glMatrix.vec2,
    vec4 = glMatrix.vec4,
    mat4 = glMatrix.mat4;

  var BoundingBox = function (xMin, xMax, yMin, yMax) {
    this.xMin = xMin;
    this.xMax = xMax;
    this.yMin = yMin;
    this.yMax = yMax;
  };
  BoundingBox.prototype.test = function (point) {
    if (point[0] >= this.xMin && point[0] < this.xMax &&
      point[1] >= this.yMin && point[1] < this.yMax) {
      return true;
    }
    return false;
  };

  var TileCuller = function (mvMatrix, pMatrix, viewWidth, viewHeight) {
    this.transform = mat4.create();
    this.viewWidth = viewWidth;
    this.viewHeight = viewHeight;
    this.screenBox = new BoundingBox(0, viewWidth, 0, viewHeight);
    this._memo = {};

    mat4.multiply(this.transform, pMatrix, mvMatrix);
  };
  // Maps a tile level and offset to screen coordinates.
  TileCuller.prototype.toScreen = function (level, wIndex, hIndex) {
    var key = level + ':' + wIndex + ':' + hIndex;
    if (this._memo[key]) {
      return this._memo[key];
    }
    var v = vec4.fromValues((Tile.SIZE << level) * wIndex,
        -(Tile.SIZE << level) * hIndex, 0, 1);

    // Transform from pixel coordinates to clip coordinates.
    vec4.transformMat4(v, v, this.transform);
    // Transform into normalized device coordinates.
    vec2.scale(v, v, 1.0 / v[3]);
    // Transform into window coordinates. Z is omitted.
    v[0] = 0.5 * (v[0] * this.viewWidth + this.viewWidth);
    v[1] = 0.5 * (v[1] * this.viewHeight + this.viewHeight);
    v[2] = 0;

    // Test whether the vertex falls within the screen bounding box,
    // and re-use the W component to store the result.
    if (this.screenBox.test(v)) {
      v[3] = 1.0;
    } else {
      v[3] = 0.0;
    }
    this._memo[key] = v;
    return v;
  };
  /* Gathers tiles of the root's tile tree which are most-appropriate
   * for the configured frustum and viewport. Result tiles are both
   * most-likely viewable, and at an approximately ideal level of detail
   * for their screen projection. */
  TileCuller.prototype.viewableTiles = function (rootTile, lodBias) {
    var viewable = [],
      stack = [rootTile];

    while (stack.length) {
      var tile = stack.pop(),
        v0 = this.toScreen(tile.level, tile.wIndex, tile.hIndex),
        v1 = this.toScreen(tile.level, tile.wIndex + 1, tile.hIndex),
        v2 = this.toScreen(tile.level, tile.wIndex, tile.hIndex + 1),
        v3 = this.toScreen(tile.level, tile.wIndex + 1, tile.hIndex + 1);

      // Is this tile visible? Eg, does a corner of the tile fall within the
      // screen, or does a corner of the screen fall within the tile bound-box?
      if (!(v0[3] || v1[3] || v2[3] || v3[3])) {
        var tileBox = new BoundingBox(
          Math.min(v0[0], v1[0], v2[0], v3[0]),
          Math.max(v0[0], v1[0], v2[0], v3[0]),
          Math.min(v0[1], v1[1], v2[1], v3[1]),
          Math.max(v0[1], v1[1], v2[1], v3[1]));

        if (tileBox.test([0, 0]) ||
          tileBox.test([this.viewWidth, 0]) ||
          tileBox.test([0, this.viewHeight]) ||
          tileBox.test([this.viewWidth, this.viewHeight])) {
          // A corner of the screen possibly overlaps the tile.
        } else {
          // Definitely no overlap.
          continue;
        }
      }
      if (tile.level === 0) {
        viewable.push(tile);
        continue;
      }

      // Discrete derivatives of screen pixels in terms of dU and dV.
      var dU = vec2.distance(v0, v1) / Tile.SIZE,
        dV = vec2.distance(v0, v2) / Tile.SIZE;

      // If derivatives are larger than 1, a texel of this tile would map to
      // multiple screen pixels. Split the tile to acheive a ratio under 1,
      // accounting for a bias heuristic.
      if (dU + lodBias > 1 || dV + lodBias > 1) {
        stack.push.apply(stack, tile.children());
      } else {
        viewable.push(tile);
      }
    }
    return viewable;
  };
  // Exposed for unit-testing.
  TileCuller._BoundingBox = BoundingBox;
  return TileCuller;
});
