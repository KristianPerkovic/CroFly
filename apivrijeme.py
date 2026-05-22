import requests

def dohvati_vrijeme(grad):
    # Open-Meteo koristi obične koordinate
    lokacije = {
        'zagreb': [45.81, 15.97], 'split': [43.50, 16.44], 'rijeka': [45.32, 14.44],
        'osijek': [45.55, 18.67], 'zadar': [44.11, 15.23], 'dubrovnik': [42.64, 18.10], 'pula': [44.86, 13.84]
    }

    coords = lokacije.get(grad.lower())
    if not coords: 
        return {"temperatura": "N/A", "vjetar": "N/A"}

    # Gađamo API i tražimo trenutno vrijeme (current_weather=true)
    url = f"https://api.open-meteo.com/v1/forecast?latitude={coords[0]}&longitude={coords[1]}&current_weather=true"

    try:
        r = requests.get(url, timeout=5)
        data = r.json()
        
        trenutno = data.get('current_weather', {})
        temp = trenutno.get('temperature', 'N/A')
        vjetar = trenutno.get('windspeed', 'N/A')
        
        return {
            "temperatura": f"{temp} °C",
            "vjetar": f"{vjetar} km/h"
        }
    except Exception as e:
        print("Greška kod prognoze:", e)
        return {"temperatura": "Nedostupno", "vjetar": "Nedostupno"}