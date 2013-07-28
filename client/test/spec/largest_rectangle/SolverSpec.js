'use strict';

describe('collage.largest_rectangle.Solver', function () {
  var Model, Solution, Solver, Transform;

  beforeEach(module('collage.largest_rectangle.Model'));
  beforeEach(module('collage.largest_rectangle.Solution'));
  beforeEach(module('collage.largest_rectangle.Solver'));
  beforeEach(module('collage.largest_rectangle.Transform'));
  beforeEach(inject([
    'collage.largest_rectangle.Model',
    'collage.largest_rectangle.Solution',
    'collage.largest_rectangle.Solver',
    'collage.largest_rectangle.Transform',
    function (iModel, iSolution, iSolver, iTransform) {
      Model = iModel;
      Solution = iSolution;
      Solver = iSolver;
      Transform = iTransform;
    }
  ]));

  it('finds a solution touching 4 lines', function () {
    // TODO(johng): Remove this manual case. Add a case for axis-aligned.
    var model = new Model([
      [-1, 0],
      [0, 1],
      [1, 0],
      [0, -1],
    ]);
    var solver = new Solver();
    solver.find4L(model.lowerLeftChain[0], model.lowerRightChain[0],
      model.upperRightChain[0], model.upperLeftChain[0]);

    expect(solver.solutions).toEqual([
      new Solution([-0.5, -0.5], [0.5, 0.5]),
    ]);

    var s = Math.sin(Math.PI / 4) * 0.5;
    model = new Model(Transform.basic().rotateZ(Math.PI / 4)
      .viewCoordinates());
    solver = new Solver();

    solver.find4L(model.lowerLeftChain[0], model.lowerRightChain[0],
      model.upperRightChain[0], model.upperLeftChain[0]);
    expect(solver.solutions).toEqual([
      new Solution([-s, -s], [s, s]),
    ]);

  });
  it('finds a solution touching 3 lines', function () {
    var model = new Model(Transform.basic().rotateZ(Math.PI / 4)
      .viewCoordinates());
    var s = Math.sin(Math.PI / 4) * 0.5;

    var solver = new Solver();
    // model.lowerRightChain[0] has positive slope.
    solver.find3L(model.lowerLeftChain[0], model.lowerRightChain[0],
      model.upperRightChain[0]);
    expect(solver.solutions).toEqual([
      new Solution([-s, -s], [s, s]),
    ]);

    solver = new Solver();
    // model.upperRightChain[0] has negative slope.
    solver.find3L(model.lowerRightChain[0], model.upperRightChain[0],
      model.upperLeftChain[0]);
    expect(solver.solutions).toEqual([
      new Solution([-s, -s], [s, s]),
    ]);
  });
  it('finds a solution touching a vertex and two lines', function () {
    var model = new Model([
      [0, 1],
      [0, 0],
      [1, 0],
      [1.5, 1.5],
    ]),
      solver = new Solver();

    solver.findV2L(model.lowerLeftChain[0].begin, model.lowerRightChain[
        0],
      model.upperLeftChain[1]);
    expect(solver.solutions).toEqual([
      new Solution([0, 0], [1.333333, 1]),
      new Solution([0, 0], [1, 1.333333]),
      new Solution([0, 0], [1, 1]),
    ]);

    model = new Model([
      [0, 1],
      [0, 0],
      [1, 0],
      [0.5, 0.5],
    ]);
    solver = new Solver();
    // X to Y and Y to X projections are filtered (they're not unit-bounded).
    solver.findV2L(model.lowerLeftChain[0].begin, model.upperRightChain[
        0],
      model.upperRightChain[1]);
    expect(solver.solutions).toEqual([
      new Solution([0, 0], [1, 1]),
    ]);
  });
  it('finds a solution touching a vertex and a line', function () {
    var model = new Model(Transform.basic()
      .rotateY(Math.PI / 4)
      .rotateZ(Math.PI / 4)
      .viewCoordinates()),
      solver = new Solver(),
      s = Math.sin(Math.PI / 4);

    solver.findV1L(model.lowerLeftChain[0].begin,
      model.lowerRightChain[0]);
    expect(solver.solutions).toEqual([
      new Solution([-0.5, -s], [0, 0]),
    ]);
  });
  it('finds a solution touching two vertices', function () {
    var solver = new Solver();
    solver.find2V([-1, 1], [1, -1]);
    expect(solver.solutions).toEqual([
      new Solution([1, 1], [-1, -1]),
    ]);
  });
});
