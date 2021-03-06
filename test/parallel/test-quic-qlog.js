// Flags: --expose-internals --no-warnings
'use strict';
const common = require('../common');
if (!common.hasQuic)
  common.skip('missing quic');

const { makeUDPPair } = require('../common/udppair');
const assert = require('assert');
const { createQuicSocket } = require('net');
const { kUDPHandleForTesting } = require('internal/quic/core');

const { key, cert, ca } = require('../common/quic');

const { serverSide, clientSide } = makeUDPPair();

const server = createQuicSocket({
  validateAddress: true,
  endpoint: { [kUDPHandleForTesting]: serverSide._handle },
  qlog: true
});

serverSide.afterBind();
server.listen({ key, cert, ca, alpn: 'meow' });

server.on('session', common.mustCall((session) => {
  gatherQlog(session, 'server');

  session.on('secure', common.mustCall((servername, alpn, cipher) => {
    const stream = session.openStream({ halfOpen: true });
    stream.end('Hi!');
  }));
}));

server.on('ready', common.mustCall(() => {
  const client = createQuicSocket({
    endpoint: { [kUDPHandleForTesting]: clientSide._handle },
    client: { key, cert, ca, alpn: 'meow' },
    qlog: true
  });
  clientSide.afterBind();

  const req = client.connect({
    address: 'localhost',
    port: server.endpoints[0].address.port,
    qlog: true
  });

  gatherQlog(req, 'client');

  req.on('stream', common.mustCall((stream) => {
    stream.resume();
    stream.on('end', common.mustCall(() => {
      req.close();
    }));
  }));
}));

function gatherQlog(session, id) {
  let log = '';
  session.on('qlog', (chunk) => log += chunk);
  session.on('close', common.mustCall(() => {
    const { qlog_version, traces } = JSON.parse(log);
    assert.strictEqual(typeof qlog_version, 'string');
    assert.strictEqual(typeof traces[0].events, 'object');
  }));
}
