/* Noyau commun du motion : scroll fluide, titres masqués, apparitions, compteurs.
   Tout ce qui est propre au site est dans la partie "SITE" plus bas. */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;


  /* menu mobile : un bouton + un panneau plein écran avec tous les liens (sans dépendre de GSAP) */
  (() => {
    const bar = $('[data-top]'), navs = $$('[data-nav]');
    if (!bar || !navs.length || bar.classList.contains('side')) return;
    const links = navs.flatMap(n => $$('a[href^="#"]', n));
    const btn = document.createElement('button');
    btn.className = 'mm-btn'; btn.type = 'button'; btn.setAttribute('aria-label', 'Ouvrir le menu'); btn.setAttribute('aria-expanded', 'false'); btn.setAttribute('aria-controls', 'mm');
    btn.innerHTML = '<span></span><span></span>';
    const panel = document.createElement('div');
    panel.className = 'mm'; panel.id = 'mm'; panel.setAttribute('data-lenis-prevent', ''); panel.setAttribute('aria-hidden', 'true');
    panel.innerHTML = '<ul>' + links.map((a, i) => '<li style="--i:' + i + '"><a href="' + a.getAttribute('href') + '"><i>' + String(i + 1).padStart(2, '0') + '</i>' + a.textContent.replace(/[→↗]/g, '').trim() + '</a></li>').join('') + '</ul>';
    bar.classList.add('has-mm'); bar.appendChild(btn); document.body.appendChild(panel);
    const set = open => {
      root.classList.toggle('mm-open', open);
      btn.setAttribute('aria-expanded', open); btn.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
      panel.setAttribute('aria-hidden', !open);
      if (window.__lenis) open ? window.__lenis.stop() : window.__lenis.start();
    };
    btn.addEventListener('click', () => set(!root.classList.contains('mm-open')));
    panel.addEventListener('click', e => { if (e.target.closest('a')) set(false); }, true);
    addEventListener('keydown', e => { if (e.key === 'Escape') set(false); });
    matchMedia('(min-width:901px)').addEventListener('change', e => { if (e.matches) set(false); });
  })();

  /* accordéon : fonctionne même sans animation */
  $$('.acc__h').forEach(b => b.addEventListener('click', () => {
    const a = b.closest('.acc'), open = !a.classList.contains('is-open');
    a.classList.toggle('is-open', open);
    b.setAttribute('aria-expanded', open);
    if (window.ScrollTrigger) setTimeout(() => ScrollTrigger.refresh(), 600);
  }));

  if (!window.gsap || !window.ScrollTrigger || !window.SplitText || reduce) {
    root.classList.remove('js'); window.__ready = true; return;
  }
  gsap.registerPlugin(ScrollTrigger, SplitText);
  const mm = gsap.matchMedia();

  mm.add('(prefers-reduced-motion: no-preference)', () => {
    const desktop = matchMedia('(min-width:901px)').matches;
    const hover = matchMedia('(hover:hover)').matches;

    const lenis = new Lenis({ lerp: 0.09 });
    window.__lenis = lenis;
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
      const t = $(a.getAttribute('href'));
      if (!t) return;
      e.preventDefault();
      lenis.scrollTo(t, { duration: 1.3, offset: 0 });
    }));

    /* barre du haut, progression, lien actif */
    const top = $('[data-top]'), prog = $('[data-progress]');
    const links = $$('[data-nav] a[href^="#"]');
    const secs = links.map(a => $(a.getAttribute('href')));
    ScrollTrigger.create({
      start: 0, end: 'max',
      onUpdate: self => {
        if (top) top.classList.toggle('is-solid', self.scroll() > 24);
        if (prog) gsap.set(prog, { scaleX: self.progress });
        const line = innerHeight * 0.4;
        secs.forEach((s, i) => {
          if (!s) return;
          const r = s.getBoundingClientRect();
          links[i].classList.toggle('is-active', r.top <= line && r.bottom >= line);
        });
      }
    });

    /* titres : lignes masquées */
    $$('[data-split]').forEach(el => {
      const d = parseFloat(el.dataset.delay || 0);
      SplitText.create(el, {
        type: 'lines', mask: 'lines', autoSplit: true,
        onSplit(self) {
          gsap.set(el, { visibility: 'visible' });
          return gsap.from(self.lines, { yPercent: 118, duration: 1.2, ease: 'power4.out', stagger: 0.1, delay: d,
            scrollTrigger: { trigger: el, start: 'top 90%' } });
        }
      });
    });

    /* apparitions par lots */
    const items = $$('[data-r]');
    gsap.set(items, { autoAlpha: 0, y: 30 });
    ScrollTrigger.batch(items, {
      start: 'top 92%', once: true,
      onEnter: els => gsap.to(els, { autoAlpha: 1, y: 0, duration: 0.95, ease: 'power3.out', stagger: 0.09, overwrite: true })
    });

    /* compteurs */
    $$('[data-count]').forEach(el => {
      const end = parseInt(el.dataset.count, 10), o = { v: 0 };
      el.textContent = '0';
      ScrollTrigger.create({ trigger: el, start: 'top 94%', once: true,
        onEnter: () => gsap.to(o, { v: end, duration: 1.8, delay: 0.3, ease: 'power2.out', onUpdate: () => { el.textContent = Math.round(o.v); } }) });
    });

    /* boutons magnétiques */
    if (hover) $$('.btn').forEach(btn => {
      const x = gsap.quickTo(btn, 'x', { duration: 0.4, ease: 'power3.out' });
      const y = gsap.quickTo(btn, 'y', { duration: 0.4, ease: 'power3.out' });
      btn.addEventListener('mousemove', e => { const r = btn.getBoundingClientRect(); x((e.clientX - r.left - r.width / 2) * 0.22); y((e.clientY - r.top - r.height / 2) * 0.3); });
      btn.addEventListener('mouseleave', () => { x(0); y(0); });
    });

    /* ===== SITE ===== */
    /* ===== hero : anneau PDCA qui tourne, portrait qui se dévoile ===== */
    gsap.to('.ring__spin', { rotation: 360, duration: 60, repeat: -1, ease: 'none' });
    gsap.from('.ring__a', { opacity: 0, duration: 1, stagger: 0.18, ease: 'power2.out' });
    gsap.from('.hero__ph', { clipPath: 'circle(0% at 50% 50%)', duration: 1.6, ease: 'power3.inOut', delay: 0.2 });
    gsap.from('.tg', { scale: 0, duration: 0.8, ease: 'back.out(2)', stagger: 0.12, delay: 1.1 });
    gsap.from('.hero__tag', { y: 30, autoAlpha: 0, duration: 1, ease: 'power3.out', delay: 1.5 });
    gsap.to('.hero__vis', { yPercent: -6, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

    /* ===== méthode : la roue PDCA tourne et s'allume au fil des étapes ===== */
    const quads = $$('.q'), steps = $$('.step'), wheel = $('.wheel__r');
    const setStep = i => {
      quads.forEach((q, k) => q.classList.toggle('on', k === i));
      steps.forEach((s, k) => s.classList.toggle('on', k === i));
      gsap.to(wheel, { rotation: -90 * i, duration: 1, ease: 'power3.inOut', transformOrigin: '200px 200px' });
      $$('.ql').forEach(t => gsap.to(t, { rotation: 90 * i, duration: 1, ease: 'power3.inOut', svgOrigin: t.getAttribute('x') + ' ' + t.getAttribute('y') }));
    };
    setStep(0);
    {
      steps.forEach((s, i) => ScrollTrigger.create({ trigger: s, start: desktop ? 'top 55%' : 'top 62%', end: desktop ? 'bottom 55%' : 'bottom 62%', onToggle: self => { if (self.isActive) setStep(i); } }));
    }

    /* ===== langues ===== */
    $$('.langs i').forEach(b => {
      const p = parseFloat(getComputedStyle(b).getPropertyValue('--p')), o = { s: 0 };
      ScrollTrigger.create({ trigger: b, start: 'top 92%', once: true, onEnter: () => gsap.to(o, { s: p, duration: 1.5, ease: 'power3.out', delay: 0.2, onUpdate: () => b.style.setProperty('--ps', o.s) }) });
    });
    /* ===== FIN SITE ===== */
  });

  const refresh = () => ScrollTrigger.refresh();
  addEventListener('load', refresh);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);
  window.__ready = true;
})();
