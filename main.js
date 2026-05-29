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
async function dohvatiPrognozu(grad, elementId) {
    const targetId = elementId || `${grad.toLowerCase()}-prognoza`;
    const prikaz = document.getElementById(targetId);
    if (!prikaz) return;

    prikaz.innerHTML = `<p>Učitavanje prognoze za ${grad}...</p>`;

    try {
        // Novo: dohvaćamo pravi API umjesto samo simulacije
        const response = await fetch(`http://127.0.0.1:5000/api/prognoza/${grad.toLowerCase()}`);
        if (!response.ok) throw new Error('API response not OK');

        const data = await response.json();
        prikaz.innerHTML = `
            <p>Temperatura: <strong>${data.temperatura}</strong></p>
            <p>Vjetar: <strong>${data.vjetar}</strong></p>
        `;
    } catch (error) {
        prikaz.innerHTML = `<p style="color: red;">Greška pri dohvaćanju prognoze.</p>`;
        console.error('Dohvat prognoze nije uspio:', error);
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
    6. LOGIKA ZA JAVASCRIPT API PRIJEVOZ (autobus.html)
    ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
    // Popis svih gradova koji odgovaraju ID-jevima u HTML-u
    const gradovi = ['zagreb', 'split', 'dubrovnik', 'zadar', 'pula', 'rijeka', 'osijek'];

    async function dohvatiPrijevoz() {
        for (const grad of gradovi) {
            // Tražimo div s ID-jem, npr. "zagreb-bus-info"
            const kontejner = document.getElementById(grad + "-bus-info");
            
            // Ako element postoji na stranici (npr. na autobus.html), pokrećemo API poziv
            if (kontejner) {
                try {
                    // Gađamo tvoj lokalni Flask server
                    const res = await fetch(`http://127.0.0.1:5000/api/prijevoz/${grad}`);
                    const data = await res.json();
                    
                    // Ispisujemo Google Maps podatke u HTML s malo CSS stila
                    kontejner.innerHTML = `
                        <div style="background: #f8f9fa; padding: 12px; border-left: 5px solid #4285F4; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                            <p style="margin: 0; font-size: 1.1em; color: #2c3e50;">🚌 <strong>${data.linija}</strong></p>
                            <p style="margin: 6px 0 0; font-size: 0.9em; color: #555;">⏱️ Vrijeme do centra: <strong>${data.vrijeme}</strong></p>
                        </div>
                    `;
                } catch (err) {
                    // U slučaju da je server ugašen ili je greška u mreži
                    console.error("Greška kod dohvata za grad " + grad + ":", err);
                    kontejner.innerHTML = `
                        <div style="background: #fff3f3; padding: 10px; border-left: 5px solid #dc3545; border-radius: 4px;">
                            <p style="margin: 0; color: #dc3545; font-weight: bold;">⚠️ Podaci trenutno nedostupni.</p>
                        </div>
                    `;
                }
            }
        }
    }

    // Pokrećemo funkciju
    dohvatiPrijevoz();
});
document.addEventListener('DOMContentLoaded', () => {
    const gradovi = ['Zagreb', 'Split', 'Dubrovnik', 'Zadar', 'Pula', 'Rijeka', 'Osijek'];
    
    gradovi.forEach(grad => {
        const elementId = grad.toLowerCase() + '-prognoza';
        
        // Pozivamo async funkciju za dohvat
        dohvatiPrognozu(grad, elementId);
    });
});