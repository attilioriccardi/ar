/* ============================================================
   GALLERIA FOTO

   Non c'è nessun elenco da aggiornare: la pagina chiede a GitHub
   quali file ci sono nelle due cartelle e li mostra.
   Per aggiungere una foto basta caricarla nella cartella giusta.

     assets/img/galleria/live/     -> sezione "Live"
     assets/img/galleria/studio/   -> sezione "In studio"

   NOME DEL FILE = DIDASCALIA
   Formato consigliato:  AAAA-MM-GG_Nome-del-posto.webp
   Esempio: 2026-07-16_Pirilampo-al-tramonto.webp
            -> didascalia "Pirilampo al tramonto — 16 luglio 2026"
   La data in testa serve anche a ordinare: le più recenti prima.
   ============================================================ */

(function () {
  "use strict";

  const REPO = 'attilioriccardi/ar';
  const BASE = 'assets/img/galleria/';
  const MESI = ['gennaio','febbraio','marzo','aprile','maggio','giugno',
                'luglio','agosto','settembre','ottobre','novembre','dicembre'];

  const sezioni = [
    { cartella: 'live',   griglia: 'griglia-live',   stato: 'stato-live' },
    { cartella: 'studio', griglia: 'griglia-studio', stato: 'stato-studio' }
  ];

  let tutte = [];   // tutte le foto mostrate, per sfogliarle nel visualizzatore

  /* Dal nome del file ricava didascalia e data */
  function leggiNome(nome) {
    const senzaEst = nome.replace(/\.[^.]+$/, '');
    const m = /^(\d{4})-(\d{2})-(\d{2})[_-](.*)$/.exec(senzaEst);
    let testo = senzaEst, quando = '';
    if (m) {
      testo = m[4];
      const g = parseInt(m[3], 10), mm = parseInt(m[2], 10) - 1;
      if (MESI[mm]) quando = `${g} ${MESI[mm]} ${m[1]}`;
    }
    testo = testo.replace(/[-_]+/g, ' ').trim();
    testo = testo.charAt(0).toUpperCase() + testo.slice(1);
    return { testo, quando, ordine: m ? m[1]+m[2]+m[3] : '0000' };
  }

  const esc = s => String(s).replace(/[&<>"]/g,
    c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]));

  function disegna(sez, elenco) {
    const griglia = document.getElementById(sez.griglia);
    const stato = document.getElementById(sez.stato);

    if (!elenco.length) {
      griglia.innerHTML = '';
      stato.textContent = 'Nessuna foto in questa sezione, per ora.';
      return;
    }

    stato.remove();
    griglia.innerHTML = elenco.map(f => {
      const i = tutte.push(f) - 1;
      const did = f.testo + (f.quando ? ' — ' + f.quando : '');
      return `<figure class="scatto" tabindex="0" role="button" data-i="${i}"
                 aria-label="Ingrandisci: ${esc(did)}">
                <img src="${esc(f.url)}" alt="${esc(did)}" loading="lazy" decoding="async">
                <figcaption>${esc(did)}</figcaption>
              </figure>`;
    }).join('');
  }

  /* Chiede a GitHub l'elenco dei file nella cartella */
  sezioni.forEach(sez => {
    fetch(`https://api.github.com/repos/${REPO}/contents/${BASE}${sez.cartella}`)
      .then(r => {
        if (r.status === 404) return [];        // cartella non ancora creata
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(dati => {
        const foto = (Array.isArray(dati) ? dati : [])
          .filter(f => f.type === 'file' && /\.(webp|jpe?g|png|avif)$/i.test(f.name))
          .map(f => Object.assign(leggiNome(f.name), { url: BASE + sez.cartella + '/' + f.name }))
          .sort((a, b) => b.ordine.localeCompare(a.ordine) || a.testo.localeCompare(b.testo));
        disegna(sez, foto);
      })
      .catch(err => {
        console.warn('Elenco foto non caricato:', err);
        const stato = document.getElementById(sez.stato);
        if (stato) stato.textContent = 'Non riesco a caricare le foto in questo momento. Riprova fra poco.';
      });
  });

  /* ---------- Visualizzatore a schermo intero ---------- */
  const lente = document.getElementById('lente');
  const img = document.getElementById('lente-img');
  const testo = document.getElementById('lente-testo');
  let corrente = -1, ultimoFocus = null;

  function mostra(i) {
    if (i < 0) i = tutte.length - 1;
    if (i >= tutte.length) i = 0;
    corrente = i;
    const f = tutte[i];
    img.src = f.url;
    img.alt = f.testo;
    testo.textContent = f.testo + (f.quando ? ' — ' + f.quando : '');
  }

  function apri(i) {
    ultimoFocus = document.activeElement;
    mostra(i);
    lente.classList.add('aperta');
    document.body.style.overflow = 'hidden';
    lente.querySelector('.chiudi').focus();
  }

  function chiudi() {
    lente.classList.remove('aperta');
    document.body.style.overflow = '';
    img.src = '';
    if (ultimoFocus) ultimoFocus.focus();
  }

  document.addEventListener('click', e => {
    const fig = e.target.closest('.scatto');
    if (fig) { apri(+fig.dataset.i); return; }
    if (e.target.closest('.chiudi')) return chiudi();
    if (e.target.closest('.prec'))  return mostra(corrente - 1);
    if (e.target.closest('.succ'))  return mostra(corrente + 1);
    if (e.target === lente) chiudi();          // clic sullo sfondo
  });

  document.addEventListener('keydown', e => {
    const fig = e.target.closest && e.target.closest('.scatto');
    if (fig && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault(); apri(+fig.dataset.i); return;
    }
    if (!lente.classList.contains('aperta')) return;
    if (e.key === 'Escape') chiudi();
    if (e.key === 'ArrowLeft') mostra(corrente - 1);
    if (e.key === 'ArrowRight') mostra(corrente + 1);
  });

  /* scorrimento col dito su telefono */
  let x0 = null;
  lente.addEventListener('touchstart', e => { x0 = e.changedTouches[0].clientX; }, { passive: true });
  lente.addEventListener('touchend', e => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 50) mostra(corrente + (dx < 0 ? 1 : -1));
    x0 = null;
  }, { passive: true });

})();
