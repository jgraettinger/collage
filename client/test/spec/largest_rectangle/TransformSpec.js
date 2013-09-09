'use strict';

define([
  'collage/largest_rectangle/Transform',
], function (Transform) {
  describe('collage/largest_rectangle/Transform', function () {
    function compareVectors(a, b) {
      expect(a[0]).toBeCloseTo(b[0], 4);
      expect(a[1]).toBeCloseTo(b[1], 4);
      expect(a[2]).toBeCloseTo(b[2], 4);
      expect(a[3]).toBeCloseTo(b[3], 4);
    }
    // TODO(johng): New tests for modelViewMatrix, perspectiveMatrix,
    // and vertexList

    it('models an axis-aligned rectangle', function () {
      var coord = Transform.basic().localCoordinates();
      compareVectors(coord[0], [-0.5, 0.5, 0, 1]);
      compareVectors(coord[1], [-0.5, -0.5, 0, 1]);
      compareVectors(coord[2], [0.5, -0.5, 0, 1]);
      compareVectors(coord[3], [0.5, 0.5, 0, 1]);
    });
    it('supports resizing', function () {
      var coord = Transform.basic().resize(2, 4).localCoordinates();
      compareVectors(coord[0], [-1, 2, 0, 1]);
      compareVectors(coord[1], [-1, -2, 0, 1]);
      compareVectors(coord[2], [1, -2, 0, 1]);
      compareVectors(coord[3], [1, 2, 0, 1]);
    });
    it('basic centers rectangle in the view volume', function () {
      var coord = Transform.basic().viewCoordinates();
      compareVectors(coord[0], [-0.5, 0.5, -5, 1]);
      compareVectors(coord[1], [-0.5, -0.5, -5, 1]);
      compareVectors(coord[2], [0.5, -0.5, -5, 1]);
      compareVectors(coord[3], [0.5, 0.5, -5, 1]);
    });
    it('supports rotation around X', function () {
      var coord = Transform.basic().rotateX(Math.PI / 8).viewCoordinates(),
        s = 0.5 * Math.sin(Math.PI / 8),
        c = 0.5 * Math.cos(Math.PI / 8);
      compareVectors(coord[0], [-0.5, c, -5 + s, 1]);
      compareVectors(coord[1], [-0.5, -c, -5 - s, 1]);
      compareVectors(coord[2], [0.5, -c, -5 - s, 1]);
      compareVectors(coord[3], [0.5, c, -5 + s, 1]);
    });
    it('supports rotation around Y', function () {
      var coord = Transform.basic().rotateY(Math.PI / 8).viewCoordinates(),
        s = 0.5 * Math.sin(Math.PI / 8),
        c = 0.5 * Math.cos(Math.PI / 8);
      compareVectors(coord[0], [-c, 0.5, -5 + s, 1]);
      compareVectors(coord[1], [-c, -0.5, -5 + s, 1]);
      compareVectors(coord[2], [c, -0.5, -5 - s, 1]);
      compareVectors(coord[3], [c, 0.5, -5 - s, 1]);
    });
    it('supports rotation around Z', function () {
      var coord = Transform.basic().rotateZ(Math.PI / 8).viewCoordinates(),
        s = 0.5 * Math.sin(Math.PI / 8),
        c = 0.5 * Math.cos(Math.PI / 8);
      compareVectors(coord[0], [-c - s, c - s, -5, 1]);
      compareVectors(coord[1], [s - c, -c - s, -5, 1]);
      compareVectors(coord[2], [c + s, -c + s, -5, 1]);
      compareVectors(coord[3], [c - s, c + s, -5, 1]);
    });
    it('supports simultaneous rotation around X,Y,Z', function () {
      var coord = Transform.basic()
        .rotate(Math.PI / 8, Math.PI, Math.PI / 4).viewCoordinates(),
        s = 0.5 * Math.sin(Math.PI / 8),
        c = 0.5 * Math.cos(Math.PI / 8),
        a = Math.cos(Math.PI / 4);
      compareVectors(coord[0], [a, 0, -5, 1]);
      compareVectors(coord[1], [0, -c - s, -5 - c + s, 1]);
      compareVectors(coord[2], [-a, 0, -5, 1]);
      compareVectors(coord[3], [0, c + s, -5 + c - s, 1]);
    });
    it('supports translation', function () {
      var coord = Transform.basic().translate(-7, 6, -5).viewCoordinates();
      compareVectors(coord[0], [-7.5, 6.5, -10, 1]);
      compareVectors(coord[1], [-7.5, 5.5, -10, 1]);
      compareVectors(coord[2], [-6.5, 5.5, -10, 1]);
      compareVectors(coord[3], [-6.5, 6.5, -10, 1]);
    });
    it('supports projection to clip coordinates', function () {
      var coord = Transform.basic().clipCoordinates(),
        a = 1.2071068,
        b = 3.8888888;
      // Note that all x, y, z are within +/- 5,
      // the W clip coordinate, and thus viewable.
      compareVectors(coord[0], [-a, a, b, 5]);
      compareVectors(coord[1], [-a, -a, b, 5]);
      compareVectors(coord[2], [a, -a, b, 5]);
      compareVectors(coord[3], [a, a, b, 5]);
    });
    it('supports normalized device coordinates', function () {
      var coord = Transform.basic().normalizedDeviceCoordinates(),
        a = 0.2414213,
        b = 0.7777777;
      compareVectors(coord[0], [-a, a, b, 1]);
      compareVectors(coord[1], [-a, -a, b, 1]);
      compareVectors(coord[2], [a, -a, b, 1]);
      compareVectors(coord[3], [a, a, b, 1]);
    });
    it('supports viewport', function () {
      var transform = Transform.basic().viewport(100, 50, 200, 100);
      expect(transform.viewMinX).toEqual(100);
      expect(transform.viewMinY).toEqual(50);
      expect(transform.viewSpanX).toEqual(200);
      expect(transform.viewSpanY).toEqual(100);
    });
    it('supports window coordinates', function () {
      var coord = Transform.basic()
        .viewport(50, 100, 300, 200)
        .windowCoordinates(),
        l = 163.78678,
        r = 236.21321,
        b = 175.85786,
        t = 224.14213;
      compareVectors(coord[0], [l, t, 9, 1]);
      compareVectors(coord[1], [l, b, 9, 1]);
      compareVectors(coord[2], [r, b, 9, 1]);
      compareVectors(coord[3], [r, t, 9, 1]);
    });
  });
});
