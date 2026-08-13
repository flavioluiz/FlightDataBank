#!/usr/bin/env python3
"""Audit and refresh the Wikimedia images used by the site.

The Wikimedia upload URL contains a hash derived from the file title.  When a
Commons file is renamed, hard-coded upload and thumbnail URLs become stale even
though the file page redirects correctly.  This script resolves every image
through the official MediaWiki API and records the current canonical URLs and
license metadata.  In write mode it also caches the approved rendition locally,
so visitors are not exposed to Wikimedia hotlink rate limits.

Run without arguments for a read-only audit, or pass ``--write`` to update the
raw data, processed data, and attribution files together.
"""

from __future__ import annotations

import argparse
from datetime import date
import html
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import sys
import time
from typing import Any
import unicodedata
from urllib.error import HTTPError, URLError
from urllib.parse import unquote, urlencode, urlsplit
from urllib.request import Request, urlopen


ROOT = Path(__file__).resolve().parents[1]
API_URL = "https://commons.wikimedia.org/w/api.php"
USER_AGENT = (
    "aircraft-databank-image-audit/1.0 "
    "(https://github.com/flavioluiz/FlightDataBank)"
)
DATASETS = (
    {
        "raw": ROOT / "data/aircraft.json",
        "processed": ROOT / "data/processed/aircraft_processed.json",
        "attribution": ROOT / "attribution_results/aircraft_attribution.json",
        "key": "aircraft",
    },
    {
        "raw": ROOT / "data/birds.json",
        "processed": ROOT / "data/processed/birds_processed.json",
        "attribution": ROOT / "attribution_results/birds_attribution.json",
        "key": "birds",
    },
)


class _TextExtractor(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.parts: list[str] = []

    def handle_data(self, data: str) -> None:
        self.parts.append(data)


def plain_text(value: str | None) -> str | None:
    """Turn Commons HTML metadata into compact human-readable text."""
    if not value:
        return None
    parser = _TextExtractor()
    parser.feed(html.unescape(value))
    text = " ".join("".join(parser.parts).split())
    return text or None


def commons_filename(url: str) -> str:
    """Extract a Commons filename from a file page, original, or thumb URL."""
    # urlsplit keeps semicolons inside Commons filenames instead of treating
    # them as the obsolete URL ``params`` component.
    parsed = urlsplit(url)
    path = unquote(parsed.path)

    if parsed.netloc == "commons.wikimedia.org" and "/wiki/File:" in path:
        return path.split("/wiki/File:", 1)[1]

    parts = path.split("/")
    if "thumb" in parts:
        thumb_index = parts.index("thumb")
        try:
            return parts[thumb_index + 3]
        except IndexError as exc:
            raise ValueError(f"invalid Wikimedia thumbnail URL: {url}") from exc

    if "commons" in parts:
        commons_index = parts.index("commons")
        try:
            return parts[commons_index + 3]
        except IndexError as exc:
            raise ValueError(f"invalid Wikimedia original URL: {url}") from exc

    raise ValueError(f"unsupported Wikimedia URL: {url}")


def strip_tracking(url: str | None) -> str | None:
    """Remove API-added campaign query parameters from media URLs."""
    return url.split("?", 1)[0] if url else None


def resolve_image(image_url: str, width: int) -> dict[str, Any]:
    filename = commons_filename(image_url)
    params = urlencode(
        {
            "action": "query",
            "format": "json",
            "formatversion": 2,
            "redirects": 1,
            "prop": "imageinfo",
            "iiprop": "url|mime|thumbmime|extmetadata",
            "iiurlwidth": width,
            "titles": f"File:{filename}",
        }
    )
    request = Request(
        f"{API_URL}?{params}",
        headers={"User-Agent": USER_AGENT, "Accept": "application/json"},
    )
    with urlopen(request, timeout=30) as response:
        payload = json.load(response)
    pages = payload.get("query", {}).get("pages", [])
    if len(pages) != 1 or pages[0].get("missing"):
        raise ValueError(f"Commons file not found: {filename}")

    page = pages[0]
    imageinfo = page.get("imageinfo", [])
    if not imageinfo:
        raise ValueError(f"Commons returned no image information: {filename}")

    info = imageinfo[0]
    metadata = info.get("extmetadata", {})

    def metadata_value(key: str) -> str | None:
        return metadata.get(key, {}).get("value")

    canonical_title = page["title"].removeprefix("File:")
    display_url = strip_tracking(info.get("thumburl") or info.get("url"))
    original_url = strip_tracking(info.get("url"))
    if not display_url or not original_url:
        raise ValueError(f"Commons returned incomplete image URLs: {filename}")

    author = plain_text(metadata_value("Artist")) or "Unknown author"
    license_name = (
        plain_text(metadata_value("UsageTerms"))
        or plain_text(metadata_value("LicenseShortName"))
        or "License listed on Wikimedia Commons"
    )

    return {
        "canonical_title": canonical_title,
        "image_url": display_url,
        # Do not manufacture a smaller URL by replacing the pixel prefix.
        # Wikimedia rejects direct requests for non-standard thumbnail sizes.
        "thumbnail_url": display_url,
        "image_original_url": original_url,
        "image_source_url": info["descriptionurl"],
        "image_author": author,
        "image_license": license_name,
        "image_license_url": metadata_value("LicenseUrl"),
        "image_attribution": f"{author}, {license_name}, via Wikimedia Commons",
        "description": plain_text(metadata_value("ImageDescription")),
        "date": plain_text(metadata_value("DateTimeOriginal")),
        "source": plain_text(metadata_value("Credit")),
        "mime": info.get("thumbmime") or info.get("mime"),
    }


def image_cache_path(dataset_key: str, item_name: str, mime: str | None) -> Path:
    ascii_name = unicodedata.normalize("NFKD", item_name).encode("ascii", "ignore").decode()
    slug = re.sub(r"[^a-z0-9]+", "-", ascii_name.lower()).strip("-")
    extensions = {
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "image/webp": ".webp",
        "image/gif": ".gif",
        "image/svg+xml": ".svg",
    }
    extension = extensions.get(mime or "", ".img")
    return ROOT / "images" / "wikimedia" / dataset_key / f"{slug}{extension}"


def download_image(
    resolved: dict[str, Any], dataset_key: str, item_name: str
) -> str:
    """Cache an API-approved rendition locally, with polite 429 retries."""
    destination = image_cache_path(dataset_key, item_name, resolved.get("mime"))
    destination.parent.mkdir(parents=True, exist_ok=True)
    request = Request(
        resolved["image_url"],
        headers={"User-Agent": USER_AGENT, "Accept": "image/*"},
    )

    for attempt in range(6):
        try:
            with urlopen(request, timeout=60) as response:
                content_type = response.headers.get_content_type()
                if response.status != 200 or not content_type.startswith("image/"):
                    raise ValueError(
                        f"invalid image response: HTTP {response.status}, {content_type}"
                    )
                image_data = response.read()
            temporary = destination.with_suffix(destination.suffix + ".tmp")
            temporary.write_bytes(image_data)
            temporary.replace(destination)
            time.sleep(1)
            return destination.relative_to(ROOT).as_posix()
        except HTTPError as exc:
            if exc.code != 429 or attempt == 5:
                raise
            retry_after = exc.headers.get("Retry-After")
            delay = int(retry_after) if retry_after and retry_after.isdigit() else 2 ** attempt
            print(f"  RATE LIMIT {item_name}: retrying in {delay}s")
            time.sleep(delay)

    raise RuntimeError(f"could not download {item_name}")


def apply_image_metadata(
    item: dict[str, Any], resolved: dict[str, Any], display_url: str | None = None
) -> None:
    item["image_url"] = display_url or resolved["image_url"]
    item["thumbnail_url"] = display_url or resolved["thumbnail_url"]
    item["image_remote_url"] = resolved["image_url"]
    for key in (
        "image_original_url",
        "image_source_url",
        "image_author",
        "image_license",
        "image_license_url",
        "image_attribution",
    ):
        value = resolved.get(key)
        if value is not None:
            item[key] = value
        else:
            item.pop(key, None)

    notes = item.get("notes")
    if notes and "Image source:" in notes:
        item["notes"] = re.sub(
            r"Image source:\s*https?://\S+?(?=\.(?:\s|$))",
            f"Image source: {resolved['image_source_url']}",
            notes,
        )


def attribution_entry(item_name: str, resolved: dict[str, Any]) -> dict[str, Any]:
    return {
        "author": resolved["image_author"],
        "license": resolved["image_license"],
        "license_url": resolved.get("image_license_url"),
        "description": resolved.get("description"),
        "date": resolved.get("date"),
        "source": resolved.get("source"),
        "url": resolved["image_source_url"],
        "formatted_attribution": resolved["image_attribution"],
        "item_name": item_name,
        "original_url": resolved["image_original_url"],
        "display_url": resolved["image_url"],
        "thumbnail_url": resolved["thumbnail_url"],
    }


def save_json(path: Path, data: dict[str, Any]) -> None:
    path.write_text(
        json.dumps(data, ensure_ascii=True, indent=2) + "\n",
        encoding="utf-8",
    )


def audit_dataset(
    config: dict[str, Any],
    width: int,
    write: bool,
) -> tuple[int, int, list[str]]:
    raw_data = json.loads(config["raw"].read_text(encoding="utf-8"))
    processed_data = json.loads(config["processed"].read_text(encoding="utf-8"))
    key = config["key"]
    raw_items = raw_data[key]
    processed_by_name = {item["name"]: item for item in processed_data[key]}
    attributions: list[dict[str, Any]] = []
    failures: list[str] = []
    changes = 0

    for item in raw_items:
        name = item["name"]
        old_url = item.get("image_url")
        if not old_url:
            failures.append(f"{name}: missing image_url")
            print(f"MISSING  {name}: no image_url")
            continue

        try:
            source_url = (
                item.get("image_source_url")
                or item.get("image_original_url")
                or old_url
            )
            resolved = resolve_image(source_url, width)
        except (HTTPError, URLError, TimeoutError, ValueError, KeyError) as exc:
            failures.append(f"{name}: {exc}")
            print(f"BROKEN   {name}: {exc}")
            continue

        display_url = resolved["image_url"]
        if write:
            try:
                display_url = download_image(resolved, key, name)
            except (HTTPError, URLError, TimeoutError, ValueError, OSError, RuntimeError) as exc:
                failures.append(f"{name}: image download failed: {exc}")
                print(f"BROKEN   {name}: image download failed: {exc}")
                continue
        elif not urlsplit(old_url).scheme:
            cached_image = ROOT / old_url
            if not cached_image.is_file() or cached_image.stat().st_size == 0:
                failures.append(f"{name}: local image missing or empty: {old_url}")
                print(f"BROKEN   {name}: local image missing or empty: {old_url}")
                continue
            display_url = old_url

        changed = old_url != display_url
        changes += int(changed)
        state = "REFRESH" if changed else "OK"
        print(f"{state:<8} {name}: {resolved['canonical_title']}")

        apply_image_metadata(item, resolved, display_url)
        processed_item = processed_by_name.get(name)
        if processed_item is None:
            failures.append(f"{name}: absent from processed data")
        else:
            apply_image_metadata(processed_item, resolved, display_url)
        attributions.append(attribution_entry(name, resolved))

    if write and not failures:
        update_date = date.today().isoformat()
        for data in (raw_data, processed_data):
            data.setdefault("metadata", {})["count"] = len(data[key])
            data["metadata"]["images_updated_at"] = update_date
        save_json(config["raw"], raw_data)
        save_json(config["processed"], processed_data)
        save_json(config["attribution"], {"attributions": attributions})

    return len(raw_items), changes, failures


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--write",
        action="store_true",
        help="cache images locally and write refreshed metadata to the repository",
    )
    parser.add_argument(
        "--width",
        type=int,
        default=960,
        help="maximum display-image width in pixels (default: 960)",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    if args.width < 480:
        print("--width must be at least 480", file=sys.stderr)
        return 2

    total = 0
    changes = 0
    failures: list[str] = []
    for config in DATASETS:
        print(f"\nAuditing {config['raw'].relative_to(ROOT)}")
        dataset_total, dataset_changes, dataset_failures = audit_dataset(
            config, args.width, args.write
        )
        total += dataset_total
        changes += dataset_changes
        failures.extend(dataset_failures)

    action = "updated" if args.write and not failures else "would refresh"
    print(f"\n{total - len(failures)}/{total} images valid; {action} {changes} URLs")
    if failures:
        print(f"{len(failures)} failure(s); no files were written:")
        for failure in failures:
            print(f"- {failure}")
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
