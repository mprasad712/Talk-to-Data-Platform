import pandas as pd
import numpy as np
import traceback
from io import StringIO
import sys


ALLOWED_BUILTINS = {
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
    "ValueError": ValueError,
    "TypeError": TypeError,
    "KeyError": KeyError,
    "IndexError": IndexError,
    "Exception": Exception,
}


def execute_code(code: str, timeout_seconds: int = 30) -> dict:
    """Execute generated Pandas code in a restricted namespace."""
    namespace = {
        "pd": pd,
        "pandas": pd,
        "np": np,
        "numpy": np,
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
                "stdout": stdout_text,
                "error": "No RESULT variable found. The code must assign the final answer to a variable named RESULT.",
            }

        # Convert DataFrames to string for readability
        if isinstance(result, pd.DataFrame):
            result_str = result.to_string(max_rows=50)
        elif isinstance(result, pd.Series):
            result_str = result.to_string()
        else:
            result_str = str(result)

        # Cap output size
        if len(result_str) > 15000:
            result_str = result_str[:15000] + "\n... (output truncated)"

        return {
            "success": True,
            "result": result_str,
            "stdout": stdout_text,
            "error": None,
        }
    except Exception as e:
        sys.stdout = old_stdout
        return {
            "success": False,
            "result": None,
            "stdout": captured_output.getvalue(),
            "error": traceback.format_exc(),
        }
