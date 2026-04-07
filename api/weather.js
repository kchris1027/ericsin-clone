const https = require('https');

module.exports = function handler(req, res) {
  const url =
    'https://api.open-meteo.com/v1/forecast?latitude=31.23&longitude=121.47&current=temperature_2m,weather_code&timezone=Asia%2FShanghai';

  https.get(url, function (upstream) {
    let body = '';
    upstream.on('data', function (chunk) { body += chunk; });
    upstream.on('end', function () {
      if (upstream.statusCode !== 200) {
        return res.status(upstream.statusCode || 502).json({
          error: 'upstream ' + upstream.statusCode,
          detail: body.slice(0, 200)
        });
      }
      try {
        const data = JSON.parse(body);
        res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=300');
        res.setHeader('Access-Control-Allow-Origin', '*');
        return res.status(200).json(data);
      } catch (e) {
        return res.status(502).json({ error: 'invalid json', detail: body.slice(0, 200) });
      }
    });
  }).on('error', function (e) {
    return res.status(502).json({ error: 'request failed', detail: e.message });
  });
};
