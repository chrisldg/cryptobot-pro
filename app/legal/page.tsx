'use client';

export default function Legal() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Mentions Légales</h1>
        
        <div className="bg-red-900/20 border border-red-500 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-red-500 mb-4">⚠️ AVERTISSEMENT IMPORTANT</h2>
          <ul className="space-y-2 text-sm">
            <li>• Le trading de cryptomonnaies comporte des risques élevés de perte en capital</li>
            <li>• Les performances passées ne garantissent pas les résultats futurs</li>
            <li>• Vous pouvez perdre la totalité de votre investissement</li>
            <li>• CryptoBot Pro n'est PAS un conseil en investissement</li>
            <li>• Consultez un conseiller financier avant d'investir</li>
          </ul>
        </div>

        <h2 className="text-2xl font-bold mb-4">Conditions d'Utilisation</h2>
        <div className="prose prose-invert mb-8">
          <p>En utilisant CryptoBot Pro, vous acceptez que :</p>
          <ul>
            <li>Vous tradez à vos propres risques</li>
            <li>La plateforme est fournie "en l'état" sans garantie</li>
            <li>Nous ne sommes pas responsables de vos pertes</li>
            <li>Vous êtes majeur et légalement autorisé à trader</li>
          </ul>
        </div>

        <h2 className="text-2xl font-bold mb-4">Politique de Confidentialité</h2>
        <p className="mb-4">Nous collectons et protégeons vos données conformément au RGPD.</p>
        
        <h2 className="text-2xl font-bold mb-4">Responsabilité</h2>
        <p>CryptoBot Pro et ses créateurs ne peuvent être tenus responsables des pertes financières résultant de l'utilisation de la plateforme.</p>
      </div>
    </div>
  );
}