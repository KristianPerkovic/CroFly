from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
import requests
from apiprijevoz import dohvati_javni_prijevoz
from apivrijeme import dohvati_vrijeme

app = Flask(__name__)
CORS(app)  # Dopušta pregledniku da poziva ovaj Flask API s lokalne HTML stranice

API_KEY = "62a8d06a-c03e-4228-ba9f-eeb81f44f318"
@app.route('/')
@app.route('/letovi')
def index():
    from flask import send_from_directory
    return send_from_directory('.', 'letovi.html')
@app.route('/api/raspored/<grad>')
def api_raspored(grad):
    iata_kodovi = {
        'zagreb': 'ZAG', 'split': 'SPU', 'dubrovnik': 'DBV',
        'zadar': 'ZAD', 'pula': 'PUY', 'rijeka': 'RJK', 'osijek': 'OSI'
    }
    
    iata = iata_kodovi.get(grad.lower())
    if not iata:
        return jsonify({"odlasci": []})

    url = f"https://airlabs.co/api/v9/schedules?dep_iata={iata}&api_key={API_KEY}"

    try:
        r = requests.get(url)
        data = r.json()
        sirovi_letovi = data.get('response', [])
        
        odlasci_cisto = []
        for let in sirovi_letovi[:10]:
            vrijeme_raw = let.get('dep_time', '00:00 00:00')
            vrijeme = vrijeme_raw.split(' ')[1] if ' ' in vrijeme_raw else '00:00'
            odlasci_cisto.append({
                "broj": let.get('flight_iata', 'N/A'),
                "vrijeme": vrijeme,
                "odrediste": let.get('arr_iata', '???')
            })
        return jsonify({"odlasci": odlasci_cisto})
    except:
        return jsonify({"odlasci": []})
@app.route('/<path:filename>')
def custom_static(filename):
    from flask import send_from_directory
    return send_from_directory('.', filename)
@app.route('/api/prijevoz/<grad>')
def api_prijevoz(grad):
    podaci = dohvati_javni_prijevoz(grad)
    return jsonify(podaci)

@app.route('/api/prognoza/<grad>')
def api_prognoza(grad):
    # Vraća vremenske podatke za traženi grad u JSON obliku
    return jsonify(dohvati_vrijeme(grad))

if __name__ == '__main__':
    # Aplikacija se pokreće na http://127.0.0.1:5000
    app.run(debug=True, port=5000)