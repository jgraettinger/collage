'use strict';

define([], function () {
  var epsilon = 0.0001;

  var epsilonEqual = function (a, b) {
    return a + epsilon >= b && b + epsilon >= a;
  };
  return {
    EPSILON: epsilon,
    epsilonEqual: epsilonEqual,
  };
});
