require.config({
  baseUrl: 'js',
  paths: {
    angular: 'lib/angular/angular',
    text: 'lib/require/text',
    domReady: 'lib/require/domReady',
    shader: '/shader',
    'gl-matrix': 'lib/gl-matrix-min',
  },
  shim: {
    'angular': {'exports': 'angular'},
    'angularMocks': {deps:['angular'], 'exports':'angular.mock'},
  },
  priority: ['angular']
});
  
require([
    // Use the Loader Plugin API, so the callback completes only when
    // the DOM is ready. 
    'domReady!',
    'angular',
    'app'
  ], function(doc, angular, app) {
    'use strict';
     var html = doc.getElementById('html');
     angular.bootstrap(html, [app['name']]);
     html.className = html.className + 'ng-app: collage;';
  });
