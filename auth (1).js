// lib/auth.js — serverside pincode-check. APP_PIN leeg/niet gezet = geen slot.
export function pinIsGeldig(req) {
  const vereist = process.env.APP_PIN;
  if (!vereist) return true;
  const meegestuurd = req.headers['x-app-pin'];
  return meegestuurd === vereist;
}

export function weigerIndienOngeldig(req, res) {
  if (pinIsGeldig(req)) return false;
  res.status(401).json({ fout: 'Incorrect or missing PIN.' });
  return true;
}
