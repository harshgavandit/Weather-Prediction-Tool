# Weather advisor

Added on 2026-10-10 as a focused extension of Climora's existing React application.

## Using the feature

Choose **Weather advisor** in the desktop sidebar or **Ask** in mobile navigation. Type an English weather, activity, or weather-related wellbeing question. Example buttons populate an editable question. Submit with **Get recommendation** or Ctrl/Cmd + Enter.

Optional inputs include a location label, temperature, feels-like temperature, humidity, wind, UV index, weather condition, and qualitative air quality. The location is a label, not a lookup. Blank readings remain unknown. Numeric values in questions accept Celsius/Fahrenheit, percentage humidity, wind in km/h, and UV; valid explicit question conditions take precedence over form values. Invalid inputs show actionable errors. Urgent symptoms bypass optional weather errors; invalid readings are ignored and recorded in the answer's basis.

The last eight answers stay available when switching tabs. Each answer retains its original weather context even when form values change. Clear conversation removes answers; reset conditions clears the form. Everything stays in component memory and clears on reload. There is no question persistence or transmission.

## Architecture

- `shared/weatherAdvisor.js`: pure deterministic input validation, English intent matching, contextual parsing, hazard priorities, and predefined recommendations. No imports, fetches, credentials, storage, or random responses.
- `shared/weatherAdvisor.d.ts`: TypeScript contract for the engine and result.
- `src/components/WeatherAdvisor.tsx`: local question form, optional conditions, validation, bounded history, source links, keyboard submission, and accessible status/focus handling.
- `src/weather-advisor.css`: scoped styles, responsive grids and answer cards. Existing reduced-motion rules apply.
- `src/App.tsx`: retains the component while hiding its region when another app tab is active.
- `src/components/Header.tsx`: adds the sidebar entry and mobile Ask button. All existing views remain accessible.

No server endpoint, AI integration, package dependency, weather provider, or dataset mutation was added. The app still starts with `npm run dev`, builds with `npm run build`, and serves production through `npm start`.

## Rules and priorities

Questions can match several topics: outdoor activity, clothing, hydration, health, air quality, sun, rain, wind, cold, heat, and weather outlook. Unsupported questions receive useful examples. Empty UI submissions are rejected. Question length is capped at 600 characters.

Urgent personal symptom wording takes priority. Negation is checked around symptom occurrences, including coordinated lists, contrasting clauses, and independent assertions. General symptom education is not treated as a reported emergency. These bounded language rules cannot understand every possible expression or diagnose a condition.

Reported lightning/thunderstorms, heavy rain, poor air, strong wind, cold, and heat influence advice before topic-specific responses. The following are conservative planning triggers, not calibrated hazard probabilities or official warning thresholds:

| Supplied condition | Rule |
| --- | --- |
| Feels-like temperature, otherwise temperature | Heat precautions at 32°C or above; also at 28°C or above with humidity at least 70% |
| Feels-like temperature, otherwise temperature | Cold precautions at 10°C or below |
| Wind speed | Extra caution at 40 km/h or above; gusts remain unknown |
| UV index | Additional sun precautions at 6 or above for activity, clothing, and sun questions |
| Weather condition | Lightning shelter advice for thunderstorms; floodwater avoidance for heavy rain |
| Air quality | Reduced outdoor exertion for the user-selected poor/unhealthy category |

No rain likelihood, future temperature, exact future timing, heat index, AQI value, or confidence percentage is synthesized. Historical snapshots and the survey are not current observations. A future forecast question explicitly explains the missing data and provides conditional planning guidance. General health responses never prescribe medication or claim a diagnosis.

## Reference material

Health and storm response wording was checked against these sources on 2026-10-10. Links are predefined further reading; the application does not fetch these pages:

- [CDC: Heat-related illnesses](https://www.cdc.gov/niosh/heat-stress/about/illnesses.html)
- [AirNow: Asthma and outdoor air pollution](https://www.airnow.gov/publications/asthma-and-heart-disease/asthma-and-outdoor-air-pollution/)
- [National Weather Service: Lightning safety](https://www.weather.gov/safety/lightning-safety-overview)

## Verification

The engine suite is `npm run test:advisor`. It covers wording variations, Celsius/Fahrenheit, conditional recommendations, multiple intents, forecast boundaries, user/form precedence, numeric validation, negative wind values, emergency wording, unrelated negation, coordinated symptom lists, storm negation, supplied UV, deterministic behavior, and fallback questions.

Existing weather endpoint tests now assert the already implemented HTTP 410 disabled contract. No weather endpoint behavior changed. Run the full suite with `npm test`; localhost socket access must be permitted for the existing API tests.

Browser checks covered empty submission, example selection, heat-running advice, expandable conditions used, lightning with future activity wording, ordinary invalid-temperature validation, urgent help despite invalid optional temperature, keyboard submission, high UV, forecast limits, fallback, history across tabs, and clear/reset controls. Desktop and 390×844 mobile views were inspected. Mobile form inputs and rain-clothing answers worked without horizontal document overflow. Console warning/error inspection returned no entries during these checks.

Final verification on 2026-10-10: `npm run lint` and `npm run build` passed; `npm test` passed all 36 tests (24 advisor regressions plus 12 existing application tests). A sequence of submissions confirmed the eight-answer history limit. Reloading cleared history. A second mobile check at 320×740 also found no horizontal document overflow. A rain-clothing question returned the expected waterproof-layer advice in the production build served at localhost:3001. The temporary mobile viewport override was reset afterward.

Screenshots in `docs/evidence/weather-advisor/` show the desktop tool, mobile inputs, and a mobile response. These are development checks, not comprehensive accessibility certification or clinical validation. The legacy `scripts/e2e_verification.js` still describes the retired live-weather product and is not the verification script for this feature.
