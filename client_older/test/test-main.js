var tests = Object.keys(window.__karma__.files).filter(function (file) {
  return /Spec\.js$/.test(file);
});

// If an object defines an 'equals' method, have Jasmine make
// use of it when determining deep object equality.
jasmine.getEnv().addEqualityTester(function(a, b) {
  if (typeof a.equals === 'function') {
    return a.equals(b);
  }
  if (typeof b.equals === 'function') {
    return b.equals(a);
  }
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
    largest_rectangle: '/base/app/largest_rectangle',

    collageConstants: '/base/test/collage-constants',

    angular: '/base/app/js/lib/angular/angular',
    angularMocks: '/base/test/lib/angular/angular-mocks',
    text: '/base/app/js/lib/require/text',
    'gl-matrix': '/base/app/js/lib/gl-matrix',
    underscore: '/base/app/js/lib/underscore-min',
    numeric: '/base/app/js/lib/numeric-1.2.6',
  },
  shim: {
    'angular': {
      'exports': 'angular'
    },
    'angularMocks': {
      deps: ['angular'],
      'exports': 'angular.mock'
    },
    'underscore': {
      'exports': '_'
    },
    'numeric': {
      'exports': 'numeric',
    },
  },
  priority: ['angular'],

  // Ask Require.js to load these files (all our tests).
  deps: tests,

  // Start tests invocation, once Require.js is done.
  callback: window.__karma__.start,
});
