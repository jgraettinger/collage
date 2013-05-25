define(['angular'], function(angular) {
  'use strict';

  return angular.module('collage.controllers', [])
    .controller('MyCtrl1', ['$scope', function($scope) {
	    $scope.image_src = "foobar.png";
    }])
    .controller('MyCtrl2', [function() {
    }]);
});
