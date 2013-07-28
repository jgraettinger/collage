'use strict';

angular.module('collage.largest_rectangle.Solution', [
  'collage.largest_rectangle.Constants',
])
  .factory('collage.largest_rectangle.Solution', [
    'collage.largest_rectangle.Constants.epsilonEqual',
    function (epsilonEqual) {

      function Solution(cornerOne, cornerTwo, solver) {
        this.xMin = Math.min(cornerOne[0], cornerTwo[0]);
        this.xMax = Math.max(cornerOne[0], cornerTwo[0]);
        this.yMin = Math.min(cornerOne[1], cornerTwo[1]);
        this.yMax = Math.max(cornerOne[1], cornerTwo[1]);
        this.area = (this.xMax - this.xMin) * (this.yMax - this.yMin);
        this.solver = solver;
      }
      Solution.prototype.equals = function (other) {
        return other.constructor === Solution &&
          epsilonEqual(this.xMin, other.xMin) &&
          epsilonEqual(this.xMax, other.xMax) &&
          epsilonEqual(this.yMin, other.yMin) &&
          epsilonEqual(this.yMax, other.yMax);
      };
      Solution.prototype.toString = function () {
        return 'Solution([' + this.xMin + ', ' + this.yMin +
          '], [' + this.xMax + ', ' + this.yMax + '])';
      };
      return Solution;
    }
  ]);
