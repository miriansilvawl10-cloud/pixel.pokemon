/* ============================================================
   POKÉDEX — Enhancements
   Animações, interações e melhorias visuais
   Carregado após app.js em todas as páginas
   ============================================================ */

/* ── 1. SCROLL REVEAL (IntersectionObserver) ─────────────────
   Adiciona a classe .visible nos elementos com .reveal
   quando entram na viewport, com delay escalonado por índice
   ------------------------------------------------------------ */
(function initReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

  function attachReveal() {
    // Seções e títulos
    document.querySelectorAll(
      '.section, .section-header, .page-header, .gen-card, .region-card, ' +
      '.type-card, .ability-card, .credits-card, .compare-slot, ' +
      '.quick-card, .footer-col, .footer-brand'
    ).forEach((el, i) => {
      if (el.classList.contains('reveal')) return;
      el.classList.add('reveal');
      el.style.transitionDelay = `${Math.min(i * 40, 300)}ms`;
      observer.observe(el);
    });

    // Cards Pokémon — escalonamento por grupo de 8
    document.querySelectorAll('.pokemon-card:not(.reveal)').forEach((el, i) => {
      el.classList.add('reveal');
      el.style.transitionDelay = `${(i % 8) * 55}ms`;
      observer.observe(el);
    });

    // Itens da timeline
    document.querySelectorAll('.timeline-item:not(.reveal)').forEach((el, i) => {
      el.classList.add('reveal', 'reveal-left');
      el.style.transitionDelay = `${i * 80}ms`;
      observer.observe(el);
    });

    // Filmes e flip-cards
    document.querySelectorAll('.filme-card:not(.reveal), .flip-card:not(.reveal)').forEach((el, i) => {
      el.classList.add('reveal');
      el.style.transitionDelay = `${i * 70}ms`;
      observer.observe(el);
    });
  }

  // Roda imediatamente e re-observa quando novos cards são inseridos
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attachReveal);
  } else {
    attachReveal();
  }

  // Re-observa novos elementos (infinite scroll / lazy load)
  const mutationObs = new MutationObserver(() => attachReveal());
  document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('pokemonGrid') || document.getElementById('featuredGrid');
    if (grid) mutationObs.observe(grid, { childList: true, subtree: false });
  });
})();


/* ── 2. HOVER 3D NOS CARDS (mouse tilt) ─────────────────────
   Inclina suavemente o card acompanhando a posição do mouse
   ------------------------------------------------------------ */
(function initCard3D() {
  // Respeita prefers-reduced-motion
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  function onMove(e) {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / (rect.width / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);
    const tiltX = dy * -8;  // max 8° vertical
    const tiltY = dx * 8;   // max 8° horizontal
    const shine = ((dx + 1) / 2) * 100;
    card.style.transform = `perspective(600px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateY(-8px) scale(1.02)`;
    // Atualiza brilho dinâmico
    let shineEl = card.querySelector('.card-shine');
    if (!shineEl) {
      shineEl = document.createElement('div');
      shineEl.className = 'card-shine';
      shineEl.style.cssText =
        'position:absolute;inset:0;border-radius:inherit;pointer-events:none;' +
        'background:radial-gradient(circle at var(--sx,50%) var(--sy,50%), rgba(255,255,255,0.18) 0%, transparent 60%);' +
        'transition:opacity 0.3s;';
      card.appendChild(shineEl);
    }
    shineEl.style.setProperty('--sx', `${shine}%`);
    shineEl.style.setProperty('--sy', `${((dy + 1) / 2) * 100}%`);
    shineEl.style.opacity = '1';
  }

  function onLeave(e) {
    const card = e.currentTarget;
    card.style.transform = '';
    const shineEl = card.querySelector('.card-shine');
    if (shineEl) shineEl.style.opacity = '0';
  }

  function attachTilt() {
    document.querySelectorAll('.pokemon-card:not([data-tilt])').forEach(card => {
      card.setAttribute('data-tilt', '1');
      card.addEventListener('mousemove', onMove);
      card.addEventListener('mouseleave', onLeave);
    });
  }

  document.addEventListener('DOMContentLoaded', attachTilt);

  // Re-aplica em novos cards inseridos dinamicamente
  const mo = new MutationObserver(attachTilt);
  document.addEventListener('DOMContentLoaded', () => {
    const root = document.querySelector('main') || document.body;
    mo.observe(root, { childList: true, subtree: true });
  });
})();


/* ── 3. BARRAS DE STAT ANIMADAS COM CONTADOR ─────────────────
   Preenche as barras quando entram na tela e anima o número
   ------------------------------------------------------------ */
(function initStatBars() {
  const statObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const bar = entry.target;
      const pct = parseFloat(bar.dataset.pct) || 0;
      const valEl = bar.closest('.stat-row')?.querySelector('.stat-value');
      const maxVal = Math.round(pct * 2.55); // reverse from percentage

      // Anima a barra
      requestAnimationFrame(() => {
        bar.style.width = pct + '%';
      });

      // Anima o contador
      if (valEl && !valEl.dataset.animated) {
        valEl.dataset.animated = '1';
        const target = parseInt(valEl.textContent) || 0;
        let start = 0;
        const duration = 900;
        const startTime = performance.now();
        function tick(now) {
          const elapsed = now - startTime;
          const progress = Math.min(elapsed / duration, 1);
          // easeOutCubic
          const eased = 1 - Math.pow(1 - progress, 3);
          valEl.textContent = Math.round(start + (target - start) * eased);
          if (progress < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      }

      statObserver.unobserve(bar);
    });
  }, { threshold: 0.3 });

  function attachStatBars() {
    document.querySelectorAll('.stat-bar-fill:not([data-stat-obs])').forEach(bar => {
      bar.setAttribute('data-stat-obs', '1');
      bar.style.width = '0%'; // reset para animar
      statObserver.observe(bar);
    });
  }

  document.addEventListener('DOMContentLoaded', attachStatBars);

  // Re-aplica quando tab de stats é aberta
  document.addEventListener('click', e => {
    if (e.target.closest('[onclick*="stats"]') || e.target.closest('.tab-btn')) {
      setTimeout(attachStatBars, 150);
    }
  });
})();


/* ── 4. HERO: POKÉBOLA CENTRAL + PARALLAX DE MOUSE ──────────
   Injeta a pokébola SVG e move os orbs com o mouse
   ------------------------------------------------------------ */
(function initHeroEffects() {
  document.addEventListener('DOMContentLoaded', () => {
    const hero = document.querySelector('.hero');
    if (!hero) return;

    // ── Pokébola SVG central ──
    const ball = document.createElement('div');
    ball.className = 'hero-pokeball';
    ball.setAttribute('aria-hidden', 'true');
    ball.innerHTML = `
      <svg class="hero-pokeball-svg" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="100" cy="100" r="96" stroke="#2563eb" stroke-width="3"/>
        <path d="M4 100 Q100 100 196 100" stroke="#2563eb" stroke-width="3"/>
        <path d="M4 100 A96 96 0 0 1 196 100" fill="rgba(37,99,235,0.06)"/>
        <circle cx="100" cy="100" r="22" stroke="#2563eb" stroke-width="3" fill="white"/>
        <circle cx="100" cy="100" r="12" fill="#2563eb" stroke="#2563eb" stroke-width="2"/>
        <circle cx="100" cy="100" r="6" fill="white"/>
        <!-- detalhes decorativos -->
        <circle cx="100" cy="100" r="96" stroke="#93c5fd" stroke-width="0.5" stroke-dasharray="4 6"/>
        <line x1="100" y1="4" x2="100" y2="78" stroke="#bfdbfe" stroke-width="1"/>
        <line x1="100" y1="122" x2="100" y2="196" stroke="#bfdbfe" stroke-width="1"/>
      </svg>`;
    hero.insertBefore(ball, hero.firstChild);

    // ── Parallax de mouse nos orbs ──
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const orbs = hero.querySelector('.hero-bg-orbs');
    let rafId = null;
    let targetX = 0, targetY = 0, currX = 0, currY = 0;

    hero.addEventListener('mousemove', e => {
      const rect = hero.getBoundingClientRect();
      targetX = ((e.clientX - rect.left) / rect.width - 0.5) * 30;
      targetY = ((e.clientY - rect.top) / rect.height - 0.5) * 20;
    });

    hero.addEventListener('mouseleave', () => {
      targetX = 0; targetY = 0;
    });

    function animateParallax() {
      currX += (targetX - currX) * 0.06;
      currY += (targetY - currY) * 0.06;
      if (orbs) {
        orbs.style.transform = `translate(${currX}px, ${currY}px)`;
      }
      if (ball) {
        ball.style.transform = `translate(calc(-50% + ${-currX * 0.4}px), calc(-50% + ${-currY * 0.4}px))`;
      }
      rafId = requestAnimationFrame(animateParallax);
    }
    animateParallax();
  });
})();


/* ── 5. TÍTULO LETRA-POR-LETRA ───────────────────────────────
   Quebra o texto do hero-title em spans .char e anima
   ------------------------------------------------------------ */
(function initCharAnimation() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  document.addEventListener('DOMContentLoaded', () => {
    const titleSpans = document.querySelectorAll('.hero-title .line1');
    titleSpans.forEach(span => {
      const text = span.textContent;
      let delay = 0;
      span.innerHTML = text.split('').map((ch, i) => {
        const d = (delay + i * 0.045).toFixed(2);
        if (ch === ' ') return `<span class="char" style="animation-delay:${d}s;display:inline-block;width:0.3em"> </span>`;
        return `<span class="char" style="animation-delay:${d}s">${ch}</span>`;
      }).join('');
    });
  });
})();


/* ── 6. BOTÃO POKÉMON ALEATÓRIO ──────────────────────────────
   Injeta o botão na hero-search e na pokedex, com animação
   ------------------------------------------------------------ */
(function initRandomButton() {
  document.addEventListener('DOMContentLoaded', () => {
    // Injeta na hero search
    const heroSearch = document.querySelector('.hero-search');
    if (heroSearch) {
      const btn = document.createElement('button');
      btn.className = 'btn-random';
      btn.setAttribute('aria-label', 'Ver Pokémon aleatório');
      btn.title = 'Pokémon aleatório';
      btn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <polyline points="16 3 21 3 21 8"/>
          <line x1="4" y1="20" x2="21" y2="3"/>
          <polyline points="21 16 21 21 16 21"/>
          <line x1="15" y1="15" x2="21" y2="21"/>
        </svg>`;
      btn.addEventListener('click', goRandom);
      heroSearch.appendChild(btn);
    }

    // Injeta na search-row da pokédex
    const searchRow = document.querySelector('.search-row');
    if (searchRow) {
      const btn = document.createElement('button');
      btn.className = 'btn-random';
      btn.setAttribute('aria-label', 'Ver Pokémon aleatório');
      btn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <polyline points="16 3 21 3 21 8"/>
          <line x1="4" y1="20" x2="21" y2="3"/>
          <polyline points="21 16 21 21 16 21"/>
          <line x1="15" y1="15" x2="21" y2="21"/>
        </svg>
        Aleatório`;
      btn.addEventListener('click', goRandom);
      searchRow.appendChild(btn);
    }
  });

  function goRandom() {
    // Feedback visual antes de navegar
    const btns = document.querySelectorAll('.btn-random');
    btns.forEach(b => {
      b.classList.add('spinning');
      setTimeout(() => b.classList.remove('spinning'), 500);
    });
    const id = Math.floor(Math.random() * 898) + 1;
    setTimeout(() => {
      window.location.href = `pokemon.html?id=${id}`;
    }, 400);
  }

  window.goRandom = goRandom;
})();


/* ── 7. ANIMAÇÃO DE CORAÇÃO NO FAVORITAR ─────────────────────
   Dispara partículas de coração ao clicar em favoritar
   ------------------------------------------------------------ */
(function initFavoriteAnimation() {
  document.addEventListener('click', e => {
    const btn = e.target.closest('.btn-favorite, .fav-card-remove');
    if (!btn) return;

    // Pop de coração
    btn.classList.add('heart-pop');
    setTimeout(() => btn.classList.remove('heart-pop'), 400);

    // Partículas flutuantes
    spawnHearts(btn);
  });

  function spawnHearts(origin) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const rect = origin.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    for (let i = 0; i < 5; i++) {
      const heart = document.createElement('span');
      heart.textContent = '♥';
      heart.style.cssText = `
        position:fixed;
        left:${cx}px; top:${cy}px;
        font-size:${12 + Math.random() * 10}px;
        color:#ef4444;
        pointer-events:none;
        z-index:9999;
        transform:translate(-50%,-50%);
        animation: heartFloat 0.8s ease forwards;
        animation-delay:${i * 60}ms;
        --dx: ${(Math.random() - 0.5) * 60}px;
        --dy: ${-30 - Math.random() * 40}px;
      `;
      document.body.appendChild(heart);
      setTimeout(() => heart.remove(), 900 + i * 60);
    }

    // CSS da animação (injeta uma vez)
    if (!document.getElementById('heart-float-style')) {
      const s = document.createElement('style');
      s.id = 'heart-float-style';
      s.textContent = `@keyframes heartFloat {
        0%   { opacity:1; transform:translate(-50%,-50%) scale(1); }
        100% { opacity:0; transform:translate(calc(-50% + var(--dx)), calc(-50% + var(--dy))) scale(0.5); }
      }`;
      document.head.appendChild(s);
    }
  }
})();


/* ── 8. NAVEGAÇÃO POR TECLADO NAS LISTAS ─────────────────────
   Arrow keys para navegar entre cards Pokémon
   ------------------------------------------------------------ */
(function initKeyboardNav() {
  document.addEventListener('keydown', e => {
    const focused = document.activeElement;
    if (!focused?.classList.contains('pokemon-card')) return;

    const cards = Array.from(document.querySelectorAll('.pokemon-card'));
    const idx = cards.indexOf(focused);
    if (idx === -1) return;

    let next = -1;
    if (e.key === 'ArrowRight') next = idx + 1;
    else if (e.key === 'ArrowLeft') next = idx - 1;
    else if (e.key === 'ArrowDown') {
      // Descobre quantas colunas há
      const cols = Math.round(
        (focused.parentElement?.offsetWidth || 1200) / (focused.offsetWidth + 20)
      );
      next = idx + cols;
    } else if (e.key === 'ArrowUp') {
      const cols = Math.round(
        (focused.parentElement?.offsetWidth || 1200) / (focused.offsetWidth + 20)
      );
      next = idx - cols;
    }

    if (next >= 0 && next < cards.length) {
      e.preventDefault();
      cards[next].focus();
      cards[next].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  });
})();


/* ── 9. TOAST MELHORADO ──────────────────────────────────────
   Substitui o notify padrão com ícone e animação mais rica
   ------------------------------------------------------------ */
(function enhanceNotify() {
  const ICONS = {
    success: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`,
    error:   `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
    info:    `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
  };

  // Override da função global notify (definida no app.js)
  window.addEventListener('load', () => {
    if (typeof window.notify !== 'function') return;
    const _original = window.notify;
    window.notify = function(msg, type = 'info') {
      const el = document.getElementById('notification');
      if (!el) { _original(msg, type); return; }
      el.innerHTML = `${ICONS[type] || ICONS.info}<span>${msg}</span>`;
      el.className = `notification ${type} show`;
      clearTimeout(el._hideTimer);
      el._hideTimer = setTimeout(() => el.classList.remove('show'), 3200);
    };
  });
})();


/* ── 10. CARDS: data-type PARA SOMBRA COLORIDA ───────────────
   Adiciona o atributo data-type ao card para o CSS aplicar
   a sombra colorida correta por tipo
   ------------------------------------------------------------ */
(function patchBuildCard() {
  window.addEventListener('load', () => {
    if (typeof window.buildCard !== 'function') return;
    const _original = window.buildCard;
    window.buildCard = function(pokemon, delay = 0) {
      const html = _original(pokemon, delay);
      const primaryType = pokemon.types?.[0]?.type?.name || 'normal';
      // Injeta data-type no primeiro elemento article
      return html.replace('<article ', `<article data-type="${primaryType}" `);
    };
  });
})();


/* ── 11. FILTROS COM RIPPLE ──────────────────────────────────
   Efeito de onda ao clicar nos chips de filtro
   ------------------------------------------------------------ */
(function initFilterRipple() {
  document.addEventListener('click', e => {
    const tab = e.target.closest('.filter-tab');
    if (!tab) return;

    const ripple = document.createElement('span');
    const rect = tab.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    ripple.style.cssText = `
      position:absolute;
      width:${size}px; height:${size}px;
      left:${e.clientX - rect.left - size/2}px;
      top:${e.clientY - rect.top - size/2}px;
      background:rgba(37,99,235,0.2);
      border-radius:50%;
      transform:scale(0);
      animation:rippleAnim 0.45s ease-out forwards;
      pointer-events:none;
    `;
    tab.style.position = 'relative';
    tab.style.overflow = 'hidden';
    tab.appendChild(ripple);
    setTimeout(() => ripple.remove(), 450);
  });

  if (!document.getElementById('ripple-style')) {
    const s = document.createElement('style');
    s.id = 'ripple-style';
    s.textContent = `@keyframes rippleAnim {
      to { transform:scale(2.5); opacity:0; }
    }`;
    document.head.appendChild(s);
  }
})();


/* ── 12. SCROLL PROGRESS BAR ─────────────────────────────────
   Barra de progresso de leitura no topo (para universo.html)
   Funciona em qualquer página mas é mais visível lá
   ------------------------------------------------------------ */
(function initProgressBar() {
  document.addEventListener('DOMContentLoaded', () => {
    const bar = document.querySelector('.progress-bar-read');
    if (!bar) return;
    window.addEventListener('scroll', () => {
      const scrollTop = window.scrollY;
      const docH = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = docH > 0 ? `${(scrollTop / docH) * 100}%` : '0%';
    }, { passive: true });
  });
})();


/* ── 13. FLIP CARDS (cultura pop) ────────────────────────────
   Vira os cards ao clicar ou pressionar Enter
   ------------------------------------------------------------ */
(function initFlipCards() {
  document.addEventListener('click', e => {
    const card = e.target.closest('.flip-card');
    if (card) card.classList.toggle('flipped');
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      const card = e.target.closest('.flip-card');
      if (card) { e.preventDefault(); card.classList.toggle('flipped'); }
    }
  });
})();


/* ── 14. SEÇÃO HISTÓRIA — Reveal alternado esquerda/direita ──
   Observa cada .historia-bloco e adiciona .historia-visible
   quando entra na viewport
   ------------------------------------------------------------ */
(function initHistoriaReveal() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    // Garante visibilidade sem animação
    document.querySelectorAll('.historia-bloco').forEach(el => {
      el.classList.add('historia-visible');
    });
    return;
  }

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('historia-visible');
      obs.unobserve(entry.target);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

  function attach() {
    document.querySelectorAll('.historia-bloco:not([data-hist-obs])').forEach(el => {
      el.setAttribute('data-hist-obs', '1');
      obs.observe(el);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attach);
  } else {
    attach();
  }

  // Lazy load das imagens da história
  document.addEventListener('DOMContentLoaded', () => {
    const imgs = document.querySelectorAll('.historia-img[data-src]');
    const imgObs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const img = entry.target;
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
        imgObs.unobserve(img);
      });
    }, { rootMargin: '200px' });
    imgs.forEach(img => imgObs.observe(img));
  });
})();


/* ── 15. ELEMENTOS AMBIENTES — Partículas + Orbes + Grid ─────
   Cria partículas flutuantes e orbes coloridos dinamicamente
   Desativado com prefers-reduced-motion
   ------------------------------------------------------------ */
(function initAmbientEffects() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  document.addEventListener('DOMContentLoaded', () => {

    // ── Grid retrô ──
    const grid = document.createElement('div');
    grid.className = 'ambient-grid';
    grid.setAttribute('aria-hidden', 'true');
    document.body.insertBefore(grid, document.body.firstChild);

    // ── Orbes coloridos por tipo Pokémon ──
    const orbColors = [
      { color: 'rgba(59,130,246,1)',   opacity: 0.07, size: 400 },
      { color: 'rgba(96,165,250,1)',   opacity: 0.06, size: 320 },
      { color: 'rgba(186,230,253,1)',  opacity: 0.08, size: 280 },
      { color: 'rgba(249,115,22,1)',   opacity: 0.04, size: 200 },
      { color: 'rgba(34,197,94,1)',    opacity: 0.04, size: 180 },
      { color: 'rgba(168,85,247,1)',   opacity: 0.04, size: 160 },
    ];

    const positions = [
      { top: '5%',  left: '-5%'  },
      { top: '40%', right: '-8%' },
      { top: '75%', left: '3%'   },
      { top: '15%', right: '10%' },
      { top: '60%', left: '40%'  },
      { top: '85%', right: '20%' },
    ];

    orbColors.forEach((orb, i) => {
      const el = document.createElement('div');
      el.className = 'ambient-orb';
      el.setAttribute('aria-hidden', 'true');
      const pos = positions[i] || { top: '50%', left: '50%' };
      const dur = 12 + i * 4;
      const pulseDur = 6 + i * 2;
      Object.assign(el.style, {
        width:  orb.size + 'px',
        height: orb.size + 'px',
        background: `radial-gradient(circle, ${orb.color} 0%, transparent 70%)`,
        animationDuration: `${dur}s, ${pulseDur}s`,
        ...pos,
      });
      el.style.setProperty('--orb-opacity', orb.opacity);
      el.style.setProperty('--ox',  `${(i % 2 === 0 ? 1 : -1) * (15 + i * 5)}px`);
      el.style.setProperty('--oy',  `${-10 - i * 4}px`);
      el.style.setProperty('--oy2', `${8 + i * 3}px`);
      document.body.insertBefore(el, document.body.firstChild);
    });

    // ── Partículas flutuantes ──
    const container = document.createElement('div');
    container.className = 'ambient-particles';
    container.setAttribute('aria-hidden', 'true');
    document.body.insertBefore(container, document.body.firstChild);

    const particleColors = [
      '#93c5fd', '#60a5fa', '#3b82f6', '#bfdbfe',
      '#ffffff',  '#e0eaff', '#7dd3fc',
    ];

    function createParticle() {
      const p = document.createElement('div');
      p.className = 'ambient-particle';
      const size  = 3 + Math.random() * 5;
      const left  = Math.random() * 100;
      const dur   = 8 + Math.random() * 16;
      const delay = Math.random() * 12;
      const drift = (Math.random() - 0.5) * 80;
      const color = particleColors[Math.floor(Math.random() * particleColors.length)];
      const opacity = 0.15 + Math.random() * 0.2;

      Object.assign(p.style, {
        width:  size + 'px',
        height: size + 'px',
        left:   left + '%',
        bottom: '-20px',
        background: color,
        animationDuration:  dur + 's',
        animationDelay:     delay + 's',
      });
      p.style.setProperty('--p-opacity', opacity);
      p.style.setProperty('--p-drift',   drift + 'px');

      container.appendChild(p);
      // Remove após 2 ciclos para não acumular DOM
      setTimeout(() => {
        if (p.parentNode) p.remove();
        createParticle(); // cria nova
      }, (dur + delay) * 1000 * 1.1);
    }

    // Cria 18 partículas iniciais
    for (let i = 0; i < 18; i++) {
      setTimeout(createParticle, i * 400);
    }

  });
})();
