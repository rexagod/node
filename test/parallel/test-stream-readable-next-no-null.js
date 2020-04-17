'use strict';
const { mustNotCall } = require('../common');
const { throws } = require('assert');
const { Readable } = require('stream');

async function* generate() {
  yield null;
}

const stream = Readable.from(generate());

stream.on('error', (err) => {
  throws(() => {
    throw err;
  }, {
    code: 'ERR_STREAM_NULL_VALUES',
    name: 'TypeError',
    message: 'May not write null values to stream'
  });
});

stream.on('data', (chunk) => {});

stream.on('end', mustNotCall());
