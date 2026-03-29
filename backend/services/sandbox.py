import re
import math
import datetime
import builtins
import pandas as pd
import numpy as np
import traceback
from io import StringIO
from pathlib import PurePosixPath, PureWindowsPath
import sys


ALLOWED_BUILTINS = {
    "__import__": builtins.__import__,
    "range": range,
    "len": len,
    "int": int,
    "float": float,
    "str": str,
    "list": list,
    "dict": dict,
    "tuple": tuple,
    "set": set,
    "sorted": sorted,
    "enumerate": enumerate,
    "zip": zip,
    "min": min,
    "max": max,
    "sum": sum,
    "round": round,
    "abs": abs,
    "print": print,
    "True": True,
    "False": False,
    "None": None,
    "isinstance": isinstance,
    "type": type,
    "map": map,
    "filter": filter,
    "any": any,
    "all": all,
    "reversed": reversed,
    "bool": bool,
    "hasattr": hasattr,
    "getattr": getattr,
    "setattr": setattr,
    "ValueError": ValueError,
    "TypeError": TypeError,
    "KeyError": KeyError,
    "IndexError": IndexError,
    "Exception": Exception,
}


def _df_to_markdown(df: pd.DataFrame, max_rows: int = 5000) -> str:
    """Convert DataFrame to a markdown table string. Frontend handles pagination."""
    total_rows = len(df)
    if total_rows > max_rows:
        df = df.head(max_rows)
        truncated = True
    else:
        truncated = False

    # Format numeric columns nicely — no scientific notation, with commas
    formatted = df.copy()
    for col in formatted.select_dtypes(include="number").columns:
        def fmt(x):
            if pd.isna(x):
                return ""
            if float(x) == int(x):
                return f"{int(x):,}"
            return f"{x:,.2f}"
        formatted[col] = formatted[col].apply(fmt).astype(str)

    md = formatted.to_markdown(index=False, disable_numparse=True)
    if truncated:
        md += f"\n\n*Showing top {max_rows} of {total_rows} rows*"
    return md


def _extract_citations(code: str, result) -> list:
    """Extract data lineage citations from the executed code."""
    citations = []

    # 1. Extract source files
    file_matches = re.findall(r'read_csv\(["\']([^"\']+)["\']', code)
    for fpath in file_matches:
        try:
            name = PureWindowsPath(fpath).name
        except Exception:
            name = PurePosixPath(fpath).name
        citations.append({
            "type": "source",
            "label": name,
            "detail": f"Source file: {name}",
            "path": fpath,
        })

    # 2. Extract columns referenced (df['col'] or df["col"] patterns)
    col_matches = re.findall(r"""\[['"]([A-Za-z_][\w\s]*?)['"]""", code)
    seen_cols = set()
    columns_used = []
    for c in col_matches:
        cl = c.strip()
        if cl not in seen_cols:
            seen_cols.add(cl)
            columns_used.append(cl)
    if columns_used:
        citations.append({
            "type": "columns",
            "label": f"{len(columns_used)} columns",
            "detail": "Columns analyzed",
            "columns": columns_used,
        })

    # 3. Detect operations
    ops = []
    if re.search(r'\.merge\(|\.join\(', code):
        join_cols = re.findall(r'on=["\'](\w+)["\']', code)
        ops.append({"name": "Join", "detail": f"Joined on: {', '.join(join_cols)}" if join_cols else "Datasets joined"})
    if re.search(r'\.groupby\(', code):
        gb_cols = re.findall(r'groupby\(\[?["\'](\w+)["\']', code)
        ops.append({"name": "Group By", "detail": f"Grouped by: {', '.join(gb_cols)}" if gb_cols else "Data grouped"})
    if re.search(r'\.sort_values\(|\.nlargest\(|\.nsmallest\(', code):
        ops.append({"name": "Sort", "detail": "Results sorted/ranked"})
    if re.search(r'\.fillna\(|\.dropna\(|\.drop_duplicates\(', code):
        ops.append({"name": "Clean", "detail": "Data cleaned (nulls/duplicates handled)"})
    if re.search(r'\.agg\(|\.sum\(|\.mean\(|\.count\(|\.std\(|\.median\(', code):
        ops.append({"name": "Aggregate", "detail": "Statistical aggregation applied"})
    if re.search(r'\.str\.|\.contains\(|\.startswith\(|\.endswith\(', code):
        ops.append({"name": "Filter", "detail": "Text filtering applied"})
    if re.search(r'pd\.to_datetime|\.dt\.', code):
        ops.append({"name": "Date Parse", "detail": "Date/time processing"})
    if ops:
        citations.append({
            "type": "operations",
            "label": f"{len(ops)} operations",
            "detail": "Transformations applied",
            "operations": ops,
        })

    # 4. Result shape
    if isinstance(result, pd.DataFrame):
        citations.append({
            "type": "output",
            "label": f"{len(result)} rows × {len(result.columns)} cols",
            "detail": f"Result: {len(result)} rows, {len(result.columns)} columns",
            "shape": [len(result), len(result.columns)],
        })
    elif isinstance(result, pd.Series):
        citations.append({
            "type": "output",
            "label": f"{len(result)} values",
            "detail": f"Result: Series with {len(result)} values",
            "shape": [len(result), 1],
        })

    return citations


def execute_code(code: str, timeout_seconds: int = 30) -> dict:
    """Execute generated Pandas code in a restricted namespace."""
    namespace = {
        "pd": pd,
        "pandas": pd,
        "np": np,
        "numpy": np,
        "math": math,
        "datetime": datetime,
        "re": re,
        "__builtins__": ALLOWED_BUILTINS,
    }

    old_stdout = sys.stdout
    captured_output = StringIO()
    sys.stdout = captured_output

    try:
        exec(code, namespace)
        sys.stdout = old_stdout
        stdout_text = captured_output.getvalue()

        result = namespace.get("RESULT", None)
        if result is None:
            return {
                "success": False,
                "result": None,
                "result_markdown": None,
                "stdout": stdout_text,
                "error": "No RESULT variable found. The code must assign the final answer to a variable named RESULT.",
            }

        # Convert to markdown table for display, and plain text for the synthesizer
        result_csv = None
        if isinstance(result, pd.DataFrame):
            result_str = result.to_string(max_rows=100)
            result_md = _df_to_markdown(result)
            result_csv = result.to_csv(index=False)
        elif isinstance(result, pd.Series):
            result_df = result.reset_index()
            result_df.columns = [result.index.name or "Index", result.name or "Value"]
            result_str = result.to_string()
            result_md = _df_to_markdown(result_df)
            result_csv = result_df.to_csv(index=False)
        else:
            result_str = str(result)
            result_md = None

        # Cap output size
        if len(result_str) > 15000:
            result_str = result_str[:15000] + "\n... (output truncated)"

        # Extract citations for data lineage
        citations = _extract_citations(code, result)

        return {
            "success": True,
            "result": result_str,
            "result_markdown": result_md,
            "result_csv": result_csv,
            "citations": citations,
            "stdout": stdout_text,
            "error": None,
        }
    except Exception as e:
        sys.stdout = old_stdout
        return {
            "success": False,
            "result": None,
            "result_markdown": None,
            "stdout": captured_output.getvalue(),
            "error": traceback.format_exc(),
        }
