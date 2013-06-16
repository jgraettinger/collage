'use strict';

define([
    'common/CollageModule',
    'common/CollageContext',
    'webgl/GLUtil',
    'gl-matrix',
    'underscore',
    'text!shader/image_editor.vert',
    'text!shader/image_editor.frag',
  ], function(
    CollageModule,
    CollageContextModule,
    GLUtil,
    glMat,
    _,
    VertexShaderSource,
    FragmentShaderSource) {

  function GLRenderer(gl) {
    var vertexShader = GLUtil.
      buildShaderFromSource(gl, gl.VERTEX_SHADER, VertexShaderSource);
    var fragmentShader = GLUtil.
      buildShaderFromSource(gl, gl.FRAGMENT_SHADER, FragmentShaderSource);
    var program = GLUtil.buildShaderProgram(gl, vertexShader, fragmentShader);

    gl.useProgram(program);

    program.aVertexHandle = GLUtil.
      checkedGetAttribLocation(gl, program, 'aVertex');
    program.pMatrixHandle = GLUtil.
      checkedGetUniformLocation(gl, program, 'uPMatrix');
    program.mvMatrixHandle = GLUtil.
      checkedGetUniformLocation(gl, program, 'uMVMatrix');

    var vertexPositionBufferHandle = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBufferHandle);
    var vertices = [
       1.0,  1.0,  0.0,
      -1.0,  1.0,  0.0,
       1.0, -1.0,  0.0,
      -1.0, -1.0,  0.0
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    vertexPositionBufferHandle.itemSize = 3;
    vertexPositionBufferHandle.itemCount = 4;

    this.gl = gl;
    this.program = program;
    this.vertexPositionBufferHandle = vertexPositionBufferHandle;
  };
  GLRenderer.prototype.redraw = function(scope) {
    this.gl.viewport(0, 0, scope.viewportSize[0], scope.viewportSize[1]);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

    _.each(scope.photos, function(photo, key) {
      var mvMatrix = scope.layout.getModelView(photo);

      this.drawPhoto(photo);
    });
  };


  var ContextRendererController = function($scope, $element, $attrs, CollageContext) {
    $scope.collageContext = CollageContext;
  };
  ContextRendererController.inject = ['$scope', '$element', '$attrs',
    'CollageContext'];

  var ContextRendererLinker = function(scope, element, attrs, ctrl) {
    var gl = element[0].getContext('webgl');
    if (!gl) {
      element.addClass('webgl-context-renderer-failed');
      console.log('Failed to initialize a WebGL context');
      return;
    }
    element.addClass('webgl-context-renderer')

    // Keep the viewport updated as the canvas is resized.
    scope.viewportSize = [element[0].width, element[0].height];
    element.bind('resize', function() {
      scope.viewportSize = [element[0].width, element[0].height];
      scope.$digest();
    });

    var glRenderer = new GLRenderer(gl);
    glRenderer.redraw(scope);

  };

  CollageModule.directive('webglContextRenderer',
    function() {
      return {
        restrict: 'E',
        template: '<canvas/>',
        replace: true,
        scope: {},
        link: ContextRendererLinker,
        controller: ContextRendererController,
      };
    });
});
