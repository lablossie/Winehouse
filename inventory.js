// api/inventory.js — GET haalt de gedeelde voorraad op, PUT slaat 'm op.
import { haalState, bewaarState } from '../lib/kv.js';
import { weigerIndienOngeldig } from '../lib/auth.js';

export default async function handler(req, res) {
  if (weigerIndienOngeldig(req, res)) return;

  try {
    if (req.method === 'GET') {
      const state = await haalState();
      res.status(200).json(state || { inventory: [], history: [], ownerName: '' });
      return;
    }

    if (req.method === 'PUT') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      if (!body || !Array.isArray(body.inventory)) {
        res.status(400).json({ fout: 'Ongeldige state: "inventory" ontbreekt of is geen array.' });
        return;
      }
      await bewaarState(body);
      res.status(200).json({ ok: true });
      return;
    }

    res.status(405).json({ fout: 'Methode niet toegestaan.' });
  } catch (fout) {
    res.status(500).json({ fout: fout.message || 'Onbekende serverfout.' });
  }
}
