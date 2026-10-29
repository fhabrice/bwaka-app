'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const SECRET_FILE = path.join(DATA_DIR, 'secret.key');

function getSecret() {
  if (!fs.existsSync(SECRET_FILE)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    const secret = crypto.randomBytes(32).toString('hex');
    fs.writeFileSync(SECRET_FILE, secret, { mode: 0o600 });
    return secret;
  }
  return fs.readFileSync(SECRET_FILE, 'utf8').trim();
}

const SECRET = getSecret();
const TOKEN_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 jours

function hashPassword(motDePasse) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(motDePasse, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(motDePasse, stocke) {
  if (!stocke || !stocke.includes(':')) return false;
  const [salt, hash] = stocke.split(':');
  const calcul = crypto.scryptSync(motDePasse, salt, 64);
  const attendu = Buffer.from(hash, 'hex');
  return calcul.length === attendu.length && crypto.timingSafeEqual(calcul, attendu);
}

function hmac(donnees) {
  return crypto.createHmac('sha256', SECRET).update(donnees).digest('base64url');
}

function signToken(payload) {
  const corps = Buffer.from(
    JSON.stringify({ ...payload, exp: Date.now() + TOKEN_DURATION_MS })
  ).toString('base64url');
  return `${corps}.${hmac(corps)}`;
}

function verifyToken(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;
  const [corps, signature] = token.split('.');
  if (hmac(corps) !== signature) return null;
  try {
    const payload = JSON.parse(Buffer.from(corps, 'base64url').toString('utf8'));
    if (!payload.exp || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

module.exports = { hashPassword, verifyPassword, signToken, verifyToken };
