'use strict';

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

let cache = null;

function load() {
  if (cache) return cache;
  if (fs.existsSync(DB_FILE)) {
    cache = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } else {
    const { buildSeed } = require('./seed');
    cache = buildSeed();
    persist();
  }
  return cache;
}

function persist() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DB_FILE, JSON.stringify(cache, null, 2));
}

function get() {
  return load();
}

function save() {
  persist();
}

function id(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${cryptoRandom()}`;
}

function cryptoRandom() {
  return Math.random().toString(36).slice(2, 8);
}

module.exports = { get, save, id };
