// Réglages du site modifiables par l'admin depuis /admin/settings, sans code.
const prisma = require('./prisma');

const DEFAULTS = {
  site_title: 'POURRITURE.ORG',
  site_tagline: 'a slow forgotten corner of the internet',
  motd: '',
  footer_text: 'pourriture.org — community forum',
  rules_text: 'Be excellent to each other. No real names, no real addresses, no real threats.',
  threads_per_page: '10',
  archive_after_days: '365',
  established_year: '2009',
  site_version: '3.7',
  last_updated: '2017',
  maintenance_mode: '0',
};

async function getAllSettings() {
  const rows = await prisma.siteSetting.findMany();
  const map = { ...DEFAULTS };
  for (const r of rows) map[r.key] = r.value;
  return map;
}

async function getSetting(key) {
  const row = await prisma.siteSetting.findUnique({ where: { key } });
  return row ? row.value : (DEFAULTS[key] ?? '');
}

async function setSettings(entries) {
  for (const [key, value] of Object.entries(entries)) {
    await prisma.siteSetting.upsert({
      where: { key },
      update: { value: String(value) },
      create: { key, value: String(value) },
    });
  }
}

module.exports = { DEFAULTS, getAllSettings, getSetting, setSettings };
