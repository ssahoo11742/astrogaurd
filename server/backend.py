from fileinput import filename
from fastapi import FastAPI, HTTPException, params
from pydantic import BaseModel
from typing import Optional
import uvicorn
import json
from datetime import datetime, timedelta
from datetime import datetime
import requests
import numpy as np
from bs4 import BeautifulSoup
import re
import math
import logging
logging.basicConfig(level=logging.INFO)
import rasterio
from rasterio.mask import mask
from shapely.geometry import Point
import geopandas as gpd
from shapely.ops import transform
import pyproj
import os
import requests
import gdown
raster_path = "population.tif"
import requests

import requests

file_id = "1qfU-QP9--UiYUvH8-MurAKGpMESQj4-l"
destination = "population.tif"
url = f"https://drive.google.com/uc?export=download&id={file_id}&confirm=t"

url = f'https://drive.google.com/file/d/{file_id}/view?usp=sharing'
output_path = "population.tif"

gdown.download(url, output_path, quiet=False, fuzzy=True)
print(f"File downloaded to: {output_path}")




# Open raster
raster = rasterio.open("population.tif")


API_KEY_XRAPID = "d6d75d6b87mshf0d57fd9d13aa4ap1e500bjsn56813c7d7156"

app = FastAPI(title="NEO Data API", description="Returns NEO info, orbital data, and impact effects.", version="1.0")
from fastapi.middleware.cors import CORSMiddleware

origins = [
    "http://localhost:3000",  # React dev server
    "http://127.0.0.1:3000",
    "https://astrogaurd.netlify.app/"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------
# Helper functions
# -------------------------

def population(lat, lng):
    params = {
    "center": f"{lng},{lat}",
    "radius": "1000.0",
    "api_key": "demo"
    }
    response = requests.get("https://osm.buntinglabs.com/v1/census/population", params=params)
    response = response.json()


def is_water(lat, lng):
    url = "https://isitwater-com.p.rapidapi.com/"
    headers = {
        "x-rapidapi-host": "isitwater-com.p.rapidapi.com",
        "x-rapidapi-key": API_KEY_XRAPID
    }
    params = {
        "latitude": lat,
        "longitude": lng
    }

    try:
        response = requests.get(url, headers=headers, params=params)
        response.raise_for_status()  # Raise error if bad response
        data = response.json()
        return data.get("water", False)  # API returns { "water": true/false }
    except Exception as e:
        print("Error checking water:", e)
        return False



def safe_factorization(cov_matrix: np.ndarray):
    try:
        return np.linalg.cholesky(cov_matrix).tolist()
    except Exception:
        eigvals, eigvecs = np.linalg.eigh(cov_matrix)
        eigvals = np.clip(eigvals, 0, None)
        L = eigvecs @ np.diag(np.sqrt(eigvals))
        return L.tolist()


def get_spk_id(pdes: str):
    """Convert primary designation to SPK-ID format"""
    return (f"{2 if pdes[0] != '2' else ''}{('0' * (7 - len(pdes) - 1))}{pdes}")


def fetch_neo_data(neo_id: str, spk_id):
    """Fetches NEO info from NASA APIs and computes covariance factorization"""
    try:
        # JPL SBDB API
        sbdb_url = f"https://ssd-api.jpl.nasa.gov/sbdb.api?spk={spk_id}&cov=mat&ca-data=true&phys-par=true"
        sbdb_res = requests.get(sbdb_url)
        sbdb_res.raise_for_status()
        sbdb_data = sbdb_res.json()

        # JPL Sentry API
        sen_url = f"https://ssd-api.jpl.nasa.gov/sentry.api?spk={spk_id}"
        sen_res = requests.get(sen_url)
        sen_res.raise_for_status()
        sen_data = sen_res.json()

        # Covariance factorization
        cov_matrix, L_matrix = None, None
        try:
            cov_data = sbdb_data.get("orbit", {}).get("covariance", {}).get("data")
            if cov_data:
                cov_matrix = np.array([[float(x) for x in row] for row in cov_data])
                L_matrix = safe_factorization(cov_matrix)
        except Exception as e:
            print(f"⚠️ Could not factorize covariance for {neo_id}: {e}")
        obj = sbdb_data.get("object", {})
        phys = {p["name"]: p for p in sbdb_data.get("phys_par", [])}
        ca_data = sbdb_data.get("ca_data", [])
        formatted = {
        "id": obj.get("spkid"),
        "name": obj.get("fullname"),
        "designation": obj.get("des"),
        "is_potentially_hazardous_asteroid": obj.get("pha"),
        "absolute_magnitude_h": phys.get("H", {}).get("value"),
        "estimated_diameter_km": {
            "kilometers": phys.get("diameter", {}).get("value")
        },
        "nasa_jpl_url": None,  # SBDB API doesn't provide this directly
        "close_approaches": [
            {
                "close_approach_date": ca.get("cd"),
                "close_approach_date_full": None,  # SBDB doesn't provide full string
                "relative_velocity": {
                    "kilometers_per_second": ca.get("v_rel")
                },
                "miss_distance": {
                    "kilometers": float(ca.get("dist", 0)) * 149597870.7  # AU → km
                },
                "orbiting_body": ca.get("body")
            }
            for ca in ca_data
        ],
            "orbital_data": sbdb_data.get("orbit", {}),
            "physical_data": sbdb_data.get("phys_par", {}),
            "sentry_data": sen_data,
            "covariance_matrix": cov_matrix.tolist() if cov_matrix is not None else None,
            "L_matrix": L_matrix
        }
        return formatted
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching NEO data: {e}")


# -------------------------
# Impact Effects functions
# -------------------------

def calculate_impact_energy(diameter_m, density_kg_m3, velocity_m_s, loss):
    """Compute kinetic energy in Joules"""
    radius_m = diameter_m / 2
    volume_m3 = (4/3) * math.pi * radius_m**3
    mass_kg = volume_m3 * density_kg_m3
    energy_joules = 0.5 * mass_kg * velocity_m_s**2
    energy_joules -= loss
    return energy_joules

def estimate_richter_magnitude(impact_energy_joules):
    """
    Convert impact energy (in Joules) to equivalent earthquake magnitude.
    Formula: M = (2/3) * log10(E) - 3.2
    """
    if impact_energy_joules <= 0:
        return 0
    magnitude = (2/3) * math.log10(impact_energy_joules) - 3.2
    return round(magnitude, 2)

import math

def estimate_tsunami_amplitude(mass_kg, velocity_m_s, diameter_m, water_depth_m=4000, distance_km=100):
    """
    Roughly estimate tsunami wave amplitude from asteroid impact.
    Returns amplitude in meters at given distance.
    """

    # Impact energy (Joules)
    E = 0.5 * mass_kg * velocity_m_s**2

    # Approximate transient crater diameter (m) in water
    # scaling from Schmidt & Housen (1987) style relations
    rho_w = 1000  # water density
    g = 9.8
    D_c = 1.8 * ((E / (rho_w * g)) ** 0.25)

    # Initial wave amplitude near source (half crater depth)
    A0 = D_c / 2.0

    # Decay with distance (cylindrical wave spread)
    r0 = D_c
    r = distance_km * 1000
    A_r = A0 * math.sqrt(r0 / r)

    return max(A_r, 0.01)  # avoid zero

def estimate_tsunami_radius(
    tsunami_data: dict,
    diameter_m: float,
    density_kg_m3: float,
    velocity_m_s: float,
    water_depth_m: float = 4000,
    distance_km: float = 100
) -> float:
    """
    Estimate tsunami affected radius from impact site.
    - Uses provided max wave amplitude if available
    - Falls back to decay curve otherwise
    """
    
    print("Tsunami data:", tsunami_data)
    wave_amp = None

    # Try to read from API
    if tsunami_data and "wave_amplitude_max_m" in tsunami_data:
        wave_amp = tsunami_data.get("wave_amplitude_max_m") or tsunami_data.get("wave_amplitude_min_m")

    # If no data from API, fall back to physics-based estimate
    if wave_amp is None or wave_amp <= 0:
        mass = (4/3) * math.pi * (diameter_m/2)**3 * density_kg_m3
        wave_amp = estimate_tsunami_amplitude(
            mass_kg=mass,
            velocity_m_s=velocity_m_s,
            diameter_m=diameter_m,
            water_depth_m=water_depth_m,
            distance_km=distance_km
        )

    # Very rough scaling: assume 100 km per 10 m wave
    tsunami_radius_km = wave_amp * 10
    return tsunami_radius_km



def population_in_circle(raster_path, lon, lat, radius_km, density=False):
    
    """
    Calculate population inside a circle for a raster (handles projected CRS).
    Works with GHSL population rasters.

    Parameters
    ----------
    raster_path : str : path to GeoTIFF
    lon, lat : float : WGS84 coords of circle center
    radius_km : float : radius in kilometers
    density : bool : True if raster stores density/km², False if population counts
    """
    raster = rasterio.open(raster_path)

    # Transform lon/lat -> raster CRS
    proj_wgs84 = pyproj.CRS("EPSG:4326")
    proj_raster = raster.crs
    transformer = pyproj.Transformer.from_crs(proj_wgs84, proj_raster, always_xy=True).transform

    point_proj = transform(transformer, Point(lon, lat))
    circle = point_proj.buffer(radius_km * 1000)  # radius in meters

    # Mask raster with circle
    out_image, out_transform = mask(raster, [circle.__geo_interface__], crop=True)
    out_image = out_image[0]

    # Filter out nodata
    nodata = raster.nodata
    if nodata is not None:
        data = out_image[out_image != nodata]
    else:
        data = out_image

    if data.size == 0:
        return 0.0

    if density:
        # pixel area in km² (since raster is projected in meters)
        pixel_area = abs(raster.transform.a * raster.transform.e) / 1e6
        total_population = np.sum(data * pixel_area)
    else:
        # already counts per pixel
        total_population = np.sum(data)

    return float(total_population)

def raw_impact_effects(diameter, density, velocity, angle, distance, water):
    # velocity = 200
    # diameter *= 20
    density = int(density)
    url = f"https://impact.ese.ic.ac.uk/ImpactEarth/cgi-bin/crater.cgi?dist={distance}&distanceUnits=1&diam={diameter}&diameterUnits=1&pdens={density}&pdens_select=0&vel={velocity}&velocityUnits=1&theta={angle}&tdens={1000 if water else 5515}&wdepth=9000&wdepthUnits=1"
    print(url)
    response = requests.get(url)
    html_content = response.text
    soup = BeautifulSoup(html_content, "html.parser")


    def extract_numbers(text):
        return re.findall(r"[-+]?\d*\.\d+|\d+|[-+]?\d+\s*x\s*10\^?\d*", text)

    data = {}
    for dl in soup.find_all("dl"):
        dt = dl.find("dt")
        if dt and dt.h2:
            section_title = dt.h2.get_text(strip=True)
            section_title = re.sub(r'[:\d].*$', '', section_title).strip()
            data[section_title] = {}
            for dd in dl.find_all("dd"):
                text = dd.get_text(" ", strip=True)
                clean_text = re.sub(r'\d+(\.\d+)?([eE][-+]?\d+)?', '', text).strip()
                clean_text = re.sub(r'\s+', ' ', clean_text)
                numbers = extract_numbers(text)
                if numbers:
                    key = clean_text if clean_text else "Data"
                    data[section_title][key] = numbers
    return data

def postprocessing(data, water=False):

    # Remove inputs if present
    data.pop("Your Inputs", None)
    data.pop("Major Global Changes", None)
    

    # --- Energy ---
    if "Energy" in data and data["Energy"]:
        energy_key = next(iter(data["Energy"]))
        energy_entry = data["Energy"][energy_key]
        new_energy = {}
        try: new_energy["entry_energy_J"] = float(energy_entry[0]) * float(energy_entry[1])**float(energy_entry[2])
        except Exception: pass
        try: new_energy["entry_energy_mt"] = float(energy_entry[3]) * float(energy_entry[4])**float(energy_entry[5])
        except Exception: pass
        try: new_energy["interval"] = float(energy_entry[7]) * float(energy_entry[8])**float(energy_entry[9])
        except Exception: pass
        data["Energy"] = new_energy

    # --- Atmospheric Entry ---
    if "Atmospheric Entry" in data and data["Atmospheric Entry"]:
        athmo_key = next(iter(data["Atmospheric Entry"]))
        athmo = data["Atmospheric Entry"][athmo_key]
        new_athmo = {}
        try: new_athmo["breakup_altitude_m"] = float(athmo[0])
        except Exception: pass
        try: new_athmo["breakup_altitude_ft"] = float(athmo[1])
        except Exception: pass
        try: new_athmo["ground_velocity_km_s"] = float(athmo[2])
        except Exception: pass
        try: new_athmo["ground_velocity_miles_s"] = float(athmo[3])
        except Exception: pass
        try: new_athmo["energy_lost_J"] = float(athmo[4]) * float(athmo[5])**float(athmo[6])
        except Exception: pass
        try: new_athmo["energy_lost_mt"] = float(athmo[7]) * float(athmo[8])**float(athmo[9])
        except Exception: pass
        try: new_athmo["impact_energy_J"] = float(athmo[10]) * float(athmo[11])**float(athmo[12])
        except Exception: pass
        try: new_athmo["impact_energy_mt"] = float(athmo[13]) * float(athmo[14])**float(athmo[15])
        except Exception: pass
        try: new_athmo["ellipse_km"] = float(athmo[16])
        except Exception: pass
        try: new_athmo["ellipse_km2"] = float(athmo[17])
        except Exception: pass
        data["Atmospheric_Entry"] = new_athmo

    # --- Crater Dimensions ---
    if "Crater Dimensions" in data and data["Crater Dimensions"]:
        crat_key = next(iter(data["Crater Dimensions"]))
        crat = data["Crater Dimensions"][crat_key]
        new_crat = {}
        if water:
            try: new_crat["ocean_crater_diameter_km"] = float(crat[0])
            except Exception: pass
            try: new_crat["ocean_crater_diameter_miles"] = float(crat[1])
            except Exception: pass
            try: new_crat["transient_crater_diameter_km"] = float(crat[2])
            except Exception: pass
            try: new_crat["transient_crater_diameter_mi"] = float(crat[3])
            except Exception: pass
            try: new_crat["transient_crater_depth_km"] = float(crat[4])
            except Exception: pass
            try: new_crat["transient_crater_depth_mi"] = float(crat[5])
            except Exception: pass
            try: new_crat["final_crater_diameter_km"] = float(crat[6])
            except Exception: pass
            try: new_crat["final_crater_diameter_mi"] = float(crat[7])
            except Exception: pass
            try: new_crat["final_crater_depth_m"] = float(crat[8])
            except Exception: pass
            try: new_crat["final_crater_depth_ft"] = float(crat[9])
            except Exception: pass
            if len(crat) == 14:
                try: new_crat["melted_volume_m3"] = float(crat[10])
                except Exception: pass
                try: new_crat["melted_volume_ft3"] = float(crat[12])
                except Exception: pass
            else:
                try: new_crat["breccia_thickness_m"] = float(crat[10])
                except Exception: pass
                try: new_crat["breccia_thickness_ft"] = float(crat[11])
                except Exception: pass
                try: new_crat["melted_volume_m3"] = float(crat[12])
                except Exception: pass
                try: new_crat["melted_volume_ft3"] = float(crat[14])
                except Exception: pass
        else:
            try: new_crat["transient_crater_diameter_m"] = float(crat[0])
            except Exception: pass
            try: new_crat["transient_crater_diameter_ft"] = float(crat[1])
            except Exception: pass
            try: new_crat["transient_crater_depth_m"] = float(crat[2])
            except Exception: pass
            try: new_crat["transient_crater_depth_ft"] = float(crat[3])
            except Exception: pass
            try: new_crat["final_crater_diameter_m"] = float(crat[4])
            except Exception: pass
            try: new_crat["final_crater_diameter_ft"] = float(crat[5])
            except Exception: pass
            try: new_crat["final_crater_depth_m"] = float(crat[6])
            except Exception: pass
            try: new_crat["final_crater_depth_ft"] = float(crat[7])
            except Exception: pass
            try: new_crat["melted_volume_km3"] = float(crat[8])
            except Exception: pass
            try: new_crat["melted_volume_mi3"] = float(crat[10])
            except Exception: pass
        data["Crater_Dimensions"] = new_crat

    # --- Thermal Radiation ---
    if "Thermal Radiation" in data and data["Thermal Radiation"]:
        rad_key = next(iter(data["Thermal Radiation"]))
        rad = data["Thermal Radiation"][rad_key]
        new_rad = {}
        try: new_rad["time_max_radiation_ms"] = float(rad[0])
        except Exception: pass
        try: new_rad["fireball_radius_km"] = float(rad[1])
        except Exception: pass
        try: new_rad["fireball_radius_miles"] = float(rad[2])
        except Exception: pass
        try: new_rad["fireball_sun_times"] = float(rad[3])
        except Exception: pass
        try: new_rad["thermal_exposure_J_m2"] = float(rad[4]) * float(rad[5])**float(rad[6])
        except Exception: pass
        try: new_rad["duration_irradiation_min"] = float(rad[8])
        except Exception: pass
        try: new_rad["radiant_flux_sun_times"] = float(rad[9])
        except Exception: pass
        data["Thermal_Radiation"] = new_rad

    # --- Seismic Effects ---
    if "Seismic Effects" in data and data["Seismic Effects"]:
        seis_key = next(iter(data["Seismic Effects"]))
        seis = data["Seismic Effects"][seis_key]
        new_seis = {}
        try: new_seis["arrival_time_m"] = float(seis[0])
        except Exception: pass
        try: new_seis["thickness_cm"] = float(seis[1])
        except Exception: pass
        try: new_seis["thickness_in"] = float(seis[2])
        except Exception: pass
        try: new_seis["diameter_cm"] = float(seis[1])
        except Exception: pass
        try: new_seis["diameter_in"] = float(seis[2])
        except Exception: pass
        data["Seismic_Effects"] = new_seis

    # --- Ejecta ---
    if "Ejecta" in data and data["Ejecta"]:
        ejecta_key = next(iter(data["Ejecta"]))
        ejecta = data["Ejecta"][ejecta_key]
        new_ejecta = {}
        try: new_ejecta["arrival_time_min"] = float(ejecta[0])
        except Exception: pass
        try: new_ejecta["ejecta_thickness_m"] = float(ejecta[1])
        except Exception: pass
        try: new_ejecta["ejecta_thickness_ft"] = float(ejecta[2])
        except Exception: pass
        data["Ejecta"] = new_ejecta

    # --- Air Blast ---
    if "Air Blast" in data and data["Air Blast"]:
        airblast_key = next(iter(data["Air Blast"]))
        airblast = data["Air Blast"][airblast_key]
        new_airblast = {}
        try: new_airblast["arrival_time_s"] = float(airblast[0])
        except Exception: pass
        try: new_airblast["peak_overpressure_Pa"] = float(airblast[1])
        except Exception: pass
        try: new_airblast["peak_overpressure_bars"] = float(airblast[2])
        except Exception: pass
        try: new_airblast["peak_overpressure_psi"] = float(airblast[3])
        except Exception: pass
        try: new_airblast["max_wind_velocity_m_s"] = float(airblast[4])
        except Exception: pass
        try: new_airblast["max_wind_velocity_mph"] = float(airblast[5])
        except Exception: pass
        try: new_airblast["sound_intensity_dB"] = float(airblast[6])
        except Exception: pass
        data["Air_Blast"] = new_airblast

    # --- Tsunami Wave ---
    if "Tsunami Wave" in data and data["Tsunami Wave"]:
        tsu_key = next(iter(data["Tsunami Wave"]))
        tsu = data["Tsunami Wave"][tsu_key]
        new_tsu = {}
        try: new_tsu["arrival_time_min"] = float(tsu[0])
        except Exception: pass
        try: new_tsu["wave_amplitude_min_m"] = float(tsu[1])
        except Exception: pass
        try: new_tsu["wave_amplitude_min_ft"] = float(tsu[2])
        except Exception: pass
        try:
            new_tsu["wave_amplitude_max_m"] = float(tsu[3])
        except Exception: pass
        try:
            new_tsu["wave_amplitude_max_ft"] = float(tsu[4])
        except Exception: pass
        data["Tsunami_Wave"] = new_tsu

def fetch_impact_data(diameter, density, velocity, angle, distance, water):
    print("HERHEHRE")
    raw_data = raw_impact_effects(diameter, density, velocity, angle, distance, water)
    postprocessing(raw_data, water)
    return raw_data

def get_next_close_approach(close_approaches, ref_date=None):
    if ref_date is None:
        ref_date = datetime.utcnow()
    future_approaches = []
    for ca in close_approaches:
        try:
            ca_date = datetime.strptime(ca["date"], "%Y-%m-%d")
            if ca_date > ref_date:
                future_approaches.append((ca_date, ca))
        except (KeyError, ValueError):
            continue
    if not future_approaches:
        return None
    return min(future_approaches, key=lambda x: x[0])[1]


# -------------------------
# FastAPI Endpoint
# -------------------------

class NEORequest(BaseModel):
    pdes: str
    spk: str

class ImpactEffectsRequest(BaseModel):
    coords: list[float]
    diameter_m: float
    density_kg_m3: float
    velocity_m_s: float
    energy_loss: float
    tsunami_data: Optional[dict] = {}

@app.post("/impact_effects")
def impact_effects(req: ImpactEffectsRequest):
    print(req)
    coords = req.coords
    water = is_water(coords[0], coords[1])

    pop = population_in_circle(
        "population.tif",
        lon=coords[1],
        lat=coords[0],
        radius_km=1600,
        density=False
    )

    energy_joules = calculate_impact_energy(
        req.diameter_m,
        req.density_kg_m3,
        req.velocity_m_s,
        req.energy_loss
    )
    magnitude = estimate_richter_magnitude(energy_joules)

    # Full impact dataset (includes tsunami section)


    tsunami_data = req.tsunami_data
    tsunami_radius_km = estimate_tsunami_radius(
        tsunami_data,
        diameter_m=req.diameter_m,
        density_kg_m3=req.density_kg_m3,
        velocity_m_s=req.velocity_m_s
    )

    return {
        "water": water,
        "population": pop,
        "impact_energy_joules": energy_joules,
        "richter_magnitude": magnitude,
        "tsunami": {
            "radius_km": tsunami_radius_km,
            "wave_data": tsunami_data
        },
        "water_impact": fetch_impact_data(diameter=req.diameter_m, density=req.density_kg_m3, velocity=int(req.velocity_m_s)/1000, angle=45, distance=100, water=True),
        "land_impact": fetch_impact_data(diameter=req.diameter_m, density=req.density_kg_m3, velocity=int(req.velocity_m_s)/1000, angle=45, distance=100, water=False)
    }

@app.get("/live_neo_data")
def get_live_neo_data():
    """
    Fetch live NEO data from NASA NeoWs API for the next 7 days
    Returns a list of NEOs with their close approach information
    """
    try:
        # Get today's date and 7 days from now
        today = datetime.utcnow()
        end_date = today + timedelta(days=7)
        
        # Format dates for NASA API (YYYY-MM-DD)
        start_str = today.strftime("%Y-%m-%d")
        end_str = end_date.strftime("%Y-%m-%d")
        
        # NASA NeoWs API endpoint
        nasa_api_key = "252F1f7Afrvp8JqJT5oZcQUzYsqkcnqLiaIede7s"  # Replace with your actual NASA API key for production
        url = f"https://api.nasa.gov/neo/rest/v1/feed?start_date={start_str}&end_date={end_str}&api_key={nasa_api_key}"
        
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()
        
        # Parse and format NEO data
        formatted_neos = []
        
        # NASA returns NEOs grouped by date
        for date, neo_list in data.get("near_earth_objects", {}).items():
            for neo in neo_list:
                # Get the closest approach for this NEO
                close_approaches = neo.get("close_approach_data", [])
                if not close_approaches:
                    continue
                
                # Sort by date to get the next approach
                close_approaches.sort(key=lambda x: x.get("close_approach_date", ""))
                next_approach = close_approaches[0]
                
                # Extract diameter range
                diameter_data = neo.get("estimated_diameter", {}).get("meters", {})
                diameter_min = round(diameter_data.get("estimated_diameter_min", 0), 2)
                diameter_max = round(diameter_data.get("estimated_diameter_max", 0), 2)
                
                # Extract velocity and distance
                velocity_kms = round(float(next_approach.get("relative_velocity", {}).get("kilometers_per_second", 0)), 2)
                distance_au = round(float(next_approach.get("miss_distance", {}).get("astronomical", 0)), 4)
                
                formatted_neos.append({
                    "name": neo.get("name", "Unknown"),
                    "id": neo.get("id", ""),
                    "hazardous": neo.get("is_potentially_hazardous_asteroid", False),
                    "next_approach": next_approach.get("close_approach_date", "Unknown"),
                    "diameter_min_m": diameter_min,
                    "diameter_max_m": diameter_max,
                    "distance_au": distance_au,
                    "velocity_kms": velocity_kms,
                    "absolute_magnitude": neo.get("absolute_magnitude_h", 0)
                })
        
        # Sort by next approach date
        formatted_neos.sort(key=lambda x: x["next_approach"])
        
        # Limit to first 10 NEOs for display
        return formatted_neos[:6]
        
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Error fetching NASA data: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing NEO data: {str(e)}")
    

@app.post("/neo")
def get_neo_info(req: NEORequest):
    logging.info(f"Request body: {req}")
    neo_id = get_spk_id(req.pdes)
    spk_id = req.spk
    logging.info(f"Calling fetch_neo_data with neo_id={neo_id}, spk_id={spk_id}")
    
    try:
        data = fetch_neo_data(neo_id, spk_id)
    except Exception as e:
        print("❌ fetch_neo_data error:", e)   # will show in your console
        raise HTTPException(status_code=500, detail=f"Error fetching NEO data: {str(e)}")
    # Estimate diameter (m)
    diameter = float(data["estimated_diameter_km"]["kilometers"]) if data["estimated_diameter_km"]["kilometers"] else 0.1



    # Estimate density
    mass = data.get("sentry_data", {}).get("summary", {}).get("mass")
    density = 3000
    if mass:
        radius_m = diameter / 2
        volume = (4/3) * math.pi * radius_m**3
        density = int(math.floor(float(mass) / volume))

    # Impact velocity
    next_ca = get_next_close_approach(data["close_approaches"])
    impact_velocity = round(float(next_ca["velocity_km_s"]), 4) if next_ca else 20


    data["impact_effects"] = {
        "water_impact": fetch_impact_data(diameter=diameter, density=density, velocity=impact_velocity, angle=45, distance=100, water=True),
        "land_impact": fetch_impact_data(diameter=diameter, density=density, velocity=impact_velocity, angle=45, distance=100, water=False)
    }

    return data

# -------------------------
# Run server
# -------------------------
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)



