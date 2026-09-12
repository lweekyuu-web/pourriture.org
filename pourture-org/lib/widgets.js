const prisma = require('./prisma');

// Récupère les widgets actifs d'un emplacement, triés, et incrémente leurs vues.
// Utilisé côté serveur (getServerSideProps) uniquement.
async function getWidgetsForSlot(slot) {
  const widgets = await prisma.widget.findMany({
    where: { slot, active: true },
    orderBy: { order: 'asc' },
  });

  if (widgets.length > 0) {
    const ids = widgets.map((w) => w.id);
    prisma.widget
      .updateMany({ where: { id: { in: ids } }, data: { impressions: { increment: 1 } } })
      .catch(() => {});
  }

  return JSON.parse(JSON.stringify(widgets));
}

module.exports = { getWidgetsForSlot };
