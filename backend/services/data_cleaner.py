"""
Data Cleaning Service
Runs automatically on file upload. Cleans CSV data and returns a detailed report.
"""
import pandas as pd
import numpy as np
from typing import Dict, List, Any


def clean_dataframe(df: pd.DataFrame, filename: str) -> tuple[pd.DataFrame, Dict[str, Any]]:
    """
    Clean a DataFrame and return (cleaned_df, cleaning_report).

    Cleaning steps:
    1. Remove fully empty rows
    2. Remove duplicate rows
    3. Strip whitespace from string columns
    4. Replace blank strings with NaN then handle them
    5. Standardize column names
    6. Fix data types where possible
    """
    report = {
        "filename": filename,
        "original_rows": len(df),
        "original_cols": len(df.columns),
        "steps": [],
        "columns_cleaned": [],
    }

    # ── Step 1: Standardize column names (strip whitespace) ──
    original_cols = list(df.columns)
    df.columns = df.columns.str.strip()
    renamed = [(o, n) for o, n in zip(original_cols, df.columns) if o != n]
    if renamed:
        report["steps"].append({
            "action": "Standardized column names",
            "detail": f"Trimmed whitespace from {len(renamed)} column name(s)",
        })

    # ── Step 2: Remove fully empty rows ──
    empty_mask = df.isna().all(axis=1) | (df.astype(str).apply(lambda x: x.str.strip()) == "").all(axis=1)
    empty_count = empty_mask.sum()
    if empty_count > 0:
        df = df[~empty_mask].reset_index(drop=True)
        report["steps"].append({
            "action": "Removed empty rows",
            "detail": f"Dropped {int(empty_count)} completely empty row(s)",
            "count": int(empty_count),
        })

    # ── Step 3: Strip whitespace from string columns ──
    str_cols = df.select_dtypes(include=["object"]).columns
    for col in str_cols:
        before = df[col].copy()
        df[col] = df[col].astype(str).str.strip()
        # Replace 'nan' strings back to actual NaN
        df[col] = df[col].replace({"nan": np.nan, "": np.nan, "None": np.nan, "none": np.nan, "null": np.nan, "NULL": np.nan})
        changed = (before.fillna("__NA__") != df[col].fillna("__NA__")).sum()
        if changed > 0:
            report["columns_cleaned"].append(col)

    if report["columns_cleaned"]:
        report["steps"].append({
            "action": "Cleaned string values",
            "detail": f"Stripped whitespace and standardized blanks in {len(report['columns_cleaned'])} column(s)",
        })

    # ── Step 4: Remove duplicate rows ──
    dup_count = df.duplicated().sum()
    if dup_count > 0:
        # Identify which columns have the most duplicate influence
        dup_cols = []
        for col in df.columns:
            col_dups = df[col].duplicated().sum()
            ratio = col_dups / len(df) if len(df) > 0 else 0
            if ratio > 0.5:
                dup_cols.append(col)

        df = df.drop_duplicates().reset_index(drop=True)
        report["steps"].append({
            "action": "Removed duplicates",
            "detail": f"Dropped {int(dup_count)} duplicate row(s)",
            "count": int(dup_count),
            "high_dup_columns": dup_cols[:5],
        })

    # ── Step 5: Handle NA values — report but keep (user might need them) ──
    na_summary = {}
    for col in df.columns:
        na_count = int(df[col].isna().sum())
        if na_count > 0:
            na_summary[col] = {
                "null_count": na_count,
                "null_pct": round(na_count / len(df) * 100, 1) if len(df) > 0 else 0,
            }

    if na_summary:
        total_nulls = sum(v["null_count"] for v in na_summary.values())
        report["steps"].append({
            "action": "Detected missing values",
            "detail": f"Found {total_nulls} null(s) across {len(na_summary)} column(s)",
            "columns": na_summary,
        })

    # ── Step 6: Try to fix dtypes (e.g., numeric columns stored as strings) ──
    type_fixes = []
    for col in df.select_dtypes(include=["object"]).columns:
        # Try numeric conversion
        numeric_attempt = pd.to_numeric(df[col], errors="coerce")
        non_null_original = df[col].notna().sum()
        non_null_numeric = numeric_attempt.notna().sum()
        # If >80% of non-null values convert successfully, it's numeric
        if non_null_original > 0 and non_null_numeric / non_null_original > 0.8:
            df[col] = numeric_attempt
            type_fixes.append(f"{col} -> numeric")

    if type_fixes:
        report["steps"].append({
            "action": "Fixed data types",
            "detail": f"Converted {len(type_fixes)} column(s) to proper types: {', '.join(type_fixes[:5])}",
        })

    # ── Final stats ──
    report["final_rows"] = len(df)
    report["final_cols"] = len(df.columns)
    report["rows_removed"] = report["original_rows"] - report["final_rows"]

    return df, report
