'use strict';

define([], function () {
  var Factory = function ($q, $rootScope, webgl, compositeTextureBuilder) {
    var gl = webgl.getGl();

    function TileTextures() {
      this._imageCache = {};
      this._textureCache = {};
    }

    TileTextures.prototype._loadImage = function (url) {
      var promise = this._imageCache[url];
      if (promise !== undefined) {
        return promise;
      }
      var deferred = $q.defer();

      var image = new Image();
      image.onload = function () {
        deferred.resolve(image);
        $rootScope.$apply();
      };
      image.onerror = function (error) {
        deferred.reject(error);
        $rootScope.$apply();
      };
      image.src = url;

      this._imageCache[url] = deferred.promise;
      return deferred.promise;
    };

    TileTextures.prototype._buildImageTexture = function (image) {
      var texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);

      // Textures are in linear RGB colorspace, and should be kept that way.
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);

      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB,
        gl.RGB, gl.UNSIGNED_BYTE, image);

      gl.texParameteri(gl.TEXTURE_2D,
        gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D,
        gl.TEXTURE_MIN_FILTER, gl.LINEAR);

      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

      gl.bindTexture(gl.TEXTURE_2D, null);
      return texture;
    };

    TileTextures.prototype._buildCompositeTexture = function (imageHigh,
      imageLow) {
      var highBitsTexture = this._buildImageTexture(imageHigh),
        lowBitsTexture = this._buildImageTexture(imageLow),
        compositeTexture = compositeTextureBuilder.build(
            imageHigh.width, imageHigh.height,
            highBitsTexture, lowBitsTexture);

      gl.deleteTexture(highBitsTexture);
      gl.deleteTexture(lowBitsTexture);
      return compositeTexture;
    };

    TileTextures.prototype.getTexture = function (tile) {
      var entry = this._textureCache[tile.key()];
      if (entry !== undefined) {
        return entry;
      }
      // Use null as a placeholder indicating the texture is loading.
      this._textureCache[tile.key()] = null;

      var url = 'images/tiles/' + tile.key(),
          p1 = this._loadImage(url + '-high.png'),
          p2 = this._loadImage(url + '-low.png');

      $q.all([p1, p2]).then(_.bind(function (images) {
        var texture = this._buildCompositeTexture(images[0], images[1]);
        this._textureCache[tile.key()] = texture;
      }, this));

      /*
      this._loadImage(url).then(_.bind(function (image) {
        var texture = this._buildImageTexture(image);
        this._textureCache[tile.key()] = texture;
      }, this));
      */

      /*
        .then(function (texture) {
        this._textureCache[tile.key()] = texture;
      });
      */

      return null;
    };
    return new TileTextures();
  };
  Factory.$inject = ['$q', '$rootScope', 'webgl', 'compositeTextureBuilder'];
  return Factory;
});
