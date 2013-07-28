'use strict';

/*global _, numeric, vec2, vec3, vec4, mat2, mat3, mat4, quat */
/*
 * This should be the _only_ location these are used as globals.
 * JSHint will fail if vendor libraries are used without being injected.
 */
angular.module('vendor', [])
  .value('vendor.underscore', _)
  .value('vendor.numericjs', numeric)
  .value('vendor.gl-matrix.vec2', vec2)
  .value('vendor.gl-matrix.vec3', vec3)
  .value('vendor.gl-matrix.vec4', vec4)
  .value('vendor.gl-matrix.mat2', mat2)
  .value('vendor.gl-matrix.mat3', mat3)
  .value('vendor.gl-matrix.mat4', mat4)
  .value('vendor.gl-matrix.quat', quat);

angular.module('clientApp', [])
  .config(['$routeProvider',
    function ($routeProvider) {
      $routeProvider
        .when('/', {
          templateUrl: 'views/main.html',
          controller: 'MainCtrl'
        })
        .when('/LargestRectangleDemo', {
          templateUrl: 'views/LargestRectangleDemo.html',
          controller: 'LargestrectangledemoCtrl'
        })
        .otherwise({
          redirectTo: '/'
        });
    }
  ]);
