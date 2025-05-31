import { QRCodeSVG } from 'qrcode.react';
import { useRef } from 'react';

export default function QRCodeTicket({ ticketNumber }) {
  const qrRef = useRef();

  const handlePrint = () => {
    const printContent = document.createElement('div');
    printContent.innerHTML = `
      <div style="text-align: center; padding: 20px;">
        <h2 style="margin-bottom: 20px;">LineUp - Ticket n°${ticketNumber}</h2>
        ${qrRef.current.innerHTML}
        <p style="margin-top: 20px; color: #666;">Scannez ce QR code pour suivre votre position dans la file d'attente</p>
        <p style="margin-top: 10px; font-size: 12px;">https://ligneup.netlify.app/</p>
      </div>
    `;

    const printWindow = window.open('', '', 'height=400,width=800');
    printWindow.document.write('<html><head><title>LineUp - QR Code</title>');
    printWindow.document.write('</head><body>');
    printWindow.document.write(printContent.innerHTML);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="flex flex-col items-center bg-white p-6 rounded-lg shadow-sm">
      <div ref={qrRef} className="mb-4">
        <QRCodeSVG
          value="https://ligneup.netlify.app/"
          size={200}
          level="H"
          includeMargin={true}
          imageSettings={{
            src: "/icon-192x192.png",
            height: 40,
            width: 40,
            excavate: true,
          }}
        />
      </div>
      <p className="text-sm text-gray-600 mb-4 text-center">
        Scannez ce QR code pour suivre votre position dans la file d'attente
      </p>
      <button
        onClick={handlePrint}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
      >
        <span>🖨️</span> Imprimer le QR code
      </button>
    </div>
  );
} 