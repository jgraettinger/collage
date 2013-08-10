'use strict';

require([
  'angular',
  'collage/controllers/main',
  'collage/largest_rectangle/DemoCtrl',
], function (angular, MainCtrl, DemoCtrl) {

  var collage = angular.module('collage', []);

  collage.directive('collageLargestRectangleDemocanvas', DemoCtrl.directive);

  collage.config(function ($routeProvider) {
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

  var html = document.getElementsByTagName('html')[0];
  angular.bootstrap(html, [collage.name]);
  html.className += ' ng-app';
});
