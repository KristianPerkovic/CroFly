import requests

# Tvoj ORS ključ za udaljenosti
ORS_KEY = "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6Ijk5ZTk2NGVmODNiZjRlNWJhMDhmNTkyNmM1MTc5MTMxIiwiaCI6Im11cm11cjY0In0"

def dohvati_sve_o_prijevozu(grad):
    # Definiramo koordinate [lat, lon] za Start (Aerodrom) i End (Centar grada)
    lokacije = {
        'zagreb': {"start": [45.74, 16.06], "end": [45.81, 15.97]},
        'split': {"start": [43.53, 16.29], "end": [43.50, 16.44]},
        'rijeka': {"start": [45.21, 14.57], "end": [45.32, 14.44]},
        'pula': {"start": [44.89, 13.92], "end": [44.86, 13.84]}
    }

    info = lokacije.get(grad.lower())
    if not info: return {"linija": "Nepoznato", "udaljenost": "N/A"}

    # --- 1. DOHVAT LINIJE (Overpass API) ---
    overpass_url = "http://overpass-api.de/api/interpreter"
    query = f"""
    [out:json];
    (node(around:1000, {info['start'][0]}, {info['start'][1]})["route"="bus"];
     way(around:1000, {info['start'][0]}, {info['start'][1]})["route"="bus"];
     relation(around:1000, {info['start'][0]}, {info['start'][1]})["route"="bus"];);
    out tags;
    """
    
    linija = "Shuttle Bus"
    try:
        r_ov = requests.post(overpass_url, data={'data': query})
        res = r_ov.json()
        if 'elements' in res:
            found = [el['tags'].get('ref') or el['tags'].get('name') for el in res['elements'] if 'tags' in el]
            if found: linija = found[0]
    except: pass

    # --- 2. DOHVAT RUTE (OpenRouteService) ---
    # PAZI: ORS koristi [lon, lat] redoslijed!
    dir_url = f"https://api.openrouteservice.org/v2/directions/driving-car"
    params = {
        "api_key": ORS_KEY,
        "start": f"{info['start'][1]},{info['start'][0]}",
        "end": f"{info['end'][1]},{info['end'][0]}"
    }
    
    try:
        r_dir = requests.get(dir_url, params=params)
        dist_data = r_dir.json()
        summary = dist_data['features'][0]['properties']['summary']
        udaljenost = f"{round(summary['distance'] / 1000, 1)} km"
        trajanje = f"{round(summary['duration'] / 60)} min"
    except:
        udaljenost, trajanje = "N/A", "N/A"

    return {
        "linija": f"Linija {linija}",
        "putanja": f"Do centra: {udaljenost}",
        "vrijeme": f"Vrijeme: {trajanje}"
    }