// Pure, deterministic rules shared by the browser and Node tests. No network or storage.
export const WEATHER_ADVISOR_VERSION = '1.0.0';
export const QUESTION_LIMIT = 600;

const conditions = ['unknown', 'clear', 'cloudy', 'rain', 'heavy-rain', 'thunderstorm', 'snow', 'fog'];
const airQualities = ['unknown', 'good', 'moderate', 'poor'];
const ranges = {
  temperatureC: [-60, 60, 'Temperature (°C)'],
  feelsLikeC: [-70, 70, 'Feels-like temperature (°C)'],
  humidityPct: [0, 100, 'Humidity (%)'],
  windKmh: [0, 300, 'Wind speed (km/h)'],
  uvIndex: [0, 25, 'UV index']
};

const healthSource = { title: 'CDC: Heat-related illnesses', url: 'https://www.cdc.gov/niosh/heat-stress/about/illnesses.html' };
const airSource = { title: 'AirNow: Asthma and outdoor air pollution', url: 'https://www.airnow.gov/publications/asthma-and-heart-disease/asthma-and-outdoor-air-pollution/' };
const stormSource = { title: 'National Weather Service: Lightning safety', url: 'https://www.weather.gov/safety/lightning-safety-overview' };

export const EXAMPLE_QUESTIONS = [
  'Can I go for a run if it is 35°C outside?',
  'What should I wear in rainy weather?',
  'How can I avoid dehydration in the heat?',
  'Will it rain tomorrow?',
  'I have asthma. Can I exercise when the air is smoky?',
  'Is it okay to play cricket during a thunderstorm?'
];

export function validateWeatherContext(input = {}) {
  const context = { condition: 'unknown', airQuality: 'unknown', location: '' };
  const errors = [];
  for (const [key, [min, max, label]] of Object.entries(ranges)) {
    const raw = input?.[key];
    if (raw === null || raw === undefined || (typeof raw === 'string' && !raw.trim())) {
      context[key] = null;
      continue;
    }
    const value = typeof raw === 'number' || typeof raw === 'string' ? Number(raw) : NaN;
    if (!Number.isFinite(value) || value < min || value > max) {
      errors.push(`${label} must be between ${min} and ${max}.`);
      context[key] = null;
    } else context[key] = value;
  }
  for (const [key, allowed] of [['condition', conditions], ['airQuality', airQualities]]) {
    if (input?.[key] !== undefined && !allowed.includes(input[key])) errors.push(`Choose a valid ${key === 'condition' ? 'weather condition' : 'air-quality category'}.`);
    else context[key] = input?.[key] || 'unknown';
  }
  if (typeof input?.location === 'string') context.location = input.location.trim().slice(0, 80);
  return { context, errors };
}

const topicRules = [
  ['activity', /\b(run|running|jog|jogging|walk|walking|hike|hiking|trek|trekking|cycle|cycling|bicycle|bike|biking|exercise|workout|sport|cricket|football|soccer|swim|swimming|picnic|camp|camping|outdoor|outside|travel|commute)\b/],
  ['clothing', /\b(wear|wearing|clothes|clothing|dress|jacket|coat|layers|outfit|shoes)\b/],
  ['hydration', /\b(hydrat\w*|dehydrat\w*|thirst\w*|drink|drinking|water intake)\b/],
  ['health', /\b(health|ill|sick|dizz\w*|headache|nause\w*|cramp\w*|fatigue|exhaust\w*|stroke|faint\w*|confus\w*|symptom\w*|flu|fever|medicine|medication|doctor|pregnan\w*|baby|babies|elderly|children|child|senior|breath\w*|asthma|allerg\w*)\b/],
  ['air', /\b(air quality|aqi|pollut\w*|smog|smok\w*|asthma|allerg\w*|pollen)\b/],
  ['sun', /\b(sunscreen|sunburn|sun protection|uv|sunlight|sunny|sun exposure)\b/],
  ['rain', /\b(rain\w*|umbrella|wet|flood\w*|thunder\w*|lightning|storm\w*|monsoon)\b/],
  ['wind', /\b(wind\w*|gust\w*)\b/],
  ['cold', /\b(cold|freezing|snow\w*|winter|chilly|hypotherm\w*)\b/],
  ['heat', /\b(heat\w*|hot|hotter|overheat\w*|humid\w*|sweat\w*|summer)\b/],
  ['forecast', /\b(forecast\w*|predict\w*|tomorrow|tonight|next week|next month|next hour|later today|current)\b|\bwill (?:it|there|the weather) (?:rain|snow|be (?:rainy|hot|cold|sunny))\b|\b(?:whats? (?:is )?(?:the )?(?:weather|temperature)|how (?:is (?:the )?weather|hot|cold|warm)|weather (?:like|today|now))\b/]
];

const labels = { activity: 'Outdoor activity', clothing: 'What to wear', hydration: 'Hydration', health: 'Weather and health', air: 'Air quality', sun: 'Sun protection', rain: 'Rain and storms', wind: 'Wind', cold: 'Cold weather', heat: 'Heat and humidity', forecast: 'Weather outlook', fallback: 'Ask about weather' };

function questionContext(question, context, basis) {
  const inferred = {};
  // Values written in a question describe a user-supplied scenario, never a measurement.
  const temperature = question.match(/(-?\d+(?:\.\d+)?)\s*(?:°\s*([cf])\b|degrees?\s*(celsius|fahrenheit|c|f)?\b|([cf])\b)/i);
  if (temperature) {
    const unit = (temperature[2] || temperature[3] || temperature[4] || 'c').toLowerCase();
    const number = Number(temperature[1]);
    const celsius = unit.startsWith('f') ? (number - 32) * 5 / 9 : number;
    inferred.temperatureC = Math.round(celsius * 10) / 10;
  }
  for (const [key, expression] of [
    ['humidityPct', /(?:humidity\s*(?:is|of|:|=)?\s*)(\d+(?:\.\d+)?)\s*%|\b(\d+(?:\.\d+)?)\s*%\s*humid/i],
    ['windKmh', /(?<![\d.])(-?\d+(?:\.\d+)?)\s*(?:km\/?h|kph)\b/i],
    ['uvIndex', /\buv(?:\s*index)?\s*(?:is|of|:|=)?\s*(\d+(?:\.\d+)?)/i],
    ['feelsLikeC', /feels?\s+like\s+(-?\d+(?:\.\d+)?)\s*(?:°\s*)?(?:c\b|celsius\b)/i]
  ]) {
    const match = question.match(expression);
    if (match) inferred[key] = Number(match[1] ?? match[2]);
  }
  const observation = question.split(/[.!?;]/).filter(clause =>
    !/\b(will|tomorrow|tonight|next week|next month|next hour|forecast|predict)\b/.test(clause)
    || /\b(it is|its|there is|there are|currently|right now|during a|in a)\b/.test(clause)
  ).join('. ');
  if (observation) {
    const positiveStorm = [...observation.matchAll(/\b(thunderstorms?|lightning|thunder)\b/g)].some(match => {
      const prefix = observation.slice(0, match.index).replace(/,/g, ' ');
      return !/\b(?:no|not|isnt|without|dont see)\s+(?:(?:any|a|thunderstorms?|lightning|thunder|or|and)\s+)*$/.test(prefix);
    });
    if (positiveStorm) inferred.condition = 'thunderstorm';
    else if (/\b(heavy rain|pouring|torrential|flooding)\b/.test(observation) && !/\b(no|not|without)\s+(?:any\s+)?(heavy rain|flooding)\b/.test(observation)) inferred.condition = 'heavy-rain';
    else if (/\b(raining|rainy|in the rain|during rain)\b/.test(observation) && !/\b(not|isnt|no|without)\s+(?:any\s+)?(raining|rain)\b/.test(observation)) inferred.condition = 'rain';
    else if (/\b(snowing|snowy)\b/.test(observation)) inferred.condition = 'snow';
    else if (/\b(foggy|dense fog)\b/.test(observation)) inferred.condition = 'fog';
    else if (/\b(it is sunny|its sunny|clear skies)\b/.test(observation)) inferred.condition = 'clear';
    if (/\b(smoky|smoke outside|poor air|bad air|unhealthy air|smog)\b/.test(observation)) inferred.airQuality = 'poor';
  }
  const validated = validateWeatherContext({ ...context, ...inferred });
  for (const key of Object.keys(inferred)) {
    if (validated.context[key] !== null && validated.context[key] !== 'unknown') basis.push(`${ranges[key]?.[2] || labels[key] || key}: ${validated.context[key]} (from your question; unverified scenario).`);
  }
  return validated;
}

function hasUrgentSymptoms(question) {
  if (!/\b(i|my|we|someone|person|friend|child|he|she|they)\b/.test(question)) return false;
  // Evaluate clauses independently so negation does not hide a later positive symptom.
  const clauses = question.split(/[.!?;]|\bbut\b|\bhowever\b|\bexcept\b/);
  return clauses.some(clause => {
    const severe = /\b(chest pain|cant breathe|cannot breathe|struggling to breathe|severe difficulty breathing|passed out|unconscious|confused|confusion|fainting|collapsed|seizure)\b/g;
    return [...clause.matchAll(severe)].some(match => {
      // Retain negation in symptom lists; reset it at an independent assertion.
      const beforeSymptom = clause.slice(0, match.index).split(/(?:,|\band\b)\s*(?=(?:(?:i|we|he|she|they|someone)\s+)?(?:am|is|are|have|has|feel|feels)\b)/).at(-1).replace(/,/g, ' ');
      if (/^(cant|cannot) breathe$/.test(match[0])) return true;
      const negated = /\b(?:no|not|dont|do not|without|never)\s+(?:(?:have|having|any|a|am|be|been|feel|feeling|experiencing|suffering|from|dizzy|confused|confusion|fainting|chest|pain|or|and|signs|symptoms|risk|of)\s+)*$/.test(beforeSymptom);
      return !negated;
    });
  });
}

export function answerWeatherQuestion(rawQuestion, input = {}) {
  const original = typeof rawQuestion === 'string' ? rawQuestion.trim().slice(0, QUESTION_LIMIT) : '';
  const question = original.toLowerCase().replace(/[’']/g, '').replace(/\s+/g, ' ');
  const validated = validateWeatherContext(input);
  const basis = [];
  const extracted = questionContext(question, validated.context, basis);
  const context = extracted.context;
  const inputErrors = [...validated.errors, ...extracted.errors];
  if (inputErrors.length) basis.push('Invalid optional weather values were ignored. No estimate was substituted.');
  for (const [key, value] of Object.entries(context)) {
    if (key === 'location' || value === null || value === 'unknown' || basis.some(line => line.startsWith(ranges[key]?.[2] || labels[key] || key))) continue;
    basis.push(`${ranges[key]?.[2] || key}: ${value} (entered by you; not measured by this app).`);
  }
  if (!basis.length) basis.push('No current weather readings supplied. Recommendations are conditional.');
  const topics = topicRules.filter(([, pattern]) => pattern.test(question)).map(([topic]) => topic);
  if (!question || !topics.length) topics.splice(0, topics.length, 'fallback');
  let level = 'info';
  const recommendations = [];
  const sources = [];
  const add = (...items) => recommendations.push(...items);
  const source = item => { if (!sources.some(existing => existing.url === item.url)) sources.push(item); };
  const feels = context.feelsLikeC ?? context.temperatureC;
  const heat = feels !== null && (feels >= 32 || (feels >= 28 && context.humidityPct >= 70));
  const cold = feels !== null && feels <= 10;
  const storm = context.condition === 'thunderstorm';
  const poorAir = context.airQuality === 'poor';
  const future = /\b(tomorrow|tonight|next week|next month|next hour|later today|forecast|predict|will)\b/.test(question);
  let summary = topics[0] === 'fallback'
    ? 'I can help with weather, outdoor plans, clothing, and weather-related wellbeing. Try one of the questions below.'
    : 'Here are practical recommendations for the conditions you supplied. They describe possible effects, not a measured forecast or a guarantee of safety.';
  if (topics.includes('forecast')) summary = 'A live reading or future forecast is unavailable here. I cannot predict whether it will rain or report the current temperature for a location. Supplied conditions can still guide your plans.';
  if (hasUrgentSymptoms(question)) {
    level = 'urgent';
    topics.unshift('health');
    summary = 'The symptoms you described may need urgent medical attention. Do not wait for a weather recommendation.';
    add('Contact local emergency services now and stop the activity. Have someone stay with the affected person.', 'Move to a cooler, sheltered place if it is safe, and begin cooling with wet cloths if heat is involved.', 'Do not give food or drink to someone who is confused, unconscious, or unable to swallow safely.');
    source(healthSource);
  } else {
    if (storm) {
      level = 'caution';
      add('Stop outdoor activities and enter a substantial building or a fully enclosed hard-topped vehicle. Trees and open shelters do not provide lightning protection.', 'Wait at least 30 minutes after the last thunder before resuming outdoor activity.');
      source(stormSource);
    }
    if (heat) {
      level = 'caution';
      add('Reduce strenuous activity; choose a cooler time, shade, or an indoor alternative. For very hot conditions, postpone outdoor exertion.', 'Take cooling breaks and drink water regularly, unless your clinician has advised a fluid restriction.');
      source(healthSource);
    }
    if (poorAir) {
      level = 'caution';
      add('Reduce prolonged or strenuous outdoor exercise when air quality is poor, especially with asthma or other heart or lung conditions. Use an indoor space with cleaner air.', 'Follow your existing asthma care plan; this tool does not prescribe or change medication.');
      source(airSource);
    }
    if (context.windKmh !== null && context.windKmh >= 40) {
      level = 'caution';
      add('Strong wind can affect balance and falling branches. Avoid exposed trails, trees, and unstable structures; postpone cycling if you cannot control the bike.');
    }
    if (context.condition === 'heavy-rain') {
      level = 'caution';
      add('Delay exposed outdoor plans during heavy rain. Never walk, cycle, or drive through floodwater; water depth and road damage can be hidden.');
    }
    if (cold) { level = 'caution'; add('Wear dry layers and protect exposed skin. Shorten time outside and move indoors if you become very cold or start shivering.'); }
    if (context.uvIndex !== null && context.uvIndex >= 6 && topics.some(topic => ['activity', 'sun', 'clothing'].includes(topic))) {
      level = 'caution';
      add('The supplied UV index is elevated; reduce direct sun exposure, particularly around midday. Use shade, protective clothing, and sunscreen according to its label.');
    }
    for (const topic of topics) {
      switch (topic) {
        case 'activity':
          if (!storm && !heat && !poorAir && !cold && context.condition !== 'heavy-rain' && (context.windKmh === null || context.windKmh < 40)) add('If conditions remain mild, air quality is acceptable, and you feel well, start with a short, easy session and reassess. Stop if you feel unwell.');
          if (context.condition === 'rain') add('Use a route with good grip and visibility in rain. Avoid slippery surfaces, standing water, and exposed swimming areas.');
          if (context.condition === 'fog') add('Low visibility makes road cycling and driving more difficult. Choose a visible, traffic-free route or delay the trip.');
          if (feels === null) add('Enter temperature or feels-like temperature, weather condition, and wind to make activity advice more specific.');
          break;
        case 'clothing': add(cold ? 'Choose several light layers, a wind-resistant outer layer, and dry footwear.' : 'Choose comfortable, breathable clothing; add a removable layer if temperatures may change.'); if (['rain', 'heavy-rain', 'snow'].includes(context.condition)) add('Use a suitable waterproof outer layer and footwear with grip. Replace wet clothing when you can.'); break;
        case 'hydration': add('Keep water accessible and take regular breaks. Fluid needs vary with activity and health; follow any prescribed fluid limits.', 'If you feel dizzy, weak, or nauseated, stop, cool down, and seek medical advice if symptoms persist or worsen.'); source(healthSource); break;
        case 'health': add('Heat can contribute to dizziness, headache, or weakness. Rest in a cooler place and seek medical help for persistent or worsening symptoms.', 'Confusion, collapse, chest pain, or severe breathing difficulty require urgent medical attention. This tool cannot diagnose the cause.'); if (/\b(cold|flu|fever)\b/.test(question)) add('Do not assume a fever or respiratory illness is caused by weather. Ask a clinician about symptoms rather than using this tool for diagnosis or medication advice.'); source(healthSource); break;
        case 'air': if (!poorAir) add('Air quality is separate from temperature. Check a current local air-quality report before prolonged outdoor exertion, especially if you have asthma.'); source(airSource); break;
        case 'sun': add('Use shade, protective clothing, a hat, and sunscreen according to its label. Cloud cover alone does not establish low UV exposure.'); break;
        case 'rain': if (!storm && context.condition !== 'heavy-rain') add('Carry a rain layer or umbrella if rain is reported or expected by a reliable local forecast. An umbrella is not lightning protection.'); break;
        case 'wind': if (context.windKmh === null) add('No wind reading was supplied. Enter wind speed in km/h; gusts can be stronger than an average reading.'); else add(`You supplied wind at ${context.windKmh} km/h. Check gusts and visibility before an exposed journey.`); break;
        case 'cold': if (!cold) add('For cold conditions, wear dry layers and limit exposure. Wet clothing and wind can make you feel colder even above freezing.'); break;
        case 'heat': if (!heat) add('In hot or humid conditions, plan cooling breaks, reduce exertion, and favor shade. Humidity can make cooling by sweat less effective.'); source(healthSource); break;
        case 'forecast': add(future ? 'This tool cannot estimate future rain timing, rain probability, or tomorrow’s temperature from a survey or a single observation.' : 'Use a thermometer or a trusted local report to supply current conditions. Choosing a city here does not load its weather.'); break;
        case 'fallback': add('Ask about a walk, run, rain protection, what to wear, heat, hydration, cold, or air quality. Add conditions such as “35°C and humid” for a more specific answer.'); break;
      }
    }
  }
  return {
    version: WEATHER_ADVISOR_VERSION,
    title: level === 'urgent' ? 'Seek urgent help' : topics[0] === 'fallback' ? labels.fallback : topics.map(topic => labels[topic]).filter((item, index, all) => all.indexOf(item) === index).slice(0, 3).join(' · '),
    topics: [...new Set(topics)], level, summary,
    recommendations: [...new Set(recommendations)].slice(0, 10),
    context, basis, inputErrors, sources,
    limitations: 'No live weather feed is connected. Conditions are supplied by you and may be incomplete or outdated. Rules provide conditional guidance, not a meteorological forecast, diagnosis, or medical treatment. Follow local warnings and professional advice.',
    suggestions: EXAMPLE_QUESTIONS
  };
}
