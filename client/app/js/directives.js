define(['angular', 'image_editor'], function(angular, imageEditor) {
  'use strict';

  angular.module('collage.directives', [])
    .directive('appVersion', ['version', function(version) {
      return function(scope, elm, attrs) {
        elm.text(version);
      };
    }])
    .directive('imageEditor', function() {
      return function(scope, element, attrs) {
        require(['image_editor'], function(buildImageEditor) {
          scope.gl = buildImageEditor(element[0],
					'file:///home/johng/Pictures/IMG_1064.JPG');
        
          element.bind('$destroy', function() {
          });

        });
      }
    });
});
