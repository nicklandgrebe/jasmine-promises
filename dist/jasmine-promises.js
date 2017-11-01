(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (global){
'use strict';

var _patch = require('./patch');

if (!global.jasmine) {
  throw new Error('jasmine must be loaded before jasmine-promise');
}

(0, _patch.apply)();

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./patch":2}],2:[function(require,module,exports){
(function (global){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.apply = apply;

var _utils = require('./utils');

function patchDone(done) {
  var doneFailDelegate = done.fail;

  if (doneFailDelegate) {
    done.fail = function () {
      if (arguments[0]) {
        arguments[0] = (0, _utils.cleanError)((0, _utils.coerceToError)(arguments[0]));
      }

      return doneFailDelegate.apply(this, arguments);
    };
  }
}

function patchJasmineFn(obj, slot, fnArgIndex) {
  var delegate = obj[slot];

  (0, _utils.patchFn)(obj, slot, function (delegate, args) {
    var testFn = args[fnArgIndex];

    args[fnArgIndex] = function (done) {
      var testFnHasDoneArg = testFn.length >= 1;
      var returnValue = undefined;

      patchDone(done);

      try {
        if (testFnHasDoneArg) {
          returnValue = testFn.call(this, done);
        } else {
          returnValue = testFn.call(this);
          if (returnValue && returnValue.then) {
            returnValue.then(function () {
              done();
            }, function () {
              done();
            });
          } else {
            done();
          }
        }
      } catch (e) {
        done.fail(e);
      }

      return returnValue;
    };

    return delegate.apply(this, args);
  });
}

function patchEnv(env) {
  var targets = [{ slot: 'afterEach', fnArgIndex: 0 }, { slot: 'beforeEach', fnArgIndex: 0 }, { slot: 'beforeAll', fnArgIndex: 0 }, { slot: 'afterAll', fnArgIndex: 0 }, { slot: 'it', fnArgIndex: 1 }, { slot: 'fit', fnArgIndex: 1 }];

  targets.forEach(function (target) {
    patchJasmineFn(env, target.slot, target.fnArgIndex);
  });
}

function patchEnvCtor(obj, slot) {
  (0, _utils.patchFn)(obj, slot, function (delegate, args) {
    var target = Object.create(delegate.prototype);
    var obj = delegate.apply(target, arguments);
    var retVal = obj || target;

    patchEnv(retVal);

    return retVal;
  });
}

function apply() {
  patchEnv(global.jasmine.getEnv());

  if (global.jasmine.Env) {
    patchEnvCtor(global.jasmine, 'Env');
  }
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./utils":3}],3:[function(require,module,exports){
(function (global){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.patchFn = patchFn;
exports.getUnpatchedFn = getUnpatchedFn;
exports.cleanError = cleanError;
exports.coerceToError = coerceToError;
var keyCache = {};

function getKey(name) {
  var key = undefined;
  var verboseName = '$jasmine-promises-delegate-' + name;

  if (!keyCache[name]) {
    if (typeof global.Symbol === 'function') {
      keyCache[name] = Symbol(verboseName);
    } else {
      keyCache[name] = verboseName;
    }
  }

  return keyCache[name];
}

function patchFn(obj, slot, patch) {
  var k = getKey(slot);
  var delegate = obj[slot];

  if (delegate && !obj[k]) {
    Object.defineProperty(obj, k, {
      value: delegate,
      enumerable: false
    });

    obj[slot] = function () {
      return patch.call(this, delegate, arguments);
    };
  }
}

function getUnpatchedFn(obj, slot) {
  var k = getKey(slot);
  var unpatchedFn = obj[k];

  if (!unpatchedFn) {
    throw new Error('object has no unpatched fn for \'' + slot + '\'');
  }

  return unpatchedFn;
}

function cleanError(error) {
  function isFrameRelevant(frame) {
    return frame.indexOf('jasmine-promises') === -1;
  }

  if (error.stack) {
    var _frames = error.stack.split('\n');

    error.stack = _frames.filter(isFrameRelevant).join('\n');
  }

  return error;
}

function coerceToError(reason) {
  var error;

  if (reason instanceof Error) {
    error = reason;
  } else {
    error = new Error(reason);

    // generate stacktrace if it doesn't already exist
    try {
      throw error;
    } catch (_) {}
  }

  return error;
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}]},{},[1]);
