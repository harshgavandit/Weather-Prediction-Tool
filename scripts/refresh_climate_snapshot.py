"""Download ERA5-Land daily values and build a reproducible climate snapshot."""

from __future__ import annotations

import argparse
import hashlib
import json
import statistics
import urllib.parse
import urllib.request
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OUTPUT_PATH = ROOT / "data" / "climate_snapshot.json"
API_URL = "https://archive-api.open-meteo.com/v1/archive"


def mean(values: list[float]) -> float | None:
    return statistics.fmean(values) if values else None


def rounded(value: float | None, digits: int = 1) -> float | None:
    return round(value, digits) if value is not None else None


def linear_slope(points: list[tuple[int, float]]) -> float | None:
    if len(points) < 2:
        return None
    xs = [float(item[0]) for item in points]
    ys = [item[1] for item in points]
    x_mean = statistics.fmean(xs)
    y_mean = statistics.fmean(ys)
    denominator = sum((x - x_mean) ** 2 for x in xs)
    if denominator == 0:
        return None
    return sum((x - x_mean) * (y - y_mean) for x, y in zip(xs, ys)) / denominator


def build_snapshot(payload: dict, request_url: str, location_name: str) -> dict:
    daily = payload.get("daily") or {}
    dates = daily.get("time") or []
    means = daily.get("temperature_2m_mean") or []
    maximums = daily.get("temperature_2m_max") or []
    precipitation = daily.get("precipitation_sum") or []
    if not (len(dates) == len(means) == len(maximums) == len(precipitation)):
        raise ValueError("Historical provider returned misaligned daily arrays")

    years: dict[int, dict[str, list[float] | int]] = defaultdict(
        lambda: {"means": [], "maximums": [], "monsoon": [], "heavyRainDays": 0, "heatDays": 0}
    )
    for date_text, daily_mean, daily_max, daily_rain in zip(dates, means, maximums, precipitation):
        date = datetime.strptime(date_text, "%Y-%m-%d")
        year = years[date.year]
        if daily_mean is not None:
            year["means"].append(float(daily_mean))
        if daily_max is not None:
            value = float(daily_max)
            year["maximums"].append(value)
            if value >= 35:
                year["heatDays"] += 1
        if daily_rain is not None:
            value = float(daily_rain)
            if 6 <= date.month <= 9:
                year["monsoon"].append(value)
            if value >= 100:
                year["heavyRainDays"] += 1

    annual = []
    for year_number in sorted(years):
        row = years[year_number]
        if len(row["means"]) < 300:
            continue
        annual.append(
            {
                "year": year_number,
                "meanAnnualTemp": rounded(mean(row["means"]), 2),
                "annualPeakTemp": rounded(max(row["maximums"]) if row["maximums"] else None, 2),
                "monsoonRainfallMm": rounded(sum(row["monsoon"]), 1),
                "heavyRainDays": int(row["heavyRainDays"]),
                "heatDays": int(row["heatDays"]),
                "validTemperatureDays": len(row["means"]),
            }
        )

    periods = [
        (1981, 1990),
        (1991, 2000),
        (2001, 2010),
        (2011, 2020),
        (2021, 2025),
    ]
    decades = []
    for start, end in periods:
        subset = [row for row in annual if start <= row["year"] <= end]
        decades.append(
            {
                "decade": f"{start}-{end}",
                "yearsIncluded": len(subset),
                "meanAnnualTemp": rounded(mean([row["meanAnnualTemp"] for row in subset]), 2),
                "summerPeakAvg": rounded(mean([row["annualPeakTemp"] for row in subset]), 2),
                "monsoonRainfallMm": rounded(mean([row["monsoonRainfallMm"] for row in subset]), 1),
                "extremeRainDaysPerYear": rounded(mean([row["heavyRainDays"] for row in subset]), 2),
                "heatwaveDaysPerYear": rounded(mean([row["heatDays"] for row in subset]), 2),
            }
        )

    baseline = decades[0]
    recent = decades[-1]
    raw_hash = hashlib.sha256(json.dumps(payload, separators=(",", ":"), sort_keys=True).encode()).hexdigest()
    temp_points = [(row["year"], row["meanAnnualTemp"]) for row in annual if row["meanAnnualTemp"] is not None]
    rain_points = [(row["year"], row["monsoonRainfallMm"]) for row in annual if row["monsoonRainfallMm"] is not None]

    return {
        "provenance": {
            "dataset": "ERA5",
            "provider": "Open-Meteo Historical Weather API",
            "apiRequest": request_url,
            "retrievedAt": datetime.now(timezone.utc).isoformat(),
            "responseSha256": raw_hash,
            "referenceLocation": {
                "name": location_name,
                "latitude": payload.get("latitude"),
                "longitude": payload.get("longitude"),
                "elevation": payload.get("elevation"),
                "timezone": payload.get("timezone"),
            },
            "locationRole": "User-selectable reference location; not respondent location",
            "period": {"start": dates[0], "end": dates[-1]},
            "observationCount": len(dates),
            "units": payload.get("daily_units", {}),
        },
        "methodology": {
            "temperature": "Annual mean of daily mean 2 m air temperature; decade value is the mean of included annual values.",
            "summerPeak": "Annual maximum daily maximum 2 m temperature; decade value is the mean of annual peaks.",
            "monsoonRainfall": "Annual June-September precipitation sum; decade value is the mean of annual monsoon totals.",
            "heavyRainDays": "Annual count of days with precipitation sum greater than or equal to 100 mm.",
            "heatwaveDays": "Educational heat-day indicator: annual count of days with maximum 2 m temperature greater than or equal to 35 C; not an official IMD heatwave declaration.",
            "trend": "Ordinary least-squares slope over complete annual values; shown per decade.",
        },
        "quality": {
            "status": "verified-snapshot",
            "completeYears": len(annual),
            "minimumValidTemperatureDaysPerYear": 300,
            "limitations": [
                "Reanalysis represents a gridded model estimate, not a local station observation.",
                "The reference coordinate is a demonstration location and is not provided by survey respondents.",
                "Heat-day counts are a transparent educational indicator, not an official heatwave classification.",
            ],
        },
        "annual": annual,
        "decades": decades,
        "changes": {
            "meanAnnualTempC": rounded(recent["meanAnnualTemp"] - baseline["meanAnnualTemp"], 2),
            "summerPeakC": rounded(recent["summerPeakAvg"] - baseline["summerPeakAvg"], 2),
            "monsoonRainfallMm": rounded(recent["monsoonRainfallMm"] - baseline["monsoonRainfallMm"], 1),
            "heavyRainDaysPerYear": rounded(recent["extremeRainDaysPerYear"] - baseline["extremeRainDaysPerYear"], 2),
            "heatDaysPerYear": rounded(recent["heatwaveDaysPerYear"] - baseline["heatwaveDaysPerYear"], 2),
            "baseline": baseline["decade"],
            "recent": recent["decade"],
        },
        "trendsPerDecade": {
            "meanAnnualTempC": rounded(linear_slope(temp_points) * 10, 3) if linear_slope(temp_points) is not None else None,
            "monsoonRainfallMm": rounded(linear_slope(rain_points) * 10, 1) if linear_slope(rain_points) is not None else None,
        },
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--latitude", type=float, default=19.076)
    parser.add_argument("--longitude", type=float, default=72.8777)
    parser.add_argument("--name", default="Mumbai reference location")
    parser.add_argument("--start", default="1981-01-01")
    parser.add_argument("--end", default="2025-12-31")
    args = parser.parse_args()

    params = {
        "latitude": args.latitude,
        "longitude": args.longitude,
        "start_date": args.start,
        "end_date": args.end,
        "daily": "temperature_2m_mean,temperature_2m_max,precipitation_sum",
        "models": "era5",
        "timezone": "Asia/Kolkata",
    }
    request_url = f"{API_URL}?{urllib.parse.urlencode(params)}"
    request = urllib.request.Request(request_url, headers={"User-Agent": "ClimateIntel-College-Project/2.0"})
    with urllib.request.urlopen(request, timeout=120) as response:
        payload = json.load(response)

    snapshot = build_snapshot(payload, request_url, args.name)
    OUTPUT_PATH.write_text(json.dumps(snapshot, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {OUTPUT_PATH.relative_to(ROOT)} with {snapshot['quality']['completeYears']} complete years.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
