"""Structured logging configuration."""

import logging
import sys


def setup_logging() -> logging.Logger:
    """Configure structured logging."""
    logger = logging.getLogger("finarivu")
    logger.setLevel(logging.INFO)

    # Clear any existing handlers
    if logger.handlers:
        for handler in logger.handlers:
            logger.removeHandler(handler)

    log_handler = logging.StreamHandler(sys.stdout)
    formatter = logging.Formatter(
        "%(asctime)s | %(levelname)s | %(name)s | %(message)s"
    )
    log_handler.setFormatter(formatter)
    logger.addHandler(log_handler)
    logger.propagate = False

    return logger


logger = setup_logging()
