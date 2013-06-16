'use strict';

define(['common/CollageModule'], function(CollageModule) {
  var TileLoaderProvider =
    CollageModule.service('TileLoader', function($q) {

    this.load = function(tileParameters) {
      var tile = {
        deferred: $q.defer(),
        image: new Image(),
        parameters: tileParameters,
      };
      tile.image.onload = function() {
        if (this.naturalHeight + this.naturalWidth === 0) {
          console.log('onload with invalid size');
          tile.deferred.reject(tile);
          return;
        }
        tile.deferred.resolve(tile);
      }
      tile.image.onerror = function() {
        tile.deferred.reject(tile);
      }
      tile.image.src = tileParameters.asUrl();
      return tile.deferred.promise;
    };
  });
  TileLoaderProvider.$inject = ['$q'];
});
