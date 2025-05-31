import { QRCodeSVG } from 'qrcode.react';

export default function QRCodeTicket({ ticketNumber }) {
  const handlePrint = () => {
    // Créer le QR code temporairement pour l'impression
    const printContent = document.createElement('div');
    
    // Créer le QR code
    const qrCode = document.createElement('div');
    qrCode.innerHTML = `
      <div style="display: flex; justify-content: center;">
        ${new QRCodeSVG({
          value: "https://ligneup.netlify.app/",
          size: 200,
          level: "H",
          includeMargin: true,
        }).outerHTML}
      </div>
    `;

    // Contenu complet pour l'impression
    printContent.innerHTML = `
      <div style="text-align: center; padding: 20px; font-family: system-ui, -apple-system, sans-serif;">
        <h2 style="margin-bottom: 20px; color: #1e40af;">LineUp - Ticket n°${ticketNumber}</h2>
        ${qrCode.innerHTML}
        <div style="margin-top: 20px; padding: 15px; background-color: #f0f9ff; border-radius: 8px; border: 1px solid #bfdbfe;">
          <p style="color: #1e40af; margin: 0;">Scannez ce QR code pour suivre votre position dans la file d'attente</p>
          <p style="color: #3b82f6; margin-top: 8px; font-size: 14px;">https://ligneup.netlify.app/</p>
        </div>
      </div>
    `;

    const printWindow = window.open('', '', 'height=600,width=800');
    printWindow.document.write('<html><head><title>LineUp - QR Code</title>');
    printWindow.document.write('</head><body>');
    printWindow.document.write(printContent.innerHTML);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <button
      onClick={handlePrint}
      className="w-full bg-gradient-to-r from-purple-600 to-purple-500 text-white px-6 py-3 rounded-xl hover:from-purple-700 hover:to-purple-600 transition-all transform hover:scale-[1.02] font-medium shadow-sm flex items-center justify-center gap-2"
    >
      <span className="text-xl">🖨️</span>
      <span>Imprimer mon QR code</span>
    </button>
  );
} 