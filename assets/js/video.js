/* ============================================================
   VIDEO YOUTUBE — caricamento al clic

   Per aggiungere un video basta scrivere nella pagina:

     <div class="video-yt" data-video="CODICE"
          data-titolo="Titolo del video"></div>

   Il CODICE è la parte finale del link YouTube:
     https://youtu.be/VbQ-JeGtEEo  ->  VbQ-JeGtEEo

   Finché nessuno clicca, YouTube non viene contattato:
   la pagina resta leggera e non vengono installati cookie.

   Facoltativo: data-poster="assets/img/nome.jpg" per usare
   un'anteprima ospitata sul sito invece di quella di YouTube.
   ============================================================ */

(function () {
  "use strict";

  const PLAY = '<svg viewBox="0 0 68 48" aria-hidden="true">' +
    '<path class="play-bg" d="M66.5 7.7c-.8-2.9-2.5-5.4-5.4-6.2C55.8.1 34 0 34 0S12.2.1 6.9 1.5C4 2.3 2.3 4.8 1.5 7.7 0 13 0 24 0 24s0 11 1.5 16.3c.8 2.9 2.5 5.4 5.4 6.2C12.2 47.9 34 48 34 48s21.8-.1 27.1-1.5c2.9-.8 4.6-3.3 5.4-6.2C68 35 68 24 68 24s0-11-1.5-16.3z"/>' +
    '<path class="play-tri" d="M45 24 27 14v20"/></svg>';

  function attiva(box) {
    const id = box.dataset.video;
    const titolo = box.dataset.titolo || 'Video';
    const iframe = document.createElement('iframe');
    // youtube-nocookie: il dominio senza cookie pubblicitari
    iframe.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(id) +
                 '?autoplay=1&rel=0';
    iframe.title = titolo;
    iframe.allow = 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; web-share';
    iframe.allowFullscreen = true;
    iframe.loading = 'lazy';
    box.innerHTML = '';
    box.appendChild(iframe);
    box.classList.add('attivo');
  }

  document.querySelectorAll('.video-yt[data-video]').forEach(box => {
    const id = box.dataset.video;
    const titolo = box.dataset.titolo || '';
    const poster = box.dataset.poster || 'https://i.ytimg.com/vi/' + id + '/hqdefault.jpg';

    box.innerHTML =
      '<button type="button" class="video-avvia" aria-label="Riproduci il video' +
        (titolo ? ': ' + titolo.replace(/"/g, '&quot;') : '') + '">' +
        '<img src="' + poster + '" alt="" loading="lazy" decoding="async">' +
        '<span class="video-play">' + PLAY + '</span>' +
        (titolo ? '<span class="video-titolo">' + titolo.replace(/[<>&]/g, '') + '</span>' : '') +
      '</button>';

    // se l'anteprima ospitata sul sito manca, ripiega su quella di YouTube
    const img = box.querySelector('img');
    img.addEventListener('error', function ripiega() {
      const scorta = 'https://i.ytimg.com/vi/' + id + '/hqdefault.jpg';
      if (img.src !== scorta) {
        console.warn('Anteprima non trovata:', poster, '— uso quella di YouTube');
        img.src = scorta;
      }
    });

    box.querySelector('.video-avvia').addEventListener('click', () => attiva(box));
  });

})();
