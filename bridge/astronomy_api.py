"""Run: python -m uvicorn bridge.astronomy_api:app --host 127.0.0.1 --port 8011."""
import os
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from .astronomy_survey import survey_image, survey_mesh
from .astronomy_physics import calculate_scene, constellations, sky_regions, sky_geometry, solar_bodies, CATALOG_URL

app = FastAPI(title="Silver Wolf Observatory", docs_url=None, redoc_url=None)
allowed_origins = [origin.strip() for origin in os.getenv(
    "ASTRONOMY_CORS_ORIGINS", "http://localhost:3005,http://127.0.0.1:3005"
).split(",") if origin.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,
    allow_methods=["GET"],
    allow_headers=[],
)


@app.get("/api/astronomy/survey-image")
def image():
    try:
        return Response(survey_image(), media_type="image/png", headers={"Cache-Control": "public, max-age=3600"})
    except Exception as exc:
        raise HTTPException(502, "Online DSS overview image unavailable") from exc


@app.get("/api/astronomy/survey-mesh")
def mesh(utc: str):
    try:
        return survey_mesh(utc)
    except ValueError as exc:
        raise HTTPException(422, str(exc)) from exc


@app.get("/api/astronomy/bodies")
def bodies(utc: str):
    try:
        return solar_bodies(utc)
    except ValueError as exc:
        raise HTTPException(422, str(exc)) from exc


@app.get("/api/astronomy/sky-geometry")
def geometry(utc: str):
    try:
        return sky_geometry(utc)
    except ValueError as exc:
        raise HTTPException(422, str(exc)) from exc
    except Exception as exc:
        raise HTTPException(502, "Online WWT geometry catalog unavailable; retry when connected") from exc


@app.get("/api/astronomy/sky")
def sky(utc: str):
    try:
        return sky_regions(utc)
    except ValueError as exc:
        raise HTTPException(422, str(exc)) from exc
    except Exception as exc:
        raise HTTPException(502, "Sky catalog or coordinate service unavailable") from exc


@app.get("/api/astronomy/constellations")
def catalog():
    try:
        return {"source": CATALOG_URL, "constellations": constellations()}
    except Exception as exc:
        raise HTTPException(502, "WWT constellation catalog is unavailable; retry when connected") from exc


@app.get("/api/astronomy/scene")
def scene(utc: str, latitude: float = Query(1.3521, ge=-90, le=90), longitude: float = Query(103.8198, ge=-180, le=180), altitude_km: float = Query(0, ge=0, le=1000000), ra_deg: float = Query(83.6475, ge=0, lt=360), dec_deg: float = Query(5.949, ge=-90, le=90), target: str = "sky"):
    try:
        return calculate_scene(utc, latitude, longitude, altitude_km, ra_deg, dec_deg, target)
    except ValueError as exc:
        raise HTTPException(422, str(exc)) from exc
