'use strict';

define([
    'common/CollageModule',
    'models/Mouse',
  ], function(CollageModule, Mouse) {
  var CollageContextFactory =
    CollageModule.factory('CollageContext', function() {
    return {
      photos: {},
      layout: null,
      mouse: new Mouse(),
    };
  });
  CollageContextFactory.$inject = [];
});
