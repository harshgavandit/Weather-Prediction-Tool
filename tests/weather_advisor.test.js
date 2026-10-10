import { test } from 'node:test';
import assert from 'node:assert/strict';
import { answerWeatherQuestion, validateWeatherContext } from '../shared/weatherAdvisor.js';

test('accepts wording variations for exercise without inventing current weather', () => {
  for (const question of ['Can I go for a run?', 'Is jogging outside a good idea?', 'Should we play cricket today?', 'Can I exercise outdoors?', 'Is a morning walk okay?', 'Can I ride my bicycle?']) {
    const result = answerWeatherQuestion(question);
    assert.ok(result.topics.includes('activity'), question);
    assert.match(result.limitations, /no live weather/i);
    assert.equal(result.context.temperatureC, null);
    assert.ok(result.recommendations.length > 0);
  }
});

test('uses question temperatures including Fahrenheit and prioritizes heat advice', () => {
  const result = answerWeatherQuestion('Can I run at 104°F?');
  assert.equal(result.context.temperatureC, 40);
  assert.equal(result.level, 'caution');
  assert.match(result.recommendations.join(' '), /postpone|indoors/i);
  assert.ok(result.basis.some(value => /question/i.test(value)));
});

test('manual weather context meaningfully changes activity recommendations', () => {
  const mild = answerWeatherQuestion('Can I go jogging?', { temperatureC: 22, condition: 'clear', windKmh: 5 });
  const hot = answerWeatherQuestion('Can I go jogging?', { feelsLikeC: 42, humidityPct: 85 });
  assert.notDeepEqual(mild.recommendations, hot.recommendations);
  assert.equal(hot.level, 'caution');
  assert.equal(mild.level, 'info');
});

test('thunderstorms override otherwise mild activity conditions', () => {
  const result = answerWeatherQuestion('Can I swim or hike?', { temperatureC: 22, condition: 'thunderstorm' });
  assert.match(result.recommendations.join(' '), /substantial building|enclosed/i);
  assert.match(result.recommendations.join(' '), /30 minutes/i);
  assert.equal(result.level, 'caution');
});

test('supports rain, umbrella, clothing, wind, cold, UV and air quality questions', () => {
  for (const [question, topic] of [
    ['Do I need an umbrella?', 'rain'], ['What should I wear outside?', 'clothing'],
    ['How do I protect myself from sunburn?', 'sun'], ['How windy is it?', 'wind'],
    ['How can I keep warm in freezing weather?', 'cold'], ['The air is smoky. I have asthma.', 'air']
  ]) assert.ok(answerWeatherQuestion(question).topics.includes(topic), question);
  const air = answerWeatherQuestion('Can I cycle?', { airQuality: 'poor' });
  assert.match(air.recommendations.join(' '), /air|pollution/i);
});

test('gives general health and hydration help without diagnosis or prescriptions', () => {
  for (const question of ['How do I avoid dehydration?', 'I feel dizzy after being in the sun', 'Can weather cause a cold or flu?', 'How does humid weather affect my health?']) {
    const result = answerWeatherQuestion(question);
    assert.ok(result.topics.some(topic => ['health', 'hydration'].includes(topic)), question);
    assert.match(result.limitations, /diagnos/i);
    assert.ok(result.sources.length > 0);
  }
});

test('urgent personal symptoms take priority over the requested activity', () => {
  for (const question of ['I have chest pain. Can I run?', "I can't breathe in this heat", 'My friend passed out after working in the sun', 'I am confused and overheating']) {
    const result = answerWeatherQuestion(question);
    assert.equal(result.level, 'urgent', question);
    assert.match(result.recommendations[0], /emergency/i);
    assert.doesNotMatch(result.recommendations.join(' '), /sip water/i);
  }
});

test('negated severe symptoms do not trigger emergency advice', () => {
  assert.notEqual(answerWeatherQuestion("I don't have chest pain. How can I stay hydrated?").level, 'urgent');
  assert.notEqual(answerWeatherQuestion('I am not confused or fainting, just thirsty').level, 'urgent');
});

test('general symptom education is not treated as an actual medical emergency', () => {
  const result = answerWeatherQuestion('What are the symptoms of heat stroke?');
  assert.notEqual(result.level, 'urgent');
  assert.match(result.recommendations.join(' '), /confusion|fainting/i);
});

test('future and location requests never claim a real forecast', () => {
  for (const question of ['Will it rain tomorrow in Mumbai?', 'Predict next week weather', 'What is the current temperature in Delhi?', 'How hot will it be tonight?']) {
    const result = answerWeatherQuestion(question);
    assert.ok(result.topics.includes('forecast'), question);
    assert.match(result.summary, /cannot|unavailable/i);
    assert.match(result.limitations, /no live weather/i);
  }
});

test('handles several intents together and does not infer sunny from sunscreen', () => {
  const result = answerWeatherQuestion('Can I run and what should I wear? Do I need sunscreen?', { temperatureC: 34, uvIndex: 8 });
  assert.ok(['activity', 'clothing', 'sun'].every(topic => result.topics.includes(topic)));
  assert.equal(result.context.condition, 'unknown');
});

test('question observations override form values without borrowing tomorrow weather', () => {
  const result = answerWeatherQuestion('It is raining and 18°C. Can I walk?', { temperatureC: 30, condition: 'clear' });
  assert.equal(result.context.temperatureC, 18);
  assert.equal(result.context.condition, 'rain');
  const future = answerWeatherQuestion('Will it rain tomorrow?', { condition: 'clear' });
  assert.equal(future.context.condition, 'clear');
  assert.equal(answerWeatherQuestion('It is not raining. Should I take an umbrella?').context.condition, 'unknown');
});

test('unknown and empty questions produce helpful fallbacks', () => {
  for (const question of ['', '   ', 'Write a poem about quantum computers', '<script>alert(1)</script>']) {
    const result = answerWeatherQuestion(question);
    assert.ok(result.topics.includes('fallback'));
    assert.ok(result.suggestions.length >= 3);
    assert.doesNotMatch(result.summary, /<script>/);
  }
});

test('validates numeric ranges and rejects malformed, non-finite or oversized values', () => {
  assert.deepEqual(validateWeatherContext({ temperatureC: 22, humidityPct: 50 }).errors, []);
  for (const values of [{ temperatureC: 1000 }, { humidityPct: -1 }, { windKmh: 'fast' }, { uvIndex: Infinity }, { temperatureC: true }]) {
    assert.ok(validateWeatherContext(values).errors.length > 0);
  }
  assert.equal(validateWeatherContext({ temperatureC: '' }).context.temperatureC, null);
  assert.equal(answerWeatherQuestion('How is the weather?', { temperatureC: 1000 }).context.temperatureC, null);
});

test('does not store questions, mutate inputs, fetch providers or use random responses', () => {
  const context = Object.freeze({ temperatureC: 33, humidityPct: 80, condition: 'clear' });
  assert.deepEqual(answerWeatherQuestion('What should I wear?', context), answerWeatherQuestion('What should I wear?', context));
  assert.equal(context.temperatureC, 33);
});

test('negation of unrelated facts cannot hide severe symptoms', () => {
  for (const question of ['I have chest pain and no water. Can I run?', 'I am not thirsty and I cannot breathe in this heat', 'I have no water, I am fainting', 'I have no symptoms except chest pain', "I don't know why I have chest pain", 'I have chest pain without a fever']) {
    assert.equal(answerWeatherQuestion(question).level, 'urgent', question);
  }
});

test('negated thunderstorm with an article is not an observed storm', () => {
  assert.equal(answerWeatherQuestion('It is not a thunderstorm. Can I go jogging?').context.condition, 'unknown');
});

test('ordinary planning questions do not receive an irrelevant forecast refusal', () => {
  for (const question of ['What should I wear in rainy weather?', 'How does humid weather affect my health?', 'There is lightning outside. Will it be safe to run?']) {
    const result = answerWeatherQuestion(question);
    assert.ok(!result.topics.includes('forecast'), question);
  }
});

test('current lightning remains actionable in a question about future activity', () => {
  const result = answerWeatherQuestion('There is lightning outside. Will it be safe to run?');
  assert.equal(result.context.condition, 'thunderstorm');
  assert.equal(result.level, 'caution');
  assert.match(result.recommendations[0], /Stop outdoor/);
});

test('high supplied UV prompts precautions for activities without a sun keyword', () => {
  const result = answerWeatherQuestion('Can I go for a run?', { temperatureC: 22, uvIndex: 12 });
  assert.equal(result.level, 'caution');
  assert.match(result.recommendations.join(' '), /UV|sun exposure|shade/);
});

test('signed question readings are validated without dropping the minus sign', () => {
  const result = answerWeatherQuestion('Wind is -50 km/h. Can I cycle?');
  assert.equal(result.context.windKmh, null);
  assert.ok(result.inputErrors.length > 0);
});

test('invalid optional weather input does not weaken urgent engine advice', () => {
  const result = answerWeatherQuestion('I cannot breathe', { temperatureC: 1000 });
  assert.equal(result.level, 'urgent');
  assert.match(result.recommendations[0], /emergency/i);
});

test('a negated thunder report cannot suppress a positive lightning report', () => {
  for (const question of ['There is no thunder. There is lightning outside. Can I run?', 'No thunderstorm today, but there is lightning outside. Can I run?']) {
    const result = answerWeatherQuestion(question);
    assert.equal(result.context.condition, 'thunderstorm', question);
    assert.equal(result.level, 'caution');
  }
});

test('shared negation applies to symptom lists but not independent assertions', () => {
  for (const question of ['I have no chest pain, confusion or fainting. Can I run?', 'I have no chest pain and no confusion', 'I am not confused or fainting']) {
    assert.notEqual(answerWeatherQuestion(question).level, 'urgent', question);
  }
  for (const question of ['I have no chest pain, I am fainting', "I don't have chest pain and cannot breathe", 'I am not confused and am fainting']) {
    assert.equal(answerWeatherQuestion(question).level, 'urgent', question);
  }
});
