export default async function handler(req, res) {
  try {
    const r = await fetch('https://moviq.onrender.com/api/health');
    const data = await r.json();
    res.status(200).json({ pinged: true, backend: data });
  } catch (e) {
    res.status(200).json({ pinged: false, error: e.message });
  }
}
