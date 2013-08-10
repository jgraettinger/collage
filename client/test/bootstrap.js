'use strict';
/*global jasmine */

// If an object defines an 'equals' method, have Jasmine make
// use of it when determining deep object equality.
jasmine.getEnv().addEqualityTester(function (a, b) {
  if (typeof a.equals === 'function') {
    return a.equals(b);
  }
  if (typeof b.equals === 'function') {
    return b.equals(a);
  }
});

var tests = [];
for (var file in window.__karma__.files) {
  if (window.__karma__.files.hasOwnProperty(file)) {
    if (/Spec\.js$/.test(file)) {
      tests.push(file);
    }
  }
}

requirejs.config({
  // Karma serves files from '/base'
  baseUrl: '/base/app',
  deps: tests,
  callback: function() {
    window.__karma__.start();
  }
});

