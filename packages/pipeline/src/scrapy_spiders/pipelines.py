"""
Define your item pipelines here

For extraction-only mode, we'll just save to JSON files
"""

import json
import os
from datetime import datetime
from pathlib import Path
from typing import Dict, Any

import structlog
from itemadapter import ItemAdapter

logger = structlog.get_logger()


class ValidationPipeline:
    """Pipeline to validate scraped items"""

    def process_item(self, item, spider):
        adapter = ItemAdapter(item)

        # Basic validation - warn about missing fields but don't fail
        if "SchoolItem" in item.__class__.__name__:
            if not adapter.get("ncaa_id"):
                logger.warning(
                    f"Missing ncaa_id for school item: {adapter.get('name', 'unknown')}"
                )
            if not adapter.get("name"):
                logger.warning(f"Missing name for school item: {adapter}")

        elif "ConferenceItem" in item.__class__.__name__:
            if not adapter.get("ncaa_id"):
                logger.warning(
                    f"Missing ncaa_id for conference item: {adapter.get('name', 'unknown')}"
                )
            if not adapter.get("name"):
                logger.warning(f"Missing name for conference item: {adapter}")

        elif "SportItem" in item.__class__.__name__:
            if not adapter.get("ncaa_id"):
                logger.warning(
                    f"Missing ncaa_id for sport item: {adapter.get('name', 'unknown')}"
                )
            if not adapter.get("name"):
                logger.warning(f"Missing name for sport item: {adapter}")

        return item


class JsonExportPipeline:
    """Pipeline to export items to JSON files"""

    def __init__(self):
        self.files = {}
        self.exporters = {}
        self.output_dir = Path("scraped_data")
        self.output_dir.mkdir(exist_ok=True)

        # Create timestamped subdirectory
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        self.run_dir = self.output_dir / timestamp
        self.run_dir.mkdir(exist_ok=True)

        logger.info(f"Exporting scraped data to: {self.run_dir}")

    def open_spider(self, spider):
        """Initialize files for each item type"""
        item_types = ["schools", "conferences", "sports"]

        for item_type in item_types:
            filename = self.run_dir / f"{item_type}.json"
            self.files[item_type] = open(filename, "w", encoding="utf-8")
            # Write opening bracket for JSON array
            self.files[item_type].write("[\n")

        self.item_counts = {item_type: 0 for item_type in item_types}

    def close_spider(self, spider):
        """Close files and finalize JSON arrays"""
        for item_type, file in self.files.items():
            # Remove trailing comma and close JSON array
            file.seek(file.tell() - 2)  # Go back 2 characters (,\n)
            file.write("\n]")
            file.close()

            logger.info(f"Exported {self.item_counts[item_type]} {item_type}")

        # Create summary file
        summary = {
            "timestamp": datetime.now().isoformat(),
            "spider": spider.name,
            "counts": self.item_counts,
            "total_items": sum(self.item_counts.values()),
        }

        with open(self.run_dir / "summary.json", "w") as f:
            json.dump(summary, f, indent=2)

        logger.info(f"Scraping complete. Total items: {summary['total_items']}")

    def process_item(self, item, spider):
        adapter = ItemAdapter(item)

        # Determine item type and corresponding file
        if "SchoolItem" in item.__class__.__name__:
            item_type = "schools"
        elif "ConferenceItem" in item.__class__.__name__:
            item_type = "conferences"
        elif "SportItem" in item.__class__.__name__:
            item_type = "sports"
        else:
            logger.warning(f"Unknown item type: {item.__class__.__name__}")
            return item

        # Write item to appropriate file
        file = self.files[item_type]

        # Add comma if not the first item
        if self.item_counts[item_type] > 0:
            file.write(",\n")

        # Write the item
        json.dump(dict(adapter), file, indent=2, ensure_ascii=False)

        self.item_counts[item_type] += 1

        return item


class CsvExportPipeline:
    """Pipeline to export items to CSV files"""

    def __init__(self):
        self.files = {}
        self.writers = {}
        self.output_dir = Path("scraped_data")
        self.output_dir.mkdir(exist_ok=True)

        # Create timestamped subdirectory
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        self.run_dir = self.output_dir / timestamp
        self.run_dir.mkdir(exist_ok=True)

    def open_spider(self, spider):
        """Initialize CSV files and writers"""
        import csv

        self.csv = csv
        item_types = ["schools", "conferences", "sports"]

        for item_type in item_types:
            filename = self.run_dir / f"{item_type}.csv"
            self.files[item_type] = open(filename, "w", newline="", encoding="utf-8")
            self.writers[item_type] = None  # Will be initialized with first item

    def close_spider(self, spider):
        """Close CSV files"""
        for file in self.files.values():
            file.close()

    def process_item(self, item, spider):
        adapter = ItemAdapter(item)

        # Determine item type
        if "SchoolItem" in item.__class__.__name__:
            item_type = "schools"
        elif "ConferenceItem" in item.__class__.__name__:
            item_type = "conferences"
        elif "SportItem" in item.__class__.__name__:
            item_type = "sports"
        else:
            return item

        # Initialize CSV writer with first item (to get headers)
        if self.writers[item_type] is None:
            fieldnames = list(adapter.keys())
            self.writers[item_type] = self.csv.DictWriter(
                self.files[item_type], fieldnames=fieldnames
            )
            self.writers[item_type].writeheader()

        # Write the item
        self.writers[item_type].writerow(dict(adapter))

        return item
