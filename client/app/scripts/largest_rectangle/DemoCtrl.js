'use strict';

(function (module) {

  var DemoController = function ($scope, quat, Model, Solver, Transform) {
    $scope.transform = new Transform().translate(0, 0, 3);

    $scope.axis = 'x';
    $scope.pixelsToRadians = 500.0;

    $scope.applyRotation = function (pixels) {
      var radians = pixels / $scope.pixelsToRadians;
      switch ($scope.axis) {
        case 'x':
          $scope.transform = $scope.transform.rotateX(radians);
          break;
        case 'y':
          $scope.transform = $scope.transform.rotateY(radians);
          break;
        case 'z':
          $scope.transform = $scope.transform.rotateZ(radians);
          break;
      }
    };

    $scope.rotate90 = function () {
      $scope.transform = $scope.transform.rotateZ(Math.PI / 2);
    };

    $scope.updateModel = function () {
      $scope.model = new Model($scope.transform.windowCoordinates());
    };
    $scope.updateSolutions = function (model, prevModel, scope) {
      var solver = new Solver();
      solver.findPotentialSolutions(model);
      $scope.solutions = solver.solutions;
      $scope.solutions.sort(function (a, b) { return b.area - a.area; });
    };
    $scope.$watch('transform', $scope.updateModel);
    $scope.$watch('model', $scope.updateSolutions);

  };
  DemoController.$inject = [
      '$scope',
      'vendor.gl-matrix.quat',
      'collage.largest_rectangle.Model',
      'collage.largest_rectangle.Solver',
      'collage.largest_rectangle.Transform',
  ];
  module.controller('collage.largest_rectangle.DemoCtrl', DemoController);

  var DemoLinker = function (scope, element, $attrs) {
    var canvas = element[0];
    var context = canvas.getContext('2d');
    if (!context) {
      console.log('Failed to initialize 2d context');
      return;
    }

    // Bind the canvas size to the scope view size.
    scope.transform.viewSpanX = canvas.width;
    scope.transform.viewSpanY = canvas.height;
    element.bind('resize', function () {
      scope.transform.viewSpanX = canvas.width;
      scope.transform.viewSpanY = canvas.height;
      scope.$digest();
    });

    // Bind canvas pointer events to the scope.
    scope.mouse = 0;
    element.bind('pointerdown', function (event) {
      var lastOffsetX = event.clientX;

      element.bind('pointermove', function(event) {
        scope.applyRotation(event.clientX - lastOffsetX);
        lastOffsetX = event.clientX;
        scope.$apply();
      });
      element.bind('pointerup', function (event) {
        element.unbind('pointermove');
        element.unbind('pointerup');
      });
      element.bind('pointerleave', function (event) {
        element.unbind('pointermove');
        element.unbind('pointerup');
      });
    });


    // Bind the scope solutions to update the canvas.
    var drawChain = function (color, chain) {
      context.strokeStyle = color;
      for (var i = 0; i != chain.length; ++i) {
        var l = chain[i];
        context.beginPath();
        context.moveTo(l.begin[0], canvas.height - l.begin[1]);
        context.lineTo(l.end[0], canvas.height - l.end[1]);
        context.closePath();
        context.stroke();
      }
    };
    var plotSolution = function (s, color) {
      context.strokeStyle = color;
      context.beginPath();
      context.moveTo(s.xMin, canvas.height - s.yMin);
      context.lineTo(s.xMax, canvas.height - s.yMin);
      context.lineTo(s.xMax, canvas.height - s.yMax);
      context.lineTo(s.xMin, canvas.height - s.yMax);
      context.lineTo(s.xMin, canvas.height - s.yMin);
      context.stroke();
    };
    var updateCanvas = function (solutions, oldSolutions, scope) {
      context.clearRect(0, 0, canvas.width, canvas.height);
      var model = scope.model;
      drawChain('#FF0000', model.lowerLeftChain);
      drawChain('#00FF00', model.lowerRightChain);
      drawChain('#0000FF', model.upperRightChain);
      drawChain('#FF00FF', model.upperLeftChain);
      _.forEach(solutions, function (s) {
        plotSolution(s, '#000000');
      });
    };
    scope.$watch('solutions', updateCanvas);
  };

  module.directive('collageLargestRectangleDemocanvas', function () {
    return {
      restrict: 'E',
      template: '<canvas width="500" height="400" touch-action="pan-y"/>',
      replace: true,
      scope: false,
      link: DemoLinker,
    }
  });
}(angular.module('collage.largest_rectangle.DemoCtrl', [
    'vendor',
    'collage.largest_rectangle.Model',
    'collage.largest_rectangle.Solver',
    'collage.largest_rectangle.Transform',
])));
