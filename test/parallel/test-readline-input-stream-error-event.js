'use strict';
require('../common');

// This test ensures that the "readline" module correctly
// emits an error on the `options.input` stream whenever
// it encounters an error (a fake stream created by a non
// existent file in this case).
const assert = require('assert');
const fs = require('fs');
const readline = require('readline');

function emit_error_on_stream(filename) {
  return function() {
    const fileStream = fs.createReadStream(filename);
    readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });
  };
}

assert.throws(
  emit_error_on_stream('foobar.txt'),
  Error
);
