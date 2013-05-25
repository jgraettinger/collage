define(['angular'], function(angular) {
  'use strict';

  // Demonstrate how to register services
  // In this case it is a simple value service.
  return angular.module('collage.services', [])
    .value('version', '0.1');
});
