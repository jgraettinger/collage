'use strict';

define([
  'collage/largest_rectangle/Segment',
], function (Segment) {

  function Model(vertices) {
    if (vertices.length !== 4) {
      throw new Error('Expected four verticies');
    }
    var segments;
    if (new Segment(vertices[0], vertices[1]).inside(vertices[2])) {
      // Vertices are already in counter-clockwise order.
      segments = [
        new Segment(vertices[0], vertices[1]),
        new Segment(vertices[1], vertices[2]),
        new Segment(vertices[2], vertices[3]),
        new Segment(vertices[3], vertices[0])
      ];
    } else {
      // Verticies are in reverse (clockwise) order.
      segments = [
        new Segment(vertices[0], vertices[3]),
        new Segment(vertices[3], vertices[2]),
        new Segment(vertices[2], vertices[1]),
        new Segment(vertices[1], vertices[0])
      ];
    }
    this.lowerLeftChain = [];
    this.lowerRightChain = [];
    this.upperRightChain = [];
    this.upperLeftChain = [];
    for (var i = 0; i !== segments.length; ++i) {
      var s = segments[i];
      // Use slope and the segment vector to characterize
      // which chain the segment falls into.
      if (s.slope <= 0) {
        if (s.vector[0] > 0) {
          this.lowerLeftChain.push(s);
        } else {
          this.upperRightChain.push(s);
        }
      } else {
        if (s.vector[1] > 0) {
          this.lowerRightChain.push(s);
        } else {
          this.upperLeftChain.push(s);
        }
      }
    }
  }
  Model.prototype.midpoint = function (chain) {
    if (chain[0].end === chain[1].begin) {
      return chain[0].end;
    } else {
      return chain[1].end;
    }
  };
  Model.prototype.boundaryTest = function (solution) {
    var check = function (point, chain) {
      for (var i = 0; i !== chain.length; ++i) {
        if (!chain[i].inside(point)) {
          return false;
        }
      }
      return true;
    };
    return check([solution.xMin, solution.yMin], this.lowerLeftChain) &&
      check([solution.xMax, solution.yMin], this.lowerRightChain) &&
      check([solution.xMax, solution.yMax], this.upperRightChain) &&
      check([solution.xMin, solution.yMax], this.upperLeftChain);
  };
  return Model;
});
