from flask import Flask, jsonify
from flask_cors import CORS
import requests

app = Flask(__name__)
CORS(app) # Ovo je ključno da browser dopusti povezivanje

def dohvati_vrijeme(grad):
    lokacije = {
        'zagreb': [45.81, 15.97], 'split': [43.50, 16.44], 'rijeka': [45.32, 14.44],
        'osijek': [45.55, 18.67], 'zadar': [44.11, 15.23], 'dubrovnik': [42.64, 18.10], 'pula': [44.86, 13.84]
    }
    coords = lokacije.get(grad.lower())
    if not coords: 
        return {"temperatura": "N/A", "vjetar": "N/A"}

    url = f"https://api.open-meteo.com/v1/forecast?latitude={coords[0]}&longitude={coords[1]}&current_weather=true"
    try:
        r = requests.get(url, timeout=5)
        data = r.json()
        trenutno = data.get('current_weather', {})
        return {
            "temperatura": f"{trenutno.get('temperature', 'N/A')}°C", 
            "vjetar": f"{trenutno.get('windspeed', 'N/A')} km/h"
        }
    except:
        return {"temperatura": "Greška", "vjetar": "Greška"}