'use strict';

define([
  'angular',
  'collage/directives/webgl-canvas',
  'collage/services/tile-geometry',
  'collage/services/tile-textures',
  'collage/services/webgl',
], function (angular, WebglCanvas, TileGeometry, TileTextures, Webgl) {
  var module = angular.module('collage.webgl', []);
  module.factory('webgl', Webgl);
  module.factory('tileGeometry', TileGeometry);
  module.factory('tileTextures', TileTextures);
  module.directive('webglCanvas', WebglCanvas);
  return module;
});
