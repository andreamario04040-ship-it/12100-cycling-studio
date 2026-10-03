/* ==========================================================================
   12100 Cycling Studio — interazioni e animazioni
   GSAP + ScrollTrigger + SplitText + Lenis (da CDN). Tutto ciò che non è
   decorativo (orari, form, rastrelliera, menu, mappa) funziona anche senza.
   ========================================================================== */
(() => {
  'use strict';

  const doc = document.documentElement;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const G = window.gsap;
  const ST = window.ScrollTrigger;
  const Split = window.SplitText;
  const anim = !!(G && ST) && !reduce;

  if (anim) G.registerPlugin(ST, ...(Split ? [Split] : []));
  else doc.classList.remove('js');

  const PHONE = '393337648755';
  const waLink = (text) => `https://wa.me/${PHONE}?text=${encodeURIComponent(text)}`;

  /* ------------------------------------------------------------ smooth scroll */
  let lenis = null;
  if (anim && window.Lenis) {
    lenis = new window.Lenis({ duration: 1.15, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
    lenis.on('scroll', ST.update);
    G.ticker.add((t) => lenis.raf(t * 1000));
    G.ticker.lagSmoothing(0);
  }

  /* ------------------------------------------------------------ orari & stato live */
  const HOURS = {
    0: [],
    1: [[15.5, 19]],
    2: [[9, 12.5], [15.5, 19]],
    3: [[9, 12.5], [15.5, 19]],
    4: [[9, 12.5], [15.5, 19]],
    5: [[9, 12.5], [15.5, 19]],
    6: [[9, 12.5]],
  };
  const DAY = ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato'];
  const DAY_S = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
  const hm = (h) => `${Math.floor(h)}:${String(Math.round((h % 1) * 60)).padStart(2, '0')}`;

  function romeNow() {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Rome', weekday: 'short', hour: 'numeric', minute: 'numeric', hourCycle: 'h23',
    }).formatToParts(new Date());
    const get = (t) => parts.find((p) => p.type === t).value;
    const day = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[get('weekday')];
    const h = +get('hour') % 24;
    const m = +get('minute');
    return { day, h, m, t: h + m / 60 };
  }

  function shopStatus() {
    const { day, t } = romeNow();
    const cur = HOURS[day].find(([a, b]) => t >= a && t < b);
    if (cur) {
      const mins = Math.round((cur[1] - t) * 60);
      return { open: true, text: mins <= 30 ? `Aperto · chiude tra ${mins} min` : `Aperto · fino alle ${hm(cur[1])}` };
    }
    for (let k = 0; k < 8; k++) {
      const d = (day + k) % 7;
      for (const [a] of HOURS[d]) {
        if (k > 0 || a > t) {
          const when = k === 0 ? 'oggi' : k === 1 ? 'domani' : DAY[d];
          return { open: false, text: `Chiuso · apre ${when} alle ${hm(a)}` };
        }
      }
    }
    return { open: false, text: 'Chiuso' };
  }

  const TT_FROM = 8;
  const TT_SPAN = 12;
  const TT_ORDER = [1, 2, 3, 4, 5, 6, 0];
  function renderTimetable() {
    const tt = $('[data-timetable]');
    if (!tt) return;
    const now = romeNow();
    if (!tt.dataset.built) {
      tt.innerHTML = TT_ORDER.map((d) => {
        const slots = HOURS[d].length
          ? HOURS[d].map(([a, b]) => `<span class="tt__slot" style="left:${((a - TT_FROM) / TT_SPAN) * 100}%;width:${((b - a) / TT_SPAN) * 100}%"><span>${hm(a)}–${hm(b)}</span></span>`).join('')
          : '<span class="tt__closed">Chiuso</span>';
        return `<div class="tt__row" data-day="${d}"><span class="tt__day">${DAY_S[d]}</span><div class="tt__track">${slots}</div></div>`;
      }).join('') + `<div class="tt__scale">${[8, 10, 12, 14, 16, 18, 20].map((h) => `<span>${h}</span>`).join('')}</div>`;
      tt.dataset.built = '1';
      if (anim) {
        G.from($$('.tt__slot', tt), {
          scaleX: 0, duration: 1.1, ease: 'expo.out', stagger: 0.05,
          scrollTrigger: { trigger: tt, start: 'top 85%', once: true },
        });
      }
    }
    $$('.tt__row', tt).forEach((r) => r.classList.toggle('is-today', +r.dataset.day === now.day));
    $$('.tt__now', tt).forEach((n) => n.remove());
    if (now.t >= TT_FROM && now.t <= TT_FROM + TT_SPAN) {
      const track = $(`.tt__row[data-day="${now.day}"] .tt__track`, tt);
      const line = document.createElement('span');
      line.className = 'tt__now';
      line.style.left = `${((now.t - TT_FROM) / TT_SPAN) * 100}%`;
      line.dataset.label = `Ora ${now.h}:${String(now.m).padStart(2, '0')}`;
      if (now.t - TT_FROM > TT_SPAN * 0.8) line.classList.add('is-late');
      track.appendChild(line);
    }
  }

  function renderStatus() {
    const s = shopStatus();
    $$('[data-status]').forEach((el) => {
      el.classList.toggle('is-open', s.open);
      const t = $('[data-status-text]', el);
      if (t) t.textContent = s.text;
    });
    renderTimetable();
  }
  renderStatus();
  setInterval(renderStatus, 60 * 1000);

  /* ------------------------------------------------------------ header */
  const hdr = $('[data-hdr]');
  let lastY = 0;
  function onScroll(y) {
    hdr.classList.toggle('is-scrolled', y > 8);
    if (!doc.classList.contains('menu-open')) {
      const down = y > lastY + 2;
      const up = y < lastY - 2;
      if (down && y > 420) hdr.classList.add('is-hidden');
      else if (up || y < 420) hdr.classList.remove('is-hidden');
    }
    lastY = y;
  }
  if (lenis) lenis.on('scroll', ({ scroll }) => onScroll(scroll));
  else addEventListener('scroll', () => onScroll(scrollY), { passive: true });
  onScroll(scrollY);
  hdr.addEventListener('focusin', () => hdr.classList.remove('is-hidden'));
  if (anim) {
    $$('[data-theme="dark"]').forEach((sec) => {
      ST.create({ trigger: sec, start: 'top 34px', end: 'bottom 34px', toggleClass: { targets: hdr, className: 'is-dark' } });
    });
  }

  /* ------------------------------------------------------------ menu "saracinesca" */
  const menuBtn = $('.hdr__menu');
  const shutter = $('#menu');
  function setMenu(open) {
    doc.classList.toggle('menu-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    $('span', menuBtn).textContent = open ? 'Chiudi' : 'Menu';
    shutter.setAttribute('aria-hidden', String(!open));
    shutter.toggleAttribute('inert', !open);
    if (open) {
      lenis?.stop();
      setTimeout(() => $('a', shutter)?.focus({ preventScroll: true }), 450);
    } else {
      lenis?.start();
    }
  }
  menuBtn.addEventListener('click', () => setMenu(!doc.classList.contains('menu-open')));
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && doc.classList.contains('menu-open')) {
      setMenu(false);
      menuBtn.focus();
    }
  });
  matchMedia('(min-width: 1024px)').addEventListener('change', (e) => { if (e.matches) setMenu(false); });

  /* ------------------------------------------------------------ ancore */
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id.length < 2) return;
      const target = document.getElementById(id.slice(1));
      if (!target) return;
      e.preventDefault();
      if (doc.classList.contains('menu-open')) setMenu(false);
      if (lenis) lenis.scrollTo(target, { offset: 0, duration: 1.4 });
      else target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
      if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
      history.replaceState(null, '', id);
    });
  });

  /* ------------------------------------------------------------ hero: titolo + disegno tecnico */
  function initHero() {
    const title = $('[data-hero-title]');
    const fades = $$('[data-hero-fade]');
    if (!anim) return;

    if (Split) {
      Split.create(title, {
        type: 'lines,chars', mask: 'lines', autoSplit: true,
        onSplit(self) {
          G.set(title, { visibility: 'visible' });
          return G.from(self.chars, { yPercent: 118, rotate: 8, duration: 1.15, ease: 'expo.out', stagger: 0.024, delay: 0.15 });
        },
      });
    } else {
      G.set(title, { visibility: 'visible' });
      G.from(title, { opacity: 0, y: 40, duration: 1, ease: 'power3.out' });
    }
    G.to(fades, { opacity: 1, y: 0, duration: 1.1, ease: 'power3.out', stagger: 0.09, delay: 0.55 });
  }

  function initBike() {
    const svg = $('.bike');
    if (!svg) return;
    const ride = $('.bk-ride', svg);
    const dims = $('.dims', svg);
    const rots = $$('.bk-rot', svg);
    const crank = $('.bk-crank', svg);
    const pedal = $('.bk-pedal', svg);
    const chain = $('.bk-chain', svg);

    // Movimento fisicamente coerente: ruota r=340, rapporto 52/17, catena sul pignone r≈46.
    // "free" è la rotazione a ruota libera data dal mouse: gira le ruote ma non pedali e catena.
    let rideX = 0;
    let free = 0;
    const setWheels = () => {
      const deg = (rideX / 340) * (180 / Math.PI) + free;
      rots.forEach((r) => r.setAttribute('transform', `rotate(${deg.toFixed(2)} ${r.dataset.cx} ${r.dataset.cy})`));
    };
    const setRide = (dx) => {
      rideX = dx;
      ride.setAttribute('transform', `translate(${dx.toFixed(2)} 0)`);
      setWheels();
      const deg = (dx / 340) * (180 / Math.PI);
      const c = deg / 3.06;
      crank.setAttribute('transform', `rotate(${c.toFixed(2)} 404 -270)`);
      pedal.setAttribute('transform', `rotate(${(-c).toFixed(2)} ${pedal.dataset.cx} ${pedal.dataset.cy})`);
      chain.style.strokeDashoffset = String((-(dx / 340) * 46).toFixed(2));
    };
    if (!anim) return;

    const draws = $$('[data-draw]', svg);
    draws.forEach((el) => {
      const L = el.getTotalLength();
      el.style.strokeDasharray = `${L} ${L + 2}`;
      el.style.strokeDashoffset = String(L + 1);
    });
    G.set([ride, dims], { visibility: 'visible' });

    const only = (sel) => $$(sel, svg).filter((el) => el.hasAttribute('data-draw'));
    const outline = $$('.bk-tube-o .t', svg);
    const fill = $$('.bk-tube-f .t', svg);
    const tl = G.timeline({ delay: 0.35, defaults: { ease: 'power2.inOut', strokeDashoffset: 0 } });

    tl.to(only('.dim--ground'), { duration: 1 })
      .to(only('.bk-wheel > circle'), { duration: 1.2, stagger: 0.07 }, 0.15);
    outline.forEach((o, i) => tl.to([o, fill[i]], { duration: 0.75 }, 0.55 + i * 0.075));
    tl.to(only('.ln--spoke'), { duration: 0.45, stagger: 0.008, ease: 'power1.out' }, 0.9)
      .to(only('.bk-rot circle, .bk-crank .ln, .bk-crank .t'), { duration: 0.7, stagger: 0.03 }, 1.1)
      .to(only('.saddle, .ln--lever, .ln--cage, .bike .ln--thin, .bk-ride > circle'), { duration: 0.6, stagger: 0.03 }, 1.35)
      .to($$('[data-show], .ln--teeth', ride), { opacity: 1, duration: 0.5, stagger: 0.04, ease: 'power1.out' }, 1.6)
      .to([chain, ...$$('.rimtxt', svg)], { opacity: 1, duration: 0.6, ease: 'power1.out' }, 1.8)
      .to(only('.dims .dim:not(.dim--ground)'), { duration: 0.8, stagger: 0.06 }, 1.75)
      .to($$('.dim--ext, .dim--tick, .dim--dot', svg), { opacity: 1, duration: 0.5, stagger: 0.02, ease: 'none' }, 1.9)
      .to($$('.dimtxt', svg), { opacity: 1, duration: 0.5, stagger: 0.06, ease: 'power1.out' }, 2.1)
      .to($('.tblock', svg), { opacity: 1, duration: 0.6, ease: 'power1.out' }, 2.3);

    // Allo scroll la bici "pedala" fuori dal disegno.
    const proxy = { x: 0 };
    G.to(proxy, {
      x: 1500, ease: 'none',
      onUpdate: () => setRide(proxy.x),
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.9 },
    });
    G.to(dims, {
      opacity: 0, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: '30% top', scrub: true },
    });

    // Passando col mouse sul disegno le ruote girano a ruota libera e rallentano da sole.
    if (!fine) return;
    let w = 0;
    let lastPX = null;
    let spinning = false;
    const spin = () => {
      free += w;
      w *= 0.972;
      setWheels();
      if (Math.abs(w) > 0.02) requestAnimationFrame(spin);
      else spinning = false;
    };
    const area = $('.hero__drawing');
    area.addEventListener('pointermove', (e) => {
      if (lastPX !== null) w = clamp(w + (e.clientX - lastPX) * 0.06, -24, 24);
      lastPX = e.clientX;
      if (!spinning && Math.abs(w) > 0.02) {
        spinning = true;
        requestAnimationFrame(spin);
      }
    });
    area.addEventListener('pointerleave', () => { lastPX = null; });
  }

  /* ------------------------------------------------------------ titoli e paragrafi */
  function initReveals() {
    if (!anim) return;
    $$('[data-reveal]').forEach((el) => {
      if (!Split) {
        G.set(el, { visibility: 'visible' });
        return;
      }
      Split.create(el, {
        type: 'lines', mask: 'lines', autoSplit: true,
        onSplit(self) {
          G.set(el, { visibility: 'visible' });
          return G.from(self.lines, {
            yPercent: 112, rotate: 2, transformOrigin: '0% 100%', duration: 1.15, ease: 'expo.out', stagger: 0.1,
            scrollTrigger: { trigger: el, start: 'top 86%', once: true },
          });
        },
      });
    });
    $$('[data-fade]').forEach((el) => {
      G.to(el, {
        opacity: 1, y: 0, duration: 1.1, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 90%', once: true },
      });
    });
    $$('.tape, .strike').forEach((el) => {
      ST.create({ trigger: el, start: 'top 78%', once: true, onEnter: () => el.classList.add('is-on') });
    });
  }

  /* ------------------------------------------------------------ immagini "photo-finish" */
  function initPhotoFinish() {
    $$('.pf').forEach((el) => {
      const img = $('img', el);
      if (!img) return;
      const move = document.createElement('div');
      move.className = 'pf__move';
      el.insertBefore(move, img);
      move.appendChild(img);
      if (!anim) return;

      const n = +el.dataset.pf || 10;
      const inner = document.createElement('div');
      inner.className = 'pf__inner';
      inner.setAttribute('aria-hidden', 'true');
      for (let i = 0; i < n; i++) {
        const s = document.createElement('div');
        s.className = 'pf__slice';
        s.style.left = `${(i * 100) / n}%`;
        s.style.width = `${100 / n}%`;
        const c = img.cloneNode();
        c.alt = '';
        c.style.width = `${n * 100}%`;
        c.style.left = `${-i * 100}%`;
        s.appendChild(c);
        inner.appendChild(s);
      }
      move.appendChild(inner);
      el.classList.add('pf--built');

      const slices = [...inner.children];
      G.set(slices, { yPercent: (i) => (i % 2 ? 101 : -101) });
      G.to(slices, {
        yPercent: 0, duration: 1.35, ease: 'expo.out', stagger: { each: 0.055, from: 'start' },
        scrollTrigger: { trigger: el, start: 'top 80%', once: true },
        onComplete: () => el.classList.add('pf--done'),
      });
      G.fromTo(move, { yPercent: -4 }, {
        yPercent: 4, ease: 'none',
        scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true },
      });
    });
  }

  /* ------------------------------------------------------------ contatori a rullo */
  function initRolls() {
    if (!anim) return;
    $$('[data-roll]').forEach((el) => {
      const final = el.textContent.trim();
      el.innerHTML = [...final].map((ch) => {
        if (!/\d/.test(ch)) return `<span>${ch}</span>`;
        const d = +ch;
        const cells = Array.from({ length: 11 + d }, (_, k) => `<span>${k % 10}</span>`).join('');
        return `<span class="reel"><span class="reel__strip" data-n="${10 + d}" data-len="${11 + d}">${cells}</span></span>`;
      }).join('');
      const strips = $$('.reel__strip', el);
      ST.create({
        trigger: el, start: 'top 88%', once: true,
        onEnter: () => strips.forEach((s, i) => {
          G.to(s, { yPercent: (-100 * +s.dataset.n) / +s.dataset.len, duration: 1.8 + i * 0.25, ease: 'expo.out', delay: 0.1 + i * 0.08 });
        }),
      });
    });
  }

  /* ------------------------------------------------------------ rastrelliera con fisica */
  function initRack() {
    const rack = $('[data-rack]');
    if (!rack) return;
    const track = $('[data-rack-track]', rack);
    const items = $$('.rack__item', track);
    const bar = $('[data-rack-bar]', rack);
    const hint = $('[data-rack-hint]', rack);
    const prevBtn = $('[data-rack-prev]');
    const nextBtn = $('[data-rack-next]');

    let x = 0;
    let target = 0;
    let min = 0;
    let down = false;
    let sx = 0;
    let st = 0;
    let lx = 0;
    let lt = 0;
    let v = 0;
    let moved = 0;
    let raf = 0;
    const sw = items.map(() => ({ a: 0, va: 0 }));

    let entered = reduce || !('IntersectionObserver' in window);
    const bound = (t) => clamp(t, min, 0);
    const measure = () => {
      min = Math.min(0, rack.clientWidth - track.scrollWidth);
      target = bound(target);
      if (entered) kick();
      else updateBtns();
    };
    const updateBtns = () => {
      prevBtn.disabled = target >= -1;
      nextBtn.disabled = target <= min + 1;
    };

    function tick() {
      const prev = x;
      x += (target - x) * (down ? 0.32 : 0.09);
      if (Math.abs(target - x) < 0.05) x = target;
      const vel = x - prev;
      track.style.transform = `translate3d(${x.toFixed(2)}px,0,0)`;
      let busy = x !== target;
      sw.forEach((s, i) => {
        const goal = reduce ? 0 : clamp(vel * 0.5, -13, 13);
        s.va += (goal - s.a) * 0.085;
        s.va *= 0.87;
        s.a += s.va;
        if (Math.abs(s.a) > 0.02 || Math.abs(s.va) > 0.02) busy = true;
        else s.a = s.va = 0;
        items[i].style.transform = s.a ? `rotate(${s.a.toFixed(3)}deg)` : '';
      });
      if (bar) bar.style.transform = `scaleX(${min ? clamp(x / min, 0, 1) : 0})`;
      raf = busy || down ? requestAnimationFrame(tick) : 0;
    }
    function kick() {
      updateBtns();
      if (!raf) raf = requestAnimationFrame(tick);
    }

    rack.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      entered = true;
      down = true;
      moved = 0;
      sx = lx = e.clientX;
      lt = performance.now();
      st = target;
      v = 0;
      rack.classList.add('is-drag');
      kick();
    });
    addEventListener('pointermove', (e) => {
      if (!down) return;
      const dx = e.clientX - sx;
      moved = Math.max(moved, Math.abs(dx));
      let t = st + dx;
      if (t > 0) t *= 0.32;
      else if (t < min) t = min + (t - min) * 0.32;
      target = t;
      const now = performance.now();
      v = ((e.clientX - lx) / Math.max(1, now - lt)) * 16;
      lx = e.clientX;
      lt = now;
      if (moved > 8 && hint) hint.classList.add('is-gone');
    });
    const release = () => {
      if (!down) return;
      down = false;
      rack.classList.remove('is-drag');
      target = bound(target + v * 12);
      kick();
    };
    addEventListener('pointerup', release);
    addEventListener('pointercancel', release);
    rack.addEventListener('click', (e) => {
      if (moved > 8) {
        e.preventDefault();
        e.stopPropagation();
      }
    }, true);
    rack.addEventListener('dragstart', (e) => e.preventDefault());
    rack.addEventListener('wheel', (e) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY) && Math.abs(e.deltaX) > 1) {
        e.preventDefault();
        target = bound(target - e.deltaX);
        if (hint) hint.classList.add('is-gone');
        kick();
      }
    }, { passive: false });

    const step = () => items[0].getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap || '0');
    prevBtn.addEventListener('click', () => { target = bound(target + step()); kick(); });
    nextBtn.addEventListener('click', () => { target = bound(target - step()); kick(); });

    // Tastiera: porta in vista la scheda che riceve il focus.
    rack.addEventListener('scroll', () => { rack.scrollLeft = 0; });
    track.addEventListener('focusin', (e) => {
      const it = e.target.closest('.rack__item');
      if (!it) return;
      const left = it.offsetLeft + target;
      if (left < 0 || left + it.offsetWidth > rack.clientWidth) {
        target = bound(-it.offsetLeft + (rack.clientWidth - it.offsetWidth) / 2);
        kick();
      }
    });

    new ResizeObserver(measure).observe(rack);
    measure();

    // Entrata: la rastrelliera scorre da destra e le bici oscillano.
    if (!entered) {
      x = Math.min(window.innerWidth * 0.5, 600);
      track.style.transform = `translate3d(${x}px,0,0)`;
      const io = new IntersectionObserver((entries) => {
        if (entries.some((en) => en.isIntersecting)) {
          io.disconnect();
          entered = true;
          kick();
        }
      }, { threshold: 0.2 });
      io.observe(rack);
    }
  }

  /* ------------------------------------------------------------ decal dei marchi */
  function initDecals() {
    const decals = $$('[data-decal]');
    if (anim) {
      G.from(decals.map((d) => $('.decal__face', d)), {
        y: -60, rotation: (i) => [-9, 7, -6, 8, -7][i % 5], scale: 1.14, opacity: 0,
        duration: 1.1, ease: 'back.out(1.6)', stagger: 0.1, clearProps: 'transform,opacity',
        scrollTrigger: { trigger: '[data-sheet]', start: 'top 78%', once: true },
      });
    }
    if (!fine || reduce) return;
    decals.forEach((d) => {
      const face = $('.decal__face', d);
      d.addEventListener('pointermove', (e) => {
        const r = face.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        face.style.setProperty('--rx', `${(-py * 14).toFixed(2)}deg`);
        face.style.setProperty('--ry', `${(px * 16).toFixed(2)}deg`);
        face.style.setProperty('--mx', `${((px + 0.5) * 100).toFixed(1)}%`);
      });
      d.addEventListener('pointerleave', () => {
        face.style.setProperty('--rx', '0deg');
        face.style.setProperty('--ry', '0deg');
        face.style.setProperty('--mx', '50%');
      });
    });
  }

  /* ------------------------------------------------------------ officina: ordine di lavoro */
  function initWorkshop() {
    const rows = $$('.worder__row');
    const imgs = $$('[data-shop-frame] img');
    const cap = $('[data-shop-cap]');
    let cur = 0;
    const show = (i) => {
      if (i === cur || !imgs[i]) return;
      imgs.forEach((im) => im.classList.remove('is-prev'));
      imgs[cur].classList.remove('is-active');
      imgs[cur].classList.add('is-prev');
      imgs[i].classList.add('is-active');
      cur = i;
      if (cap) cap.textContent = $('.worder__name', rows[i]).textContent;
    };
    rows.forEach((row, i) => {
      const btn = $('.worder__btn', row);
      btn.addEventListener('click', () => {
        const open = !row.classList.contains('is-open');
        rows.forEach((r) => {
          r.classList.remove('is-open');
          $('.worder__btn', r).setAttribute('aria-expanded', 'false');
        });
        if (open) {
          row.classList.add('is-open');
          btn.setAttribute('aria-expanded', 'true');
        }
        show(i);
        setTimeout(() => ST?.refresh(), 650);
      });
      if (fine) row.addEventListener('pointerenter', () => show(i));
      btn.addEventListener('focus', () => show(i));
    });

    const date = $('[data-wo-date]');
    if (date) date.textContent = new Intl.DateTimeFormat('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Europe/Rome' }).format(new Date());

    if (anim) {
      G.fromTo('.shop', { clipPath: 'inset(0% 3.5% 0% 3.5%)' }, {
        clipPath: 'inset(0% 0% 0% 0%)', ease: 'none',
        scrollTrigger: { trigger: '.shop', start: 'top bottom', end: 'top 35%', scrub: true },
      });
      G.from(rows, {
        opacity: 0, y: 28, duration: 0.9, ease: 'power3.out', stagger: 0.07,
        scrollTrigger: { trigger: '.worder', start: 'top 80%', once: true },
      });
    }
  }

  /* ------------------------------------------------------------ metodo: profilo altimetrico */
  function initProfile() {
    const box = $('[data-profile]');
    if (!box) return;
    const line = $('.pline', box);
    const clip = $('.profile__clip', box);
    const rider = $('.prider', box);
    const altEl = $('[data-alt]', box);
    const stages = $$('.stage', box);
    const marks = $$('.pmark', box);
    const L = line.getTotalLength();
    const Y0 = 450;
    const Y1 = 70;
    line.style.strokeDasharray = `${L} ${L}`;

    const set = (p) => {
      line.style.strokeDashoffset = String(L * (1 - p));
      const pt = line.getPointAtLength(L * p);
      rider.setAttribute('transform', `translate(${pt.x.toFixed(1)} ${pt.y.toFixed(1)})`);
      clip.setAttribute('width', pt.x.toFixed(1));
      const alt = 534 + ((Y0 - pt.y) / (Y0 - Y1)) * 2210;
      altEl.textContent = String(Math.round(alt)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      const px = clamp((pt.x - 20) / 1560, 0, 1);
      stages.forEach((s, i) => {
        const local = clamp(px * 4 - i, 0, 1);
        s.style.setProperty('--p', local.toFixed(3));
        s.classList.toggle('is-on', px * 4 > i + 0.02 || (i === 0 && p > 0.005));
      });
      marks.forEach((m) => m.classList.toggle('is-on', px >= +m.dataset.p - 0.002));
    };

    if (!anim) {
      set(1);
      return;
    }
    set(0);
    const proxy = { p: 0 };
    const mm = G.matchMedia();
    mm.add('(min-width: 900px)', () => {
      G.to(proxy, {
        p: 1, ease: 'none', onUpdate: () => set(proxy.p),
        scrollTrigger: { trigger: box, start: 'center 52%', end: '+=1500', pin: true, scrub: 0.8, anticipatePin: 1 },
      });
    });
    mm.add('(max-width: 899px)', () => {
      G.to(proxy, {
        p: 1, ease: 'none', onUpdate: () => set(proxy.p),
        scrollTrigger: { trigger: box, start: 'top 70%', end: 'bottom 35%', scrub: 0.6 },
      });
    });
  }

  /* ------------------------------------------------------------ recensioni */
  function initVoices() {
    if (!anim) return;
    G.fromTo('.star__f', { scale: 0, transformOrigin: '50% 50%' }, {
      scale: 1, duration: 0.6, ease: 'back.out(2.4)', stagger: 0.12,
      scrollTrigger: { trigger: '.stars', start: 'top 88%', once: true },
    });
    const clips = $$('.clip');
    G.from(clips, {
      y: 70, rotation: (i) => (i % 2 ? 7 : -7), opacity: 0, duration: 1.1, ease: 'back.out(1.3)', stagger: 0.1,
      clearProps: 'transform,opacity',
      scrollTrigger: { trigger: '[data-board]', start: 'top 78%', once: true },
    });
    G.from($$('.clip__tape'), {
      scaleX: 0, duration: 0.6, ease: 'power3.out', stagger: 0.1, delay: 0.45, clearProps: 'transform',
      scrollTrigger: { trigger: '[data-board]', start: 'top 78%', once: true },
    });
  }

  /* ------------------------------------------------------------ cartellino di prenotazione */
  function initTag() {
    const form = $('[data-tag-form]');
    if (!form) return;
    const wrap = $('[data-tag]');
    const stub = $('[data-stub]', form);
    const err = $('[data-tag-error]', form);
    const done = $('[data-tag-done]');
    const nameInput = $('#f-name', form);
    const ticket = String(Math.floor(Math.random() * 9000) + 1000);
    $$('[data-ticket]').forEach((b) => { b.textContent = ticket; });
    const sName = $('[data-stub-name]', form);
    const sInt = $('[data-stub-int]', form);

    const sync = () => {
      const fd = new FormData(form);
      sName.textContent = String(fd.get('nome') || '').trim() || '—';
      const ints = fd.getAll('int');
      sInt.textContent = ints.length ? ints.join(', ') : '—';
      if (nameInput.value.trim()) nameInput.removeAttribute('aria-invalid');
    };
    form.addEventListener('input', sync);
    form.addEventListener('change', sync);

    const shake = () => {
      form.classList.remove('is-shake');
      void form.offsetWidth;
      form.classList.add('is-shake');
    };
    form.addEventListener('animationend', (e) => { if (e.animationName === 'shake') form.classList.remove('is-shake'); });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const nome = String(fd.get('nome') || '').trim();
      const bici = String(fd.get('bici') || '').trim();
      const note = String(fd.get('note') || '').trim();
      const ints = fd.getAll('int');
      if (!nome) {
        err.textContent = 'Scrivi il tuo nome sul cartellino.';
        nameInput.setAttribute('aria-invalid', 'true');
        nameInput.focus();
        shake();
        return;
      }
      if (!ints.length && !note) {
        err.textContent = 'Spunta almeno un intervento o lascia una nota.';
        shake();
        return;
      }
      err.textContent = '';
      const lines = [
        'Ciao 12100 Cycling Studio! Vorrei prenotare un intervento in officina.',
        '',
        `Cartellino N° ${ticket}`,
        `Nome: ${nome}`,
        `Bici: ${[bici, fd.get('tipo')].filter(Boolean).join(' · ')}`,
      ];
      if (ints.length) lines.push(`Intervento: ${ints.join(', ')}`);
      lines.push(`Quando: ${fd.get('quando')}`);
      if (note) lines.push(`Note: ${note}`);
      const url = waLink(lines.join('\n'));
      window.open(url, '_blank', 'noopener');
      $('[data-wa-fallback]').href = url;

      stub.classList.remove('is-back');
      stub.classList.add('is-torn');
      done.hidden = false;
      setTimeout(() => {
        stub.classList.remove('is-torn');
        stub.classList.add('is-back');
      }, 5200);
    });

    if (!fine || reduce) return;
    // Il cartellino oscilla appeso al suo spago quando ci passi sopra.
    let a = 0;
    let va = 0;
    let push = 0;
    let raf = 0;
    let lastX = null;
    const tick = () => {
      va += (push - a) * 0.05;
      va *= 0.9;
      a += va;
      push *= 0.88;
      form.style.setProperty('--swing', `${a.toFixed(3)}deg`);
      raf = Math.abs(a) > 0.01 || Math.abs(va) > 0.01 || Math.abs(push) > 0.01 ? requestAnimationFrame(tick) : 0;
    };
    const nudge = (amount) => {
      push = clamp(push + amount, -3.5, 3.5);
      if (!raf) raf = requestAnimationFrame(tick);
    };
    wrap.addEventListener('pointermove', (e) => {
      if (form.contains(document.activeElement) && document.activeElement !== document.body) {
        lastX = null;
        return;
      }
      if (lastX !== null) nudge((e.clientX - lastX) * 0.035);
      lastX = e.clientX;
    });
    wrap.addEventListener('pointerleave', () => { lastX = null; });
    const io = new IntersectionObserver((entries) => {
      if (entries.some((en) => en.isIntersecting)) {
        io.disconnect();
        va = 1.4;
        nudge(0);
      }
    }, { threshold: 0.35 });
    io.observe(form);
  }

  /* ------------------------------------------------------------ mappa su consenso */
  function initMap() {
    const btn = $('[data-map-load]');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const map = $('[data-map]');
      const f = document.createElement('iframe');
      f.src = 'https://www.google.com/maps?q=12100%20Cycling%20Studio%2C%20Via%20San%20Giovanni%20Bosco%2010%2C%2012100%20Cuneo&z=16&output=embed';
      f.setAttribute('aria-label', 'Mappa: 12100 Cycling Studio, Via San Giovanni Bosco 10, Cuneo');
      f.loading = 'lazy';
      f.referrerPolicy = 'no-referrer-when-downgrade';
      f.allowFullscreen = true;
      map.appendChild(f);
      map.classList.add('is-loaded');
      f.focus();
    });
  }

  /* ------------------------------------------------------------ instagram: lettere che "cambiano rapporto" */
  function initHandle() {
    const el = $('[data-roll-text]');
    if (!el || reduce) return;
    const text = el.textContent;
    const chars = [...text].map((ch, i) => `<span class="ch" style="--i:${i}">${ch}</span>`).join('');
    el.innerHTML = `<span class="sr-only">${text}</span><span aria-hidden="true">${chars}</span>`;
  }

  /* ------------------------------------------------------------ footer: la bici attraversa la strada */
  function initFooterBike() {
    const svg = $('.minibike');
    if (!svg || !anim) return;
    const box = $('.foot__ride');
    const rots = $$('.mb-rot', svg);
    const crank = $('.mb-crank', svg);
    const pedal = $('.mb-pedal', svg);
    const chain = $('.mb-chain', svg);
    const VBW = 1720;
    const proxy = { p: 0 };
    const set = () => {
      const bw = svg.getBoundingClientRect().width || 1;
      const w = box.clientWidth;
      const px = -bw + (w + bw) * proxy.p;
      svg.style.transform = `translateX(${px.toFixed(1)}px)`;
      const units = px * (VBW / bw);
      const deg = (units / 340) * (180 / Math.PI);
      rots.forEach((r) => r.setAttribute('transform', `rotate(${deg.toFixed(2)} ${r.dataset.cx} ${r.dataset.cy})`));
      const c = deg / 3.06;
      crank.setAttribute('transform', `rotate(${c.toFixed(2)} 404 -270)`);
      pedal.setAttribute('transform', `rotate(${(-c).toFixed(2)} ${pedal.dataset.cx} ${pedal.dataset.cy})`);
      chain.style.strokeDashoffset = String((-(units / 340) * 46).toFixed(2));
    };
    set();
    let tw = null;
    const go = () => {
      tw?.kill();
      proxy.p = 0;
      tw = G.to(proxy, { p: 1, duration: 6.5, ease: 'power1.inOut', onUpdate: set });
    };
    ST.create({ trigger: box, start: 'top 92%', onEnter: go, onEnterBack: go });
  }

  /* ------------------------------------------------------------ varie */
  $$('[data-year]').forEach((el) => { el.textContent = String(new Date().getFullYear()); });

  initHero();
  initBike();
  initReveals();
  initPhotoFinish();
  initRolls();
  initRack();
  initDecals();
  initWorkshop();
  initProfile();
  initVoices();
  initTag();
  initMap();
  initHandle();
  initFooterBike();

  if (anim) {
    document.fonts?.ready.then(() => ST.refresh());
    addEventListener('load', () => ST.refresh());
  }
  doc.classList.add('ready');
})();
