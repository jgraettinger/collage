'use strict';

define(['collageConstants',
        'models/TileParameters'],
        function(constants, TileParameters) {

  describe('TileParameters', function() {
    it('Should validate bounds', function() {
      expect(function() {
        new TileParameters('test-image', 'image',
                           151, 150, 200, 250, 4);
      }).toThrow(new RangeError('Invalid tile bounds'));
      expect(function() {
        new TileParameters('test-image', 'image',
                           100, 150, 251, 250, 4);
      }).toThrow(new RangeError('Invalid tile bounds'));
    });
    it('Should validate tile type', function() {
      expect(function() {
        new TileParameters('test-image', 'foobar',
                           100, 150, 200, 250, 4);
      }).toThrow(new RangeError('Invalid tile type foobar'));
    });
    it('Should accept valid input', function() {
        var params = new TileParameters('test-image', 'image',
                                        100, 150, 200, 250, 4);
    });
    it('Should support URL conversion', function() {
        var params = new TileParameters('test-image', 'image',
                                        100, 150, 200, 250, 4);
        expect(params.asUrl()).toEqual(
          constants.tileApiEndpoint +
              '/test-image/image/100,150,200,250,4.png');
    });
  });
});
