define([
    'underscore',
    'largest_rectangle/Solver',
    'largest_rectangle/Model',
    'largest_rectangle/Transform',
    'largest_rectangle/Solution',
], function (_, Solver, Model, Transform, Solution) {
  'use strict';

  describe('Solver', function () {
    iit('finds a solution touching 4 lines', function () {
      var model = new Model([
        [-1, 0],
        [0, 1],
        [1, 0],
        [0, -1]
      ]);
      var solver = new Solver();
      solver.find4L(model.lowerLeftChain[0], model.lowerRightChain[0],
        model.upperRightChain[0], model.upperLeftChain[0]);

      expect(solver.solutions).toEqual(
      [new Solution([-0.5, -0.5], [0.5, 0.5], '4L')]);
    });
    iit('find a solution touching 3 lines', function () {
      var model = new Model([
        [-1.5, 2],
        [-1, 0],
        [1, 0],
        [1.5, 2],
       ])
      var solver = new Solver();
      solver.find3L(model.lowerLeftChain[0], model.lowerRightChain[0],
        model.upperRightChain[0]);

      expect(solver.solutions).toEqual(
      [new Solution([-0.5, -0.5], [0.5, 0.5], '3L')]);
    });
  });
});
