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

// Generate & Download Authentic Full Plot Report PDF
export async function generatePlotReportPdf({ plotInfo, villageData, extent }) {
  const plotNo = plotInfo.basePlotNo || plotInfo.plotNo || 'Plot';
  const gisCode = extent?.gisCode || plotInfo.gisCode;

  // 1. Fetch official plot map image from UP BhuNaksha API
  let plotImageBase64 = null;
  let plotScale = null;
  try {
    const res = await fetch(`/bhunakshaserver/api/plots?gisCode=${encodeURIComponent(gisCode)}&plotNo=${encodeURIComponent(plotNo)}`);
    if (res.ok) {
      const data = await res.json();
      plotImageBase64 = data.imageBase64;
      plotScale = data.scale;
    }
  } catch (err) {
    console.warn('Could not fetch plot-specific map image:', err);
  }

  // 2. Build offscreen HTML report element
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '780px';
  container.style.backgroundColor = '#ffffff';
  container.style.color = '#1e293b';
  container.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans Devanagari", sans-serif';
  container.style.padding = '28px';
  container.style.boxSizing = 'border-box';

  const totalAreaHa = plotInfo.areaHectare || '---';
  const subdivisions = plotInfo.subdivisions || [];

  container.innerHTML = `
    <div style="border: 2px solid #0f172a; padding: 20px; border-radius: 4px;">
      <!-- Report Header -->
      <div style="text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 16px;">
        <div style="font-size: 13px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 1px;">
          उत्तर प्रदेश राजस्व परिषद / Board of Revenue, Uttar Pradesh
        </div>
        <div style="font-size: 20px; font-weight: 800; color: #0f172a; margin-top: 4px;">
          UP BHUNAKSHA - PLOT CADASTRAL REPORT (गाटा नक़्शा रिपोर्ट)
        </div>
      </div>

      <!-- Village & Plot Info Grid -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 12px;">
        <tr>
          <td style="padding: 6px 10px; border: 1px solid #cbd5e1; background: #f8fafc; font-weight: 600; width: 22%;">District / जनपद:</td>
          <td style="padding: 6px 10px; border: 1px solid #cbd5e1; width: 28%;">${villageData?.districtName || villageData?.distCode || '---'}</td>
          <td style="padding: 6px 10px; border: 1px solid #cbd5e1; background: #f8fafc; font-weight: 600; width: 22%;">Tehsil / तहसील:</td>
          <td style="padding: 6px 10px; border: 1px solid #cbd5e1; width: 28%;">${villageData?.tehsilName || villageData?.tehsilCode || '---'}</td>
        </tr>
        <tr>
          <td style="padding: 6px 10px; border: 1px solid #cbd5e1; background: #f8fafc; font-weight: 600;">Village / ग्राम:</td>
          <td style="padding: 6px 10px; border: 1px solid #cbd5e1;">${villageData?.villageName || villageData?.villageCode || '---'}</td>
          <td style="padding: 6px 10px; border: 1px solid #cbd5e1; background: #f8fafc; font-weight: 600;">Village GIS Code:</td>
          <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-family: monospace;">${gisCode}</td>
        </tr>
        <tr>
          <td style="padding: 6px 10px; border: 1px solid #cbd5e1; background: #f0fdf4; font-weight: 700; color: #166534;">Plot No. (गाटा सं.):</td>
          <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: 700; font-size: 13px; color: #1e40af;">${plotNo}</td>
          <td style="padding: 6px 10px; border: 1px solid #cbd5e1; background: #f0fdf4; font-weight: 700; color: #166534;">Total Area / कुल क्षेत्रफल:</td>
          <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: 700; font-size: 13px; color: #166534;">${totalAreaHa} Hectares</td>
        </tr>
      </table>

      <!-- Plot Map Section -->
      ${plotImageBase64 ? `
        <div style="text-align: center; margin-bottom: 18px; border: 1px solid #cbd5e1; padding: 12px; background: #f8fafc; border-radius: 4px;">
          <div style="font-size: 12px; font-weight: 700; color: #334155; margin-bottom: 8px;">
            Plot Cadastral Map (नक़्शा विवरण) ${plotScale ? `[Scale: ${plotScale}]` : ''}
          </div>
          <img src="data:image/png;base64,${plotImageBase64}" style="max-width: 100%; max-height: 280px; object-fit: contain; border: 1px solid #94a3b8; background: #fff;" />
        </div>
      ` : ''}

      <!-- Khasra & Khata Breakdown Table -->
      <div style="margin-bottom: 16px;">
        <div style="font-size: 12px; font-weight: 700; color: #0f172a; text-transform: uppercase; margin-bottom: 6px;">
          Khasra & Khata Breakdown / गाटा एवं खाता अंश विवरण
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
          <thead>
            <tr style="background: #e2e8f0;">
              <th style="border: 1px solid #cbd5e1; padding: 6px; text-align: center; width: 12%;">S.No</th>
              <th style="border: 1px solid #cbd5e1; padding: 6px; text-align: left;">Khasra No. (गाटा)</th>
              <th style="border: 1px solid #cbd5e1; padding: 6px; text-align: left;">Khata No. (खाता सं.)</th>
              <th style="border: 1px solid #cbd5e1; padding: 6px; text-align: right;">Area (Hectares)</th>
            </tr>
          </thead>
          <tbody>
            ${subdivisions.length > 0 ? subdivisions.map((s, idx) => `
              <tr>
                <td style="border: 1px solid #cbd5e1; padding: 5px; text-align: center;">${idx + 1}</td>
                <td style="border: 1px solid #cbd5e1; padding: 5px; font-weight: 600;">${s.khasraNo}</td>
                <td style="border: 1px solid #cbd5e1; padding: 5px; font-family: monospace;">${s.khataNo}</td>
                <td style="border: 1px solid #cbd5e1; padding: 5px; text-align: right; font-weight: 600;">${s.areaHectare} Ha</td>
              </tr>
            `).join('') : `
              <tr>
                <td style="border: 1px solid #cbd5e1; padding: 5px; text-align: center;">1</td>
                <td style="border: 1px solid #cbd5e1; padding: 5px; font-weight: 600;">${plotNo}</td>
                <td style="border: 1px solid #cbd5e1; padding: 5px; font-family: monospace;">${plotInfo.khataNo || '---'}</td>
                <td style="border: 1px solid #cbd5e1; padding: 5px; text-align: right; font-weight: 600;">${totalAreaHa} Ha</td>
              </tr>
            `}
          </tbody>
        </table>
      </div>

      <!-- Khatedars / Land Owners Table -->
      <div style="margin-bottom: 16px;">
        <div style="font-size: 12px; font-weight: 700; color: #0f172a; text-transform: uppercase; margin-bottom: 6px;">
          Land Owners / खातेदार विवरण (${plotInfo.owners?.length || 0})
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 10.5px;">
          <thead>
            <tr style="background: #e2e8f0;">
              <th style="border: 1px solid #cbd5e1; padding: 5px; text-align: center; width: 8%;">क्र.सं.</th>
              <th style="border: 1px solid #cbd5e1; padding: 5px; text-align: left; width: 34%;">खातेदार का नाम</th>
              <th style="border: 1px solid #cbd5e1; padding: 5px; text-align: left; width: 34%;">पिता / संरक्षक का नाम</th>
              <th style="border: 1px solid #cbd5e1; padding: 5px; text-align: left; width: 24%;">निवास स्थान</th>
            </tr>
          </thead>
          <tbody>
            ${(() => {
              if (plotInfo.owners && plotInfo.owners.length > 0) {
                let currentKhata = null;
                return plotInfo.owners.map((o, idx) => {
                  let groupRow = '';
                  if (o.khataNo && o.khataNo !== currentKhata) {
                    currentKhata = o.khataNo;
                    const matchedKhata = plotInfo.khatas?.find(k => k.khataNo === currentKhata);
                    const khasraLabel = matchedKhata ? matchedKhata.plotNo : plotInfo.plotNo;
                    groupRow = `
                      <tr>
                        <td colspan="4" style="background: #fef3c7; border: 1px solid #cbd5e1; padding: 6px; font-weight: 700; color: #92400e; font-size: 11px;">
                          📌 खसरा (Khasra) : ${khasraLabel} | खाता (Khata) : ${currentKhata} के खातेदार
                        </td>
                      </tr>
                    `;
                  }
                  const row = `
                    <tr style="background: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
                      <td style="border: 1px solid #cbd5e1; padding: 4px; text-align: center;">${o.serial || (idx + 1)}</td>
                      <td style="border: 1px solid #cbd5e1; padding: 4px; font-weight: 600;">${o.name}</td>
                      <td style="border: 1px solid #cbd5e1; padding: 4px;">${o.guardian || '---'}</td>
                      <td style="border: 1px solid #cbd5e1; padding: 4px;">${o.residence || 'नि.ग्राम'}</td>
                    </tr>
                  `;
                  return groupRow + row;
                }).join('');
              } else {
                return `
                  <tr>
                    <td colspan="4" style="border: 1px solid #cbd5e1; padding: 8px; text-align: center; color: #64748b;">
                      No individual owner records listed (e.g. Government/Public Land).
                    </td>
                  </tr>
                `;
              }
            })()}
          </tbody>
        </table>
      </div>

      <!-- Mutation & Court Orders (if present) -->
      ${plotInfo.orders && plotInfo.orders.length > 0 ? `
        <div style="margin-bottom: 16px;">
          <div style="font-size: 12px; font-weight: 700; color: #92400e; text-transform: uppercase; margin-bottom: 6px;">
            राजस्व आदेश एवं नामांतरण विवरण / Registered Orders (${plotInfo.orders.length})
          </div>
          <div style="display: flex; flex-direction: column; gap: 6px;">
            ${plotInfo.orders.map((ord, idx) => `
              <div style="border: 1px solid #fde68a; background: #fffdf5; padding: 6px 10px; font-size: 10px; border-radius: 3px; line-height: 1.4;">
                <span style="font-weight: 700; color: #b45309;">#${ord.serial || (idx + 1)} ${ord.khataNo ? `[खाता ${ord.khataNo}]` : ''}:</span>
                <span style="color: #78350f;">${ord.text}</span>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Footer Disclaimer -->
      <div style="border-top: 1px solid #cbd5e1; padding-top: 8px; font-size: 9px; color: #94a3b8; text-align: center;">
        यह प्रपत्र UP BhuNaksha / राजस्व परिषद के भूलेख पोर्टल से जनरेट किया गया है। विधिक प्रमाण हेतु प्राधिकृत खतौनी ही मान्य होगी।
      </div>
    </div>
  `;

  document.body.appendChild(container);

  try {
    const html2canvasModule = await import('html2canvas');
    const html2canvas = html2canvasModule.default || html2canvasModule;
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    // If content exceeds single A4 height, handle multi-page or fit cleanly
    let heightLeft = pdfHeight;
    let position = 0;
    const pageHeight = pdf.internal.pageSize.getHeight();

    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - pdfHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;
    }

    const safeVillage = (villageData?.villageName || 'Village').replace(/[^a-zA-Z0-9_\u0900-\u097F]/g, '_');
    pdf.save(`Plot_Report_${plotNo}_${safeVillage}.pdf`);
  } finally {
    document.body.removeChild(container);
  }
}

