# 12100 Cycling Studio — sito vetrina

Sito statico (HTML + CSS + JS, nessun build): basta caricare la cartella su qualsiasi hosting
(Netlify, Vercel, Aruba, SiteGround…). Per vederlo in locale:

```bash
python3 -m http.server 5187
```

e aprire http://localhost:5187.

## Aggiornare il sito

GitHub Pages fa tenere i file in cache ai browser per 10 minuti. Dopo ogni modifica a
`assets/css/style.css` o `assets/js/main.js` va aggiornato il codice di versione in `index.html`,
altrimenti un telefono può mostrare la pagina nuova con stile e script vecchi:

```bash
python3 tools/versiona.py && git add -A && git commit -m "Aggiornamento sito" && git push
```

## Struttura

- `index.html` — tutte le sezioni e i testi, dati strutturati `BikeStore` per Google.
- `assets/css/style.css` — stile (palette alluminio / inchiostro / blu officina / kraft).
- `assets/js/main.js` — animazioni (GSAP, ScrollTrigger, SplitText, Lenis da CDN) e interazioni:
  disegno tecnico che si traccia e pedala allo scroll, rastrelliera trascinabile con oscillazione,
  ordine di lavoro, profilo altimetrico, cartellino di prenotazione → WhatsApp, orari con stato live.
- `assets/img/` — logo (originale e versioni trasparenti), favicon, icona Apple, anteprima per i link.

## Da completare prima della pubblicazione

1. **Foto**: quelle attuali sono provvisorie (Unsplash, uso commerciale consentito) e mostrano anche bici
   di marchi non trattati. Vanno sostituite con foto del negozio, delle bici in vetrina e dell'officina.
   Ogni `<img>` in `index.html` punta a `images.unsplash.com`: basta cambiare `src`/`srcset`.
2. **Logo**: inserito. `logo-mark.png` (simbolo, in alto) e `logo-full.png` (footer) sono ricavati dal file
   originale come maschere trasparenti e prendono il colore della sezione; `og-image.png` è l'anteprima dei link.
   Se arriva un SVG ufficiale, basta sostituire questi file. L'URL di `og:image` va aggiornato col dominio definitivo.
3. **P.IVA** nel footer (`XXXXXXXXXXX`) e pagine **Privacy** e **Cookie** (link `#` nel footer).
4. **Dominio**: quando è noto, aggiungere `<link rel="canonical">`, `og:url`, e `url`/`image` nel JSON-LD.
5. **WhatsApp**: form, bottoni e schede usano `wa.me/393337648755`. Verificare che il numero sia
   attivo su WhatsApp (altrimenti cambiare i link in `tel:`).
6. **Modelli in rastrelliera**: i nomi (Cervélo S5, Colnago V5Rs, Factor Ostro VAM…) sono esempi dei
   marchi trattati; aggiornarli con le bici realmente disponibili.
7. **Indicizzazione**: l'anteprima ha `<meta name="robots" content="noindex, nofollow">` per non finire su Google;
   toglierla quando il sito va online sul dominio definitivo.
8. **Loghi dei marchi** (`assets/img/brands/`): presi dai siti ufficiali di Colnago, Cervélo, Factor,
   CeramicSpeed e Carbon-Ti, solo ritagliati. Da concessionari conviene chiedere ai referenti il kit loghi
   ufficiale (SVG) e le eventuali regole d'uso, e sostituire i file con quelli.
9. **Orari**: sono in `HOURS` in `assets/js/main.js`, nel JSON-LD di `index.html` e nel footer.

## Note

- La mappa Google si carica solo dopo il clic (nessun cookie di terze parti prima del consenso).
- I font arrivano da Google Fonts; per la massima tutela privacy si possono ospitare in locale.
- Con `prefers-reduced-motion` attivo le animazioni vengono disattivate e il contenuto resta completo;
  se i CDN non rispondono, il sito resta leggibile e funzionante.
