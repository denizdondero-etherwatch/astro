// Netlify Function: Calculate Planetary Aspects using Swiss Ephemeris
// Returns aspects for past 2 days + next 7 days

exports.handler = async (event, context) => {
  try {
    console.log('Calculating planetary aspects...');
    
    // For now, return current static aspects
    // Full Swiss Ephemeris integration would require npm packages
    const aspects = getAspects();
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600'
      },
      body: JSON.stringify({
        success: true,
        aspects: aspects,
        calculatedAt: new Date().toISOString()
      })
    };
    
  } catch (error) {
    console.error('Error calculating aspects:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        success: false,
        error: error.message 
      })
    };
  }
};

function getAspects() {
  const today = new Date();
  const aspects = [];
  
  // Generate aspects for past 2 days and next 7 days
  for (let dayOffset = -2; dayOffset <= 7; dayOffset++) {
    const date = new Date(today);
    date.setDate(date.getDate() + dayOffset);
    
    const dayOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
    const monthDay = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    
    // Sample aspects (would be calculated with Swiss Ephemeris)
    const sampleAspects = [
      { aspect: 'Conjunction ☌', planets: 'Venus ♀ - Jupiter ♃', degree: '0°', energy: 'Expansion, abundance, beauty', color: '#22c55e', icon: '☌' },
      { aspect: 'Square □', planets: 'Mars ♂ - Saturn ♄', degree: '90°', energy: 'Tension, restriction, discipline', color: '#ef4444', icon: '□' },
      { aspect: 'Opposition ☍', planets: 'Sun ☉ - Neptune ♆', degree: '180°', energy: 'Dissolution, spirituality', color: '#a855f7', icon: '☍' },
      { aspect: 'Trine △', planets: 'Mercury ☿ - Uranus ♅', degree: '120°', energy: 'Innovation, breakthroughs', color: '#3b82f6', icon: '△' }
    ];
    
    // Pick a random aspect for this day
    const aspect = sampleAspects[dayOffset % sampleAspects.length];
    aspects.push({
      date: monthDay,
      ...aspect
    });
  }
  
  return aspects;
}
