# 12100 Cycling Studio — sito vetrina

Sito statico (HTML + CSS + JS, nessun build): basta caricare la cartella su qualsiasi hosting
(Netlify, Vercel, Aruba, SiteGround…). Per vederlo in locale:

```bash
python3 -m http.server 5187
```

e aprire http://localhost:5187.

## Aggiornare il sito

GitHub Pages fa tenere i file in cache ai browser per 10 minuti. Dopo ogni modifica a
`assets/css/style.css` o `assets/js/main.js` va aggiornato il codice di versione in tutte le pagine (`index.html`, `404.html`, `privacy.html`),
altrimenti un telefono può mostrare la pagina nuova con stile e script vecchi:

```bash
python3 tools/versiona.py && git add -A && git commit -m "Aggiornamento sito" && git push
```

## Struttura

- `index.html` — tutte le sezioni e i testi, dati strutturati `BikeStore` per Google.
- `assets/css/style.css` — stile (palette alluminio / inchiostro / blu officina / kraft).
- `assets/js/main.js` — animazioni (GSAP, ScrollTrigger, SplitText, Lenis) e interazioni:
  disegno tecnico che si traccia e pedala allo scroll, rastrelliera trascinabile con oscillazione,
  ordine di lavoro, profilo altimetrico, cartellino di prenotazione → WhatsApp, orari con stato live.
- `404.html` — pagina per gli indirizzi inesistenti: la ruota forata al posto dello zero, da rigonfiare
  con la pompa (oltre gli 8 bar scoppia). GitHub Pages la usa da sola, con stato 404.
- `privacy.html` — informativa privacy e cookie (bozza da completare, vedi sotto). Linkata dal footer,
  dalla nota del cartellino e dalla nota della mappa.
- `assets/fonts/` — Big Shoulders, Big Shoulders Stencil e IBM Plex Sans (licenza OFL), serviti dal sito:
  nessuna richiesta a Google Fonts.
- `assets/vendor/` — GSAP 3.15.0 e Lenis 1.3.26, copiati dal pacchetto ufficiale: nessuna richiesta ai CDN.
  Per aggiornarli si crea una nuova cartella con il numero di versione e si cambiano i percorsi in `index.html`.
- `assets/img/` — logo (originale e versioni trasparenti), favicon, icona Apple, anteprima per i link.

## Da completare prima della pubblicazione

1. **Foto**: quelle attuali sono provvisorie (Unsplash, uso commerciale consentito) e mostrano anche bici
   di marchi non trattati. Vanno sostituite con foto del negozio, delle bici in vetrina e dell'officina.
   Ogni `<img>` in `index.html` punta a `images.unsplash.com`: basta cambiare `src`/`srcset`.
   Con le foto nel sito, togliere da `index.html` il `preconnect` a Unsplash e da `privacy.html` il paragrafo
   sulle foto di prova (punto 2): a quel punto il sito non contatta più nessun server esterno.
2. **Logo**: inserito. `logo-mark.png` (simbolo, in alto) e `logo-full.png` (footer) sono ricavati dal file
   originale come maschere trasparenti e prendono il colore della sezione; `og-image.png` è l'anteprima dei link.
   Se arriva un SVG ufficiale, basta sostituire questi file. L'URL di `og:image` va aggiornato col dominio definitivo.
3. **P.IVA** nel footer di `index.html` e `privacy.html` (`XXXXXXXXXXX`). In `privacy.html` completare i dati
   evidenziati in kraft (ragione sociale, P.IVA, email, tempo di conservazione dei messaggi WhatsApp) e
   far rivedere il testo a un consulente privacy prima del lancio. Se si aggiungono statistiche, pixel
   pubblicitari o un negozio online, servono informativa aggiornata e banner dei cookie.
4. **Dominio**: quando è noto, aggiungere `<link rel="canonical">`, `og:url`, e `url`/`image` nel JSON-LD.
   In `404.html` tutti i percorsi iniziano con `/12100-cycling-studio/`: con un dominio proprio diventano `/`.
5. **WhatsApp**: form, bottoni e schede usano `wa.me/393337648755`. Verificare che il numero sia
   attivo su WhatsApp (altrimenti cambiare i link in `tel:`).
6. **Modelli in rastrelliera**: i nomi (Cervélo S5, Colnago V5Rs, Factor Ostro VAM…) sono esempi dei
   marchi trattati; aggiornarli con le bici realmente disponibili.
7. **Indicizzazione**: l'anteprima ha `<meta name="robots" content="noindex, nofollow">` per non finire su Google;
   toglierla da `index.html` e `privacy.html` quando il sito va online sul dominio definitivo (la 404 resta noindex).
8. **Loghi dei marchi** (`assets/img/brands/`): presi dai siti ufficiali di Colnago, Cervélo, Factor,
   CeramicSpeed e Carbon-Ti, solo ritagliati. Da concessionari conviene chiedere ai referenti il kit loghi
   ufficiale (SVG) e le eventuali regole d'uso, e sostituire i file con quelli.
9. **Orari**: sono in `HOURS` in `assets/js/main.js`, nel JSON-LD di `index.html` e nel footer.

## Note

- La mappa Google si carica solo dopo il clic (nessun cookie di terze parti prima del consenso).
- I font arrivano da Google Fonts; per la massima tutela privacy si possono ospitare in locale.
- Con `prefers-reduced-motion` attivo le animazioni vengono disattivate e il contenuto resta completo;
  se i CDN non rispondono, il sito resta leggibile e funzionante.
