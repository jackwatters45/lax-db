import re
from bs4 import BeautifulSoup
import structlog
from .base_extractor import BaseExtractor
from ..generated.models import School, Conference, Location, Sport

logger = structlog.get_logger()


class NCAADirectoryExtractor(BaseExtractor):
    """Extractor for NCAA directory data"""

    BASE_URL = "https://web3.ncaa.org/directory/api"

    def __init__(self):
        super().__init__(rate_limit_delay=0.5)  # Be respectful to NCAA servers

    async def extract_sports(self) -> list[Sport]:
        """Extract all NCAA sports"""
        logger.info("Extracting NCAA sports")

        url = f"{self.BASE_URL}/common/sportList"
        data = await self.fetch_json(url)

        sports = []
        for sport_data in data:
            # Map NCAA sport data to our Sport model
            sport = Sport(
                ncaaId=sport_data["code"],
                name=self._normalize_sport_name(sport_data["name"]),
                displayName=sport_data["name"],
                gender=self._infer_gender(sport_data["name"]),
                isActive=True,
                divisions=["I", "II", "III"],  # Most sports are in all divisions
            )
            sports.append(sport)

        logger.info("Sports extraction complete", count=len(sports))
        return sports

    async def extract_schools_overview(self) -> list[dict[str, any]]:
        """Extract basic school information for all divisions"""
        logger.info("Extracting NCAA schools overview")

        all_schools = []

        # Extract schools from each division
        for division in [1, 2, 3]:
            url = f"{self.BASE_URL}/directory/memberList"
            params = {"division": division}

            data = await self.fetch_json(url, params=params)

            for school_data in data:
                school_info = {
                    "ncaa_id": school_data["orgId"],
                    "name": self._normalize_name(school_data["name"]),
                    "display_name": school_data["name"],
                    "division": str(division),
                    "conference_id": school_data.get("primaryConferenceId"),
                    "private": school_data.get("isPrivate"),
                    "athletics_site": school_data.get("athleticsUrl"),
                    "academics_site": school_data.get("institutionUrl"),
                    "sport_region": school_data.get("region"),
                }
                all_schools.append(school_info)

        logger.info("Schools overview extraction complete", count=len(all_schools))
        return all_schools

    async def extract_school_details(self, school_id: int) -> dict[str, any] | None:
        """Extract detailed information for a specific school"""
        logger.debug("Extracting school details", school_id=school_id)

        url = f"{self.BASE_URL}/directory/orgDetail"
        params = {"id": school_id}

        try:
            data = await self.fetch_json(url, params=params)

            # Extract location information
            location_data = self._extract_location_from_html(data.get("address", ""))

            # Extract social media URLs
            social_media = self._extract_social_media(data)

            school_details = {
                "ncaa_id": school_id,
                "name": self._normalize_name(data["name"]),
                "display_name": data["name"],
                "abbreviation": data.get("abbreviation"),
                "mascot": data.get("mascot"),
                "logo": data.get("logoUrl"),
                "location": location_data,
                **social_media,
            }

            return school_details

        except Exception as e:
            logger.error(
                "Failed to extract school details", school_id=school_id, error=str(e)
            )
            return None

    async def extract_conferences(self) -> list[Conference]:
        """Extract conference information"""
        logger.info("Extracting NCAA conferences")

        # Get conferences from school data
        schools_data = await self.extract_schools_overview()
        conference_ids = set()

        for school in schools_data:
            if school.get("conference_id"):
                conference_ids.add(school["conference_id"])

        conferences = []

        for conf_id in conference_ids:
            conf_details = await self.extract_conference_details(conf_id)
            if conf_details:
                conference = Conference(**conf_details)
                conferences.append(conference)

        logger.info("Conference extraction complete", count=len(conferences))
        return conferences

    async def extract_conference_details(
        self, conference_id: int
    ) -> Optional[Dict[str, Any]]:
        """Extract detailed information for a specific conference"""
        logger.debug("Extracting conference details", conference_id=conference_id)

        url = f"{self.BASE_URL}/directory/orgDetail"
        params = {"id": conference_id}

        try:
            data = await self.fetch_json(url, params=params)

            # Extract social media URLs
            social_media = self._extract_social_media(data)

            conference_details = {
                "ncaa_id": conference_id,
                "name": data["name"],
                "abbreviation": data.get("abbreviation"),
                "division": self._extract_division(data),
                "football_division": self._extract_football_division(data),
                "url": data.get("websiteUrl"),
                "address": data.get("address"),
                "logo": data.get("logoUrl"),
                **social_media,
            }

            return conference_details

        except Exception as e:
            logger.error(
                "Failed to extract conference details",
                conference_id=conference_id,
                error=str(e),
            )
            return None

    async def extract(self) -> dict[str, list[any]]:
        """Extract all NCAA directory data"""
        logger.info("Starting full NCAA directory extraction")

        # Extract sports first (needed for other extractions)
        sports = await self.extract_sports()

        # Extract schools overview
        schools_overview = await self.extract_schools_overview()

        # Extract detailed school information (sample first 10 for testing)
        schools = []
        locations = []

        for school_data in schools_overview[:10]:  # Limit for testing
            school_details = await self.extract_school_details(school_data["ncaa_id"])
            if school_details:
                # Create location if provided
                if school_details.get("location"):
                    location = Location(**school_details["location"])
                    locations.append(location)
                    school_details["location_id"] = location.id
                    del school_details["location"]

                # Merge overview and detailed data
                merged_school = {**school_data, **school_details}
                school = School(**merged_school)
                schools.append(school)

        # Extract conferences
        conferences = await self.extract_conferences()

        logger.info(
            "NCAA directory extraction complete",
            sports_count=len(sports),
            schools_count=len(schools),
            conferences_count=len(conferences),
            locations_count=len(locations),
        )

        return {
            "sports": sports,
            "schools": schools,
            "conferences": conferences,
            "locations": locations,
        }

    def _normalize_name(self, name: str) -> str:
        """Normalize school/conference name for database storage"""
        # Convert to lowercase, replace spaces with underscores, remove special chars
        normalized = re.sub(r"[^\w\s-]", "", name.lower())
        normalized = re.sub(r"[-\s]+", "_", normalized)
        return normalized.strip("_")

    def _normalize_sport_name(self, name: str) -> str:
        """Normalize sport name"""
        # Remove gender prefixes and normalize
        name = re.sub(r"^(Men's|Women's)\s+", "", name)
        return self._normalize_name(name)

    def _infer_gender(self, sport_name: str) -> str:
        """Infer gender from sport name"""
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

        # Parse HTML
        soup = BeautifulSoup(address_html, "html.parser")
        address_text = soup.get_text(separator=" ").strip()

        if not address_text:
            return None

        # Basic address parsing (would need more sophisticated parsing in production)
        parts = address_text.split(",")

        location = {
            "street": parts[0].strip() if len(parts) > 0 else None,
            "city": parts[1].strip() if len(parts) > 1 else None,
            "state": parts[2].strip() if len(parts) > 2 else None,
            "country": "United States",
        }

        # Extract ZIP code if present
        if len(parts) > 2:
            state_zip = parts[2].strip()
            zip_match = re.search(r"\b\d{5}(-\d{4})?\b", state_zip)
            if zip_match:
                location["zip_code"] = zip_match.group()
                location["state"] = state_zip.replace(zip_match.group(), "").strip()

        return location

    def _extract_social_media(self, data: dict[str, any]) -> dict[str, str | None]:
        """Extract social media URLs from organization data"""
        return {
            "facebook": data.get("facebookUrl"),
            "twitter": data.get("twitterUrl"),
            "instagram": data.get("instagramUrl"),
        }

    def _extract_division(self, data: dict[str, any]) -> str | None:
        """Extract division information"""
        # This would need to be implemented based on actual NCAA API response structure
        division_info = data.get("division", "")
        if "I" in division_info:
            return "I"
        elif "II" in division_info:
            return "II"
        elif "III" in division_info:
            return "III"
        return None

    def _extract_football_division(self, data: dict[str, any]) -> str | None:
        """Extract football division information"""
        # This would need to be implemented based on actual NCAA API response structure
        return data.get("footballDivision")
