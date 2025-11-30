import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import facesRouter from './routes/faces.js';
import geminiRouter from './routes/gemini.js';
import { checkBucketAccess } from './gcsClient.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
    origin: process.env.VITE_DEV_SERVER || 'http://localhost:5173',
    credentials: true,
}));

app.use(express.json({ limit: '500mb' })); // Increased limit for images
app.use(express.urlencoded({ limit: '500mb', extended: true, parameterLimit: 50000 }));

// Routes
app.use('/api/faces', facesRouter);
app.use('/api/gemini', geminiRouter);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// GCS connection check endpoint
app.get('/api/status', async (req, res) => {
    try {
        const bucketAccessible = await checkBucketAccess();
        res.json({
            gcs: bucketAccessible ? 'connected' : 'disconnected',
            bucket: process.env.GCS_BUCKET_NAME || 'coa-lookbook-assets',
        });
    } catch (error) {
        res.status(500).json({
            gcs: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Face Library API Server running on http://localhost:${PORT}`);
    console.log(`📦 GCS Bucket: ${process.env.GCS_BUCKET_NAME || 'coa-lookbook-assets'}`);
    console.log(`🔑 Using key file: server/keys/face-library-key.json`);
});
