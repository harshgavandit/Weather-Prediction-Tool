const headers = [
  'ID', 'ParticipantID', 'RowNumber', 'PageNumber', 'SourceDoc', 'Timestamp',
  'Q1_TempChange', 'Q2_HotterSummers', 'Q3_RainfallChange', 'Q4_Flooding', 'Q5_WaterShortages',
  'Q6_ExtremeWeatherEvents', 'Q7_DailyActivitiesAffected', 'Q8_HeatHealthProblems',
  'Q9_AgriculturePlantsImpact', 'Q10_DrinkingWaterAvailability', 'Q11_AirQualityImpact',
  'Q12_ConcernLevel', 'Q13_AwarenessOfCauses', 'Q14_BiggestProblem', 'Q15_RecommendedAction'
];

function quoteCell(value) {
  let text = String(value ?? '');
  // Keep spreadsheet apps from executing survey text as a formula.
  if (/^\s*[=+\-@]/.test(text) || /^[\t\r\n]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

/** Serialize the displayed public records using the full export's column order. */
export function createSurveyCsv(records) {
  const rows = records.map(record => [
    record.id, record.respondentId, record.rowNumber, record.pageNumber,
    record.sourceDoc, record.timestamp,
    ...Array.from({ length: 15 }, (_, index) => record.answers[`Q${index + 1}`])
  ].map(quoteCell).join(','));
  return [headers.join(','), ...rows].join('\r\n');
}
