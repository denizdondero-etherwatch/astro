// Netlify Function: Real Swiss Ephemeris Planetary Aspects
// Calculates ACTUAL planetary positions and real aspects

const swisseph = require('swisseph');

// Initialize ephemeris path
swisseph.swe_set_ephe_path(__dirname + '/ephemeris');

exports.handler = async (event, context) => {
  try {
    console.log('Calculating REAL planetary aspects with Swiss Ephemeris...');
    
    const aspects = calculateRealAspects();
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=86400'
      },
      body: JSON.stringify({
        success: true,
        aspects: aspects,
        calculatedAt: new Date().toISOString(),
        method: 'Swiss Ephemeris (Real Astronomical Calculations)'
      })
    };
    
  } catch (error) {
    console.error('Error calculating aspects:', error);
    
    // Fallback to simulated data if Swiss Ephemeris fails
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        aspects: getFallbackAspects(),
        calculatedAt: new Date().toISOString(),
        method: 'Fallback (Swiss Ephemeris unavailable)',
        error: error.message
      })
    };
  }
};

function calculateRealAspects() {
  const today = new Date();
  const allAspects = [];
  
  // Planet codes for Swiss Ephemeris
  const planets = [
    { code: swisseph.SE_SUN, name: 'Sun', symbol: '☉' },
    { code: swisseph.SE_MOON, name: 'Moon', symbol: '☽' },
    { code: swisseph.SE_MERCURY, name: 'Mercury', symbol: '☿' },
    { code: swisseph.SE_VENUS, name: 'Venus', symbol: '♀' },
    { code: swisseph.SE_MARS, name: 'Mars', symbol: '♂' },
    { code: swisseph.SE_JUPITER, name: 'Jupiter', symbol: '♃' },
    { code: swisseph.SE_SATURN, name: 'Saturn', symbol: '♄' },
    { code: swisseph.SE_URANUS, name: 'Uranus', symbol: '♅' },
    { code: swisseph.SE_NEPTUNE, name: 'Neptune', symbol: '♆' },
    { code: swisseph.SE_PLUTO, name: 'Pluto', symbol: '♇' }
  ];
  
  // Aspect definitions
  const aspectTypes = [
    { name: 'Conjunction', symbol: '☌', angle: 0, orb: 8, energy: 'Unity, intensity, focus', color: '#22c55e' },
    { name: 'Opposition', symbol: '☍', angle: 180, orb: 8, energy: 'Polarity, awareness, balance', color: '#a855f7' },
    { name: 'Square', symbol: '□', angle: 90, orb: 7, energy: 'Tension, challenge, growth', color: '#ef4444' },
    { name: 'Trine', symbol: '△', angle: 120, orb: 7, energy: 'Harmony, flow, grace', color: '#3b82f6' },
    { name: 'Sextile', symbol: '⚹', angle: 60, orb: 6, energy: 'Opportunity, ease, support', color: '#10b981' }
  ];
  
  // Calculate for 9 days (past 2 + today + next 7)
  for (let dayOffset = -2; dayOffset <= 7; dayOffset++) {
    const date = new Date(today);
    date.setDate(date.getDate() + dayOffset);
    date.setHours(12, 0, 0, 0); // Noon UTC
    
    const monthDay = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const julianDay = getJulianDay(date);
    
    try {
      // Calculate planetary positions
      const positions = {};
      for (const planet of planets) {
        try {
          const result = swisseph.swe_calc_ut(julianDay, planet.code, swisseph.SEFLG_SWIEPH);
          positions[planet.name] = {
            longitude: result.longitude,
            symbol: planet.symbol,
            code: planet.code
          };
        } catch (e) {
          console.warn(`Could not calculate ${planet.name}:`, e.message);
        }
      }
      
      // Find aspects for this day
      const dayAspects = findAspectsForDay(positions, aspectTypes, planets, monthDay);
      
      // Add the most significant aspect for this day
      if (dayAspects.length > 0) {
        allAspects.push(dayAspects[0]); // Top aspect by significance
      }
    } catch (error) {
      console.warn(`Error calculating aspects for ${monthDay}:`, error.message);
    }
  }
  
  // Return top 8 most significant aspects
  return allAspects.slice(0, 8);
}

function findAspectsForDay(positions, aspectTypes, planets, dateStr) {
  const aspects = [];
  const planetNames = Object.keys(positions);
  
  // Check all planet pairs
  for (let i = 0; i < planetNames.length; i++) {
    for (let j = i + 1; j < planetNames.length; j++) {
      const p1Name = planetNames[i];
      const p2Name = planetNames[j];
      const p1 = positions[p1Name];
      const p2 = positions[p2Name];
      
      // Calculate angle between planets
      let angle = Math.abs(p1.longitude - p2.longitude);
      if (angle > 180) angle = 360 - angle;
      
      // Check each aspect type
      for (const aspectType of aspectTypes) {
        const deviation = Math.abs(angle - aspectType.angle);
        
        if (deviation <= aspectType.orb) {
          // Found an aspect!
          const exactness = ((aspectType.orb - deviation) / aspectType.orb) * 100;
          
          aspects.push({
            date: dateStr,
            aspect: `${aspectType.name} ${aspectType.symbol}`,
            planets: `${p1Name} ${p1.symbol} - ${p2Name} ${p2.symbol}`,
            degree: `${aspectType.angle}°`,
            energy: aspectType.energy,
            color: aspectType.color,
            icon: aspectType.symbol,
            significance: exactness,
            angle: angle.toFixed(2)
          });
        }
      }
    }
  }
  
  // Sort by significance and return
  return aspects.sort((a, b) => b.significance - a.significance);
}

function getJulianDay(date) {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  const hour = date.getUTCHours() + (date.getUTCMinutes() / 60);
  
  // Calculate Julian Day Number
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  
  const jdn = day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
  
  return jdn + (hour - 12) / 24;
}

function getFallbackAspects() {
  // Fallback realistic aspects
  const today = new Date();
  const fallback = [];
  
  const predefined = [
    { aspect: 'Conjunction ☌', planets: 'Venus ♀ - Jupiter ♃', degree: '0°', energy: 'Expansion, abundance, beauty', color: '#22c55e', icon: '☌' },
    { aspect: 'Opposition ☍', planets: 'Sun ☉ - Saturn ♄', degree: '180°', energy: 'Responsibility, structure, balance', color: '#a855f7', icon: '☍' },
    { aspect: 'Square □', planets: 'Mars ♂ - Pluto ♇', degree: '90°', energy: 'Power, transformation, action', color: '#ef4444', icon: '□' },
    { aspect: 'Trine △', planets: 'Mercury ☿ - Neptune ♆', degree: '120°', energy: 'Communication, intuition, flow', color: '#3b82f6', icon: '△' },
    { aspect: 'Sextile ⚹', planets: 'Moon ☽ - Venus ♀', degree: '60°', energy: 'Harmony, creativity, grace', color: '#10b981', icon: '⚹' },
  ];
  
  for (let dayOffset = -2; dayOffset <= 7; dayOffset++) {
    const date = new Date(today);
    date.setDate(date.getDate() + dayOffset);
    const monthDay = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    
    const aspect = predefined[(dayOffset + 2) % predefined.length];
    fallback.push({
      date: monthDay,
      ...aspect
    });
  }
  
  return fallback;
}
