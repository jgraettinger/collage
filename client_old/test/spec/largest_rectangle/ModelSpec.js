'use strict';

define([
  'underscore',
  'collage/largest_rectangle/Model',
  'collage/largest_rectangle/Solution',
  'collage/largest_rectangle/Transform',
], function (_, Model, Solution, Transform) {
  describe('collage/largest_rectangle/Model', function () {
    it('models a rectangle with four chains invariant to order', function () {
      _.each([
        Transform.basic().rotateZ(Math.PI / 8),
        Transform.basic().rotateZ(-Math.PI / 8),
        Transform.basic().rotate(Math.PI, 0, Math.PI / 8),
        Transform.basic().rotate(0, Math.PI, Math.PI / 8),
      ], function (transform) {
        var model = new Model(transform.viewCoordinates());

        expect(model.lowerLeftChain[0].slope).toBeLessThan(0);
        expect(model.lowerLeftChain[0].vector[0]).toBeGreaterThan(0);
        expect(model.lowerRightChain[0].slope).toBeGreaterThan(0);
        expect(model.lowerRightChain[0].vector[0]).toBeGreaterThan(0);
        expect(model.upperRightChain[0].slope).toBeLessThan(0);
        expect(model.upperRightChain[0].vector[0]).toBeLessThan(0);
        expect(model.upperLeftChain[0].slope).toBeGreaterThan(0);
        expect(model.upperLeftChain[0].vector[0]).toBeLessThan(0);
      });
    });
    it('properly models the axis-aligned rectangle case', function () {
      var model = new Model(Transform.basic().viewCoordinates());

      expect(model.lowerLeftChain[0].slope).toEqual(0);
      expect(model.lowerLeftChain[0].vector[0]).toBeGreaterThan(0);
      expect(model.lowerRightChain[0].slope).toEqual(Infinity);
      expect(model.lowerRightChain[0].vector[1]).toBeGreaterThan(0);
      expect(model.upperRightChain[0].slope).toEqual(0);
      expect(model.upperRightChain[0].vector[0]).toBeLessThan(0);
      expect(model.upperLeftChain[0].slope).toEqual(Infinity);
      expect(model.upperLeftChain[0].vector[1]).toBeLessThan(0);
    });
    it('models a rectangle with three chains', function () {
      var model = new Model(Transform.basic().rotateX(Math.PI / 8)
        .normalizedDeviceCoordinates());

      expect(model.lowerLeftChain.length).toEqual(2);
      expect(model.lowerRightChain.length).toEqual(1);
      expect(model.upperRightChain.length).toEqual(1);
      expect(model.upperLeftChain.length).toEqual(0);

      model = new Model(Transform.basic().rotateX(-Math.PI / 8)
        .normalizedDeviceCoordinates());

      expect(model.lowerLeftChain.length).toEqual(1);
      expect(model.lowerRightChain.length).toEqual(0);
      expect(model.upperRightChain.length).toEqual(2);
      expect(model.upperLeftChain.length).toEqual(1);

      model = new Model(Transform.basic().rotateY(Math.PI / 8)
        .normalizedDeviceCoordinates());

      expect(model.lowerLeftChain.length).toEqual(0);
      expect(model.lowerRightChain.length).toEqual(2);
      expect(model.upperRightChain.length).toEqual(1);
      expect(model.upperLeftChain.length).toEqual(1);

      model = new Model(Transform.basic().rotateY(-Math.PI / 8)
        .normalizedDeviceCoordinates());

      expect(model.lowerLeftChain.length).toEqual(1);
      expect(model.lowerRightChain.length).toEqual(1);
      expect(model.upperRightChain.length).toEqual(0);
      expect(model.upperLeftChain.length).toEqual(2);
    });
    it('models a rectangle with two chains', function () {
      // TODO(johng): Come up with a fixture to fill this out.
      console.log('Not implemented');
    });
    it('supports boundary testing of candiate solutions', function () {
      var model = new Model([
        [-1, 0],
        [0, 1],
        [1, 0],
        [0, -1],
      ]);
      // A trivially contained solution passes.
      expect(model.boundaryTest(
        new Solution([-0.1, -0.1], [0.1, 0.1]))).toBeTruthy();
      // A solution exactly inscribed within the model passes.
      expect(model.boundaryTest(
        new Solution([-0.5, -0.5], [0.5, 0.5]))).toBeTruthy();
      // Any further violation of the exactly inscribed solution fails.
      expect(model.boundaryTest(
        new Solution([-0.6, -0.5], [0.5, 0.5]))).toBeFalsy();
      expect(model.boundaryTest(
        new Solution([-0.5, -0.6], [0.5, 0.5]))).toBeFalsy();
      expect(model.boundaryTest(
        new Solution([-0.5, -0.5], [0.6, 0.5]))).toBeFalsy();
      expect(model.boundaryTest(
        new Solution([-0.5, -0.5], [0.5, 0.6]))).toBeFalsy();
    });
  });
});
