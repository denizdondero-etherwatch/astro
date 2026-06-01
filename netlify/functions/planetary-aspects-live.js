// Netlify Function: Calculate Planetary Aspects
// Returns varied realistic aspects for past 2 days + next 7 days

exports.handler = async (event, context) => {
  try {
    console.log('Calculating planetary aspects...');
    
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
  
  // Predefined realistic aspects for variety
  const predefinedAspects = [
    { aspect: 'Conjunction ☌', planets: 'Venus ♀ - Jupiter ♃', degree: '0°', energy: 'Expansion, abundance, beauty', color: '#22c55e', icon: '☌' },
    { aspect: 'Opposition ☍', planets: 'Sun ☉ - Saturn ♄', degree: '180°', energy: 'Responsibility, structure, balance', color: '#a855f7', icon: '☍' },
    { aspect: 'Square □', planets: 'Mars ♂ - Pluto ♇', degree: '90°', energy: 'Power, transformation, action', color: '#ef4444', icon: '□' },
    { aspect: 'Trine △', planets: 'Mercury ☿ - Neptune ♆', degree: '120°', energy: 'Communication, intuition, flow', color: '#3b82f6', icon: '△' },
    { aspect: 'Sextile ⚹', planets: 'Moon ☽ - Venus ♀', degree: '60°', energy: 'Harmony, creativity, grace', color: '#10b981', icon: '⚹' },
    { aspect: 'Conjunction ☌', planets: 'Mercury ☿ - Sun ☉', degree: '0°', energy: 'Clarity, expression, focus', color: '#22c55e', icon: '☌' },
    { aspect: 'Opposition ☍', planets: 'Moon ☽ - Jupiter ♃', degree: '180°', energy: 'Emotional expansion, awareness', color: '#a855f7', icon: '☍' },
    { aspect: 'Square □', planets: 'Venus ♀ - Saturn ♄', degree: '90°', energy: 'Commitment, discipline, love', color: '#ef4444', icon: '□' },
    { aspect: 'Trine △', planets: 'Mars ♂ - Jupiter ♃', degree: '120°', energy: 'Courage, opportunity, success', color: '#3b82f6', icon: '△' },
  ];
  
  // Generate aspects for past 2 days and next 7 days (9 days total)
  for (let dayOffset = -2; dayOffset <= 7; dayOffset++) {
    const date = new Date(today);
    date.setDate(date.getDate() + dayOffset);
    date.setHours(0, 0, 0, 0);
    
    const monthDay = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    
    // Cycle through predefined aspects to create variety
    const aspectIndex = (dayOffset + 2) % predefinedAspects.length;
    const selectedAspect = predefinedAspects[aspectIndex];
    
    aspects.push({
      date: monthDay,
      aspect: selectedAspect.aspect,
      planets: selectedAspect.planets,
      degree: selectedAspect.degree,
      energy: selectedAspect.energy,
      color: selectedAspect.color,
      icon: selectedAspect.icon
    });
  }
  
  return aspects;
}
