import re
import math
import datetime
import builtins
import pandas as pd
import numpy as np
import traceback
from io import StringIO
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


def _df_to_markdown(df: pd.DataFrame, max_rows: int = 50) -> str:
    """Convert DataFrame to a markdown table string."""
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
        if isinstance(result, pd.DataFrame):
            result_str = result.to_string(max_rows=50)
            result_md = _df_to_markdown(result)
        elif isinstance(result, pd.Series):
            result_df = result.reset_index()
            result_df.columns = [result.index.name or "Index", result.name or "Value"]
            result_str = result.to_string()
            result_md = _df_to_markdown(result_df)
        else:
            result_str = str(result)
            result_md = None

        # Cap output size
        if len(result_str) > 15000:
            result_str = result_str[:15000] + "\n... (output truncated)"

        return {
            "success": True,
            "result": result_str,
            "result_markdown": result_md,
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
