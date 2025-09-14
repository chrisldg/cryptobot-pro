export function exportToCSV(data: any[], filename: string) {
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(obj => Object.values(obj).join(','));
  const csv = [headers, ...rows].join('\n');
  
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}-${Date.now()}.csv`;
  a.click();
}

// Utilisation dans votre composant
const exportTrades = () => {
  const trades = [
    { date: '2024-01-01', bot: 'DCA Bitcoin', profit: 234.56 },
    // ... vos données
  ];
  exportToCSV(trades, 'trades-export');
};