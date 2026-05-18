// Čekamo da se cijeli DOM učita prije izvršavanja bilo kakve logike
document.addEventListener('DOMContentLoaded', () => {
    
    /* ==========================================================================
       1. DARK MODE LOGIKA
       ========================================================================== */
    const themeToggle = document.getElementById('theme-toggle');
    const htmlElement = document.documentElement;

    // Provjera postoji li spremljena tema u localStorageu
    const currentTheme = localStorage.getItem('theme');

    if (currentTheme) {
        htmlElement.setAttribute('data-theme', currentTheme);
        updateToggleButton(currentTheme);
    }

    // listener za promjenu teme
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            let theme = htmlElement.getAttribute('data-theme');

            if (theme === 'dark') {
                htmlElement.removeAttribute('data-theme');
                localStorage.setItem('theme', 'light');
                updateToggleButton('light');
            } else {
                htmlElement.setAttribute('data-theme', 'dark');
                localStorage.setItem('theme', 'dark');
                updateToggleButton('dark');
            }

            // Osvježi Google kartu 
            if (typeof initMap === "function") {
                initMap(); 
            }
        });
    }

    
    function updateToggleButton(theme) {
        if (!themeToggle) return;
        themeToggle.innerHTML = (theme === 'dark') ? '☀️' : '🌙';
    }


    /* ==========================================================================
       2. LOGIKA ZA REGISTRACIJU (index.html)
       ========================================================================== */
    const registrationForm = document.getElementById('registrationForm');

    if (registrationForm) {
        registrationForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            const errorText = document.getElementById('errorText');

            // Provjera podudaranja lozinki
            if (password !== confirmPassword) {
                errorText.style.display = 'block';
                errorText.scrollIntoView({ behavior: 'smooth' });
                return; 
            } else {
                errorText.style.display = 'none';
            }

            // Kreiranje objekta korisnika
            const korisnik = {
                ime: document.getElementById('firstName').value,
                prezime: document.getElementById('lastName').value,
                email: document.getElementById('email').value,
                lozinka: password
            };

            // Pohrana imena za personalizaciju
            localStorage.setItem('korisnikIme', korisnik.ime);

            console.log("Podaci spremni za registraciju:", korisnik);
            alert("Uspješna registracija za: " + korisnik.ime + " " + korisnik.prezime);
            
            // Resetiranje forme
            this.reset();
        });
    }
});

/* ==========================================================================
   3. DODATNE FUNKCIJE (dohvaćanje prognoze)
   ========================================================================== */
function dohvatiPrognozu(grad, elementId) {
    const prikaz = document.getElementById(elementId);
    if (prikaz) {
        prikaz.innerHTML = `<p>Učitavanje prognoze za ${grad}...</p>`;
        
        // Simulacija API poziva (kasnije ćeš ovdje staviti pravi fetch)
        setTimeout(() => {
            prikaz.innerHTML = `<p>Trenutno: <strong>22°C, Sunčano</strong></p>`;
        }, 1000);
    }
}

/* ==========================================================================
   4. KLASA ZA UPRAVLJANJE KARTOM 
   ========================================================================== */
class CroFlyMap {
    constructor() {
        this.map = null;
        this.service = null;
        this.infowindow = null;
        this.markers = []; // Lista za praćenje markera kako bi ih mogli obrisati
        this.croatiaCenter = { lat: 44.4748, lng: 15.1960 };
    }

    // Inicijalizacija karte
    init() {
        this.infowindow = new google.maps.InfoWindow();
        this.map = new google.maps.Map(document.getElementById("map"), {
            zoom: 7,
            center: this.croatiaCenter
        });

        this.provjeriUrlParametre();
    }

    // Provjera dolazi li korisnik s klikom na određeni grad
    provjeriUrlParametre() {
        const urlParams = new URLSearchParams(window.location.search);
        const gradParam = urlParams.get('grad');
        
        if (gradParam) {
            const selectGrad = document.getElementById('grad-select');
            if (selectGrad) {
                selectGrad.value = gradParam.charAt(0).toUpperCase() + gradParam.slice(1);
                this.filtriraj();
            }
        }
    }

    // Glavna metoda za pretragu i filtriranje
    filtriraj() {
        const grad = document.getElementById('grad-select').value;
        const vrsta = document.getElementById('vrsta-smjestaja').value;

        if (!grad) {
            alert("Molimo odaberite grad.");
            return;
        }

        this.obrisiMarkere(); // čisti stare markere prije nove pretrage

        const request = {
            query: `${vrsta} in ${grad}, Croatia`,
            fields: ['name', 'geometry', 'formatted_address'],
        };

        this.service = new google.maps.places.PlacesService(this.map);

        this.service.textSearch(request, (results, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && results) {
                this.map.setCenter(results[0].geometry.location);
                this.map.setZoom(13);

                results.forEach(place => this.dodajMarker(place));
            }
        });
    }

    // Kreiranje pojedinačnog markera
    dodajMarker(place) {
        if (!place.geometry || !place.geometry.location) return;

        const marker = new google.maps.Marker({
            map: this.map,
            position: place.geometry.location,
            animation: google.maps.Animation.DROP // Lijep efekt padanja markera
        });

        google.maps.event.addListener(marker, "click", () => {
            this.infowindow.setContent(`<strong>${place.name}</strong><br>${place.formatted_address || ''}`);
            this.infowindow.open(this.map, marker);
        });

        this.markers.push(marker);
    }

    // Funkcija za čišćenje karte
    obrisiMarkere() {
        this.markers.forEach(m => m.setMap(null));
        this.markers = [];
    }
}

// Globalna instanca klase
const croFlyMap = new CroFlyMap();

// Globalna funkcija koju poziva Google Maps Callback
function initMap() {
    croFlyMap.init();
}

// Funkcija za gumb na stranici
function filtrirajKartu() {
    croFlyMap.filtriraj();
} /* ==========================================================================
    5. LOGIKA ZA LETOVE
    ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
    const gradovi = ['zagreb', 'split', 'dubrovnik', 'zadar', 'pula', 'rijeka', 'osijek'];

    // Funkcija za dohvaćanje i prikaz letova za određeni grad
    async function osvjeziLetove(grad) {
        const kontejner = document.getElementById(grad + "-raspored");
        if (!kontejner) return;

        try {
            const response = await fetch(`http://127.0.0.1:5000/api/raspored/${grad}`);
            const data = await response.json();

            kontejner.innerHTML = ''; 

            if (!data.odlasci || data.odlasci.length === 0) {
                kontejner.innerHTML = '<p>Nema planiranih letova. ✈️</p>';
                return;
            }

            data.odlasci.forEach(letInfo => {
                const redak = document.createElement('p');
                redak.style.margin = "5px 0";
                redak.innerHTML = `<strong>${letInfo.vrijeme}</strong> | ${letInfo.broj} -> ${letInfo.odrediste}`;
                kontejner.appendChild(redak);
            });
        } catch (err) {
            kontejner.innerHTML = '<p style="color: red;">Greška u vezi.</p>';
        }
    }

    // 1. AUTOMATSKO UČITAVANJE SVEGA ODJEDNOM
    gradovi.forEach(grad => {
        osvjeziLetove(grad);
    });

    // 2. OSTAVLJAMO I KLIK (ako korisnik želi ručno osvježiti kasnije)
    document.querySelectorAll('ul li a').forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href && href.startsWith('#')) {
                const gradId = href.substring(1);
                osvjeziLetove(gradId);
            }
        });
    });
});
/* ==========================================================================
    6. LOGIKA ZA AUTOBUSE
    ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
    const gradovi = ['zagreb', 'split', 'dubrovnik', 'zadar', 'pula', 'rijeka', 'osijek'];

    // Pokrećemo samo ako smo na stranici autobus.html
    if (window.location.pathname.includes('autobus.html')) {
        
        gradovi.forEach(async (grad) => {
            const kontejner = document.getElementById(grad + "-bus-info");
            if (!kontejner) return;

            try {
                // Pozivamo tvoj Python API (koji sada preko POI-ja traži naziv linije)
                const response = await fetch(`http://127.0.0.1:5000/api/prijevoz/${grad}`);
                const data = await response.json();

                // Ispisujemo točno ono što je API vratio pod ključem "linija"
                kontejner.innerHTML = `
                    <div style="border-left: 5px solid #28a745; background: #f4fdf4; padding: 15px; border-radius: 5px;">
                        <h4 style="margin: 0 0 10px 0; color: #28a745;">🚐 Informacije s terena:</h4>
                        <p style="font-size: 1.2em; font-weight: bold; margin: 0;">${data.linija}</p>
                        <p style="margin: 5px 0 0; font-size: 0.9em; color: #666;">Udaljenost do centra: ${data.udaljenost}</p>
                    </div>
                `;
            } catch (err) {
                kontejner.innerHTML = "<p>Greška pri komunikaciji s API-jem.</p>";
            }
        });
    }
});