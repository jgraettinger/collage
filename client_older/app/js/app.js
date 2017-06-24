define([
    'angular',
    'largest_rectangle/DemoController'
], function (
  angular,
  DemoController) {
  'use strict';

  var module = angular.module('collage', []);

  // Controller registrations.
  module.controller('largest_rectangle/DemoController', DemoController);

  function createRoutes($routeProvider) {
    $routeProvider.when('/largest_rectangle_demo', {
      templateUrl: 'html/largest_rectangle/demo.html',
      controller: 'largest_rectangle/DemoController'
    });
    $routeProvider.otherwise({
      redirectTo: '/largest_rectangle_demo'
    });
  };
  module.config(['$routeProvider', createRoutes]);
  return module;
});
