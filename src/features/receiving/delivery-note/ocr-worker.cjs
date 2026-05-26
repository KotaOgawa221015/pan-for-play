'use strict';

const fetch = global.fetch;
const { parentPort } = require('node:worker_threads');
const worker = require('tesseract.js/src/worker-script');
const getCore = require('tesseract.js/src/worker-script/node/getCore');
const gunzip = require('tesseract.js/src/worker-script/node/gunzip');
const cache = require('tesseract.js/src/worker-script/node/cache');

if (!fetch) {
  throw new Error('Tesseract OCR requires global fetch in the Node runtime.');
}

parentPort.on('message', (packet) => {
  worker.dispatchHandlers(packet, (obj) => parentPort.postMessage(obj));
});

worker.setAdapter({
  getCore,
  gunzip,
  fetch,
  ...cache,
});
