const fs = require('fs');
const path = 'c:\\Users\\user\\Desktop\\coa\\ai-fashion-hub-main\\src\\apps\\detail-storage\\components\\Step1PersonalShopper.tsx';

try {
    let content = fs.readFileSync(path, 'utf8');

    // The correct button code
    const correctButton = `            <button
              onClick={() => {
                if (customText.trim()) {
                  onAddCustomText(customText);
                  setCustomText('');
                }
              }}
              disabled={!customText.trim()}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold py-4 px-6 rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg flex items-center justify-center gap-2 text-lg"
            >
              <span className="text-2xl">+</span>
              문구 추가하기
            </button>`;

    // Find the textarea before the button
    const startMarker = 'rows={4}';
    // Find the closing div of the container
    const endMarker = '</div>';

    const startIndex = content.lastIndexOf(startMarker);
    // Find the last closing div, which should be the one for the custom text container
    // Actually, let's look for the closing div AFTER the start marker
    const endIndex = content.indexOf(endMarker, startIndex);

    if (startIndex !== -1 && endIndex !== -1) {
        const before = content.substring(0, startIndex + startMarker.length);
        const after = content.substring(endIndex);

        const newContent = before + '\n            />\n' + correctButton + '\n          ' + after;

        fs.writeFileSync(path, newContent, 'utf8');
        console.log('File fixed successfully!');
    } else {
        console.log('Markers not found. Start:', startIndex, 'End:', endIndex);
    }
} catch (e) {
    console.error('Error:', e);
}
