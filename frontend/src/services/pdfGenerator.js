import { jsPDF } from 'jspdf';

export async function generateMapPdf({ imgUrl, villageData, extent }) {
  // Fetch image as Blob and convert to Base64
  const res = await fetch(imgUrl);
  const blob = await res.blob();

  const base64Img = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

  // Calculate aspect ratio
  const img = new Image();
  img.src = base64Img;
  await new Promise(resolve => {
    img.onload = resolve;
  });

  const imgW = img.naturalWidth || 2200;
  const imgH = img.naturalHeight || 2200;
  const aspect = imgH / imgW;

  // Page dimensions (in points or mm). Let's use mm for standard printing (A3 / A4)
  // A3: 297 x 420 mm
  const pageW = 297; // mm
  const pageH = Math.max(420, Math.round(pageW * (imgH / imgW) + 50));

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [pageW, pageH]
  });

  // Background clean white
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageW, pageH, 'F');

  // Header Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(20, 35, 60);
  doc.text('UP BHUNAKSHA - CADASTRAL VILLAGE MAP', pageW / 2, 16, { align: 'center' });

  // Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(50, 65, 85);
  const distText = `District: ${villageData.districtName || villageData.distCode}  |  Tehsil: ${villageData.tehsilName || villageData.tehsilCode}  |  Village: ${villageData.villageName || villageData.villageCode}`;
  doc.text(distText, pageW / 2, 23, { align: 'center' });

  // Meta info
  doc.setFontSize(9);
  doc.setTextColor(100, 110, 125);
  const metaText = `GIS Code: ${extent.gisCode}  |  Spatial Ref: ${extent.crs || 'EPSG:32644'}  |  Large Legible Numbers Edition`;
  doc.text(metaText, pageW / 2, 28, { align: 'center' });

  // Map Image
  const marginX = 12; // mm
  const marginY = 33; // mm
  const drawW = pageW - marginX * 2;
  const drawH = drawW * aspect;

  doc.addImage(base64Img, 'PNG', marginX, marginY, drawW, drawH);

  // Border around map
  doc.setDrawColor(200, 205, 215);
  doc.setLineWidth(0.4);
  doc.rect(marginX, marginY, drawW, drawH);

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(140, 145, 155);
  doc.text('Generated from official UP BhuNaksha Cadastral Service | Vector-derived high-clarity print edition', pageW / 2, marginY + drawH + 8, { align: 'center' });

  const safeVillage = (villageData.villageName || 'Map').replace(/[^a-zA-Z0-9_\u0900-\u097F]/g, '_');
  const filename = `UP_BhuNaksha_${extent.gisCode}_${safeVillage}.pdf`;
  doc.save(filename);
}

export function downloadMapImage(imgUrl, villageData, extent) {
  fetch(imgUrl)
    .then(r => r.blob())
    .then(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const safeVillage = (villageData.villageName || 'Map').replace(/[^a-zA-Z0-9_\u0900-\u097F]/g, '_');
      a.download = `UP_BhuNaksha_${extent.gisCode}_${safeVillage}_HD.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    });
}
