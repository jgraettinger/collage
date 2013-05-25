define([
  'angular',
  'filters',
  'services',
  'directives',
  'controllers',
  ], function(angular) {
    'use strict';

    return angular.module('collage',
      ['collage.filters', 'collage.services', 'collage.directives', 'collage.controllers'])
      .config(['$routeProvider', function($routeProvider) {
        $routeProvider.when('/view1', {templateUrl: 'partials/partial1.html', controller: 'MyCtrl1'});
        $routeProvider.when('/view2', {templateUrl: 'partials/partial2.html', controller: 'MyCtrl2'});
        $routeProvider.otherwise({redirectTo: '/view1'});
      }]);
});
