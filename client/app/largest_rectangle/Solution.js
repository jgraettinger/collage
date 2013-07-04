define([], function () {
  'use strict';

  function Solution(cornerOne, cornerTwo, solver) {
    this.xMin = Math.min(cornerOne[0], cornerTwo[0]);
    this.xMax = Math.max(cornerOne[0], cornerTwo[0]);
    this.yMin = Math.min(cornerOne[1], cornerTwo[1]);
    this.yMax = Math.max(cornerOne[1], cornerTwo[1]);
    this.area = (this.xMax - this.xMin) * (this.yMax - this.yMin);
    this.solver = solver;
  }
  return Solution;
});
