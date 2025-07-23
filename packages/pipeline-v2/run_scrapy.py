#!/usr/bin/env python3
"""
Simple runner for NCAA Directory Scrapy spider - Extraction Only

Usage:
    python run_scrapy.py                    # Scrape all divisions
    python run_scrapy.py --divisions 1      # Scrape only Division I
    python run_scrapy.py --limit 10         # Limit to 10 schools per division
    python run_scrapy.py --output json      # Export to JSON (default)
    python run_scrapy.py --output csv       # Export to CSV
"""

import argparse
import os
import sys
from pathlib import Path

# Add src to Python path
sys.path.insert(0, str(Path(__file__).parent / "src"))

from scrapy.crawler import CrawlerProcess
from scrapy.utils.project import get_project_settings


def main():
    parser = argparse.ArgumentParser(description="NCAA Directory Scrapy Spider")
    parser.add_argument(
        "--divisions",
        default="1,2,3",
        help="Comma-separated list of divisions to scrape (default: 1,2,3)",
    )
    parser.add_argument(
        "--limit", type=int, help="Limit number of schools per division (for testing)"
    )
    parser.add_argument(
        "--output",
        choices=["json", "csv", "both"],
        default="json",
        help="Output format (default: json)",
    )
    parser.add_argument(
        "--log-level",
        choices=["DEBUG", "INFO", "WARNING", "ERROR"],
        default="INFO",
        help="Log level (default: INFO)",
    )

    args = parser.parse_args()

    # Get Scrapy settings
    settings = get_project_settings()
    settings.set("LOG_LEVEL", args.log_level)

    # Configure pipelines based on output format
    pipelines = {
        "src.scrapy_spiders.pipelines.ValidationPipeline": 300,
    }

    if args.output in ["json", "both"]:
        pipelines["src.scrapy_spiders.pipelines.JsonExportPipeline"] = 400

    if args.output in ["csv", "both"]:
        pipelines["src.scrapy_spiders.pipelines.CsvExportPipeline"] = 500

    settings.set("ITEM_PIPELINES", pipelines)

    # Create crawler process
    process = CrawlerProcess(settings)

    # Spider arguments
    spider_kwargs = {
        "divisions": args.divisions,
    }

    if args.limit:
        spider_kwargs["limit"] = str(args.limit)

    # Add spider to process
    process.crawl("ncaa_directory", **spider_kwargs)

    print(f"Starting NCAA Directory spider...")
    print(f"Divisions: {args.divisions}")
    if args.limit:
        print(f"Limit: {args.limit} schools per division")
    print(f"Output format: {args.output}")
    print(f"Log level: {args.log_level}")
    print()

    # Start crawling
    process.start()


if __name__ == "__main__":
    main()
