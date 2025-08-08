import { QRCodeSVG } from 'qrcode.react';
import { renderToString } from 'react-dom/server';

export default function QRCodeTicket() {
  const handlePrint = () => {
    // Détecter si on est sur mobile
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (isMobile) {
      // Sur mobile, créer un élément canvas pour l'image
      const qrCodeString = renderToString(
        <QRCodeSVG
          value="https://ligneup.netlify.app"
          size={1024} // Plus grande taille pour meilleure qualité
          level="H"
          includeMargin={true}
        />
      );

      // Créer un conteneur temporaire
      const container = document.createElement('div');
      container.innerHTML = qrCodeString;
      const svgElement = container.querySelector('svg');

      // Créer un canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      // Convertir SVG en image
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl = URL.createObjectURL(svgBlob);

      img.onload = () => {
        // Définir la taille du canvas
        canvas.width = img.width;
        canvas.height = img.height;

        // Dessiner l'image sur le canvas
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);

        // Convertir le canvas en image téléchargeable
        const imgUrl = canvas.toDataURL('image/png');
        
        // Créer un lien de téléchargement
        const downloadLink = document.createElement('a');
        downloadLink.href = imgUrl;
        downloadLink.download = 'LineUp-QRCode.png';
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        
        // Nettoyer
        URL.revokeObjectURL(svgUrl);
      };

      img.src = svgUrl;
    } else {
      // Sur desktop, utiliser l'impression normale
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      document.body.appendChild(iframe);

      const qrCodeString = renderToString(
        <QRCodeSVG
          value="https://ligneup.netlify.app"
          size={200}
          level="H"
          includeMargin={true}
        />
      );

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

      iframe.contentWindow.document.open();
      iframe.contentWindow.document.write(printContent);
      iframe.contentWindow.document.close();

      iframe.onload = () => {
        iframe.contentWindow.print();
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1000);
      };
    }
  };

  return (
    <button
      onClick={handlePrint}
      className="w-full bg-gradient-to-r from-purple-600 to-purple-500 text-white px-6 py-3 rounded-xl hover:from-purple-700 hover:to-purple-600 transition-all transform hover:scale-[1.02] font-medium shadow-sm flex items-center justify-center gap-2"
    >
      <span className="text-xl" aria-hidden="true"></span>
      <span>{/iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ? 'Télécharger le QR code' : 'Imprimer le QR code'}</span>
    </button>
  );
} 