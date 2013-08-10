'use strict';

require.config({
  baseUrl: '',
  paths: {
    collage: 'scripts',

    angular: 'bower_components/angular/angular',
    'angular-cookies': 'bower_components/angular-cookies/angular-cookies',
    'angular-mocks': 'bower_components/angular-mocks/angular-mocks',
    'angular-resource': 'bower_components/angular-resource/angular-resource',
    'angular-sanitize': 'bower_components/angular-sanitize/angular-sanitize',
    'angular-scenario': 'bower_components/angular-scenario/angular-scenario',
    'es5-shim': 'bower_components/es5-shim/es5-shim',
    'gl-matrix': 'bower_components/gl-matrix/dist/gl-matrix',
    jquery: 'bower_components/jquery/jquery',
    json3: 'bower_components/json3/build',
    numericjs: 'bower_components/numericjs/lib/numeric-1.2.6',
    'pointerevents-polyfill': 'bower_components/pointerevents-polyfill/pointerevents.min',
    underscore: 'bower_components/underscore/underscore',
  },
  shim: {
    angular: {
      exports: 'angular'
    },
    'gl-matrix': {
      exports: 'gl-matrix'
    },
    numericjs: {
      exports: 'numeric'
    },
    underscore: {
      exports: '_'
    },
  },
});
