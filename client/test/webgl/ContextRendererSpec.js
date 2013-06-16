'use strict';

define([
    'angular',
    'angularMocks',
    'webgl/ContextRenderer',
  ], function(angular, mocks, WebGLContextDirective) {

  describe('ContextRendererTests', function() {
    beforeEach(module('collage'));

    var $compile;
    var $rootScope;
    beforeEach(inject(function(_$compile_, _$rootScope_) {
      $compile = _$compile_;
      $rootScope = _$rootScope_;
    }));

    it('replaces the element with a webgl canvas', function() {
      var element = $compile('<webgl-context-renderer/>')($rootScope);

      expect(element.hasClass('webgl-context-renderer')).toBeTruthy();
      expect(element[0].tagName).toEqual('CANVAS');

      expect(element.scope().viewportSize[0]).toEqual(300);
      expect(element.scope().viewportSize[1]).toEqual(150);
    });

    it('models mouse events', function() {
      var element = $compile('<webgl-context-renderer/>')($rootScope);
    });

    it('responds to canvas resize', function() {
      var element = $compile('<webgl-context-renderer/>')($rootScope);
      var scope = element.scope();

      /*
      element[0].width = 301;
      element[0].height = 151;

      var event = document.createEvent('HTMLEvents');
      event.initEvent('resize', true, true);
      element[0].dispatchEvent(event);

      expect(scope.viewportSize[0]).toEqual(301);
      expect(scope.viewportSize[1]).toEqual(151);
      expect(scope.dirty).toBeTruthy();
      */
    });
  });
});
