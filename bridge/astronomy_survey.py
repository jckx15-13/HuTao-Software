"""WWT TOAST overview geometry. Projection math stays in Python.

Root layout follows the MIT-licensed WWT WebGL engine ToastTile and Triangle
implementations: https://github.com/WorldWideTelescope/wwt-webgl-engine
This overview uses the online DSS level-zero tile, not a complete zoom pyramid.
"""
from functools import lru_cache
from datetime import datetime
from urllib.request import urlopen
import math
import astropy.units as u
from astropy.coordinates import SkyCoord, ITRS
from astropy.time import Time

DSS_ROOT = "https://cdn.worldwidetelescope.org/wwtweb/dss.aspx?q=0,0,0"


@lru_cache(maxsize=1)
def survey_image():
    with urlopen(DSS_ROOT, timeout=20) as response:
        data = response.read(2_000_001)
    if len(data) > 2_000_000 or not data.startswith(b"\x89PNG\r\n\x1a\n"):
        raise ValueError("Unexpected DSS overview image response")
    return data


@lru_cache(maxsize=4)
def survey_mesh(utc: str):
    timestamp = datetime.fromisoformat(utc.replace("Z", "+00:00"))
    if timestamp.tzinfo is None or not 2000 <= timestamp.year <= 2050:
        raise ValueError("Use a timezone-aware observation time from 2000 through 2050")
    # WWT uses Y as celestial north and Z for RA=6h. UVs start at top-left.
    vertices = [(0,-1,0,0,0),(0,0,1,.5,0),(0,-1,0,1,0),
                (-1,0,0,0,.5),(0,1,0,.5,.5),(1,0,0,1,.5),
                (0,-1,0,0,1),(0,0,-1,.5,1),(0,-1,0,1,1)]
    triangles = [(3,1,0),(4,1,3),(5,2,1),(4,5,1),(7,4,3),(6,7,3),(7,5,4),(8,5,7)]
    for _ in range(4):
        next_triangles = []
        midpoint_cache = {}
        def midpoint(i, j):
            key = tuple(sorted((i,j)))
            if key not in midpoint_cache:
                a, b = vertices[i], vertices[j]
                xyz = [(a[k]+b[k])/2 for k in range(3)]
                length = math.sqrt(sum(v*v for v in xyz))
                midpoint_cache[key] = len(vertices)
                vertices.append((*[v/length for v in xyz], (a[3]+b[3])/2, (a[4]+b[4])/2))
            return midpoint_cache[key]
        for a,b,c in triangles:
            ab,bc,ca = midpoint(a,b),midpoint(b,c),midpoint(c,a)
            next_triangles.extend(((a,ab,ca),(b,bc,ab),(c,ca,bc),(bc,ca,ab)))
        triangles = next_triangles
    coordinates = SkyCoord(ra=[math.atan2(v[2],v[0]) for v in vertices]*u.rad,
                           dec=[math.asin(v[1]) for v in vertices]*u.rad, frame="icrs")
    directions = coordinates.transform_to(ITRS(obstime=Time(timestamp))).cartesian.xyz.value.T.tolist()
    return {"directions": directions, "uv": [[v[3],1-v[4]] for v in vertices],
            "indices": [i for triangle in triangles for i in triangle], "source": DSS_ROOT,
            "level": 0, "description": "DSS color all-sky overview; 256 × 256 TOAST tile"}
