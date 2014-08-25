'use strict';

define([
  'angular',
  'collage/models/pointer',
], function (angular, Pointer) {
  var module = angular.module('collage.lowLevelInput', []);
  module.service('mainContextPointer', Pointer);
  return module;
});
