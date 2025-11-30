const fs = require('fs');
const path = require('path');

// Fix ShoeEditorApp
const shoeEditorPath = path.join(__dirname, 'src/apps/shoe-editor/ShoeEditorApp.tsx');
let shoeContent = fs.readFileSync(shoeEditorPath, 'utf8');
shoeContent = shoeContent.replace('const App: React.FC = () => {', 'export const ShoeEditorApp: React.FC = () => {');
shoeContent = shoeContent.replace(/export default App;/g, '');
fs.writeFileSync(shoeEditorPath, shoeContent, 'utf8');
console.log('✓ Fixed ShoeEditorApp.tsx');

// Fix ContentGeneratorApp
const contentPath = path.join(__dirname, 'src/apps/content-generator/ContentGeneratorApp.tsx');
let contentContent = fs.readFileSync(contentPath, 'utf8');
contentContent = contentContent.replace('const App: React.FC = () => {', 'export const ContentGeneratorApp: React.FC = () => {');
contentContent = contentContent.replace(/export default App;/g, '');
fs.writeFileSync(contentPath, contentContent, 'utf8');
console.log('✓ Fixed ContentGeneratorApp.tsx');

console.log('\n✅ All files fixed successfully!');
