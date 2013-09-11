'use strict';

define([], function () {

  var LOG2 = Math.log(2);

  var TILE_SHIFT = 8,
      TILE_SIZE = 1 << TILE_SHIFT;

  function Tile(photo, level, wIndex, hIndex) {
    this.photo = photo;
    this.level = level;
    this.wIndex = wIndex;
    this.hIndex = hIndex;

    // Debug assertion.
    var tileSize = 1 << (level + TILE_SHIFT);
    if (wIndex * tileSize >= photo.width) {
      throw new Error('Invalid level/wIndex: ' + level + '/' + wIndex);
    }
    if (hIndex * tileSize >= photo.height) {
      throw new Error('Invalid level/hIndex: ' + level + '/' + hIndex);
    }
  };
  Tile.SHIFT = TILE_SHIFT;
  Tile.SIZE = TILE_SIZE;

  Tile.maximumLevel = function (maxSpan) {
    if (maxSpan <= TILE_SIZE) {
      return 0;
    }
    return Math.ceil(Math.log(maxSpan) / LOG2) - TILE_SHIFT;
  };
  Tile.buildRootTile = function (photo) {
    if (!(photo.width > 0 && photo.height > 0)) {
      throw new Error('Invalid photo bounds');
    }
    var level = Tile.maximumLevel(Math.max(photo.width, photo.height));
    return new Tile(photo, level, 0, 0);
  };

  // Methods computing the tile's begin and end offsets.
  Tile.prototype.wBegin = function () {
    return (TILE_SIZE << this.level) * this.wIndex;
  };
  Tile.prototype.wEnd = function () {
    return Math.min(this.photo.width,
        (TILE_SIZE << this.level) * (this.wIndex + 1));
  };
  Tile.prototype.hBegin = function () {
    return (TILE_SIZE << this.level) * this.hIndex;
  };
  Tile.prototype.hEnd = function () {
    return Math.min(this.photo.height,
        (TILE_SIZE << this.level) * (this.hIndex + 1));
  };

  Tile.prototype.hasChildren = function () {
    return this.level > 0;
  };
  Tile.prototype.children = function () {
    var children = [];
    if (this.level === 0) {
      return children;
    }
    /* Parent tiles split themselves into up to four children, depending on
     * whether each potential child has overlap with the photo bounds.
     *
     * Specifically, children have one level less than the parent (half of the
     * parent tile's stride), and a wIndex/hIndex which has been shifted by
     * one, plus zero or one.
     */
    var level = this.level - 1,
        wIndex = this.wIndex << 1,
        hIndex = this.hIndex << 1,
        size = TILE_SIZE << level,
        // Would the right/bottom child tiles lay outside the photo bounds?
        wCheck = (wIndex + 1) * size < this.photo.width,
        hCheck = (hIndex + 1) * size < this.photo.height;

    // This tile is guaranteed to exist.
    children.push(new Tile(this.photo, level, wIndex, hIndex));
    if (wCheck) {
      children.push(new Tile(this.photo, level, wIndex + 1, hIndex));
    }
    if (hCheck) {
      children.push(new Tile(this.photo, level, wIndex, hIndex + 1));
    }
    if (wCheck && hCheck) {
      children.push(new Tile(this.photo, level, wIndex + 1, hIndex + 1));
    }
    return children;
  };
  return Tile;
});
