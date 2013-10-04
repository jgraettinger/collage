'use strict';

define([
  'angular',
  'collage/controllers/main',
  'collage/controllers/DemoCtrl',
  'collage/modules/webgl',
], function (angular, MainCtrl, DemoCtrl, WebglModule) {
  var module = angular.module('collage', [WebglModule.name]);
  module.directive('collageLargestRectangleDemocanvas', DemoCtrl.directive);

  module.config(function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'views/main.html',
        controller: MainCtrl,
      })
      .when('/LargestRectangleDemo', {
        templateUrl: 'views/LargestRectangleDemo.html',
        controller: DemoCtrl.controller,
      })
      .otherwise({
        redirectTo: '/'
      });
  });
  console.log("collage module name: " + module.name);
  return module;
});
