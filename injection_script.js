(async () => {
    // 1. Get the active village GIS code from session
    let gisCode = sessionStorage.getItem("giscode");
    if (!gisCode) {
        gisCode = prompt("Enter 14-digit GIS Code (or District,Tehsil,Village):", "14200751121533");
    }
    if (!gisCode) return alert("GIS code not found.");

    console.log("📍 Fetching map metadata for:", gisCode);
    const levels = gisCode.includes(',') ? gisCode : `${gisCode.slice(0, 2)},${gisCode.slice(2, 4)},${gisCode.slice(4)}`;

    // 2. Fetch georeferenced bounding box
    const resp = await fetch("https://upbhunaksha.gov.in/bhunakshaserver/MapInfo/getVVVVExtentGeoref", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ gisLevels: levels })
    });
    const info = await resp.json();

    // 3. Ultra-readable Large Numbers Mode (Fixed at 2200px width for bold, legible plot numbers)
    const targetWidth = 2200;
    const targetHeight = Math.round(targetWidth * (info.ymax - info.ymin) / (info.xmax - info.xmin));

    const params = new URLSearchParams({
        SERVICE: 'WMS',
        VERSION: '1.3.0',
        REQUEST: 'GetMap',
        FORMAT: 'image/png',
        TRANSPARENT: 'FALSE',
        LAYERS: 'VILLAGE_MAP',
        STYLES: 'VILLAGE_MAP',
        CRS: info.crs || 'EPSG:32644',
        gis_code: info.gisCode,
        overlay_codes: '',
        state: '',
        BBOX: `${info.xmin},${info.ymin},${info.xmax},${info.ymax}`,
        WIDTH: targetWidth,
        HEIGHT: targetHeight
    });

    const wmsUrl = `https://upbhunaksha.gov.in/bhunakshaserver/WMS?${params.toString()}`;
    console.log(`⏳ Downloading Large Numbers Map (${targetWidth}x${targetHeight} px)...`);

    const imgResp = await fetch(wmsUrl);
    const blob = await imgResp.blob();
    const blobUrl = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = `UP_BhuNaksha_${info.gisCode}_Large_Numbers.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    console.log("✅ Downloaded Large Numbers Map successfully!");
})();
