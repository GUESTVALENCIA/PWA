const https = require('https');

const serviceId = 'srv-d4sqhoeuk2gs73f1ba8g';
const options = {
    hostname: 'api.render.com',
    path: `/v1/services/${serviceId}/deploys`,
    method: 'POST',
    headers: {
        'Authorization': 'Bearer rnd_Uay2uwmu5q75kbh8kmDegPCQw8wR',
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    }
};

console.log(`Triggering deploy for service ${serviceId}...`);

const req = https.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    res.on('end', () => {
        try {
            const response = JSON.parse(data);
            console.log('Deploy Response:', JSON.stringify(response, null, 2));
            if (res.statusCode >= 200 && res.statusCode < 300) {
                console.log('✅ Deploy successfully triggered!');
            } else {
                console.error('❌ Failed to trigger deploy:', res.statusCode);
            }
        } catch (e) {
            console.error('Error parsing response:', e.message);
            console.log('Raw response:', data);
        }
    });
});

req.on('error', (e) => {
    console.error('Request failed:', e);
});

// Write body just in case (empty object often required/accepted)
req.write('{}');
req.end();
