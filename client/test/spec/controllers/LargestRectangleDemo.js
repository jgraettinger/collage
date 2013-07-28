'use strict';

describe('Controller: LargestrectangledemoCtrl', function () {

  // load the controller's module
  beforeEach(module('clientApp'));

  var LargestrectangledemoCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    LargestrectangledemoCtrl = $controller('LargestrectangledemoCtrl', {
      $scope: scope
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(scope.awesomeThings.length).toBe(3);
  });
});
