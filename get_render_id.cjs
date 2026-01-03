const https = require('https');

const options = {
    hostname: 'api.render.com',
    path: '/v1/services?limit=20',
    method: 'GET',
    headers: {
        'Authorization': 'Bearer rnd_Uay2uwmu5q75kbh8kmDegPCQw8wR',
        'Accept': 'application/json'
    }
};

const req = https.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    res.on('end', () => {
        try {
            const services = JSON.parse(data);
            services.forEach(s => {
                console.log(`Service: ${s.service.name}, ID: ${s.service.id}, Slug: ${s.service.slug}`);
            });
        } catch (e) {
            console.error(e.message);
            console.log(data);
        }
    });
});

req.on('error', (e) => {
    console.error(e);
});

req.end();
