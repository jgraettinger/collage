'use strict';

define([
  'angular',
  'collage/directives/webgl-canvas',
  'collage/services/tile-geometry',
  'collage/services/tile-textures',
  'collage/services/composite-texture-builder',
  'collage/services/webgl',
], function (angular, WebglCanvas, TileGeometry, TileTextures, CompositeTextureBuilder, Webgl) {
  var module = angular.module('collage.webgl', []);
  module.factory('webgl', Webgl);
  module.factory('tileGeometry', TileGeometry);
  module.factory('tileTextures', TileTextures);
  module.factory('compositeTextureBuilder', CompositeTextureBuilder);
  module.directive('webglCanvas', WebglCanvas);
  console.log("WEBGL module name: " + module.name);
  return module;
});
