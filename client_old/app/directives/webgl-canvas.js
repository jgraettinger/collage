'use strict';

define([], function () {
  function DirectiveController($scope, $element, $attrs,
      mainContextPointer, webgl) {

    $element.prepend(webgl._canvas);

    $scope.pointer = mainContextPointer;
    mainContextPointer.setOwningScope($scope);
  }
  DirectiveController.$inject = ['$scope', '$element', '$attrs',
    'mainContextPointer', 'webgl'];

  return function () {
    return {
      restrict: 'A',
      replace: false,
      scope: false,
      controller: DirectiveController,
    };
  };
});
