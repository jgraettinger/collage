'use strict';

define([
  'collage/controllers/main',
  'collage/modules/webgl',
], function (MainCtrl, WebglModule) {
  describe('collage/largest_rectangle/MainCtrl', function () {
    var ctrl, scope;

    beforeEach(module(WebglModule.name));
    beforeEach(inject(function ($controller, $rootScope) {
      scope = $rootScope.$new();
      ctrl = $controller(MainCtrl, {
        $scope: scope
      });
    }));
    it('should attach a list of awesomeThings to the scope', function () {
      expect(scope.awesomeThings.length).toBe(3);
    });
  });
});
