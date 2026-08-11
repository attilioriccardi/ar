/* ============================================================
   ELENCO CONCERTI — unico file da aggiornare

   Le date passate finiscono automaticamente nell'archivio,
   quelle future nel banner della home e in "Prossime date".
   Non devi cancellare nulla a mano.

   Formato della data: "AAAA-MM-GG"
   I campi "venue" e "citta" sono obbligatori.
   Il campo "nota" è facoltativo (es. "sold out", "ingresso libero").
   ============================================================ */

const CONCERTI = [
  { data: "2026-09-19", venue: "FESTA PRIVATA",       citta: "Pinerolo, TO" },
  { data: "2026-09-05", venue: "CAMPING SERRE MARIE", citta: "Fenestrelle, TO" },
  { data: "2026-07-10", venue: "PIAZZA",              citta: "Rivoli, TO" },
  { data: "2026-07-08", venue: "PIRIPIOLA",           citta: "Macello, TO" },
  { data: "2026-06-20", venue: "NOTTE ROMANTICA",     citta: "Pourrieres, TO" },
  { data: "2026-04-30", venue: "HOME CONCERT",        citta: "Pinerolo, TO", nota: "Presentazione disco ATTI" },
  { data: "2026-02-05", venue: "CORTILE DEL MAGLIO",  citta: "Torino, TO" },
];

/* ============================================================
   Da qui in giù non serve modificare nulla.
   ============================================================ */

(function () {
  "use strict";

  const MESI = ['GEN','FEB','MAR','APR','MAG','GIU','LUG','AGO','SET','OTT','NOV','DIC'];

  const oggi = new Date();
  oggi.setHours(0, 0, 0, 0);

  const esc = s => String(s == null ? '' : s)
    .replace(/[&<>"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]));

  // Converte "AAAA-MM-GG" in Date, scartando le righe scritte male
  const elenco = CONCERTI.map(c => {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(c.data || '').trim());
    if (!m) {
      console.warn('Concerto con data non valida, ignorato:', c);
      return null;
    }
    const d = new Date(+m[1], +m[2] - 1, +m[3]);
    return isNaN(d) ? null : Object.assign({}, c, { _d: d });
  }).filter(Boolean);

  const futuri  = elenco.filter(c => c._d >= oggi).sort((a, b) => a._d - b._d);
  const passati = elenco.filter(c => c._d <  oggi).sort((a, b) => b._d - a._d);

  const giorno = c => String(c._d.getDate()).padStart(2, '0');
  const mese   = c => MESI[c._d.getMonth()];
  const anno   = c => c._d.getFullYear();

  /* ---------- Banner della home ---------- */
  const banner = document.getElementById('concert-banner');
  if (banner) {
    const lista = banner.querySelector('#cb-list');
    if (!futuri.length) {
      banner.remove();
    } else {
      lista.innerHTML = futuri.slice(0, 5).map(c => `
        <div class="cb-row">
          <div class="cb-date">
            <div class="cb-day">${giorno(c)}</div>
            <div class="cb-month">${mese(c)}</div>
          </div>
          <div class="cb-info">
            <div class="cb-venue">${esc(c.venue)}</div>
            <div class="cb-city">${esc(c.nota || c.citta)}</div>
          </div>
          <div class="cb-dot"></div>
        </div>`).join('');

      const chiudi = banner.querySelector('.cb-close');
      if (chiudi) chiudi.addEventListener('click', () => banner.remove());
      setTimeout(() => banner.classList.add('visible'), 2000);
    }
  }

  /* ---------- Prossime date (pagina Live) ---------- */
  const boxProssime = document.getElementById('prossime-date');
  if (boxProssime) {
    boxProssime.innerHTML = futuri.length
      ? futuri.map(c => `
          <div class="date-row prossima">
            <div class="date-box">
              <span class="date-day">${giorno(c)}</span>
              <span class="date-month">${mese(c)}</span>
              <span class="date-year">${anno(c)}</span>
            </div>
            <div class="date-info">
              <div class="date-venue">${esc(c.venue)}</div>
              <div class="date-city">${esc(c.citta)}${c.nota ? ' · ' + esc(c.nota) : ''}</div>
            </div>
          </div>`).join('')
      : '<p class="date-vuoto">Nessuna data in programma al momento. Scrivimi per organizzare un live!</p>';
  }

  /* ---------- Archivio (pagina Live) ---------- */
  const boxArchivio = document.getElementById('archivio-date');
  if (boxArchivio) {
    if (!passati.length) {
      boxArchivio.innerHTML = '<p class="date-vuoto">L\'archivio è ancora vuoto.</p>';
    } else {
      // raggruppa per anno, dal più recente
      const perAnno = {};
      passati.forEach(c => (perAnno[anno(c)] = perAnno[anno(c)] || []).push(c));
      const anni = Object.keys(perAnno).sort((a, b) => b - a);

      boxArchivio.innerHTML = anni.map((y, i) => `
        <details class="archivio-anno"${i === 0 ? ' open' : ''}>
          <summary>
            <span>${y}</span>
            <span class="archivio-conta">${perAnno[y].length} ${perAnno[y].length === 1 ? 'data' : 'date'}</span>
          </summary>
          <div class="archivio-lista">
            ${perAnno[y].map(c => `
              <div class="date-row passata">
                <div class="date-box">
                  <span class="date-day">${giorno(c)}</span>
                  <span class="date-month">${mese(c)}</span>
                </div>
                <div class="date-info">
                  <div class="date-venue">${esc(c.venue)}</div>
                  <div class="date-city">${esc(c.citta)}${c.nota ? ' · ' + esc(c.nota) : ''}</div>
                </div>
              </div>`).join('')}
          </div>
        </details>`).join('');

      const totale = document.getElementById('archivio-totale');
      if (totale) {
        totale.textContent = passati.length + (passati.length === 1 ? ' concerto' : ' concerti');
      }
    }
  }

  /* ---------- Dati strutturati per Google ----------
     Descrive le date future in formato schema.org, così i concerti
     possono comparire nei risultati di ricerca con luogo e giorno.
     Viene generato solo dove esiste la sezione "Prossime date". */
  if (boxProssime && futuri.length) {
    const eventi = futuri.map(c => ({
      "@context": "https://schema.org",
      "@type": "MusicEvent",
      "name": c.venue + (c.nota ? ' — ' + c.nota : ''),
      "startDate": c.data,
      "eventStatus": "https://schema.org/EventScheduled",
      "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
      "location": { "@type": "Place", "name": c.venue, "address": c.citta },
      "performer": { "@type": "MusicGroup", "name": "Attilio Riccardi" },
      "organizer": { "@type": "Person", "name": "Attilio Riccardi" }
    }));
    const tag = document.createElement('script');
    tag.type = 'application/ld+json';
    tag.textContent = JSON.stringify(eventi);
    document.head.appendChild(tag);
  }
})();
