export type WeatherCondition = 'unknown' | 'clear' | 'cloudy' | 'rain' | 'heavy-rain' | 'thunderstorm' | 'snow' | 'fog';
export type AirQualityCategory = 'unknown' | 'good' | 'moderate' | 'poor';
export interface WeatherContext {
  temperatureC: number | null;
  feelsLikeC: number | null;
  humidityPct: number | null;
  windKmh: number | null;
  uvIndex: number | null;
  condition: WeatherCondition;
  airQuality: AirQualityCategory;
  location: string;
}
export interface WeatherAnswer {
  version: string;
  title: string;
  topics: string[];
  level: 'info' | 'caution' | 'urgent';
  summary: string;
  recommendations: string[];
  context: WeatherContext;
  basis: string[];
  inputErrors: string[];
  sources: Array<{ title: string; url: string }>;
  limitations: string;
  suggestions: string[];
}
export const WEATHER_ADVISOR_VERSION: string;
export const QUESTION_LIMIT: number;
export const EXAMPLE_QUESTIONS: string[];
export function validateWeatherContext(input?: Record<string, unknown>): { context: WeatherContext; errors: string[] };
export function answerWeatherQuestion(question: string, input?: Record<string, unknown>): WeatherAnswer;
