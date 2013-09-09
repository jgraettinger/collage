'use strict';

define([
  'angular',
  'collage/services/webgl',
  'collage/directives/webgl-canvas',
], function (angular, Webgl, WebglCanvas) {
  var module = angular.module('collage.webgl', []);
  module.factory('webgl', Webgl);
  module.directive('webglCanvas', WebglCanvas);
  return module;
});
