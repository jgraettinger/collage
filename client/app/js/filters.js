define(['angular'], function(angular) {
  'use strict';

  return angular.module('collage.filters', [])
    .filter('interpolate', ['version', function(version) {
      return function(text) {
        return String(text).replace(/\%VERSION\%/mg, version);
      }
    }]);
});
