/*jshint bitwise: false*/
'use strict';

define([
  'collage/models/tile',
], function (Tile) {
  describe('collage/models/tile', function () {
    it('computes a maximum tile level from the largest span', function () {
      expect(Tile.maximumLevel(0)).toEqual(0);
      expect(Tile.maximumLevel(1)).toEqual(0);
      expect(Tile.maximumLevel(Tile.SIZE / 2)).toEqual(0);
      expect(Tile.maximumLevel(Tile.SIZE - 1)).toEqual(0);
      expect(Tile.maximumLevel(Tile.SIZE)).toEqual(0);
      expect(Tile.maximumLevel(Tile.SIZE + 1)).toEqual(1);
      expect(Tile.maximumLevel(Tile.SIZE * 2)).toEqual(1);
      expect(Tile.maximumLevel(Tile.SIZE * 2 + 1)).toEqual(2);
      expect(Tile.maximumLevel((Tile.SIZE << 20) - 1)).toEqual(20);
      expect(Tile.maximumLevel((Tile.SIZE << 20) + 0)).toEqual(20);
      expect(Tile.maximumLevel((Tile.SIZE << 20) + 1)).toEqual(21);
    });
    it('offers a root tile constructor', function () {
      var photo = {
        width: Tile.SIZE * 5,
        height: Tile.SIZE * 2
      };

      // An appropriate level was selected for the photo size.
      expect(Tile.buildRootTile(photo)).toEqual(new Tile(photo, 3, 0, 0));

      // Selected level is invariant to w > h, or h > w.
      photo.width = Tile.SIZE;
      photo.height = Math.floor(Tile.SIZE * 1.5);
      expect(Tile.buildRootTile(photo)).toEqual(new Tile(photo, 1, 0, 0));

      // Photo fully fits within a single tile.
      photo.width = Math.floor(Tile.SIZE / 2);
      photo.height = Math.floor(Tile.SIZE - 1);
      expect(Tile.buildRootTile(photo)).toEqual(new Tile(photo, 0, 0, 0));

      photo.width = 1;
      photo.height = 1;
      expect(Tile.buildRootTile(photo)).toEqual(new Tile(photo, 0, 0, 0));

      photo.width = -1;
      expect(function () {
        Tile.buildRootTile(photo);
      }).toThrow(
        'Invalid photo bounds');
    });
    it('supports computing tile pixel bounds', function () {
      var photo = {
        width: Tile.SIZE * 3,
        height: Tile.SIZE * 3 - 1
      };

      // Tile is not bound by either photo edge.
      var tile = new Tile(photo, 1, 0, 0);
      expect(tile.wBegin()).toEqual(0);
      expect(tile.wEnd()).toEqual(Tile.SIZE * 2);
      expect(tile.hBegin()).toEqual(0);
      expect(tile.hEnd()).toEqual(Tile.SIZE * 2);

      // Tile is bound by both photo edges.
      tile = new Tile(photo, 1, 1, 1);
      expect(tile.wBegin()).toEqual(Tile.SIZE * 2);
      expect(tile.wEnd()).toEqual(Tile.SIZE * 3);
      expect(tile.hBegin()).toEqual(Tile.SIZE * 2);
      expect(tile.hEnd()).toEqual(Tile.SIZE * 3 - 1);
    });
    it('supports recursive enumeration of children', function () {
      var photo = {
        width: Tile.SIZE * 3 - 1,
        height: Tile.SIZE * 2 + 1
      },
        root = Tile.buildRootTile(photo);

      // All four children of the root tile are defined.
      expect(root).toEqual(new Tile(photo, 2, 0, 0));
      expect(root.children()).toEqual([
        new Tile(photo, 1, 0, 0),
        new Tile(photo, 1, 1, 0),
        new Tile(photo, 1, 0, 1),
        new Tile(photo, 1, 1, 1)
      ]);

      // All four grand-children of the child not bounding
      // a photo edge, are defined.
      expect(new Tile(photo, 1, 0, 0).children()).toEqual([
        new Tile(photo, 0, 0, 0),
        new Tile(photo, 0, 1, 0),
        new Tile(photo, 0, 0, 1),
        new Tile(photo, 0, 1, 1)
      ]);

      // Two grand-children exist for the child bounding
      // the vertical edge.
      expect(new Tile(photo, 1, 1, 0).children()).toEqual([
        new Tile(photo, 0, 2, 0),
        new Tile(photo, 0, 2, 1)
      ]);

      // Two grand-children exist for the child bounding
      // the horizontal edge.
      expect(new Tile(photo, 1, 0, 1).children()).toEqual([
        new Tile(photo, 0, 0, 2),
        new Tile(photo, 0, 1, 2)
      ]);

      // One grand-child exists for the child bounding
      // both the vertical and horizontal edge.
      expect(new Tile(photo, 1, 1, 1).children()).toEqual([
        new Tile(photo, 0, 2, 2)
      ]);
    });
  });
});
