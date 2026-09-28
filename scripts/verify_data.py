import json

with open('data/survey_data.json', 'r', encoding='utf-8') as f:
    d = json.load(f)

print("Total extracted records:", len(d['records']))
print("Survey Date Range:", d['metadata']['surveyDateRange'])

missing_summary = []
for r in d['records']:
    if r['missingCount'] > 0:
        missing_keys = [k for k, v in r['answers'].items() if v is None]
        missing_summary.append((r['rowNumber'], r['name'], missing_keys))

print(f"Records with missing fields: {len(missing_summary)}")
for row, name, keys in missing_summary:
    print(f"  Row {row} ({name}): missing {keys}")

print("\nSample Record 1:")
print(json.dumps(d['records'][0], indent=2))
