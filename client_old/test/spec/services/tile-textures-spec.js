define([
    'collage/models/tile',
    'collage/modules/webgl',
    'collage/modules/collage',
], function (Tile, WebglModule, CollageModule) {

  var testUri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAA' +
  'ACCAIAAAD91JpzAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAGUlEQVQIHQEOAPH/AH8A' +
  'AAB/AAEAAH9/fwAPdgJ9dbtA+gAAAABJRU5ErkJggg==';

  describe('collage/services/tile-textures', function () {
    beforeEach(module(WebglModule.name));
    beforeEach(module(CollageModule.name));

    it('should build composite textures', inject(function (tileTextures) {
      var image = new Image(),
        loaded = false;

      image.onload = function() {
        loaded = true;
      };
      image.onerror = function(err) {
        console.log('Error: ');
        console.log(err);
      };
      image.src = testUri;

      waitsFor(function () {
        return loaded;
      }, "The image should be loaded", 750);

      runs(function() {
        tileTextures._buildCompositeTexture(image, image);
      });
    }));
  });
});
