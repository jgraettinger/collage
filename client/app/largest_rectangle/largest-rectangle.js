'use strict';

define([
    'gl-matrix',
    'collage/largest_rectangle/Model',
    'collage/largest_rectangle/Solver',
], function (glMatrix, Model, Solver) {

  function largestRectangle(transform) {
    var device = transform.normalizedDeviceCoordinates(),
      nearXY = transform.projectDeviceXYToNearPlaneXY(device);

    // Solve for ideal rectangle size in near-plane XY coordinates,
    // the solution for which defines the ideal frustum size.
    var model = new Model(nearXY),
        bestFit = new Solver().findBestFitSolution(model);

    console.log(bestFit);

    // Map the solution to local photo coordinates.
    var localFit = transform.projectNearPlaneXYToLocalXY([
      [bestFit.xMin, bestFit.yMax, -transform.near, 1],
      [bestFit.xMin, bestFit.yMin, -transform.near, 1],
      [bestFit.xMax, bestFit.yMax, -transform.near, 1],
      [bestFit.xMax, bestFit.yMin, -transform.near, 1]]);

    console.log(localFit);
  };
  return largestRectangle;
});
