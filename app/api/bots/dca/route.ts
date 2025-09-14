// Route pour exécuter le DCA toutes les heures
export async function POST(request: Request) {
  const { botId, amount, pair } = await request.json();
  
  // Logique DCA : acheter X$ de crypto à intervalle régulier
  // Sauvegarder en DB
  // Créer l'ordre sur Binance
}