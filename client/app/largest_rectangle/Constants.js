define([], function () {
  'use strict';

  var epsilon = 0.0001;

  return {
    EPSILON: epsilon,

    epsilonEqual: function (a, b) {
      return a + epsilon >= b && b + epsilon >= a;
    },
  };
});
