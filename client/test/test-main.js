var tests = Object.keys(window.__karma__.files).filter(function (file) {
  return /Spec\.js$/.test(file);
});

requirejs.config({
  // Karma serves files from '/base'.
  baseUrl: '/base',
  paths: {
    models: '/base/app/models',
    common: '/base/app/common',
    webgl: '/base/app/webgl',
    shader: '/base/app/shader',
    layout: '/base/app/layout',

    collageConstants: '/base/test/collage-constants',

    angular: '/base/app/js/lib/angular/angular',
    angularMocks: '/base/test/lib/angular/angular-mocks',
    text: '/base/app/js/lib/require/text',
    'gl-matrix': '/base/app/js/lib/gl-matrix',
    underscore: '/base/app/js/lib/underscore-min',
  },
  shim: {
    'angular': {'exports': 'angular'},
    'angularMocks': {
      deps: ['angular'],
      'exports': 'angular.mock'
    },
    'underscore': {'exports': '_'},
  },
  priority: ['angular'],

  // Ask Require.js to load these files (all our tests).
  deps: tests,

  // Start tests invocation, once Require.js is done.
  callback: window.__karma__.start,
});
