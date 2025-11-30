import { Storage } from '@google-cloud/storage';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const keyPath = path.join(__dirname, 'server', 'keys', 'face-library-key.json');
process.env.GOOGLE_APPLICATION_CREDENTIALS = keyPath;

const storage = new Storage();
const bucketName = 'coa-lookbook-479608';

async function testConnection() {
    console.log(`Testing connection to bucket: ${bucketName}`);
    console.log(`Using key file: ${keyPath}`);

    try {
        const bucket = storage.bucket(bucketName);
        console.log('Calling bucket.exists()...');
        const [exists] = await bucket.exists();
        console.log(`Bucket exists: ${exists}`);

        if (exists) {
            console.log('✅ Successfully connected!');
            console.log('Attempting to list files...');
            const [files] = await bucket.getFiles();
            console.log(`Found ${files.length} files in bucket`);
            files.forEach(file => console.log(`  - ${file.name}`));
        } else {
            console.log('❌ Bucket does not exist or is not accessible.');
        }
    } catch (error) {
        console.error('❌ Connection failed:', error.message);
        console.error('Full error:', error);
    }
}

testConnection();
