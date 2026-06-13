#!/usr/bin/env node

const { generateView } = require('./lib.cjs');

const outputPath = generateView();
console.log(`Generated gotcha view: ${outputPath}`);
