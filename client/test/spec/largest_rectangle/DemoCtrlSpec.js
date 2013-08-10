'use strict';

define([
  'collage/largest_rectangle/DemoCtrl',
], function (DemoCtrl) {
  describe('collage/largest_rectangle/DemoCtrl', function () {
    var ctrl, scope;

    beforeEach(inject(function ($controller, $rootScope) {
      scope = $rootScope.$new();
      ctrl = $controller(DemoCtrl.controller, {
        $scope: scope
      });
    }));
    it('should do something', function () {});
  });
});
