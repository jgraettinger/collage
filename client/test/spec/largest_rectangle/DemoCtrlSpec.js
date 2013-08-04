'use strict';

describe('Controller: collage.largest_rectangle.DemoCtrl', function () {
  var DemoCtrl, scope;

  beforeEach(module('collage.largest_rectangle.DemoCtrl'));
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    DemoCtrl = $controller(
      'collage.largest_rectangle.DemoCtrl', {
      $scope: scope
    });
  }));

  iit('should attach a list of awesomeThings to the scope', function () {
    expect(scope.awesomeThings.length).toBe(3);
  });
});
