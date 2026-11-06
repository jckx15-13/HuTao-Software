"""Online WWT catalog adapters; no fabricated replacement data on fetch failure."""
from functools import lru_cache
import math
from urllib.request import urlopen

ASSETS = "https://web.wwtassets.org/engine/assets/"
HIPPARCOS_URL = "https://cdn.worldwidetelescope.org/wwtweb/catalog.aspx?Q=hipparcos"


@lru_cache(maxsize=4)
def catalog_text(url: str):
    with urlopen(url, timeout=20) as response:
        return response.read().decode("utf-8-sig")


def constellation_paths(boundaries=False):
    """Match WWT's fixed-width parser and pen-up semantics.

    constellations.txt contains WWT's interpolated celestial boundary paths.
    figures.txt contains traditional line figures, not IAU region boundaries.
    """
    paths = []
    current = None
    previous_region = None
    for row in catalog_text(ASSETS + ("constellations.txt" if boundaries else "figures.txt")).splitlines():
        if len(row) < 29:
            continue
        row = row[:11] + row[11:21].replace("- ", " -").replace("+ ", " +") + row[21:]
        ra, dec = float(row[:10]) * 15, float(row[11:21])
        region = row[23:27].strip()
        if row[30:].strip() == "Empty":
            continue
        pen_up = not boundaries and row[28:29] == "0"
        if current is None or region != previous_region or pen_up:
            current = {"id": region, "points": []}
            paths.append(current)
        current["points"].append([ra, dec])
        previous_region = region
    if boundaries:
        for path in paths:
            if path["points"] and path["points"][0] != path["points"][-1]:
                path["points"].append(path["points"][0])
    return [path for path in paths if len(path["points"]) > 1]


@lru_cache(maxsize=1)
def bright_stars():
    stars = []
    for row in catalog_text(HIPPARCOS_URL).splitlines():
        fields = row.split("\t")
        if len(fields) < 5:
            continue
        try:
            ra, dec, magnitude = float(fields[2]), float(fields[3]), float(fields[4])
        except ValueError:
            continue
        if all(math.isfinite(value) for value in (ra, dec, magnitude)) and magnitude <= 6.5:
            stars.append({"id": fields[0], "ra_deg": ra, "dec_deg": dec, "magnitude": magnitude})
    if not stars:
        raise ValueError("The WWT star catalog contained no usable bright stars")
    return stars
