'use strict';

define([], function () {
  function DirectiveController($scope, $element, $attrs, $window, webgl) {
    console.log('called directive controller');
    // Update class of injected canvas element.
    /*
    $attrs.$observe('canvasClass', function (value) {
      webgl.canvas.attr('class', $attrs.canvasClass);
      console.log('canvasClass has changed value to ' + value);
      webgl.possiblyResized();
    });
    */
    $element.prepend(webgl._canvas);
  }
  DirectiveController.$inject = ['$scope', '$element', '$attrs',
    '$window', 'webgl'
  ];

  return function () {
    return {
      restrict: 'A',
      replace: false,
      scope: {},
      controller: DirectiveController,
    };
  };
});
