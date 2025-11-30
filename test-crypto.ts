import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const keyPath = path.join(__dirname, 'server', 'keys', 'face-library-key.json');

try {
    const keyContent = fs.readFileSync(keyPath, 'utf8');
    const keyJson = JSON.parse(keyContent);
    let privateKey = keyJson.private_key;

    console.log('Original key length:', privateKey.length);

    // Sanitize key: ensure proper line breaks
    privateKey = privateKey.replace(/\\n/g, '\n');

    // If it was already escaped in JSON, JSON.parse handles it. 
    // But sometimes people copy-paste and double escape or use literal newlines.

    console.log('Attempting to sign data with sanitized key...');
    const sign = crypto.createSign('RSA-SHA256');
    sign.update('test data');
    const signature = sign.sign(privateKey, 'base64');
    console.log('Signature generated successfully!');
    console.log(`Signature: ${signature.substring(0, 20)}...`);

} catch (e) {
    console.error('Crypto signing failed:', e);
}
