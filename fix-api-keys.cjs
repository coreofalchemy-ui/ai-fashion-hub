const fs = require('fs');
const path = require('path');
const glob = require('glob');

const appsDir = path.join(__dirname, 'src', 'apps');

console.log('\nFixing API key references in geminiService files...\n');

// Find all geminiService.ts files
const pattern = path.join(appsDir, '**', 'geminiService.ts').replace(/\\/g, '/');
const files = glob.sync(pattern, { nodir: true });

console.log(`Found ${files.length} geminiService.ts files`);

let totalFixed = 0;

files.forEach(file => {
    try {
        let content = fs.readFileSync(file, 'utf8');
        const originalContent = content;

        // Replace process.env.API_KEY with import.meta.env.VITE_GEMINI_API_KEY
        content = content.replace(/process\.env\.API_KEY/g, 'import.meta.env.VITE_GEMINI_API_KEY');

        if (content !== originalContent) {
            fs.writeFileSync(file, content, 'utf8');
            console.log(`  ✓ Fixed: ${path.relative(appsDir, file)}`);
            totalFixed++;
        }
    } catch (err) {
        console.error(`  ✗ Error processing ${file}: ${err.message}`);
    }
});

console.log(`\n✅ Fixed ${totalFixed} files!`);
