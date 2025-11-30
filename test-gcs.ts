import { Storage } from '@google-cloud/storage';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const keyPath = path.join(__dirname, 'server', 'keys', 'face-library-key.json');
process.env.GOOGLE_APPLICATION_CREDENTIALS = keyPath;

console.log(`Node Version: ${process.version}`);
console.log(`NODE_OPTIONS: ${process.env.NODE_OPTIONS}`);

try {
    const keyContent = fs.readFileSync(keyPath, 'utf8');
    const keyJson = JSON.parse(keyContent);
    console.log('Key file parsed as JSON successfully.');
    if (keyJson.private_key) {
        console.log(`Private key starts with: ${keyJson.private_key.substring(0, 30)}...`);
        console.log(`Private key ends with: ...${keyJson.private_key.substring(keyJson.private_key.length - 30)}`);
    } else {
        console.error('No private_key found in JSON.');
    }
    if (keyJson.client_email) {
        console.log(`Client Email: ${keyJson.client_email}`);
    }
} catch (e) {
    console.error('Error reading/parsing key file:', e);
}

const storage = new Storage();
const bucketName = 'coa-lookbook-assets';

async function testConnection() {
    console.log(`Testing connection to bucket: ${bucketName}`);

    try {
        const bucket = storage.bucket(bucketName);
        const [exists] = await bucket.exists();
        console.log(`Bucket exists: ${exists}`);
        if (exists) {
            console.log('Successfully connected!');
        }
    } catch (error) {
        console.error('Connection failed:', error);
    }
}

testConnection();
