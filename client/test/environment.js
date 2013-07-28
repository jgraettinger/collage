'use strict';
/*global jasmine */

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
