'use client';

import { useState, useEffect } from 'react';

export default function RiskDisclaimer() {
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    const hasAccepted = localStorage.getItem('risk-disclaimer-accepted');
    if (!hasAccepted) {
      document.body.style.overflow = 'hidden';
    }
    setAccepted(!!hasAccepted);
  }, []);

  const handleAccept = () => {
    localStorage.setItem('risk-disclaimer-accepted', 'true');
    setAccepted(true);
    document.body.style.overflow = 'auto';
  };

  if (accepted) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4">
      <div className="bg-gray-900 border-2 border-red-500 rounded-xl max-w-2xl max-h-[90vh] overflow-y-auto p-8">
        <h1 className="text-3xl font-bold text-red-500 mb-4">
          ⚠️ AVERTISSEMENT IMPORTANT
        </h1>
        
        <div className="space-y-4 text-white mb-6">
          <h2 className="text-xl font-bold text-red-400">
            RISQUES DE TRADING DE CRYPTOMONNAIES
          </h2>
          
          <ul className="space-y-2 text-sm">
            <li>• Cette plateforme est en MODE DÉMO/TEST uniquement</li>
            <li>• Aucun trading réel n'est effectué actuellement</li>
            <li>• Le trading de crypto peut entraîner la PERTE TOTALE de votre capital</li>
            <li>• Les performances passées NE garantissent PAS les résultats futurs</li>
            <li>• Cette plateforme N'EST PAS un conseil en investissement</li>
            <li>• Nous NE sommes PAS responsables de vos pertes</li>
            <li>• Consultez un conseiller financier avant d'investir</li>
          </ul>

          <div className="bg-red-900 bg-opacity-50 p-4 rounded-lg">
            <p className="font-bold">LIMITE DE SÉCURITÉ :</p>
            <p>Maximum 100€ par utilisateur (quand le trading réel sera activé)</p>
          </div>
        </div>

        <div className="flex gap-4">
            <button
                onClick={handleAccept}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 px-6 rounded-lg font-bold"
            >
                J'accepte les risques et je comprends
            </button>
            <a    {/* ← IL MANQUAIT CETTE BALISE */}
                href="https://google.com"
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 px-6 rounded-lg font-bold text-center"
            >
                Je refuse, quitter
            </a>
            </div>
      </div>
    </div>
  );
}