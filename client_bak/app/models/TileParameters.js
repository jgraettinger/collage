'use strict';

define(['collageConstants'], function(constants) {
  function TileParameters(imageKey,
                          tileType,
                          xBegin,
                          xEnd,
                          yBegin,
                          yEnd,
                          stride) {
    if (xEnd < xBegin || yEnd < yBegin) {
      throw new RangeError("Invalid tile bounds");
    }
    if (tileType != 'image') {
      throw new TypeError('Invalid tile type ' + tileType);
    }
    this.imageKey = imageKey;
    this.tileType = tileType;
    this.xBegin = xBegin;
    this.xEnd = xEnd;
    this.yBegin = yBegin;
    this.yEnd = yEnd;
    this.stride = stride;
  };
  TileParameters.prototype.asUrl = function() {
    return constants.tileApiEndpoint + '/' +
      this.imageKey + '/' +
      this.tileType + '/' +
      [this.xBegin, this.xEnd,
       this.yBegin, this.yEnd,
       this.stride].join(',') +
      '.png';
  };
  return TileParameters;
});
