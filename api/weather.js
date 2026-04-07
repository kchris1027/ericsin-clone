const https = require('https');

function fetchJSON(url) {
  return new Promise(function (resolve, reject) {
    https.get(url, { headers: { 'User-Agent': 'CaiKong/1.0' } }, function (r) {
      let body = '';
      r.on('data', function (c) { body += c; });
      r.on('end', function () {
        if (r.statusCode !== 200) return reject(new Error('HTTP ' + r.statusCode));
        try { resolve(JSON.parse(body)); }
        catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

var WMO_FROM_WTTR = {
  '113': 0, '116': 2, '119': 3, '122': 3,
  '143': 45, '176': 61, '179': 71, '182': 66,
  '185': 56, '200': 95, '227': 77, '230': 75,
  '248': 45, '260': 48,
  '263': 51, '266': 53, '281': 56, '284': 57,
  '293': 61, '296': 61, '299': 63, '302': 65,
  '305': 65, '308': 65, '311': 66, '314': 67,
  '317': 66, '320': 71, '323': 71, '326': 73,
  '329': 75, '332': 75, '335': 75, '338': 75,
  '350': 77, '353': 80, '356': 81, '359': 82,
  '362': 66, '365': 67, '368': 85, '371': 86,
  '374': 77, '377': 96, '386': 95, '389': 99,
  '392': 95, '395': 86
};

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=300');
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Primary: Open-Meteo
  try {
    var data = await fetchJSON(
      'https://api.open-meteo.com/v1/forecast?latitude=31.23&longitude=121.47&current=temperature_2m,weather_code&timezone=Asia%2FShanghai'
    );
    return res.status(200).json(data);
  } catch (_) { /* fallback below */ }

  // Fallback: wttr.in
  try {
    var wttr = await fetchJSON('https://wttr.in/Shanghai?format=j1');
    var cc = wttr.current_condition[0];
    var temp = parseFloat(cc.temp_C);
    var code = WMO_FROM_WTTR[cc.weatherCode] != null ? WMO_FROM_WTTR[cc.weatherCode] : 0;
    return res.status(200).json({
      current: {
        temperature_2m: temp,
        weather_code: code
      }
    });
  } catch (e) {
    return res.status(502).json({ error: 'all weather sources failed', detail: e.message });
  }
};
