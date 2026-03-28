"""
Data operations service — join, union, filter, group, sort, deduplicate, column tools.
All operations run on pandas DataFrames loaded from session CSVs.
"""

import pandas as pd
from pathlib import Path
from typing import List, Dict, Any, Optional
from services.file_manager import get_session, save_file, extract_schema_from_df


def _load_df(session_id: str, filename: str) -> pd.DataFrame:
    session = get_session(session_id)
    if not session or filename not in session["files"]:
        raise ValueError(f"File '{filename}' not found in session")
    path = session["files"][filename]["path"]
    try:
        return pd.read_csv(path, encoding="utf-8", encoding_errors="replace")
    except UnicodeDecodeError:
        return pd.read_csv(path, encoding="latin-1")


def op_join(session_id: str, params: dict) -> dict:
    """Join two datasets on specified columns."""
    left_file = params["left_file"]
    right_file = params["right_file"]
    left_on = params["left_on"]       # list of column names
    right_on = params["right_on"]     # list of column names
    how = params.get("how", "inner")  # inner, left, right, outer

    if how not in ("inner", "left", "right", "outer"):
        raise ValueError(f"Invalid join type: {how}")

    left_df = _load_df(session_id, left_file)
    right_df = _load_df(session_id, right_file)

    result = pd.merge(left_df, right_df, left_on=left_on, right_on=right_on, how=how, suffixes=("", f"_{right_file.replace('.csv', '')}"))

    return _build_result(result, f"join_{left_file.replace('.csv', '')}_{right_file.replace('.csv', '')}", session_id, params)


def op_union(session_id: str, params: dict) -> dict:
    """Union (concatenate) multiple datasets vertically."""
    filenames = params["files"]  # list of filenames
    if len(filenames) < 2:
        raise ValueError("Need at least 2 files for union")

    dfs = [_load_df(session_id, f) for f in filenames]
    result = pd.concat(dfs, ignore_index=True, sort=False)

    name_parts = [f.replace('.csv', '') for f in filenames[:3]]
    return _build_result(result, f"union_{'_'.join(name_parts)}", session_id, params)


def op_filter(session_id: str, params: dict) -> dict:
    """Filter rows by conditions."""
    filename = params["file"]
    conditions = params["conditions"]  # list of {column, operator, value}

    df = _load_df(session_id, filename)

    for cond in conditions:
        col = cond["column"]
        op = cond["operator"]
        val = cond["value"]

        if col not in df.columns:
            raise ValueError(f"Column '{col}' not found")

        series = df[col]

        if op == "equals":
            df = df[series.astype(str) == str(val)]
        elif op == "not_equals":
            df = df[series.astype(str) != str(val)]
        elif op == "contains":
            df = df[series.astype(str).str.contains(str(val), case=False, na=False)]
        elif op == "not_contains":
            df = df[~series.astype(str).str.contains(str(val), case=False, na=False)]
        elif op == "greater_than":
            df = df[pd.to_numeric(series, errors="coerce") > float(val)]
        elif op == "less_than":
            df = df[pd.to_numeric(series, errors="coerce") < float(val)]
        elif op == "greater_equal":
            df = df[pd.to_numeric(series, errors="coerce") >= float(val)]
        elif op == "less_equal":
            df = df[pd.to_numeric(series, errors="coerce") <= float(val)]
        elif op == "between":
            low, high = float(val[0]), float(val[1])
            numeric = pd.to_numeric(series, errors="coerce")
            df = df[(numeric >= low) & (numeric <= high)]
        elif op == "is_null":
            df = df[series.isnull()]
        elif op == "not_null":
            df = df[series.notnull()]
        else:
            raise ValueError(f"Unknown operator: {op}")

    return _build_result(df, f"filtered_{filename.replace('.csv', '')}", session_id, params)


def op_group(session_id: str, params: dict) -> dict:
    """Group by columns and aggregate."""
    filename = params["file"]
    group_by = params["group_by"]           # list of column names
    aggregations = params["aggregations"]   # list of {column, function}

    df = _load_df(session_id, filename)

    agg_dict = {}
    for agg in aggregations:
        col = agg["column"]
        func = agg["function"]  # sum, mean, count, min, max, nunique
        if col not in df.columns:
            raise ValueError(f"Column '{col}' not found")
        if func not in ("sum", "mean", "count", "min", "max", "nunique"):
            raise ValueError(f"Unknown aggregation: {func}")
        if col not in agg_dict:
            agg_dict[col] = []
        agg_dict[col].append(func)

    result = df.groupby(group_by, dropna=False).agg(agg_dict)
    # Flatten multi-level columns
    result.columns = [f"{col}_{func}" if func != "count" or col != group_by[0] else f"{col}_{func}"
                      for col, func in result.columns]
    result = result.reset_index()

    return _build_result(result, f"grouped_{filename.replace('.csv', '')}", session_id, params)


def op_sort(session_id: str, params: dict) -> dict:
    """Sort by one or more columns."""
    filename = params["file"]
    sort_by = params["sort_by"]  # list of {column, ascending}

    df = _load_df(session_id, filename)

    columns = [s["column"] for s in sort_by]
    ascending = [s.get("ascending", True) for s in sort_by]

    result = df.sort_values(by=columns, ascending=ascending, ignore_index=True)

    return _build_result(result, f"sorted_{filename.replace('.csv', '')}", session_id, params)


def op_deduplicate(session_id: str, params: dict) -> dict:
    """Remove duplicate rows."""
    filename = params["file"]
    columns = params.get("columns")  # None = all columns, or list of specific columns
    keep = params.get("keep", "first")  # first, last

    df = _load_df(session_id, filename)
    original_count = len(df)

    subset = columns if columns and len(columns) > 0 else None
    result = df.drop_duplicates(subset=subset, keep=keep, ignore_index=True)

    res = _build_result(result, f"deduped_{filename.replace('.csv', '')}", session_id, params)
    res["rows_removed"] = original_count - len(result)
    return res


def op_column_tools(session_id: str, params: dict) -> dict:
    """Drop, rename, or reorder columns."""
    filename = params["file"]
    action = params["action"]  # drop, rename, reorder

    df = _load_df(session_id, filename)

    if action == "drop":
        columns_to_drop = params["columns"]
        result = df.drop(columns=columns_to_drop, errors="ignore")
    elif action == "rename":
        rename_map = params["rename_map"]  # {old_name: new_name}
        result = df.rename(columns=rename_map)
    elif action == "reorder":
        new_order = params["column_order"]  # list of column names
        # Keep any columns not in the order at the end
        remaining = [c for c in df.columns if c not in new_order]
        result = df[new_order + remaining]
    else:
        raise ValueError(f"Unknown column action: {action}")

    return _build_result(result, f"columns_{filename.replace('.csv', '')}", session_id, params)


def _build_result(df: pd.DataFrame, name: str, session_id: str, params: dict) -> dict:
    """Build preview + metadata for the result DataFrame."""
    schema = extract_schema_from_df(df)
    preview_rows = df.head(50).fillna("").to_dict(orient="records")

    return {
        "name": name,
        "row_count": schema["row_count"],
        "column_count": schema["column_count"],
        "columns": schema["columns"],
        "preview": preview_rows,
    }


def save_operation_result(session_id: str, name: str, params: dict, operation: str) -> dict:
    """Re-run the operation and save result as a new CSV in the session."""
    op_map = {
        "join": op_join,
        "union": op_union,
        "filter": op_filter,
        "group": op_group,
        "sort": op_sort,
        "deduplicate": op_deduplicate,
        "column_tools": op_column_tools,
    }

    if operation not in op_map:
        raise ValueError(f"Unknown operation: {operation}")

    # Re-run the operation to get the full result
    result = op_map[operation](session_id, params)

    # Build a DataFrame from preview is not enough — re-run and save full
    # We need to reconstruct the full df, so let's refactor slightly
    df = _execute_operation(session_id, operation, params)

    filename = f"{name}.csv"
    csv_bytes = df.to_csv(index=False).encode("utf-8")
    file_info = save_file(session_id, filename, csv_bytes)

    return file_info


def _execute_operation(session_id: str, operation: str, params: dict) -> pd.DataFrame:
    """Execute operation and return full DataFrame (not just preview)."""
    if operation == "join":
        left_df = _load_df(session_id, params["left_file"])
        right_df = _load_df(session_id, params["right_file"])
        return pd.merge(left_df, right_df, left_on=params["left_on"], right_on=params["right_on"],
                        how=params.get("how", "inner"), suffixes=("", f"_{params['right_file'].replace('.csv', '')}"))

    elif operation == "union":
        dfs = [_load_df(session_id, f) for f in params["files"]]
        return pd.concat(dfs, ignore_index=True, sort=False)

    elif operation == "filter":
        df = _load_df(session_id, params["file"])
        for cond in params["conditions"]:
            col, op, val = cond["column"], cond["operator"], cond["value"]
            series = df[col]
            if op == "equals": df = df[series.astype(str) == str(val)]
            elif op == "not_equals": df = df[series.astype(str) != str(val)]
            elif op == "contains": df = df[series.astype(str).str.contains(str(val), case=False, na=False)]
            elif op == "not_contains": df = df[~series.astype(str).str.contains(str(val), case=False, na=False)]
            elif op == "greater_than": df = df[pd.to_numeric(series, errors="coerce") > float(val)]
            elif op == "less_than": df = df[pd.to_numeric(series, errors="coerce") < float(val)]
            elif op == "greater_equal": df = df[pd.to_numeric(series, errors="coerce") >= float(val)]
            elif op == "less_equal": df = df[pd.to_numeric(series, errors="coerce") <= float(val)]
            elif op == "between":
                numeric = pd.to_numeric(series, errors="coerce")
                df = df[(numeric >= float(val[0])) & (numeric <= float(val[1]))]
            elif op == "is_null": df = df[series.isnull()]
            elif op == "not_null": df = df[series.notnull()]
        return df

    elif operation == "group":
        df = _load_df(session_id, params["file"])
        agg_dict = {}
        for agg in params["aggregations"]:
            col, func = agg["column"], agg["function"]
            if col not in agg_dict: agg_dict[col] = []
            agg_dict[col].append(func)
        result = df.groupby(params["group_by"], dropna=False).agg(agg_dict)
        result.columns = [f"{c}_{f}" for c, f in result.columns]
        return result.reset_index()

    elif operation == "sort":
        df = _load_df(session_id, params["file"])
        columns = [s["column"] for s in params["sort_by"]]
        ascending = [s.get("ascending", True) for s in params["sort_by"]]
        return df.sort_values(by=columns, ascending=ascending, ignore_index=True)

    elif operation == "deduplicate":
        df = _load_df(session_id, params["file"])
        subset = params.get("columns") if params.get("columns") else None
        return df.drop_duplicates(subset=subset, keep=params.get("keep", "first"), ignore_index=True)

    elif operation == "column_tools":
        df = _load_df(session_id, params["file"])
        action = params["action"]
        if action == "drop": return df.drop(columns=params["columns"], errors="ignore")
        elif action == "rename": return df.rename(columns=params["rename_map"])
        elif action == "reorder":
            remaining = [c for c in df.columns if c not in params["column_order"]]
            return df[params["column_order"] + remaining]

    raise ValueError(f"Unknown operation: {operation}")


# Map of operation names to handler functions
OPERATIONS = {
    "join": op_join,
    "union": op_union,
    "filter": op_filter,
    "group": op_group,
    "sort": op_sort,
    "deduplicate": op_deduplicate,
    "column_tools": op_column_tools,
}
