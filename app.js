/* ============================================================
   POKÉDEX - Core Application
   Source: PokéAPI (https://pokeapi.co)
   ============================================================ */

const POKEAPI = 'https://pokeapi.co/api/v2';
const TOTAL_LIMIT = 10000; // fetch all available
const PAGE_SIZE = 40;

// ── Cache ────────────────────────────────────────────────────
const Cache = {
  _store: new Map(),
  get(key) { return this._store.get(key) || null; },
  set(key, value) { this._store.set(key, value); return value; },
  has(key) { return this._store.has(key); }
};

// ── HTTP helper ──────────────────────────────────────────────
async function fetchJSON(url) {
  if (Cache.has(url)) return Cache.get(url);
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    Cache.set(url, data);
    return data;
  } catch (e) {
    console.error('Fetch error:', url, e);
    throw e;
  }
}

// ── Type helpers ─────────────────────────────────────────────
const TYPE_COLORS = {
  normal:'#6b7280', fire:'#f97316', water:'#3b82f6', electric:'#ca8a04',
  grass:'#16a34a', ice:'#0891b2', fighting:'#b91c1c', poison:'#9333ea',
  ground:'#d97706', flying:'#6366f1', psychic:'#db2777', bug:'#65a30d',
  rock:'#78350f', ghost:'#4f46e5', dragon:'#3730a3', dark:'#374151',
  steel:'#4b5563', fairy:'#be185d', unknown:'#374151', shadow:'#374151'
};

function typeColor(type) { return TYPE_COLORS[type] || '#374151'; }

function typeBadge(type, size = '') {
  const cls = size === 'lg' ? 'type-badge-lg' : 'type-badge';
  return `<span class="${cls} type-${type}" style="background:${typeColor(type)}">${type}</span>`;
}

function padId(n) { return String(n).padStart(3, '0'); }

function getPokemonImage(pokemon) {
  const sp = pokemon.sprites;
  return sp?.other?.['official-artwork']?.front_default
      || sp?.other?.home?.front_default
      || sp?.front_default
      || null;
}

function getPokemonImageShiny(pokemon) {
  const sp = pokemon.sprites;
  return sp?.other?.['official-artwork']?.front_shiny
      || sp?.other?.home?.front_shiny
      || sp?.front_shiny
      || null;
}

// ── Notification ─────────────────────────────────────────────
function notify(msg, type = 'info') {
  const el = document.getElementById('notification');
  if (!el) return;
  el.textContent = msg;
  el.className = `notification ${type} show`;
  setTimeout(() => el.classList.remove('show'), 3000);
}

// ── Navbar scroll ────────────────────────────────────────────
function initNavbar() {
  const nav = document.querySelector('.navbar');
  const menuBtn = document.getElementById('menuBtn');
  const mobileMenu = document.getElementById('mobileMenu');
  if (!nav) return;

  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 20);
    const btt = document.getElementById('backToTop');
    if (btt) btt.classList.toggle('visible', window.scrollY > 400);
  });

  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener('click', () => {
      menuBtn.classList.toggle('open');
      mobileMenu.classList.toggle('open');
    });
  }

  const btt = document.getElementById('backToTop');
  if (btt) btt.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  // Active link
  const path = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a, .mobile-menu a').forEach(a => {
    if (a.getAttribute('href') === path) a.classList.add('active');
  });
}

// ── Lazy Image Observer ──────────────────────────────────────
const imgObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const img = entry.target;
      const src = img.dataset.src;
      if (src) {
        img.src = src;
        img.removeAttribute('data-src');
        imgObserver.unobserve(img);
        img.onerror = () => {
          img.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiMxMTE4MjciIHJ4PSI1MCIvPjxjaXJjbGUgY3g9IjUwIiBjeT0iNTAiIHI9IjMwIiBmaWxsPSJub25lIiBzdHJva2U9IiMxZTJkNDAiIHN0cm9rZS13aWR0aD0iNiIvPjxsaW5lIHgxPSIyMCIgeTE9IjUwIiB4Mj0iODAiIHkyPSI1MCIgc3Ryb2tlPSIjMWUyZDQwIiBzdHJva2Utd2lkdGg9IjYiLz48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI4IiBmaWxsPSIjMWUyZDQwIi8+PC9zdmc+';
        };
      }
    }
  });
}, { rootMargin: '200px' });

function lazyImg(src, alt, cls = '') {
  return `<img data-src="${src || ''}" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" alt="${alt}" class="${cls}" loading="lazy">`;
}

// ── Pokemon Card ─────────────────────────────────────────────
function buildCard(pokemon, delay = 0) {
  const id = pokemon.id;
  const name = pokemon.name;
  const types = pokemon.types || [];
  const img = getPokemonImage(pokemon);
  const primaryType = types[0]?.type?.name || 'normal';
  const color = typeColor(primaryType);

  return `
  <article class="pokemon-card" style="animation-delay:${delay}ms" data-id="${id}"
    role="article" aria-label="${name} - Número ${padId(id)}"
    tabindex="0" onkeypress="if(event.key==='Enter') openPokemon(${id})">
    <div class="card-type-bg bg-type-${primaryType}" style="background:${color}"></div>
    <span class="card-number">#${padId(id)}</span>
    <div class="card-image-wrapper">
      ${img
        ? `<img data-src="${img}" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
             alt="${name}" loading="lazy" width="110" height="110">`
        : `<div class="card-image-placeholder"><svg width="48" height="48" viewBox="0 0 100 100" fill="none" stroke="#1e2d40" stroke-width="6"><circle cx="50" cy="50" r="30"/><line x1="20" y1="50" x2="80" y2="50"/><circle cx="50" cy="50" r="8" fill="#1e2d40"/></svg></div>`
      }
    </div>
    <div class="card-body">
      <h3 class="card-name">${name}</h3>
      <div class="card-types">
        ${types.map(t => typeBadge(t.type.name)).join('')}
      </div>
      <button class="card-btn" onclick="openPokemon(${id})" aria-label="Ver detalhes de ${name}">
        Ver detalhes
      </button>
    </div>
  </article>`;
}

function observeCardImages() {
  document.querySelectorAll('.pokemon-card img[data-src]').forEach(img => imgObserver.observe(img));
}

function openPokemon(id) {
  window.location.href = `pokemon.html?id=${id}`;
}

// ── Skeleton Cards ───────────────────────────────────────────
function skeletonCards(n = 12) {
  return Array.from({ length: n }, () => `
    <div class="card-skeleton">
      <div class="skeleton sk-image"></div>
      <div class="skeleton sk-line medium"></div>
      <div class="skeleton sk-line short"></div>
      <div class="skeleton sk-line medium" style="height:30px;margin-top:12px"></div>
    </div>
  `).join('');
}

// ── Debounce ─────────────────────────────────────────────────
function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

// ── Expose globally ──────────────────────────────────────────
window.typeColor = typeColor;
window.typeBadge = typeBadge;
window.padId = padId;
window.getPokemonImage = getPokemonImage;
window.getPokemonImageShiny = getPokemonImageShiny;
window.fetchJSON = fetchJSON;
window.Cache = Cache;
window.POKEAPI = POKEAPI;
window.PAGE_SIZE = PAGE_SIZE;
window.buildCard = buildCard;
window.observeCardImages = observeCardImages;
window.skeletonCards = skeletonCards;
window.debounce = debounce;
window.notify = notify;
window.openPokemon = openPokemon;
window.imgObserver = imgObserver;
window.lazyImg = lazyImg;
window.TYPE_COLORS = TYPE_COLORS;
window.initNavbar = initNavbar;

document.addEventListener('DOMContentLoaded', initNavbar);
