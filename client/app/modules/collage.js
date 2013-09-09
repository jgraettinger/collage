'use strict';

require([
  'angular',
  'collage/controllers/main',
  'collage/controllers/DemoCtrl',
  'collage/modules/webgl',
], function (angular, MainCtrl, DemoCtrl, WebglModule) {

  var collage = angular.module('collage', [WebglModule.name]);
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
