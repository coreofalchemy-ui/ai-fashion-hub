const fs = require('fs');
const path = require('path');
const glob = require('glob');

const appsDir = path.join(__dirname, 'src', 'apps');

// Define the mappings for each app
const appMappings = {
    'model-generator': 'ModelGeneratorApp',
    'detail-generator': 'DetailGeneratorApp',
    'shoe-editor': 'ShoeEditorApp',
    'content-generator': 'ContentGeneratorApp'
};

let totalFixed = 0;

// Process each app
Object.entries(appMappings).forEach(([appFolder, appName]) => {
    const appPath = path.join(appsDir, appFolder);

    console.log(`\nProcessing ${appFolder}...`);

    // Find all .ts and .tsx files in this app
    const pattern = path.join(appPath, '**', '*.{ts,tsx}').replace(/\\/g, '/');
    const files = glob.sync(pattern, { nodir: true });

    console.log(`Found ${files.length} TypeScript files`);

    files.forEach(file => {
        try {
            let content = fs.readFileSync(file, 'utf8');
            const originalContent = content;
            let modified = false;

            // Replace imports from './App' to './AppName'
            const regex1 = /from\s+['"]\.\/App['"]/g;
            if (regex1.test(content)) {
                content = content.replace(regex1, `from './${appName}'`);
                modified = true;
            }

            // Replace imports from '../App' to '../AppName'
            const regex2 = /from\s+['"]\.\.\/App['"]/g;
            if (regex2.test(content)) {
                content = content.replace(regex2, `from '../${appName}'`);
                modified = true;
            }

            if (modified && content !== originalContent) {
                fs.writeFileSync(file, content, 'utf8');
                console.log(`  ✓ Fixed: ${path.relative(appsDir, file)}`);
                totalFixed++;
            }
        } catch (err) {
            console.error(`  ✗ Error processing ${file}: ${err.message}`);
        }
    });
});

console.log(`\n✅ Fixed ${totalFixed} files!`);
