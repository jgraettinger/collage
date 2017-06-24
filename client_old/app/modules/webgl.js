'use strict';

define([
  'angular',
  'collage/directives/webgl-canvas',
  'collage/modules/low-level-input',
  'collage/services/tile-geometry',
  'collage/services/tile-textures',
  'collage/services/composite-texture-builder',
  'collage/services/webgl',
], function (
  angular,
  WebglCanvasDirective,
  LowLevelInputModule,
  TileGeometry,
  TileTextures,
  CompositeTextureBuilder,
  Webgl) {
  var module = angular.module('collage.webgl', [LowLevelInputModule.name]);
  module.factory('webgl', Webgl);
  module.factory('tileGeometry', TileGeometry);
  module.factory('tileTextures', TileTextures);
  module.factory('compositeTextureBuilder', CompositeTextureBuilder);
  module.directive('webglCanvas', WebglCanvasDirective);
  return module;
});
