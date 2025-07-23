"""
NCAA Directory Spider

This spider scrapes the NCAA directory for schools, conferences, and sports data.
It uses the NCAA API to gather comprehensive information.
"""

import json
import re
from typing import Generator, Dict, Any, Optional
from urllib.parse import urljoin, urlparse

import scrapy
from scrapy import Request
from scrapy.http import Response
from itemloaders import ItemLoader

from src.scrapy_spiders.items import SchoolItem, ConferenceItem, SportItem, LocationItem


class NCAADirectorySpider(scrapy.Spider):
    """Spider for scraping NCAA directory data"""

    name = "ncaa_directory"
    allowed_domains = ["web3.ncaa.org", "ncaa.org"]

    # API endpoints
    API_BASE = "https://web3.ncaa.org/directory/api"
    SPORTS_URL = f"{API_BASE}/common/sportList"
    MEMBERS_URL = f"{API_BASE}/directory/memberList"
    ORG_DETAIL_URL = f"{API_BASE}/directory/orgDetail"

    custom_settings = {
        "DOWNLOAD_DELAY": 1,
        "CONCURRENT_REQUESTS_PER_DOMAIN": 2,
    }

    def __init__(
        self, divisions: str = "1,2,3", limit: Optional[str] = None, *args, **kwargs
    ):
        super().__init__(*args, **kwargs)
        self.divisions = [int(d.strip()) for d in divisions.split(",")]
        self.limit = int(limit) if limit else None
        self.processed_schools = 0
        self.processed_conferences = set()

        self.logger.info(
            f"Initialized NCAA Directory Spider for divisions: {self.divisions}"
        )
        if self.limit:
            self.logger.info(f"Limiting to {self.limit} schools per division")

    def start_requests(self) -> Generator[Request, None, None]:
        """Generate initial requests"""
        # Start with sports data
        yield Request(
            url=self.SPORTS_URL,
            callback=self.parse_sports,
            headers={"Accept": "application/json"},
        )

        # Then get schools for each division
        for division in self.divisions:
            url = f"{self.MEMBERS_URL}?division={division}"
            yield Request(
                url=url,
                callback=self.parse_schools_overview,
                meta={"division": division},
                headers={"Accept": "application/json"},
                dont_filter=True,
                cb_kwargs={"division": division},
            )

    def parse_sports(self, response: Response) -> Generator[SportItem, None, None]:
        """Parse sports data from NCAA API"""
        try:
            data = json.loads(response.text)
            self.logger.info(f"Found {len(data)} sports")

            for sport_data in data:
                loader = ItemLoader(item=SportItem(), response=response)

                loader.add_value("ncaa_id", sport_data.get("code"))
                loader.add_value("display_name", sport_data.get("name"))
                loader.add_value(
                    "name", self._normalize_sport_name(sport_data.get("name", ""))
                )
                loader.add_value(
                    "gender", self._infer_gender(sport_data.get("name", ""))
                )
                loader.add_value("is_active", True)
                loader.add_value(
                    "divisions", ["I", "II", "III"]
                )  # Most sports are in all divisions

                yield loader.load_item()

        except (json.JSONDecodeError, KeyError) as e:
            self.logger.error(f"Failed to parse sports data: {e}")

    def parse_schools_overview(
        self, response: Response, division: int
    ) -> Generator[Request, None, None]:
        """Parse schools overview and generate detail requests"""
        try:
            data = json.loads(response.text)
            self.logger.info(f"Found {len(data)} schools in Division {division}")

            schools_to_process = data
            if self.limit:
                schools_to_process = data[: self.limit]
                self.logger.info(
                    f"Limited to {len(schools_to_process)} schools for Division {division}"
                )

            for school_data in schools_to_process:
                # Generate request for detailed school information
                school_id = school_data.get("orgId")
                if school_id:
                    url = f"{self.ORG_DETAIL_URL}?id={school_id}"
                    yield Request(
                        url=url,
                        callback=self.parse_school_detail,
                        meta={"school_overview": school_data, "division": division},
                        headers={"Accept": "application/json"},
                        dont_filter=True,
                        cb_kwargs={"school_id": school_id},
                    )

                    # Also request conference details if not already processed
                    conf_id = school_data.get("primaryConferenceId")
                    if conf_id and conf_id not in self.processed_conferences:
                        self.processed_conferences.add(conf_id)
                        url = f"{self.ORG_DETAIL_URL}?id={conf_id}"
                        yield Request(
                            url=url,
                            callback=self.parse_conference_detail,
                            meta={"conference_id": conf_id},
                            headers={"Accept": "application/json"},
                            dont_filter=True,
                            cb_kwargs={"conference_id": conf_id},
                        )

        except (json.JSONDecodeError, KeyError) as e:
            self.logger.error(
                f"Failed to parse schools overview for Division {division}: {e}"
            )

    def parse_school_detail(
        self, response: Response, school_id: int
    ) -> Generator[SchoolItem, None, None]:
        """Parse detailed school information"""
        try:
            data = json.loads(response.text)
            overview_data = response.meta.get("school_overview", {})
            division = response.meta.get("division")

            self.processed_schools += 1
            self.logger.debug(
                f"Processing school {school_id} ({self.processed_schools} total)"
            )

            loader = ItemLoader(item=SchoolItem(), response=response)

            # Basic information
            loader.add_value("ncaa_id", school_id)
            loader.add_value("name", data.get("name"))
            loader.add_value("display_name", data.get("name"))
            loader.add_value(
                "normalized_name", self._normalize_name(data.get("name", ""))
            )
            loader.add_value("abbreviation", data.get("abbreviation"))
            loader.add_value("mascot", data.get("mascot"))
            loader.add_value("division", str(division))
            loader.add_value("logo_url", data.get("logoUrl"))

            # From overview data
            loader.add_value("conference_id", overview_data.get("primaryConferenceId"))
            loader.add_value("is_private", overview_data.get("isPrivate"))
            loader.add_value("athletics_site", overview_data.get("athleticsUrl"))
            loader.add_value("academics_site", overview_data.get("institutionUrl"))
            loader.add_value("sport_region", overview_data.get("region"))

            # Location information
            location_data = self._extract_location_from_html(data.get("address", ""))
            if location_data:
                for key, value in location_data.items():
                    loader.add_value(key, value)

            # Social media
            social_media = self._extract_social_media(data)
            for key, value in social_media.items():
                if value:
                    loader.add_value(key, value)

            yield loader.load_item()

        except (json.JSONDecodeError, KeyError) as e:
            self.logger.error(f"Failed to parse school detail for {school_id}: {e}")

    def parse_conference_detail(
        self, response: Response, conference_id: int
    ) -> Generator[ConferenceItem, None, None]:
        """Parse detailed conference information"""
        try:
            data = json.loads(response.text)

            self.logger.debug(f"Processing conference {conference_id}")

            loader = ItemLoader(item=ConferenceItem(), response=response)

            # Basic information
            loader.add_value("ncaa_id", conference_id)
            loader.add_value("name", data.get("name"))
            loader.add_value("abbreviation", data.get("abbreviation"))
            loader.add_value("division", self._extract_division(data))
            loader.add_value("football_division", self._extract_football_division(data))
            loader.add_value("url", data.get("websiteUrl"))
            loader.add_value("logo_url", data.get("logoUrl"))
            loader.add_value("address", data.get("address"))

            # Social media
            social_media = self._extract_social_media(data)
            for key, value in social_media.items():
                if value:
                    loader.add_value(key, value)

            yield loader.load_item()

        except (json.JSONDecodeError, KeyError) as e:
            self.logger.error(
                f"Failed to parse conference detail for {conference_id}: {e}"
            )

    def _normalize_name(self, name: str) -> str:
        """Normalize school/conference name for database storage"""
        if not name:
            return ""
        # Convert to lowercase, replace spaces with underscores, remove special chars
        normalized = re.sub(r"[^\w\s-]", "", name.lower())
        normalized = re.sub(r"[-\s]+", "_", normalized)
        return normalized.strip("_")

    def _normalize_sport_name(self, name: str) -> str:
        """Normalize sport name"""
        if not name:
            return ""
        # Remove gender prefixes and normalize
        name = re.sub(r"^(Men's|Women's)\s+", "", name)
        return self._normalize_name(name)

    def _infer_gender(self, sport_name: str) -> str:
        """Infer gender from sport name"""
        if not sport_name:
            return "mixed"
        if sport_name.startswith("Men's"):
            return "male"
        elif sport_name.startswith("Women's"):
            return "female"
        else:
            return "mixed"

    def _extract_location_from_html(
        self, address_html: str
    ) -> Optional[Dict[str, Any]]:
        """Extract location information from HTML address"""
        if not address_html:
            return None

        from bs4 import BeautifulSoup

        # Parse HTML
        soup = BeautifulSoup(address_html, "html.parser")
        address_text = soup.get_text(separator=" ").strip()

        if not address_text:
            return None

        # Basic address parsing
        parts = [part.strip() for part in address_text.split(",") if part.strip()]

        location = {"country": "United States"}

        if len(parts) >= 1:
            location["street"] = parts[0]
        if len(parts) >= 2:
            location["city"] = parts[1]
        if len(parts) >= 3:
            # Extract state and ZIP code
            state_zip = parts[2]
            zip_match = re.search(r"\b\d{5}(-\d{4})?\b", state_zip)
            if zip_match:
                location["zip_code"] = zip_match.group()
                location["state"] = state_zip.replace(zip_match.group(), "").strip()
            else:
                location["state"] = state_zip

        return location

    def _extract_social_media(self, data: Dict[str, Any]) -> Dict[str, Optional[str]]:
        """Extract social media URLs from organization data"""
        return {
            "facebook": data.get("facebookUrl"),
            "twitter": data.get("twitterUrl"),
            "instagram": data.get("instagramUrl"),
        }

    def _extract_division(self, data: Dict[str, Any]) -> Optional[str]:
        """Extract division information"""
        division_info = str(data.get("division", ""))
        if (
            "I" in division_info
            and "II" not in division_info
            and "III" not in division_info
        ):
            return "I"
        elif "II" in division_info:
            return "II"
        elif "III" in division_info:
            return "III"
        return None

    def _extract_football_division(self, data: Dict[str, Any]) -> Optional[str]:
        """Extract football division information"""
        return data.get("footballDivision")

    def closed(self, reason):
        """Called when spider closes"""
        self.logger.info(
            f"Spider closed: {reason}. "
            f"Processed {self.processed_schools} schools, "
            f"{len(self.processed_conferences)} conferences"
        )
