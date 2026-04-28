// ═══════════════════════════════════════════════════════════════
//  SAITOX Portfolio – Navigation & Animation Controller
// ═══════════════════════════════════════════════════════════════

// ── STATE ──
let currentPage = 'home';   // 'home' | 'projects' | 'about'
let currentCat  = '3d';     // active project category
let isAnimating = false;     // lock to prevent overlapping transitions

// Animation duration (ms) — slightly longer for smoother feel
const DURATION = 580;

// Softer easing — less aggressive start/end than the original
const EASE = 'cubic-bezier(0.4, 0, 0.2, 1)';

// Timeout tracker to cancel stale panel transitions
let panelTimeout = null;

// ── ELEMENTS ──
const pageHome   = document.getElementById('page-home');
const pageInner  = document.getElementById('page-inner');
const homeTitle  = document.getElementById('home-title');
const homeNav    = document.getElementById('home-nav');
const innerTitle = document.getElementById('inner-title');
const innerNavEl = document.getElementById('inner-nav');
const flyTitle   = document.getElementById('fly-title');
const sharedLayer = document.getElementById('shared-layer');
const sidebar    = document.getElementById('sidebar');
const innerRule  = document.getElementById('inner-rule');
const titleMarkup = '<img class="title-logo" src="assets/img/logo.png" alt="SAITOX logo"><span>SAITOX</span>';

// ── HELPERS ──

/**
 * Snapshot an element's position and computed font-size.
 * Used to calculate start/end states for flying animations.
 */
function snapshot(el) {
  const r = el.getBoundingClientRect();
  const s = window.getComputedStyle(el);
  return { x: r.left, y: r.top, w: r.width, h: r.height, fs: parseFloat(s.fontSize) };
}

/**
 * Position a flying clone at the given snapshot using transform.
 * Uses translate for position and scale for font-size ratio.
 * This keeps everything on the compositor (GPU) for smooth 60fps.
 */
function positionClone(el, snap, baseFontSize) {
  el.style.left = snap.x + 'px';
  el.style.top  = snap.y + 'px';
  el.style.fontSize = baseFontSize + 'px';
  el.style.transform = `scale(${snap.fs / baseFontSize})`;
}

/**
 * Animate a flying clone from its current position to a target snapshot.
 * Only transforms are animated (GPU-composited, no reflow).
 */
function animateCloneTo(el, targetSnap, baseFontSize) {
  el.style.transition = `left ${DURATION}ms ${EASE}, top ${DURATION}ms ${EASE}, transform ${DURATION}ms ${EASE}`;
  el.style.left = targetSnap.x + 'px';
  el.style.top  = targetSnap.y + 'px';
  el.style.transform = `scale(${targetSnap.fs / baseFontSize})`;
}

// ── NAVIGATION ──

function navigate(target) {
  if (target === currentPage || isAnimating) return;
  const from = currentPage;
  currentPage = target;

  if (from === 'home' && (target === 'projects' || target === 'about')) {
    animateHomeToInner(target);
  } else if ((from === 'projects' || from === 'about') && target === 'home') {
    animateInnerToHome();
  } else {
    // Inner ↔ Inner (projects ↔ about)
    switchInnerView(target);
  }
}

// ── HOME → INNER ──

function animateHomeToInner(target) {
  isAnimating = true;

  // 1) Snapshot home elements in their current positions
  const htSnap  = snapshot(homeTitle);
  const hnItems = [...homeNav.querySelectorAll('.home-nav-item')];
  const hnSnaps = hnItems.map(snapshot);

  // 2) Switch DOM to inner page (kept invisible during measurement)
  pageInner.classList.add('active');
  pageHome.classList.remove('active');
  pageHome.style.opacity = '0';
  pageInner.style.opacity = '0';

  // Configure inner page content for the target section
  updateInnerNav(target);
  document.getElementById('sidebar-projects').style.display = target === 'projects' ? '' : 'none';
  document.getElementById('sidebar-about').style.display    = target === 'about'    ? '' : 'none';
  showPanel(target === 'projects' ? currentCat : 'about-me');

  // 3) Snapshot destination positions
  const itSnap  = snapshot(innerTitle);
  const inItems = [...innerNavEl.querySelectorAll('.inner-nav-item')];
  const inSnaps = inItems.map(snapshot);

  // 4) Hide real elements, create flying clones
  homeTitle.classList.add('hidden');
  hnItems.forEach(el => el.classList.add('hidden'));
  innerTitle.classList.add('hidden');
  inItems.forEach(el => el.classList.add('hidden'));
  innerRule.style.opacity = '0';

  // Flying title — use home font-size as the base reference for scaling
  const titleBase = htSnap.fs;
  flyTitle.innerHTML = titleMarkup;
  flyTitle.style.display = 'flex';
  flyTitle.style.transition = 'none';
  positionClone(flyTitle, htSnap, titleBase);

  // Flying nav items — each uses its own home font-size as base
  const flyNavs = hnItems.map((el, i) => {
    const clone = document.createElement('div');
    clone.className = 'fly-nav';
    clone.textContent = el.textContent;
    clone.style.transition = 'none';
    positionClone(clone, hnSnaps[i], hnSnaps[i].fs);
    sharedLayer.appendChild(clone);
    return { el: clone, baseFontSize: hnSnaps[i].fs };
  });

  // 5) Show inner page behind the flying clones
  pageInner.style.opacity = '1';

  // 6) Trigger animation on next frame (allows browser to apply initial styles)
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      animateCloneTo(flyTitle, itSnap, titleBase);

      flyNavs.forEach(({ el, baseFontSize }, i) => {
        animateCloneTo(el, inSnaps[i], baseFontSize);
      });
    });
  });

  // 7) Cleanup after animation completes
  setTimeout(() => {
    flyTitle.style.display = 'none';
    flyTitle.style.transition = 'none';
    flyNavs.forEach(({ el }) => el.remove());

    innerTitle.classList.remove('hidden');
    inItems.forEach(el => el.classList.remove('hidden'));

    // Fade in the horizontal rule
    innerRule.style.opacity = '1';

    isAnimating = false;
  }, DURATION + 20);
}

// ── INNER → HOME ──

function animateInnerToHome() {
  isAnimating = true;

  // 1) Snapshot inner elements
  const itSnap  = snapshot(innerTitle);
  const inItems = [...innerNavEl.querySelectorAll('.inner-nav-item')];
  const inSnaps = inItems.map(snapshot);

  // 2) Switch DOM to home page (invisible during measurement)
  pageHome.classList.add('active');
  pageHome.style.opacity = '1';
  pageInner.classList.remove('active');

  // 3) Snapshot home positions
  const htSnap  = snapshot(homeTitle);
  const hnItems = [...homeNav.querySelectorAll('.home-nav-item')];
  const hnSnaps = hnItems.map(snapshot);

  // 4) Hide real elements, create flying clones
  innerTitle.classList.add('hidden');
  inItems.forEach(el => el.classList.add('hidden'));
  homeTitle.classList.add('hidden');
  hnItems.forEach(el => el.classList.add('hidden'));
  innerRule.style.opacity = '0';

  // Flying title — use inner font-size as base for reverse animation
  const titleBase = itSnap.fs;
  flyTitle.innerHTML = titleMarkup;
  flyTitle.style.display = 'flex';
  flyTitle.style.transition = 'none';
  positionClone(flyTitle, itSnap, titleBase);

  // Flying nav items
  const flyNavs = inItems.map((el, i) => {
    const clone = document.createElement('div');
    clone.className = 'fly-nav';
    clone.textContent = el.textContent;
    clone.style.transition = 'none';
    positionClone(clone, inSnaps[i], inSnaps[i].fs);
    sharedLayer.appendChild(clone);
    return { el: clone, baseFontSize: inSnaps[i].fs };
  });

  // Hide inner page immediately (clones are visible on shared layer)
  pageInner.style.opacity = '0';

  // 5) Animate clones to home positions
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      animateCloneTo(flyTitle, htSnap, titleBase);

      flyNavs.forEach(({ el, baseFontSize }, i) => {
        animateCloneTo(el, hnSnaps[i], baseFontSize);
      });
    });
  });

  // 6) Cleanup
  setTimeout(() => {
    flyTitle.style.display = 'none';
    flyTitle.style.transition = 'none';
    flyNavs.forEach(({ el }) => el.remove());

    homeTitle.classList.remove('hidden');
    hnItems.forEach(el => el.classList.remove('hidden'));

    // Reset inner page styles for next use
    pageInner.style.opacity = '';
    innerRule.style.opacity = '';

    isAnimating = false;
  }, DURATION + 20);
}

// ── INNER ↔ INNER (projects ↔ about) ──

function switchInnerView(target) {
  updateInnerNav(target);
  document.getElementById('sidebar-projects').style.display = target === 'projects' ? '' : 'none';
  document.getElementById('sidebar-about').style.display    = target === 'about'    ? '' : 'none';

  const panelKey = target === 'projects' ? currentCat : 'about-me';
  fadeToPanel(panelKey);
}

// ── PANEL SWITCHING ──
// Fixed: proper sequencing — fade out current, then fade in next.
// Uses a single tracked timeout to prevent stacking.

function fadeToPanel(key) {
  // Cancel any pending panel switch
  if (panelTimeout) { clearTimeout(panelTimeout); panelTimeout = null; }

  // Fade out the currently visible panel
  const current = document.querySelector('.content-panel.visible');
  if (current) {
    current.classList.remove('visible');
  }

  // After the fade-out transition, show the new panel
  panelTimeout = setTimeout(() => {
    showPanel(key);
    panelTimeout = null;
  }, 350);
}

/**
 * Immediately show a panel by key (no fade-out of previous).
 * Used for initial setup and after fadeToPanel's delay.
 */
function showPanel(key) {
  // Ensure all panels are hidden first
  document.querySelectorAll('.content-panel').forEach(p => {
    p.classList.remove('visible');
  });
  const target = document.querySelector(`.content-panel[data-panel="${key}"]`);
  if (target) {
    target.classList.add('visible');
  }
}

function updateInnerNav(target) {
  document.querySelectorAll('.inner-nav-item').forEach(el => {
    el.classList.toggle('current', el.dataset.target === target);
  });
}

// ── CATEGORY SWITCHING (project sidebar) ──

function switchCategory(cat) {
  if (cat === currentCat && currentPage === 'projects') return;
  currentCat = cat;

  document.querySelectorAll('#sidebar-projects .cat-item').forEach(el => {
    el.classList.toggle('active', el.dataset.cat === cat);
  });

  fadeToPanel(cat);
}

// ── EVENT LISTENERS ──

// Navigation items (both home and inner)
document.querySelectorAll('[data-target]').forEach(el => {
  el.addEventListener('click', () => navigate(el.dataset.target));
});

// Project category items
document.querySelectorAll('#sidebar-projects .cat-item').forEach(el => {
  el.addEventListener('click', () => switchCategory(el.dataset.cat));
});

// About sidebar items
document.querySelectorAll('#sidebar-about .cat-item').forEach(el => {
  el.addEventListener('click', () => {
    const key = el.dataset.about;
    document.querySelectorAll('#sidebar-about .cat-item').forEach(n => {
      n.classList.toggle('active', n.dataset.about === key);
    });
    fadeToPanel('about-' + key);
  });
});

// Ensure the 3d animation videos are not muted by default.
document.querySelectorAll('.content-panel[data-panel="3d"] video').forEach(video => {
  video.muted = false;
  video.volume = 1;
  video.removeAttribute('muted');
});

// Allow each 3d animation video to toggle looping independently.
document.querySelectorAll('.video-card').forEach(card => {
  const video = card.querySelector('video');
  const checkbox = card.querySelector('.loop-checkbox');

  if (!video || !checkbox) return;

  checkbox.checked = video.loop;
  checkbox.addEventListener('change', () => {
    video.loop = checkbox.checked;
  });
});
