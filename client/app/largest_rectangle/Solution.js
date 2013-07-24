define([
    'largest_rectangle/Constants'
], function (Constants) {
  'use strict';

  function Solution(cornerOne, cornerTwo, solver) {
    this.xMin = Math.min(cornerOne[0], cornerTwo[0]);
    this.xMax = Math.max(cornerOne[0], cornerTwo[0]);
    this.yMin = Math.min(cornerOne[1], cornerTwo[1]);
    this.yMax = Math.max(cornerOne[1], cornerTwo[1]);
    this.area = (this.xMax - this.xMin) * (this.yMax - this.yMin);
    this.solver = solver;
  }
  Solution.prototype.equals = function (other) {
    return other.__proto__.constructor === Solution &&
      Constants.epsilonEqual(this.xMin, other.xMin) &&
      Constants.epsilonEqual(this.xMax, other.xMax) &&
      Constants.epsilonEqual(this.yMin, other.yMin) &&
      Constants.epsilonEqual(this.yMax, other.yMax);
  };
  Solution.prototype.toString = function () {
    return 'Solution([' + this.xMin + ', ' + this.yMin +
      '], [' + this.xMax + ', ' + this.yMax + '])';
  };
  return Solution;
});
