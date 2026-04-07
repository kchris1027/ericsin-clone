export default async function handler(req, res) {
  const url =
    'https://api.open-meteo.com/v1/forecast?latitude=31.23&longitude=121.47&current=temperature_2m,weather_code&timezone=Asia%2FShanghai';

  try {
    const upstream = await fetch(url);
    if (!upstream.ok) {
      return res.status(upstream.status).json({ error: 'upstream error' });
    }
    const data = await upstream.json();
    res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=300');
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json(data);
  } catch (e) {
    return res.status(502).json({ error: 'failed to fetch weather' });
  }
}
