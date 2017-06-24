'use strict';

define([
  'collage/largest_rectangle/Transform',
], function (Transform) {
  var zShift = Transform.basic().zShift;

  describe('collage/largest_rectangle/Transform', function () {
    function compareVectors(a, b) {
      expect(a.length).toEqual(b.length);
      for (var i = 0; i !== a.length; ++i) {
        expect(a[i]).toBeCloseTo(b[i], 3);
      }
    }
    it('models an axis-aligned rectangle', function () {
      var coord = Transform.basic().localCoordinates();
      compareVectors(coord[0], [0, 0, 0, 1]);
      compareVectors(coord[1], [0, -1, 0, 1]);
      compareVectors(coord[2], [1, -1, 0, 1]);
      compareVectors(coord[3], [1, 0, 0, 1]);
    });
    it('supports resizing', function () {
      var coord = Transform.basic().resize(2, 4).localCoordinates();
      compareVectors(coord[0], [0, 0, 0, 1]);
      compareVectors(coord[1], [0, -4, 0, 1]);
      compareVectors(coord[2], [2, -4, 0, 1]);
      compareVectors(coord[3], [2, 0, 0, 1]);
    });
    it('creates a model-view which centers and unit-scales', function () {
      var coord = Transform.basic().resize(5, 10).viewCoordinates();
      compareVectors(coord[0], [-0.25, 0.5, zShift, 1]);
      compareVectors(coord[1], [-0.25, -0.5, zShift, 1]);
      compareVectors(coord[2], [0.25, -0.5, zShift, 1]);
      compareVectors(coord[3], [0.25, 0.5, zShift, 1]);

      coord = Transform.basic().resize(10, 5).viewCoordinates();
      compareVectors(coord[0], [-0.5, 0.25, zShift, 1]);
      compareVectors(coord[1], [-0.5, -0.25, zShift, 1]);
      compareVectors(coord[2], [0.5, -0.25, zShift, 1]);
      compareVectors(coord[3], [0.5, 0.25, zShift, 1]);
    });
    it('supports rotation around X', function () {
      var coord = Transform.basic().rotateX(Math.PI / 8).viewCoordinates(),
        s = 0.5 * Math.sin(Math.PI / 8),
        c = 0.5 * Math.cos(Math.PI / 8);
      compareVectors(coord[0], [-0.5, c, zShift + s, 1]);
      compareVectors(coord[1], [-0.5, -c, zShift - s, 1]);
      compareVectors(coord[2], [0.5, -c, zShift - s, 1]);
      compareVectors(coord[3], [0.5, c, zShift + s, 1]);
    });
    it('supports rotation around Y', function () {
      var coord = Transform.basic().rotateY(Math.PI / 8).viewCoordinates(),
        s = 0.5 * Math.sin(Math.PI / 8),
        c = 0.5 * Math.cos(Math.PI / 8);
      compareVectors(coord[0], [-c, 0.5, zShift + s, 1]);
      compareVectors(coord[1], [-c, -0.5, zShift + s, 1]);
      compareVectors(coord[2], [c, -0.5, zShift - s, 1]);
      compareVectors(coord[3], [c, 0.5, zShift - s, 1]);
    });
    it('supports rotation around Z', function () {
      var coord = Transform.basic().rotateZ(Math.PI / 8).viewCoordinates(),
        s = 0.5 * Math.sin(Math.PI / 8),
        c = 0.5 * Math.cos(Math.PI / 8);
      compareVectors(coord[0], [-c - s, c - s, zShift, 1]);
      compareVectors(coord[1], [s - c, -c - s, zShift, 1]);
      compareVectors(coord[2], [c + s, -c + s, zShift, 1]);
      compareVectors(coord[3], [c - s, c + s, zShift, 1]);
    });
    it('supports simultaneous rotation around X,Y,Z', function () {
      var coord = Transform.basic()
        .rotate(Math.PI / 8, Math.PI, Math.PI / 4).viewCoordinates(),
        s = 0.5 * Math.sin(Math.PI / 8),
        c = 0.5 * Math.cos(Math.PI / 8),
        a = Math.cos(Math.PI / 4);
      compareVectors(coord[0], [a, 0, zShift, 1]);
      compareVectors(coord[1], [0, -c - s, zShift - c + s, 1]);
      compareVectors(coord[2], [-a, 0, zShift, 1]);
      compareVectors(coord[3], [0, c + s, zShift + c - s, 1]);
    });
    it('supports translation', function () {
      var coord = Transform.basic().translate(-7, 6, -5).viewCoordinates();
      compareVectors(coord[0], [-7.5, 6.5, zShift - 5, 1]);
      compareVectors(coord[1], [-7.5, 5.5, zShift - 5, 1]);
      compareVectors(coord[2], [-6.5, 5.5, zShift - 5, 1]);
      compareVectors(coord[3], [-6.5, 6.5, zShift - 5, 1]);
    });
    it('applys transforms in the correct order', function () {
      var coord = Transform.basic()
        .resize(4, 3)
        .translate(-0.5, -0.375, 0)
        .rotateX(Math.PI / 8)
        .viewCoordinates(),
        s = 0.75 * Math.sin(Math.PI / 8),
        c = 0.75 * Math.cos(Math.PI / 8);
      // We expect the following order of transforms:
      //  - The rectangle is scaled to unit-length in X, three-quarters in Y.
      //  - The rectangle was centered around the origin.
      //  - The translation fixture placed the upper right
      //    corner onto the origin.
      //  - The rotation fixture rotated the bottom two corners about the X
      //    axis towards negative Z. The top two corners weren't shifted as
      //    they lay on the X axis.
      //  - The rectangle was then shifted zShift.
      compareVectors(coord[0], [-1, 0, zShift, 1]);
      compareVectors(coord[1], [-1, -c, zShift - s, 1]);
      compareVectors(coord[2], [0, -c, zShift - s, 1]);
      compareVectors(coord[3], [0, 0, zShift, 1]);
    });
    it('supports projection to clip coordinates', function () {
      var coord = Transform.basic().clipCoordinates(),
        a = 2.5,
        b = 3.888888;
      // Note that all x, y, z are within +/- zShift,
      // the W clip coordinate, and thus viewable.
      compareVectors(coord[0], [-a, a, b, -zShift]);
      compareVectors(coord[1], [-a, -a, b, -zShift]);
      compareVectors(coord[2], [a, -a, b, -zShift]);
      compareVectors(coord[3], [a, a, b, -zShift]);
    });
    it('supports normalized device coordinates', function () {
      var coord = Transform.basic().normalizedDeviceCoordinates(),
        a = 0.5,
        b = 0.777777;
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
        l = 125,
        r = 275,
        b = 150,
        t = 250;
      compareVectors(coord[0], [l, t, 9, 1]);
      compareVectors(coord[1], [l, b, 9, 1]);
      compareVectors(coord[2], [r, b, 9, 1]);
      compareVectors(coord[3], [r, t, 9, 1]);
    });
    it('supports reverse projection of window XY to device XY', function () {
      var transform = Transform.basic()
        .viewport(50, 100, 300, 200),
        windowXY = transform.windowCoordinates(),
        deviceXY = transform.projectWindowXYToDeviceXY(windowXY),
        a = 0.5;
      compareVectors(deviceXY[0], [-a, a]);
      compareVectors(deviceXY[1], [-a, -a]);
      compareVectors(deviceXY[2], [a, -a]);
      compareVectors(deviceXY[3], [a, a]);
    });
    it('supports reverse projection of device XY to near plane XY', function () {
      var transform = Transform.basic(),
        deviceXY = transform.normalizedDeviceCoordinates(),
        nearXY = transform.projectDeviceXYToNearPlaneXY(deviceXY),
        a = 0.1;
      compareVectors(nearXY[0], [-a, a, -1, 1]);
      compareVectors(nearXY[1], [-a, -a, -1, 1]);
      compareVectors(nearXY[2], [a, -a, -1, 1]);
      compareVectors(nearXY[3], [a, a, -1, 1]);
    });
    it('supports reverse projection of near XY to local XY', function () {
      var transform = Transform.basic(),
        deviceXY = transform.normalizedDeviceCoordinates(),
        nearXY = transform.projectDeviceXYToNearPlaneXY(deviceXY),
        localXY = transform.projectNearPlaneXYToLocalXY(nearXY);

      compareVectors(localXY[0], [0, 0, 0, 1]);
      compareVectors(localXY[1], [0, -1, 0, 1]);
      compareVectors(localXY[2], [1, -1, 0, 1]);
      compareVectors(localXY[3], [1, 0, 0, 1]);
    });
    it('supports reversible non-trivial transforms', function () {
      var transform = Transform.basic()
        .resize(1024, 768)
        .translate(-0.5, -0.375, 0)
        .rotateX(Math.PI / 9)
        .rotateY(Math.PI / 7)
        .rotateZ(Math.PI / 10)
        .viewport(50, 100, 300, 200);

      // The window-space projection of the rectangle should
      // reverse-project back to the local-space coordinates.
      var expected = transform.localCoordinates(),
          actual = transform.projectNearPlaneXYToLocalXY(
        transform.projectDeviceXYToNearPlaneXY(
          transform.projectWindowXYToDeviceXY(
            transform.windowCoordinates())));

      compareVectors(expected[0], actual[0]);
      compareVectors(expected[1], actual[1]);
      compareVectors(expected[2], actual[2]);
      compareVectors(expected[3], actual[3]);
    });
  });
});
