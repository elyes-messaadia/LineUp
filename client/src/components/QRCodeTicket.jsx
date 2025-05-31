import { QRCodeSVG } from 'qrcode.react';
import { renderToString } from 'react-dom/server';

export default function QRCodeTicket() {
  const handlePrint = () => {
    // Créer un iframe caché pour l'impression
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);

    // Générer le QR code
    const qrCodeString = renderToString(
      <QRCodeSVG
        value="https://ligneup.netlify.app"
        size={200}
        level="H"
        includeMargin={true}
      />
    );

    // Contenu à imprimer
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>LineUp - QR Code</title>
          <style>
            @page {
              size: 80mm 120mm;
              margin: 0;
            }
            body {
              margin: 10mm;
              font-family: system-ui, -apple-system, sans-serif;
              text-align: center;
            }
            .qr-container {
              display: flex;
              justify-content: center;
              margin: 10mm 0;
            }
            .info-box {
              margin-top: 10mm;
              padding: 5mm;
              background-color: #f0f9ff;
              border-radius: 3mm;
              border: 0.5mm solid #bfdbfe;
            }
            .title {
              color: #1e40af;
              font-size: 16pt;
              margin-bottom: 5mm;
            }
            .instruction {
              color: #1e40af;
              margin: 0;
              font-size: 10pt;
            }
            .url {
              color: #3b82f6;
              margin-top: 2mm;
              font-size: 8pt;
            }
          </style>
        </head>
        <body>
          <div class="title">LineUp</div>
          <div class="qr-container">${qrCodeString}</div>
          <div class="info-box">
            <p class="instruction">Scannez ce QR code pour suivre votre position</p>
            <p class="url">https://ligneup.netlify.app</p>
          </div>
        </body>
      </html>
    `;

    // Écrire le contenu dans l'iframe
    iframe.contentWindow.document.open();
    iframe.contentWindow.document.write(printContent);
    iframe.contentWindow.document.close();

    // Attendre que le contenu soit chargé
    iframe.onload = () => {
      // Imprimer
      iframe.contentWindow.print();
      
      // Supprimer l'iframe après l'impression
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    };
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