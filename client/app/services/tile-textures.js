'use strict';

define([], function () {
  var Factory = function (webgl) {

    function TileTextures() {
      this._texture = webgl.loadTexture(
        'images/lena256.BMP');
    }
    TileTextures.prototype.getTextures = function ( /*tile*/ ) {
      return this._texture;
    };
    return new TileTextures();
  };
  Factory.$inject = ['webgl'];
  return Factory;
});
