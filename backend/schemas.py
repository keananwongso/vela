from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Literal

from pydantic import BaseModel, field_validator

VALID_REGION_IDS = {"kampar", "pelalawan", "inhu", "rohil", "siak"}
VALID_CROP_HEALTH = {"good", "moderate", "at_risk"}


def to_utc_timestamp(value: datetime) -> str:
    normalized = value.astimezone(timezone.utc).replace(microsecond=0)
    return normalized.isoformat().replace("+00:00", "Z")


class IngestPayload(BaseModel):
    region_id: str
    crop_health: str
    action: str
    price_signal: str
    confidence: float
    generated_at: datetime
    source: str
    prompt_version: str
    run_id: str
    ndvi: float
    ndvi_previous: float
    ndvi_source: str
    rain_probability: float
    heavy_rain_day: str | None = None
    cpo_price: str | None = None
    cpo_price_raw: float
    tbs_price: str | None = None
    period: str | None = None
    price_trend: str

    @field_validator("region_id")
    @classmethod
    def validate_region_id(cls, value: str) -> str:
        if value not in VALID_REGION_IDS:
            raise ValueError(f"region_id must be one of: {', '.join(sorted(VALID_REGION_IDS))}")
        return value

    @field_validator("crop_health")
    @classmethod
    def validate_crop_health(cls, value: str) -> str:
        if value not in VALID_CROP_HEALTH:
            raise ValueError(f"crop_health must be one of: {', '.join(sorted(VALID_CROP_HEALTH))}")
        return value

    @field_validator("generated_at")
    @classmethod
    def validate_generated_at(cls, value: datetime) -> datetime:
        if value.tzinfo is None or value.utcoffset() is None:
            raise ValueError("generated_at must be a timezone-aware ISO 8601 UTC timestamp")
        if value.utcoffset() != timedelta(0):
            raise ValueError("generated_at must be a UTC timestamp")
        return value.astimezone(timezone.utc)

    @property
    def generated_at_iso(self) -> str:
        return to_utc_timestamp(self.generated_at)


class IngestSuccessResponse(BaseModel):
    status: Literal["ok"]
    run_id: str


class ErrorResponse(BaseModel):
    status: Literal["error"]
    detail: str
