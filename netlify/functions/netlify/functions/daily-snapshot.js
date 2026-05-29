// Netlify Function: Daily Data Collection & Storage
// Collects snapshots of all cosmic-terrestrial events

exports.handler = async (event, context) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] Starting daily data collection...`);
  
  try {
    // Collect all current data
    const [earthquakes, solar, geomagnetic] = await Promise.all([
      fetchEarthquakeData(),
      fetchSolarData(),
      fetchGeomagneticData()
    ]);
    
    // Create daily snapshot
    const dailySnapshot = {
      date: timestamp.split('T')[0],
      timestamp: timestamp,
      data: {
        earthquakes: {
          count_total: earthquakes.length,
          count_m5plus: earthquakes.filter(eq => eq.magnitude >= 5.0).length,
          count_m6plus: earthquakes.filter(eq => eq.magnitude >= 6.0).length,
          avg_magnitude: earthquakes.length > 0 
            ? (earthquakes.reduce((sum, eq) => sum + eq.magnitude, 0) / earthquakes.length).toFixed(2)
            : 0,
          max_magnitude: earthquakes.length > 0 
            ? Math.max(...earthquakes.map(eq => eq.magnitude)).toFixed(1)
            : 0,
          events: earthquakes.slice(0, 10)
        },
        solar: {
          class: solar.currentClass,
          flux: solar.flux,
          is_flaring: solar.isFlaring
        },
        geomagnetic: {
          kp: geomagnetic.currentKp,
          storm_level: geomagnetic.stormLevel,
          is_storm: geomagnetic.isStorm
        }
      }
    };
    
    console.log(`[${timestamp}] Data collection complete`);
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        snapshot: dailySnapshot,
        message: 'Daily snapshot collected successfully'
      })
    };
    
  } catch (error) {
    console.error('Error collecting daily data:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        success: false,
        error: error.message 
      })
    };
  }
};

async function fetchEarthquakeData() {
  try {
    const response = await fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.geojson');
    const data = await response.json();
    
    return data.features.map(feature => ({
      magnitude: feature.properties.mag,
      location: feature.properties.place,
      time: new Date(feature.properties.time).toISOString()
    }));
  } catch (error) {
    console.error('Error fetching earthquakes:', error);
    return [];
  }
}

async function fetchSolarData() {
  try {
    const response = await fetch('https://services.swpc.noaa.gov/json/goes/primary/xrays-6-hour.json');
    const data = await response.json();
    
    if (!data || data.length === 0) {
      return { currentClass: 'B', flux: 0, isFlaring: false };
    }
    
    const latest = data[data.length - 1];
    const flux = parseFloat(latest.flux);
    
    let flareClass = 'A';
    if (flux >= 1e-3) flareClass = 'X';
    else if (flux >= 1e-4) flareClass = 'M';
    else if (flux >= 1e-5) flareClass = 'C';
    else if (flux >= 1e-6) flareClass = 'B';
    
    return {
      currentClass:
