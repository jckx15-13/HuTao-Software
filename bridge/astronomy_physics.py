"""Observer geometry for the online observatory. Distances are km, angles degrees.

Astropy/ERFA built-in ephemerides are suitable for visualization, not navigation.
Solar-system vectors use ICRS barycentric axes; the map rotates them to a fixed
J2000 ecliptic orientation. Apparent target coordinates include light travel time.
"""
from datetime import datetime, timezone
from functools import lru_cache
import csv
import io
import math
from urllib.request import urlopen

import astropy.units as u
from astropy.coordinates import AltAz, EarthLocation, SkyCoord, ITRS, get_body, get_body_barycentric
from astropy.time import Time
from astropy.utils import iers
from .astronomy_catalogs import constellation_paths, bright_stars, ASSETS, HIPPARCOS_URL

# Use the packaged IERS table: a request never blocks on an auxiliary download.
iers.conf.auto_download = False
iers.conf.auto_max_age = None

CATALOG_URL = "https://web.wwtassets.org/engine/assets/ConstellationNamePositions_v2_EN.txt"
BODIES = ("sun", "mercury", "venus", "earth", "moon", "mars", "jupiter", "saturn", "uranus", "neptune")
RADII = dict(zip(BODIES, (695700, 2439.7, 6051.8, 6371, 1737.4, 3389.5, 69911, 58232, 25362, 24622)))


@lru_cache(maxsize=1)
def constellations():
    """Fetch WWT's 89 region centroids, group Serpens into one of 88 constellations."""
    with urlopen(CATALOG_URL, timeout=15) as response:
        rows = list(csv.reader(io.StringIO(response.read().decode("utf-8-sig"))))
    result = []
    serpens = []
    for name, abbreviation, ra, dec in rows:
        region = {"id": abbreviation, "name": name, "ra_deg": float(ra) * 15, "dec_deg": float(dec)}
        if abbreviation.startswith("SER"):
            serpens.append(region)
        else:
            result.append({**region, "regions": [region]})
    result.append({"id": "SER", "name": "Serpens", "ra_deg": serpens[0]["ra_deg"], "dec_deg": serpens[0]["dec_deg"], "regions": serpens})
    if len(result) != 88:
        raise ValueError("WWT catalog did not contain 88 constellations")
    return sorted(result, key=lambda item: item["name"])


def vector_km(vector):
    return [float(value) for value in vector.xyz.to_value(u.km)]


def sky_regions(utc: str):
    """Project the WWT region centers into Cesium's Earth-fixed axes in Python.

    These are directions at infinity, not nearby objects or boundary geometry.
    Astropy handles precession, Earth rotation and the ICRS-to-ITRS transform.
    """
    timestamp = datetime.fromisoformat(utc.replace("Z", "+00:00"))
    if timestamp.tzinfo is None or not 2000 <= timestamp.year <= 2050:
        raise ValueError("Use a timezone-aware observation time from 2000 through 2050")
    regions = [region for entry in constellations() for region in entry["regions"]]
    coordinates = SkyCoord(ra=[r["ra_deg"] for r in regions]*u.deg,
                           dec=[r["dec_deg"] for r in regions]*u.deg, frame="icrs")
    vectors = coordinates.transform_to(ITRS(obstime=Time(timestamp))).cartesian.xyz.value.T
    return {"utc": timestamp.isoformat(), "frame": "ITRS", "source": CATALOG_URL,
            "regions": [{**region, "direction": [float(v) for v in vector / math.sqrt(sum(vector*vector))]}
                        for region, vector in zip(regions, vectors)]}


def ecliptic(vector):
    """Fixed J2000 obliquity rotation for a geometric third-person diagram."""
    x, y, z = vector
    eps = math.radians(23.439291111)
    return [x, y * math.cos(eps) + z * math.sin(eps), -y * math.sin(eps) + z * math.cos(eps)]


@lru_cache(maxsize=4)
def sky_geometry(utc: str):
    """Real catalog stars and all WWT line figures/boundaries at a selected UTC.

    Catalog directions are treated as distant J2000 sky directions, with no
    stellar proper-motion solution or simulated interstellar parallax.
    """
    timestamp = datetime.fromisoformat(utc.replace("Z", "+00:00"))
    if timestamp.tzinfo is None or not 2000 <= timestamp.year <= 2050:
        raise ValueError("Use a timezone-aware observation time from 2000 through 2050")
    frame = ITRS(obstime=Time(timestamp))

    def directions(points):
        coordinates = SkyCoord(ra=[p[0] for p in points]*u.deg, dec=[p[1] for p in points]*u.deg, frame="icrs")
        return coordinates.transform_to(frame).cartesian.xyz.value.T.tolist()

    result = {"utc": timestamp.isoformat(), "frame": "ITRS",
              "sources": {"figures": ASSETS + "figures.txt", "boundaries": ASSETS + "constellations.txt", "stars": HIPPARCOS_URL}}
    for key, boundary in (("figures", False), ("boundaries", True)):
        paths = constellation_paths(boundary)
        flat = directions([point for path in paths for point in path["points"]])
        offset = 0
        output = []
        for path in paths:
            length = len(path["points"])
            output.append({"id": path["id"], "directions": flat[offset:offset+length]})
            offset += length
        result[key] = output
    stars = bright_stars()
    vectors = directions([[star["ra_deg"], star["dec_deg"]] for star in stars])
    result["stars"] = [{"id": star["id"], "magnitude": star["magnitude"], "direction": direction} for star, direction in zip(stars, vectors)]
    return result


@lru_cache(maxsize=8)
def solar_bodies(utc: str):
    """Earth-referenced apparent body centers in ITRS, metres for Cesium.

    Includes geocentric light time; not an apparent-observation solution for
    arbitrary spacecraft viewpoints. Radii are mean spherical approximations.
    """
    timestamp = datetime.fromisoformat(utc.replace("Z", "+00:00"))
    if timestamp.tzinfo is None or not 2000 <= timestamp.year <= 2050:
        raise ValueError("Use a timezone-aware observation time from 2000 through 2050")
    t = Time(timestamp)
    frame = ITRS(obstime=t)
    bodies = []
    for name in BODIES:
        fixed = [0.0, 0.0, 0.0] if name == "earth" else [float(value) for value in get_body(name, t).transform_to(frame).cartesian.xyz.to_value(u.m)]
        bodies.append({"id": name, "name": name.title(), "radius_m": RADII[name]*1000, "position_m": fixed})
    return {"utc": timestamp.isoformat(), "frame": "ITRS", "model": "Astropy/ERFA; geocentric apparent positions", "bodies": bodies}


def calculate_scene(utc: str, latitude: float, longitude: float, altitude_km: float, ra_deg: float, dec_deg: float, target: str = "sky"):
    timestamp = datetime.fromisoformat(utc.replace("Z", "+00:00"))
    if timestamp.tzinfo is None:
        raise ValueError("Observation time must include a UTC offset")
    timestamp = timestamp.astimezone(timezone.utc)
    if not 2000 <= timestamp.year <= 2050:
        raise ValueError("Prototype supports observation dates from 2000 through 2050")
    t = Time(timestamp)
    location = EarthLocation.from_geodetic(longitude * u.deg, latitude * u.deg, altitude_km * u.km)
    earth = get_body_barycentric("earth", t)
    sun = get_body_barycentric("sun", t)
    # GCRS axes are aligned with ICRS to the accuracy needed by this diagram.
    # This geometric sum deliberately excludes apparent light-time displacement.
    observer_offset, _ = location.get_gcrs_posvel(t)
    camera = earth + observer_offset
    apparent = get_body(target, t, location) if target in BODIES and target != "earth" else SkyCoord(ra=ra_deg*u.deg, dec=dec_deg*u.deg, frame="icrs")
    horizontal = apparent.transform_to(AltAz(obstime=t, location=location, pressure=0*u.hPa))
    bodies = []
    for name in BODIES:
        position = get_body_barycentric(name, t)
        bodies.append({"id": name, "name": name.title(), "radius_km": RADII[name], "heliocentric_ecliptic_km": ecliptic(vector_km(position - sun)), "distance_from_camera_km": float((position-camera).norm().to_value(u.km))})
    icrs_direction = SkyCoord(ra=ra_deg*u.deg, dec=dec_deg*u.deg, frame="icrs").cartesian.xyz.value
    return {
        "utc": timestamp.isoformat(), "model": "Astropy/ERFA built-in ephemeris; geometric map, unrefracted apparent altitude",
        "observer": {"latitude": latitude, "longitude": longitude, "altitude_km": altitude_km,
                     "earth_fixed_km": vector_km(location.get_itrs().cartesian),
                     "earth_relative_inertial_km": vector_km(observer_offset),
                     "barycentric_icrs_km": vector_km(camera),
                     "heliocentric_ecliptic_km": ecliptic(vector_km(camera - sun))},
        "target": {"altitude_deg": float(horizontal.alt.deg), "azimuth_deg": float(horizontal.az.deg),
                   "ra_deg": float(apparent.ra.deg), "dec_deg": float(apparent.dec.deg),
                   "direction_ecliptic": ecliptic(icrs_direction), "above_geometric_horizon": bool(horizontal.alt.deg >= 0)},
        "bodies": bodies,
    }
