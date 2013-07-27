requirejs.config({
  baseUrl: '',
  paths: {
    angular: 'js/lib/angular/angular',
    text: 'js/lib/require/text',
    domReady: 'js/lib/require/domReady',
    'gl-matrix': 'js/lib/gl-matrix-min',
    html: 'html/',
  },
  shim: {
    'angular': {
      'exports': 'angular'
    },
    'angularMocks': {
      deps: ['angular'],
      'exports': 'angular.mock'
    },
  },
  priority: ['angular']
});

require([
  // Use the Loader Plugin API, so the callback completes only when
  // the DOM is ready.
  'domReady!',
    'angular',
    'js/app'
], function (doc, angular, app) {
  'use strict';
  var html = doc.getElementById('html');
  angular.bootstrap(html, [app['name']]);
  html.className = html.className + 'ng-app: collage;';
});
