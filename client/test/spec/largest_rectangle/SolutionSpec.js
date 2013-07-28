'use strict';

describe('collage.largest_rectangle.Solution', function () {
  var _, Solution;

  beforeEach(module('vendor'));
  beforeEach(module('collage.largest_rectangle.Solution'));
  beforeEach(inject([
    'vendor.underscore',
    'collage.largest_rectangle.Solution',
    function (iUnderscore, iSolution) {
      _ = iUnderscore;
      Solution = iSolution;
    }
  ]));

  it('initializes x/y min and max', function () {
    var solutions = [
      new Solution([-1, -1], [2, 2]),
      new Solution([2, 2], [-1, -1]),
      new Solution([2, -1], [-1, 2]),
      new Solution([-1, 2], [2, -1]),
    ];
    _.each(solutions, function (solution) {
      expect(solution.xMin).toEqual(-1);
      expect(solution.yMin).toEqual(-1);
      expect(solution.xMax).toEqual(2);
      expect(solution.yMax).toEqual(2);
    });
  });
  it('computes the solution area', function () {
    var solution = new Solution([-1, -1], [4, 4]);
    expect(solution.area).toEqual(25);
  });
});
