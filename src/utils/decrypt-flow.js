import { nanoid } from 'nanoid';
import hmacSHA256 from 'crypto-js/hmac-sha256';
import AES from 'crypto-js/aes';
import encUtf8 from 'crypto-js/enc-utf8';
import { parseJSON } from './helper';
import getPassKey from './get-pass-key';

export function getWorkflowPass(pass) {
  const key = getPassKey(nanoid());
  const decryptedPass = AES.decrypt(pass.substring(64), key).toString(encUtf8);

  return decryptedPass;
}

export default function ({ pass, drawflow }, password) {
  const hmac = pass.substring(0, 64);
  const decryptedHmac = hmacSHA256(pass.substring(64), password).toString();

  if (hmac !== decryptedHmac)
    return {
      isError: true,
      message: 'incorrect-password',
    };

  const isDecrypted = parseJSON(drawflow, null);
  if (isDecrypted) return isDecrypted;

  return AES.decrypt(drawflow, password).toString(encUtf8);
}
