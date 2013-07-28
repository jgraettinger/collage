'use strict';

angular.module('collage.largest_rectangle.Constants', [])
  .constant('collage.largest_rectangle.Constants.EPSILON', 0.0001)
  .factory('collage.largest_rectangle.Constants.epsilonEqual', [
    'collage.largest_rectangle.Constants.EPSILON',
    function (epsilon) {
      return function (a, b) {
        return a + epsilon >= b && b + epsilon >= a;
      };
    }
  ]);
