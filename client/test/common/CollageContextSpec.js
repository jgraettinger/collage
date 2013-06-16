'use strict';

define([
    'angular',
    'angularMocks',
    'common/CollageContext',
  ], function(angular, mocks, _) {

  describe('CollageContextTests', function() {
    beforeEach(module('collage'));

    var CollageContext;
    beforeEach(inject(function(_CollageContext_) {
      CollageContext = _CollageContext_;
    }));

    it('injects and has basic properties', function() {
      expect(CollageContext.photos).toEqual({});
    });
  });
});
