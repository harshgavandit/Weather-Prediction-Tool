"""Verify the survey PDF against the structured dataset and build public-safe records."""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

import pdfplumber


ROOT = Path(__file__).resolve().parents[1]
PDF_PATH = ROOT / "RESPONSES.pdf"
RAW_DATA_PATH = ROOT / "data" / "survey_data.json"
PUBLIC_DATA_PATH = ROOT / "public" / "data" / "survey_data.json"


def normalize(value: object) -> str:
    return " ".join(str(value or "").split())


def extract_answer_rows() -> list[list[str]]:
    with pdfplumber.open(PDF_PATH) as document:
        if len(document.pages) != 1:
            raise ValueError(f"Expected one PDF page, found {len(document.pages)}")
        tables = document.pages[0].extract_tables()
        if len(tables) != 1:
            raise ValueError(f"Expected one table, found {len(tables)}")

    table = tables[0]
    rows = [row for row in table[1:] if normalize(row[0])]
    if len(rows) != 51:
        raise ValueError(f"Expected 51 populated rows, found {len(rows)}")
    return rows


def load_raw_data() -> dict:
    return json.loads(RAW_DATA_PATH.read_text(encoding="utf-8"))


def public_record(record: dict, index: int) -> dict:
    return {
        "id": record["id"],
        "respondentId": f"Participant {index:02d}",
        "rowNumber": record["rowNumber"],
        "pageNumber": record["pageNumber"],
        "sourceDoc": record["sourceDoc"],
        "timestamp": record["timestamp"],
        "answers": record["answers"],
        "missingCount": record["missingCount"],
    }


def build_public_dataset(raw_data: dict) -> dict:
    public_metadata = {
        **raw_data["metadata"],
        "region": "Not specified in source PDF",
    }
    return {
        "metadata": public_metadata,
        "records": [
            public_record(record, index)
            for index, record in enumerate(raw_data["records"], start=1)
        ],
    }


def verify_pdf(raw_data: dict) -> int:
    rows = extract_answer_rows()
    records = raw_data["records"]
    if len(records) != 51:
        raise ValueError(f"Expected 51 JSON records, found {len(records)}")

    mismatches = []
    for index, (pdf_row, record) in enumerate(zip(rows, records, strict=True), start=1):
        for question_index in range(15):
            question = f"Q{question_index + 1}"
            pdf_value = normalize(pdf_row[question_index + 4])
            json_value = normalize(record["answers"].get(question))
            if pdf_value != json_value:
                mismatches.append((index, question, pdf_value, json_value))

    print(f"Verified {len(records)} records and {len(records) * 15} answer cells; {len(mismatches)} mismatches.")
    if mismatches:
        for mismatch in mismatches[:10]:
            print("Mismatch:", mismatch)
        raise ValueError("PDF and JSON answer values diverge")
    return len(records) * 15


def verify_public_dataset(public_data: dict) -> None:
    serialized = json.dumps(public_data["records"])
    forbidden_fields = {"name", "email", "contact"}
    for record in public_data["records"]:
        if forbidden_fields.intersection(record):
            raise ValueError("Public dataset contains contact fields")
    if "@" in serialized or re.search(r"\b\d{10}\b", serialized):
        raise ValueError("Public dataset contains contact data")
    print("Public dataset contains no contact fields or contact values.")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    parser.add_argument("--check-public", action="store_true")
    parser.add_argument("--write", action="store_true")
    args = parser.parse_args()

    raw_data = load_raw_data()
    public_data = build_public_dataset(raw_data)

    if args.check or args.write:
        verify_pdf(raw_data)
    if args.check_public or args.write:
        verify_public_dataset(public_data)
    if args.write:
        PUBLIC_DATA_PATH.parent.mkdir(parents=True, exist_ok=True)
        PUBLIC_DATA_PATH.write_text(
            json.dumps(public_data, indent=2, ensure_ascii=False) + "\n",
            encoding="utf-8",
        )
        print(f"Wrote {PUBLIC_DATA_PATH.relative_to(ROOT)}")

    if not (args.check or args.check_public or args.write):
        parser.print_help()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
