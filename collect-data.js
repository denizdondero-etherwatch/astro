// Netlify Function: Collect cosmic and terrestrial data daily
// This runs every day at 6 AM UTC via scheduled function

const fetch = require('node-fetch');

// Simple data storage using Netlify Blob Store or you can use a free database
// For now, we'll use environment variables or external storage

exports.handler = async (event, context) => {
  const today = new Date();
  const timestamp = today.toISOString();
  
  console.log(`[${timestamp}] Starting data collection...`);
  
  try {
    // Collect all data sources
    const [earthquakeData, solarData, geomagneticData] = await Promise.all([
      fetchEarthquakes(),
      fetchSolarData(),
      fetchGeomagneticData()
    ]);
    
    // Store the collected data
    const collectedData = {
      timestamp,
      earthquakes: earthquakeData,
      solar: solarData,
      geomagnetic: geomagneticData
    };
    
    // TODO: Store in database or Netlify Blob Store
    // For now, we'll return it and you can set up storage later
    
    console.log(`[${timestamp}] Data collection complete:`, {
      earthquakes: earthquakeData.length,
      solar: solarData.currentClass,
      geomagnetic: geomagneticData.currentKp
    });
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        data: collectedData,
        message: 'Data collection successful'
      })
    };
    
  } catch (error) {
    console.error('Error collecting data:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};

// Fetch earthquake data from USGS
async function fetchEarthquakes() {
  try {
    const response = await fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_week.geojson');
    const data = await response.json();
    
    return data.features.map(feature => ({
      magnitude: feature.properties.mag,
      location: feature.properties.place,
      time: new Date(feature.properties.time).toISOString(),
      coordinates: feature.geometry.coordinates,
      depth: feature.geometry.coordinates[2]
    }));
  } catch (error) {
    console.error('Error fetching earthquakes:', error);
    return [];
  }
}

// Fetch solar flare data from NOAA
async function fetchSolarData() {
  try {
    const response = await fetch('https://services.swpc.noaa.gov/json/goes/primary/xrays-6-hour.json');
    const data = await response.json();
    
    if (!data || data.length === 0) {
      return { currentClass: 'B', flux: 0, timestamp: new Date().toISOString() };
    }
    
    const latest = data[data.length - 1];
    const flux = parseFloat(latest.flux);
    
    // Determine flare class
    let flareClass = 'A';
    let classNumber = flux;
    
    if (flux >= 1e-3) {
      flareClass = 'X';
      classNumber = flux / 1e-3;
    } else if (flux >= 1e-4) {
      flareClass = 'M';
      classNumber = flux / 1e-4;
    } else if (flux >= 1e-5) {
      flareClass = 'C';
      classNumber = flux / 1e-5;
    } else if (flux >= 1e-6) {
      flareClass = 'B';
      classNumber = flux / 1e-6;
    }
    
    return {
      currentClass: `${flareClass}${classNumber.toFixed(1)}`,
      flux,
      timestamp: latest.time_tag,
      isFlaring: flux >= 1e-5 // C-class or higher
    };
  } catch (error) {
    console.error('Error fetching solar data:', error);
    return { currentClass: 'B', flux: 0, timestamp: new Date().toISOString() };
  }
}

// Fetch geomagnetic data (Kp index) from NOAA
async function fetchGeomagneticData() {
  try {
    const response = await fetch('https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json');
    const data = await response.json();
    
    if (!data || data.length < 2) {
      return { currentKp: 0, stormLevel: 'Quiet', timestamp: new Date().toISOString() };
    }
    
    // Get latest Kp value (skip header row)
    const latest = data[data.length - 1];
    const kp = parseFloat(latest[1]);
    
    // Determine storm level
    let stormLevel = 'Quiet';
    if (kp >= 9) stormLevel = 'G5 - Extreme';
    else if (kp >= 8) stormLevel = 'G4 - Severe';
    else if (kp >= 7) stormLevel = 'G3 - Strong';
    else if (kp >= 6) stormLevel = 'G2 - Moderate';
    else if (kp >= 5) stormLevel = 'G1 - Minor';
    else if (kp >= 4) stormLevel = 'Unsettled';
    
    return {
      currentKp: kp,
      stormLevel,
      timestamp: latest[0],
      isStorm: kp >= 5
    };
  } catch (error) {
    console.error('Error fetching geomagnetic data:', error);
    return { currentKp: 0, stormLevel: 'Quiet', timestamp: new Date().toISOString() };
  }
}
