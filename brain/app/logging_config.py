"""
Structured logging configuration for the Brain service.

Outputs JSON-lines to stdout — one JSON object per log entry.
Compatible with Docker log drivers, Grafana Loki, Datadog, and any
log aggregator that understands newline-delimited JSON.

Usage (in each module):
    import logging
    logger = logging.getLogger(__name__)

Call configure_logging() once at app startup in main.py.
"""

import json
import logging
import traceback as tb
from datetime import datetime, timezone


class JSONFormatter(logging.Formatter):
    """
    Formats each log record as a single JSON object on one line.

    Fields:
      ts      — ISO-8601 UTC timestamp with milliseconds
      level   — DEBUG / INFO / WARNING / ERROR / CRITICAL
      logger  — module name (last segment only, e.g. "decision" not "app.decision")
      msg     — the log message
      exc     — formatted exception traceback, only present when an exception is attached
    """

    def format(self, record: logging.LogRecord) -> str:
        entry: dict = {
            "ts":     datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.") +
                      f"{record.msecs:03.0f}Z",
            "level":  record.levelname,
            "logger": record.name.split(".")[-1],
            "msg":    record.getMessage(),
        }
        if record.exc_info:
            entry["exc"] = self.formatException(record.exc_info)
        elif record.exc_text:
            entry["exc"] = record.exc_text
        return json.dumps(entry, ensure_ascii=False)


def configure_logging(level: str = "INFO") -> None:
    """
    Replace the root logger's handlers with a single stdout JSON handler.
    Call this once at application startup before any loggers are used.
    """
    handler = logging.StreamHandler()
    handler.setFormatter(JSONFormatter())

    root = logging.getLogger()
    root.handlers.clear()
    root.addHandler(handler)
    root.setLevel(getattr(logging, level.upper(), logging.INFO))

    # Suppress noisy third-party loggers that would pollute the output
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("uvicorn.error").setLevel(logging.WARNING)
    logging.getLogger("httpx").setLevel(logging.WARNING)
