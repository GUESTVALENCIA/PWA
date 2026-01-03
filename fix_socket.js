const fs = require('fs');
const path = require('path');

const filePath = path.join('c:', 'Users', 'clayt', 'OneDrive', 'GUESTVALENCIAPWA', 'src', 'websocket', 'socket-server.js');

try {
    const data = fs.readFileSync(filePath, 'utf8');
    const lines = data.split('\n'); // Split by newline

    // Line numbers are 1-based in view_file, so 966 becomes index 965
    // We want to remove from line 966 to 1200 inclusive.
    // Start Index: 965
    // End Index: 1199 (corresponding to line 1200)
    // Number of lines to remove: 1200 - 966 + 1 = 235

    const startIndex = 965;
    const deleteCount = 235;

    console.log(`Original line count: ${lines.length}`);
    console.log(`Deleting ${deleteCount} lines starting from index ${startIndex} (Line ${startIndex + 1})`);
    console.log(`First line to delete: ${lines[startIndex].trim()}`);
    console.log(`Last line to delete: ${lines[startIndex + deleteCount - 1].trim()}`);

    // Verify content before deleting (Sanity Check)
    if (!lines[startIndex].includes('TTS WebSocket streaming (ENABLED for low latency)')) {
        console.error('ERROR: Line 966 does not match expected content. Aborting.');
        process.exit(1);
    }
    if (!lines[startIndex + deleteCount - 1].includes('Audio TTS response sent to client')) {
        console.error('ERROR: Line 1200 does not match expected content. Aborting.');
        // console.log('Found instead:', lines[startIndex + deleteCount - 1]);
        process.exit(1);
    }

    lines.splice(startIndex, deleteCount);

    console.log(`New line count: ${lines.length}`);

    const newData = lines.join('\n');
    fs.writeFileSync(filePath, newData, 'utf8');
    console.log('Successfully removed duplicate block.');

} catch (err) {
    console.error('Error:', err);
}
