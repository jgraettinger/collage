'use strict';

define([
    'angular',
    'angularMocks',
    'models/TileParameters',
    'common/TileLoader'
  ], function(angular, mocks, TileParameters, _) {

  describe('TileLoaderTests', function() {
    beforeEach(module('collage'));

    var $rootScope;
    var TileLoader;
    beforeEach(inject(function(_$rootScope_, _TileLoader_) {
      $rootScope = _$rootScope_;
      TileLoader = _TileLoader_;
    }));

    it("loads a valid tile and resolves it's promise", function() {
      var calledBack = false;
      runs(function() {
        var params = new TileParameters('a-photo-key', 'image',
                                        64, 128, 64, 128, 2);
        var promise = TileLoader.load(params);

        promise.then(function(tile) {
          expect(tile.parameters).toEqual(params);
          expect(tile.image.width).toEqual(32);
          expect(tile.image.height).toEqual(32);
          calledBack = true;
        }, function(tile) {
          throw new Error(tile);
        });
      });
      waitsFor(function() {
        $rootScope.$apply();
        return calledBack;
      }, "The promise should have been called", 100);
    });

    it('rejects a promise on invalid tile load', function() {
      var calledBack = false;
      runs(function() {
        var params = new TileParameters('404-key', 'image',
                                        64, 128, 64, 128, 2);
        var promise = TileLoader.load(params);

        promise.then(function(tile) {
          throw new Error(tile);
        }, function(tile) {
          expect(tile.parameters).toEqual(params);
          calledBack = true;
        });
      });
      waitsFor(function() {
        $rootScope.$apply();
        return calledBack;
      }, "The promise should have been called", 100);
    });
  });
});
