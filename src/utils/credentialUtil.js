import SHA256 from 'crypto-js/sha256';
import HmacSHA256 from 'crypto-js/hmac-sha256';
import AES from 'crypto-js/aes';
import encUtf8 from 'crypto-js/enc-utf8';
import getPassKey from './getPassKey';
import { parseJSON } from './helper';

function encryptValue(value) {
  const pass = getPassKey('credential');
  const encryptedValue = AES.encrypt(value, pass).toString();
  const hmac = HmacSHA256(encryptedValue, SHA256(pass)).toString();

  return hmac + encryptedValue;
}

function decryptValue(value) {
  const pass = getPassKey('credential');
  const hmac = value.substring(0, 64);
  const encryptedValue = value.substring(64);
  const decryptedHmac = HmacSHA256(encryptedValue, SHA256(pass)).toString();

  if (hmac !== decryptedHmac) return '';

  const decryptedValue = AES.decrypt(encryptedValue, pass).toString(encUtf8);

  return parseJSON(decryptedValue, decryptedValue);
}

export default {
  encrypt: encryptValue,
  decrypt: decryptValue,
};
