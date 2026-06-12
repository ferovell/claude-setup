/* ============================================================
   app.js — Birthday Card Interactive Logic
   State machine: ENVELOPE → CARD → CONFETTI → LETTER → GALLERY

   Animation rules:
   - All JS-driven motion runs through ONE shared rAF ticker
   - Ticker commits updates only every ~41.67ms (24fps)
   - Positions quantized to 3px, rotations to 2deg
   ============================================================ */

'use strict';

/* ------------------------------------------------------------------
   0. CONSTANTS & CRAYOLA PALETTE
------------------------------------------------------------------ */
const PALETTE = ['#EE204D','#FF7538','#FCE883','#1CAC78','#1F75FE','#926EAE','#FFAACC','#B4674D'];

// 24fps interval
const FRAME_MS = 1000 / 24;

// Quantise helpers
const qPos = v => Math.round(v / 3) * 3;    // snap to 3px
const qRot = v => Math.round(v / 2) * 2;    // snap to 2deg

/* ------------------------------------------------------------------
   1. SHARED RAF TICKER
   All animated modules subscribe via ticker.add(fn).
   fn(dt) is called at most once per 24fps tick.
------------------------------------------------------------------ */
const ticker = (() => {
  const subscribers = new Set();
  let lastTime = 0;
  let rafId = null;

  function loop(ts) {
    rafId = requestAnimationFrame(loop);
    const dt = ts - lastTime;
    if (dt < FRAME_MS - 1) return;   // skip if not enough time has passed
    lastTime = ts - (dt % FRAME_MS); // keep phase aligned
    for (const fn of subscribers) fn(dt);
  }

  return {
    add(fn) {
      subscribers.add(fn);
      if (subscribers.size === 1) {
        lastTime = performance.now();
        rafId = requestAnimationFrame(loop);
      }
    },
    remove(fn) {
      subscribers.delete(fn);
      if (subscribers.size === 0 && rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    }
  };
})();

/* ------------------------------------------------------------------
   2. STATE MACHINE
   States: 'ENVELOPE' | 'CARD' | 'CONFETTI' | 'LETTER' | 'GALLERY'
------------------------------------------------------------------ */
let currentState = 'ENVELOPE';

function transitionTo(next) {
  currentState = next;
  switch (next) {
    case 'CARD':     enterCard();     break;
    case 'CONFETTI': enterConfetti(); break;
    case 'LETTER':   enterLetter();   break;
    case 'GALLERY':  enterGallery();  break;
  }
}

/* ------------------------------------------------------------------
   3. DOM REFERENCES
------------------------------------------------------------------ */
const envWrap       = document.getElementById('envelope-wrap');
const envBtn        = document.getElementById('envelope-btn');
const peekingCard   = document.getElementById('peeking-card');
const peekingPhotos = document.getElementById('peeking-photos');
const pullHint      = document.getElementById('pull-hint');
const envelopeHint  = document.getElementById('envelope-hint');

const greetingCard  = document.getElementById('greeting-card');
const cardGreetText = document.getElementById('card-greeting-text');

const confettiCanvas = document.getElementById('confetti-canvas');
const confettiCtx    = confettiCanvas.getContext('2d');

const letterScene   = document.getElementById('letter-scene');
const letterAccord  = document.getElementById('letter-accordion');
const foldHint      = document.getElementById('fold-hint');

const galleryScene  = document.getElementById('gallery-scene');
const galleryEnv    = document.getElementById('gallery-envelope-wrap');
const galleryPocket = document.getElementById('gallery-pocket');
const polaroidFreeStack = document.getElementById('polaroid-free-stack');
const swipeHint     = document.getElementById('swipe-hint');

const sceneNav       = document.getElementById('scene-nav');
const navLetterBtn   = document.getElementById('nav-letter-btn');
const navGalleryBtn  = document.getElementById('nav-gallery-btn');
const polaroidModal  = document.getElementById('polaroid-modal');

/* ------------------------------------------------------------------
   4. POPULATE CONTENT FROM CONFIG
------------------------------------------------------------------ */
function populateContent() {
  const name = CONFIG.friendName || 'Friend';

  // Greeting card text
  cardGreetText.textContent = (CONFIG.cardGreeting || 'Happy Birthday, {name}!').replace('{name}', name);

  // Letter title and paragraphs
  document.getElementById('letter-title-el').textContent = CONFIG.letterTitle || 'A little letter for you';
  const paras = CONFIG.letterParagraphs || [];
  ['letter-p0','letter-p1','letter-p2','letter-p3'].forEach((id, i) => {
    const el = document.getElementById(id);
    if (el) el.textContent = paras[i] || '';
  });

  // Letter sign-off
  const signoff = document.getElementById('letter-signoff-el');
  if (signoff) signoff.textContent = CONFIG.letterSignoff || 'With love, your friend';
}

/* ------------------------------------------------------------------
   5. STAGE 1 — ENVELOPE
------------------------------------------------------------------ */
function initEnvelope() {
  // Keyboard / click handler on the envelope button
  envBtn.addEventListener('click', onEnvelopeActivate);
  envBtn.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onEnvelopeActivate(); }
  });
}

function onEnvelopeActivate() {
  if (currentState !== 'ENVELOPE') return;

  // Open the flap
  envWrap.classList.add('flap-open');
  envelopeHint.textContent = 'Now pull the card out ↑';

  // Make envelope button inert now that flap is open
  envBtn.setAttribute('aria-expanded', 'true');
  envBtn.style.pointerEvents = 'none';

  // Enable card dragging after a short delay (let flap animation play)
  setTimeout(initCardDrag, 700);
}

/* ------------------------------------------------------------------
   6. STAGE 1→2 — CARD DRAG
------------------------------------------------------------------ */
let cardDragActive   = false;
let cardDragStartY   = 0;
let cardCurrentOffsetY = 0;
// Card height used for threshold calc; measured after DOM paint
let cardPocketHeight = 0;

function initCardDrag() {
  // Measure the envelope wrap so we know the clip threshold
  const wrapRect = envWrap.getBoundingClientRect();
  cardPocketHeight = wrapRect.height;

  peekingCard.addEventListener('pointerdown', onCardPointerDown);
}

function onCardPointerDown(e) {
  if (currentState !== 'ENVELOPE') return;
  e.preventDefault();
  peekingCard.setPointerCapture(e.pointerId);
  cardDragActive = true;
  cardDragStartY = e.clientY;
  cardCurrentOffsetY = 0;
  document.addEventListener('pointermove', onCardPointerMove);
  document.addEventListener('pointerup',   onCardPointerUp);
  document.addEventListener('pointercancel', onCardPointerUp);
  document.body.style.overscrollBehavior = 'none';
  ticker.add(applyCardDragTick);
}

// Ticker-driven card position update
let pendingCardOffsetY = 0;
function onCardPointerMove(e) {
  if (!cardDragActive) return;
  const dy = e.clientY - cardDragStartY;
  // Only allow upward drag (negative dy)
  pendingCardOffsetY = Math.min(0, dy);
}

function applyCardDragTick() {
  if (!cardDragActive) return;
  const snapped = qPos(pendingCardOffsetY);
  if (snapped === cardCurrentOffsetY) return;
  cardCurrentOffsetY = snapped;
  peekingCard.style.transform = `translateX(-50%) translateY(${snapped}px)`;
}
// ticker.add is called lazily inside onCardPointerDown / removed on pointerup

function onCardPointerUp(e) {
  if (!cardDragActive) return;
  cardDragActive = false;
  ticker.remove(applyCardDragTick);
  document.removeEventListener('pointermove', onCardPointerMove);
  document.removeEventListener('pointerup',   onCardPointerUp);
  document.removeEventListener('pointercancel', onCardPointerUp);
  document.body.style.overscrollBehavior = '';

  // Threshold: 60% of peeking card's own height
  const cardHeight = peekingCard.offsetHeight;
  const threshold  = cardHeight * 0.6;

  if (Math.abs(cardCurrentOffsetY) >= threshold) {
    // Animate card out then transition
    popCardFree();
  } else {
    // Snap back
    peekingCard.style.transform = 'translateX(-50%)';
    cardCurrentOffsetY = 0;
  }
}

function popCardFree() {
  // Hide peeking card — greeting card takes over
  peekingCard.style.opacity = '0';
  peekingCard.style.pointerEvents = 'none';
  transitionTo('CARD');
}

/* ------------------------------------------------------------------
   7. STAGE 2 — GREETING CARD (center stage)
------------------------------------------------------------------ */
function enterCard() {
  // Show greeting card overlay
  greetingCard.setAttribute('aria-hidden', 'false');
  greetingCard.classList.add('visible');

  // Fire confetti after brief delay
  setTimeout(() => transitionTo('CONFETTI'), 300);
}

/* ------------------------------------------------------------------
   8. STAGE 3 — CONFETTI BURST
------------------------------------------------------------------ */
const CONFETTI_COUNT   = 150;
const CONFETTI_GRAVITY = 0.3;
const CONFETTI_SECS    = 3;
let confettiParticles = [];
let confettiStartTime = 0;
let confettiRunning   = false;

function enterConfetti() {
  // Size canvas to viewport
  confettiCanvas.width  = window.innerWidth;
  confettiCanvas.height = window.innerHeight;
  confettiCanvas.style.display = 'block';

  confettiParticles = Array.from({ length: CONFETTI_COUNT }, (_, i) => ({
    x:             Math.random() * confettiCanvas.width,
    y:             -10 - Math.random() * 80,
    vx:            (Math.random() - 0.5) * 6,
    vy:            2 + Math.random() * 4,
    rotation:      Math.random() * 360,
    rotationSpeed: (Math.random() - 0.5) * 8,
    color:         PALETTE[i % PALETTE.length],
    w:             8 + Math.random() * 10,
    h:             4 + Math.random() * 6,
    flutter:       Math.random() * Math.PI * 2,  // phase offset for sine
    flutterSpeed:  0.05 + Math.random() * 0.08,
  }));

  confettiStartTime = performance.now();
  confettiRunning = true;
  ticker.add(tickConfetti);

  // After 1.5s transition to letter
  setTimeout(() => transitionTo('LETTER'), 1500);
}

function tickConfetti(dt) {
  if (!confettiRunning) return;
  const elapsed = (performance.now() - confettiStartTime) / 1000;

  if (elapsed > CONFETTI_SECS) {
    confettiRunning = false;
    confettiCanvas.style.display = 'none';
    ticker.remove(tickConfetti);
    return;
  }

  const opacity = elapsed > 2 ? 1 - (elapsed - 2) : 1;
  confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);

  for (const p of confettiParticles) {
    // Update physics
    p.flutter += p.flutterSpeed;
    p.vx = (Math.random() - 0.5) * 2 + Math.sin(p.flutter) * 1.5;
    p.vy += CONFETTI_GRAVITY;
    p.x  += p.vx;
    p.y  += p.vy;
    p.rotation += p.rotationSpeed;

    // Quantise
    const qx  = qPos(p.x);
    const qy  = qPos(p.y);
    const qr  = qRot(p.rotation);

    confettiCtx.save();
    confettiCtx.globalAlpha = opacity;
    confettiCtx.translate(qx, qy);
    confettiCtx.rotate(qr * Math.PI / 180);
    confettiCtx.fillStyle = p.color;
    // Crayon-scribble rectangle (use plain rect for broadest browser compat)
    confettiCtx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
    confettiCtx.restore();
  }
}

/* ------------------------------------------------------------------
   9. STAGE 4 — LETTER (folded accordion)
   4 panels fold/unfold driven by pointer drag
   Panel angles (when folded): panel2=-180, panel3=180, panel4=-180
   Unfolding: drag downward, progress 0→1 unfolds each panel sequentially
------------------------------------------------------------------ */
// Fold angles for each panel index (0-based, panel 0 is always visible)
const FOLDED_ANGLES  = [0, -180, 180, -180];
const PANEL_IDS      = ['panel-1','panel-2','panel-3','panel-4'];
let panels           = [];
let unfoldProgress   = 0;   // 0 = all folded, 3 = all unfolded (3 panels open)
let letterDragActive = false;
let letterDragStartY = 0;
let pendingUnfoldProgress = 0;
let letterFullyUnfolded = false;
let _letterPointerStartX = 0;
let _letterPointerStartY = 0;

function enterLetter() {
  // Hide confetti and greeting card
  greetingCard.style.display = 'none';
  confettiCanvas.style.display = 'none';

  // Hide envelope scene
  document.getElementById('envelope-scene').style.display = 'none';

  letterScene.style.display = 'flex';
  // Animate drop-in
  letterScene.style.animation = 'letter-drop .6s steps(6) forwards';

  // Nav is available from the moment the letter exists — the user can
  // hop between letter and photos at any time, in any fold state.
  galleryUnlocked = true;
  sceneNav.classList.remove('hidden');
  updateNavButtons('LETTER');

  panels = PANEL_IDS.map(id => document.getElementById(id));

  // Apply initial folded state
  applyFoldState(0);

  // Drag on the accordion
  letterAccord.addEventListener('pointerdown', onLetterPointerDown);
  letterAccord._touchMoveFn = (e) => { if (letterDragActive) e.preventDefault(); };
  letterAccord.addEventListener('touchmove', letterAccord._touchMoveFn, { passive: false });
  ticker.add(tickLetter);
}

function onLetterPointerDown(e) {
  if (letterFullyUnfolded) return;
  e.preventDefault();
  letterAccord.setPointerCapture(e.pointerId);
  letterDragActive = true;
  letterDragStartY = e.clientY;
  _letterPointerStartX = e.clientX;
  _letterPointerStartY = e.clientY;
  pendingUnfoldProgress = unfoldProgress;
  document.body.style.overscrollBehavior = 'none';

  // Disable CSS transition so JS ticker drives the motion directly
  panels.forEach(p => { p.style.transition = 'none'; });

  document.addEventListener('pointermove', onLetterPointerMove);
  document.addEventListener('pointerup',   onLetterPointerUp);
  document.addEventListener('pointercancel', onLetterPointerUp);
}

function onLetterPointerMove(e) {
  if (!letterDragActive) return;
  // Each panel requires ~80px of drag to unfold (3 panels total → max progress 3)
  const dy = e.clientY - letterDragStartY;
  const delta = dy / 80;
  pendingUnfoldProgress = Math.max(0, Math.min(3, unfoldProgress + delta));
}

function onLetterPointerUp(e) {
  if (!letterDragActive) return;
  letterDragActive = false;
  document.body.style.overscrollBehavior = '';
  document.removeEventListener('pointermove', onLetterPointerMove);
  document.removeEventListener('pointerup',   onLetterPointerUp);
  document.removeEventListener('pointercancel', onLetterPointerUp);

  // Re-enable snap transition for the release snap
  panels.forEach(p => { p.style.transition = 'transform 0.2s steps(3)'; });

  // Tap detection: if total pointer movement < 8px, treat as a tap → advance one panel
  const dx = e ? Math.abs(e.clientX - _letterPointerStartX) : 99;
  const dy = e ? Math.abs(e.clientY - _letterPointerStartY) : 99;
  if (Math.hypot(dx, dy) < 8) {
    unfoldProgress = Math.min(3, unfoldProgress + 1);
    pendingUnfoldProgress = unfoldProgress;
    applyFoldState(unfoldProgress);
    if (unfoldProgress >= 3) {
      onLetterFullyUnfolded();
    }
    return;
  }

  // Snap to nearest integer panel state
  const snapped = Math.round(pendingUnfoldProgress);
  pendingUnfoldProgress = snapped;
  unfoldProgress = snapped;
  applyFoldState(snapped);

  if (snapped >= 3) {
    onLetterFullyUnfolded();
  }
}

let lastRenderedUnfold = -1;
function tickLetter() {
  if (!letterDragActive) return;
  const q = Math.round(pendingUnfoldProgress * 10) / 10; // coarse quantise
  if (Math.abs(q - lastRenderedUnfold) < 0.05) return;
  lastRenderedUnfold = q;
  applyFoldState(pendingUnfoldProgress);
}

function applyFoldState(progress) {
  // progress 0→1: unfold panel 2; 1→2: unfold panel 3; 2→3: unfold panel 4
  // panel 1 (index 0) is always flat/visible
  if (!panels.length) return;
  for (let i = 1; i < panels.length; i++) {
    const p = panels[i];
    if (!p) continue;
    const panelProgress = Math.max(0, Math.min(1, progress - (i - 1)));
    const foldedAngle   = FOLDED_ANGLES[i];
    const angle         = foldedAngle * (1 - panelProgress);
    const qAngle        = qRot(angle);
    p.style.transform = `rotateX(${qAngle}deg)`;
    p.style.backfaceVisibility = 'hidden';
    // Hide completely when nearly fully folded (invisible anyway, avoids render cost)
    p.style.visibility = Math.abs(qAngle) > 165 ? 'hidden' : 'visible';
  }
}

function onLetterFullyUnfolded() {
  letterFullyUnfolded = true;
  foldHint.style.opacity = '0';
  ticker.remove(tickLetter);

  // Remove pointerdown listener so letter can't re-fold
  letterAccord.removeEventListener('pointerdown', onLetterPointerDown);

  // Remove touchmove prevention
  if (letterAccord._touchMoveFn) {
    letterAccord.removeEventListener('touchmove', letterAccord._touchMoveFn);
    letterAccord._touchMoveFn = null;
  }

  // Allow normal scrolling
  letterAccord.style.touchAction = 'auto';
  letterAccord.style.cursor = 'default';

  // Show nav bar
  sceneNav.classList.remove('hidden');
  galleryUnlocked = true;
  updateNavButtons('LETTER');
}

function updateNavButtons(state) {
  navLetterBtn.classList.toggle('nav-btn--active', state === 'LETTER');
  navGalleryBtn.classList.toggle('nav-btn--active', state === 'GALLERY');
}

/* Free navigation between letter and gallery, any time, both ways.
   Scenes are display-toggled (never destroyed) so the letter keeps its
   fold state and the gallery keeps its stack order. */
function showScene(which) {
  if (!galleryUnlocked) return;
  if (which === 'GALLERY') {
    if (!galleryEverEntered) {
      galleryEverEntered = true;
      transitionTo('GALLERY');           // first visit: envelope pull-out moment
    } else {
      letterScene.style.display = 'none';
      galleryScene.style.display = 'flex';
    }
  } else {
    galleryScene.style.display = 'none';
    letterScene.style.display = 'flex';
  }
  updateNavButtons(which);
  // Each scene fills the viewport from the top — no hunting for the envelope.
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
}

navLetterBtn.addEventListener('click', () => showScene('LETTER'));
navGalleryBtn.addEventListener('click', () => showScene('GALLERY'));

/* ------------------------------------------------------------------
   10. STAGE 5 — GALLERY
   Photo pull-out from second envelope + swipeable polaroid stack
------------------------------------------------------------------ */
let photoElements     = [];
let stackTopIndex     = 0;   // index of currently topmost polaroid
let polaroidDragActive = false;
let polaroidDragStartX = 0;
let polaroidDragStartY = 0;
let polaroidDragEndY   = 0;
let polaroidCurrentX   = 0;
let pendingPolaroidX   = 0;
let polaroidGrabbed    = false;
let photosInEnvelope   = true;
let photoStackDragActive = false;
let photoStackStartY = 0;
let photoStackCurrentY = 0;
let pendingStackY = 0;
let polaroidFlingInProgress = false;
let galleryUnlocked   = false;
let galleryEverEntered = false;
let _galleryBuilt     = false;

function enterGallery() {
  letterScene.style.display = 'none';
  galleryScene.style.display = 'flex';

  if (_galleryBuilt) return;
  _galleryBuilt = true;

  // Build polaroid elements and place them in the gallery pocket
  buildPolaroids();

  // Show gallery envelope with the photo stack peeking out
  galleryEnv.classList.add('photos-visible');

  // After short delay let user pull the stack out
  setTimeout(initPhotoPullOut, 600);
}

function buildPolaroids() {
  const photos = CONFIG.photos || [];
  photoElements = [];

  // Create individual polaroid divs
  photos.forEach((photo, idx) => {
    const pol = createPolaroid(photo, idx);
    photoElements.push(pol);
  });

  // Place them in the gallery pocket as a stack (behind)
  const stackHolder = document.createElement('div');
  stackHolder.id = 'polaroid-stack';
  stackHolder.setAttribute('aria-label', 'Photo stack in envelope');
  stackHolder.style.cssText = [
    'position:absolute',
    'bottom:0',
    'left:50%',
    'transform:translateX(-50%)',
    'width:55%',
    'z-index:3',
    'cursor:grab',
    'touch-action:none',
  ].join(';');

  // Append all as a visual stack (only top one counts for interactions)
  photoElements.forEach((pol, i) => {
    pol.style.position = 'relative';
    pol.style.left     = '0';
    pol.style.bottom   = '0';
    pol.style.marginTop = i === 0 ? '0' : '-8px';
    pol.style.transform = `rotate(${(i % 3 - 1) * 3}deg)`;
    stackHolder.appendChild(pol);
  });

  galleryPocket.appendChild(stackHolder);

  // Also pre-build the free stack for later
  renderFreeStack();
}

function createPolaroid(photo, idx) {
  const div = document.createElement('div');
  div.className = 'polaroid';
  div.setAttribute('data-index', idx);

  // Photo area
  const photoArea = document.createElement('div');
  photoArea.className = 'polaroid-photo';

  const img = document.createElement('img');
  img.alt = photo.caption || '';
  img.src = photo.src;
  img.onerror = () => {
    // Replace with crayon doodle placeholder
    img.style.display = 'none';
    const ph = createPlaceholderSVG(idx);
    photoArea.appendChild(ph);
  };

  photoArea.appendChild(img);
  div.appendChild(photoArea);

  // Caption
  const caption = document.createElement('p');
  caption.className = 'polaroid-caption';
  caption.textContent = photo.caption || '';
  div.appendChild(caption);

  return div;
}

/* Create an SVG placeholder when a photo fails to load */
function createPlaceholderSVG(idx) {
  const bgColors = PALETTE;
  const bg = bgColors[idx % bgColors.length];

  // Build SVG as inline element
  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('viewBox', '0 0 120 90');
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', '100%');
  svg.style.cssText = 'position:absolute;inset:0;display:block';

  // Background rect
  const bgRect = document.createElementNS(svgNS, 'rect');
  bgRect.setAttribute('width', '120');
  bgRect.setAttribute('height', '90');
  bgRect.setAttribute('fill', bg);
  svg.appendChild(bgRect);

  // Sun (circle + rays)
  const sunG = document.createElementNS(svgNS, 'g');
  sunG.setAttribute('stroke', 'rgba(255,255,255,0.85)');
  sunG.setAttribute('stroke-width', '2');
  sunG.setAttribute('stroke-linecap', 'round');
  const sunCircle = document.createElementNS(svgNS, 'circle');
  sunCircle.setAttribute('cx', '90');
  sunCircle.setAttribute('cy', '22');
  sunCircle.setAttribute('r', '10');
  sunCircle.setAttribute('fill', 'rgba(255,255,255,0.7)');
  sunCircle.setAttribute('stroke', 'none');
  sunG.appendChild(sunCircle);
  const rays = [[90,6,90,2],[90,38,90,42],[74,22,70,22],[106,22,110,22],
                [79,11,76,8],[101,33,104,36],[101,11,104,8],[79,33,76,36]];
  rays.forEach(([x1,y1,x2,y2]) => {
    const line = document.createElementNS(svgNS, 'line');
    line.setAttribute('x1',x1); line.setAttribute('y1',y1);
    line.setAttribute('x2',x2); line.setAttribute('y2',y2);
    sunG.appendChild(line);
  });
  svg.appendChild(sunG);

  // Hills (two arcs)
  const hillPath = document.createElementNS(svgNS, 'path');
  hillPath.setAttribute('d', 'M-5 70 Q30 45 60 65 Q90 85 125 58 L125 95 L-5 95 Z');
  hillPath.setAttribute('fill', 'rgba(255,255,255,0.35)');
  svg.appendChild(hillPath);

  const hillPath2 = document.createElementNS(svgNS, 'path');
  hillPath2.setAttribute('d', 'M-5 80 Q25 60 55 75 Q85 90 125 70 L125 95 L-5 95 Z');
  hillPath2.setAttribute('fill', 'rgba(255,255,255,0.2)');
  svg.appendChild(hillPath2);

  // Stick figures (2 figures)
  const figureG = document.createElementNS(svgNS, 'g');
  figureG.setAttribute('stroke', 'rgba(255,255,255,0.9)');
  figureG.setAttribute('stroke-width', '2');
  figureG.setAttribute('stroke-linecap', 'round');
  // Figure 1
  const f1 = [
    ['circle', {cx:'32', cy:'58', r:'4', fill:'rgba(255,255,255,0.9)', stroke:'none'}],
    ['line',   {x1:'32', y1:'62', x2:'32', y2:'76'}],
    ['line',   {x1:'32', y1:'66', x2:'26', y2:'72'}],
    ['line',   {x1:'32', y1:'66', x2:'38', y2:'72'}],
    ['line',   {x1:'32', y1:'76', x2:'27', y2:'84'}],
    ['line',   {x1:'32', y1:'76', x2:'37', y2:'84'}],
  ];
  // Figure 2
  const f2 = [
    ['circle', {cx:'52', cy:'56', r:'4', fill:'rgba(255,255,255,0.9)', stroke:'none'}],
    ['line',   {x1:'52', y1:'60', x2:'52', y2:'74'}],
    ['line',   {x1:'52', y1:'64', x2:'46', y2:'70'}],
    ['line',   {x1:'52', y1:'64', x2:'58', y2:'70'}],
    ['line',   {x1:'52', y1:'74', x2:'47', y2:'82'}],
    ['line',   {x1:'52', y1:'74', x2:'57', y2:'82'}],
  ];
  [...f1, ...f2].forEach(([tag, attrs]) => {
    const el = document.createElementNS(svgNS, tag);
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    figureG.appendChild(el);
  });
  svg.appendChild(figureG);

  return svg;
}

/* Build the free-standing polaroid stack shown center-stage */
function renderFreeStack() {
  polaroidFreeStack.innerHTML = '';
  const photos = CONFIG.photos || [];
  const count  = photos.length;

  photos.forEach((photo, i) => {
    const relativePos = (i - stackTopIndex + count) % count; // 0=top
    const iTop = relativePos === 0;
    const pol  = createPolaroid(photo, i);
    pol.style.position = 'absolute';
    pol.style.left     = '50%';
    pol.style.bottom   = '0';
    // Spread rotation: pseudo-random ±6deg per index, quantised to 2deg
    const rawRot = ((i * 37 + 13) % 13) - 6;  // deterministic spread
    const rot    = qRot(rawRot);
    pol.style.transform = `translateX(-50%) rotate(${rot}deg)`;
    pol.style.zIndex    = count - relativePos;  // top card gets highest z-index
    // Only the top card may receive input — fixes swipes hitting mid-stack cards
    pol.style.pointerEvents = iTop ? 'auto' : 'none';

    if (iTop) {
      pol.classList.add('top-card');
      pol.style.cursor = 'grab';
      pol.style.touchAction = 'none';
    }

    polaroidFreeStack.appendChild(pol);
  });
}

/* Pull-out: user drags the polaroid stack out of the gallery envelope */
function initPhotoPullOut() {
  const stackEl = document.getElementById('polaroid-stack');
  if (!stackEl) return;

  stackEl.addEventListener('pointerdown', onPhotoStackPointerDown);
}

function onPhotoStackPointerDown(e) {
  e.preventDefault();
  const stackEl = document.getElementById('polaroid-stack');
  stackEl.setPointerCapture(e.pointerId);
  photoStackDragActive = true;
  photoStackStartY = e.clientY;
  photoStackCurrentY = 0;
  pendingStackY = 0;

  document.addEventListener('pointermove', onPhotoStackPointerMove);
  document.addEventListener('pointerup',   onPhotoStackPointerUp);
  document.addEventListener('pointercancel', onPhotoStackPointerUp);
  ticker.add(tickPhotoStack);
}

function onPhotoStackPointerMove(e) {
  if (!photoStackDragActive) return;
  const dy = e.clientY - photoStackStartY;
  pendingStackY = Math.min(0, dy);  // only drag upward
}

function tickPhotoStack() {
  if (!photoStackDragActive) return;
  const snapped = qPos(pendingStackY);
  if (snapped === photoStackCurrentY) return;
  photoStackCurrentY = snapped;
  const stackEl = document.getElementById('polaroid-stack');
  if (stackEl) {
    stackEl.style.transform = `translateX(-50%) translateY(${snapped}px)`;
  }
}

function onPhotoStackPointerUp() {
  if (!photoStackDragActive) return;
  photoStackDragActive = false;
  ticker.remove(tickPhotoStack);
  document.removeEventListener('pointermove', onPhotoStackPointerMove);
  document.removeEventListener('pointerup',   onPhotoStackPointerUp);
  document.removeEventListener('pointercancel', onPhotoStackPointerUp);

  // Threshold: dragged up by 80px = pop it free
  if (Math.abs(photoStackCurrentY) >= 80) {
    releasePhotoStack();
  } else {
    // Snap back
    const stackEl = document.getElementById('polaroid-stack');
    if (stackEl) stackEl.style.transform = 'translateX(-50%)';
    photoStackCurrentY = 0;
  }
}

function releasePhotoStack() {
  // Hide the gallery envelope, show polaroid free stack
  galleryEnv.style.display = 'none';
  polaroidFreeStack.style.display = 'block';
  swipeHint.style.display = 'block';

  // Render free stack
  renderFreeStack();
  initPolaroidSwipe();
}

/* Swipe the top polaroid off the stack */
function initPolaroidSwipe() {
  // The top-card element is identified inside polaroidFreeStack
  function attachSwipeHandler() {
    const topCard = polaroidFreeStack.querySelector('.top-card');
    if (!topCard) return;

    topCard.addEventListener('pointerdown', onPolaroidPointerDown);
  }

  attachSwipeHandler();

  // Re-attach after each fling
  polaroidFreeStack._reattach = attachSwipeHandler;
}

// Per-drag state stored at module level so named handler refs can be used
let _activePolaroidCard    = null;
let _polaroidTickFn        = null;
let _polaroidMoveFn        = null;
let _polaroidUpFn          = null;
let _polaroidMaxTravel     = 0;
let polaroidModalOpen      = false;

function onPolaroidPointerDown(e) {
  // Ignore input while a fling animation runs or the zoom modal is open,
  // and only ever react on the current top card.
  if (polaroidFlingInProgress || polaroidModalOpen) return;
  if (!e.currentTarget.classList.contains('top-card')) return;
  e.preventDefault();
  const card = e.currentTarget;
  card.setPointerCapture(e.pointerId);
  _activePolaroidCard = card;
  polaroidDragActive  = true;
  polaroidDragStartX  = e.clientX;
  polaroidDragStartY  = e.clientY;
  polaroidCurrentX    = 0;
  pendingPolaroidX    = 0;
  _polaroidMaxTravel  = 0;
  card.style.cursor   = 'grabbing';

  // Store named refs so we can remove them later
  _polaroidMoveFn = (e2) => {
    if (!polaroidDragActive) return;
    pendingPolaroidX = e2.clientX - polaroidDragStartX;
    _polaroidMaxTravel = Math.max(_polaroidMaxTravel,
      Math.hypot(e2.clientX - polaroidDragStartX, e2.clientY - polaroidDragStartY));
  };
  _polaroidUpFn = (e2) => _onPolaroidUp(card);

  // Pointer capture means move/up fire on card, but document also works
  card.addEventListener('pointermove', _polaroidMoveFn);
  card.addEventListener('pointerup',   _polaroidUpFn);
  card.addEventListener('pointercancel', _polaroidUpFn);

  _polaroidTickFn = () => {
    if (!polaroidDragActive || !_activePolaroidCard) return;
    const snapped = qPos(pendingPolaroidX);
    if (snapped === polaroidCurrentX) return;
    polaroidCurrentX = snapped;
    const baseRot = (() => {
      const m = _activePolaroidCard.style.transform.match(/rotate\(([-\d.]+)deg\)/);
      return m ? parseFloat(m[1]) : 0;
    })();
    const extraRot = qRot(polaroidCurrentX / 20);
    _activePolaroidCard.style.transform =
      `translateX(calc(-50% + ${polaroidCurrentX}px)) rotate(${qRot(baseRot + extraRot)}deg)`;
  };
  ticker.add(_polaroidTickFn);
}

function _onPolaroidUp(card) {
  if (!polaroidDragActive) return;
  polaroidDragActive = false;
  card.style.cursor = 'grab';

  // Remove named listener refs
  if (_polaroidMoveFn) { card.removeEventListener('pointermove', _polaroidMoveFn); _polaroidMoveFn = null; }
  if (_polaroidUpFn)   {
    card.removeEventListener('pointerup',    _polaroidUpFn);
    card.removeEventListener('pointercancel', _polaroidUpFn);
    _polaroidUpFn = null;
  }
  if (_polaroidTickFn) { ticker.remove(_polaroidTickFn); _polaroidTickFn = null; }
  _activePolaroidCard = null;

  // Tap (no real movement): zoom the polaroid instead of swiping it
  if (_polaroidMaxTravel < 8) {
    const idx    = parseInt(card.dataset.index, 10);
    const rawRot = ((idx * 37 + 13) % 13) - 6;
    card.style.transform = `translateX(-50%) rotate(${qRot(rawRot)}deg)`;
    polaroidCurrentX = 0;
    openPolaroidModal(idx);
    return;
  }

  const threshold = Math.max(60, card.offsetWidth * 0.3);
  if (Math.abs(polaroidCurrentX) >= threshold) {
    // Fling it off
    flingPolaroid(card, polaroidCurrentX > 0 ? 'right' : 'left');
  } else {
    // Snap back to resting rotation
    const idx    = parseInt(card.dataset.index, 10);
    const rawRot = ((idx * 37 + 13) % 13) - 6;
    card.style.transform = `translateX(-50%) rotate(${qRot(rawRot)}deg)`;
    polaroidCurrentX = 0;
  }
}

function flingPolaroid(card, direction) {
  polaroidFlingInProgress = true;
  const animName = direction === 'right' ? 'polaroid-fling-right' : 'polaroid-fling-left';
  card.style.animation = `${animName} .5s steps(10) forwards`;
  card.style.pointerEvents = 'none';

  card.addEventListener('animationend', () => {
    // Move this photo to the bottom of the stack
    stackTopIndex = (stackTopIndex + 1) % (CONFIG.photos || []).length;
    renderFreeStack();
    if (polaroidFreeStack._reattach) polaroidFreeStack._reattach();
    polaroidFlingInProgress = false;
  }, { once: true });
}

/* ------------------------------------------------------------------
   Polaroid zoom modal — tap a photo to enlarge, tap anywhere to close
------------------------------------------------------------------ */
const polaroidModalInner = polaroidModal.querySelector('.polaroid-modal-inner');

function openPolaroidModal(idx) {
  const photo = (CONFIG.photos || [])[idx];
  if (!photo) return;
  polaroidModalInner.innerHTML = '';

  const photoArea = document.createElement('div');
  photoArea.className = 'polaroid-modal-photo';
  const img = document.createElement('img');
  img.alt = photo.caption || '';
  img.src = photo.src;
  img.onerror = () => {
    img.style.display = 'none';
    photoArea.appendChild(createPlaceholderSVG(idx));
  };
  photoArea.appendChild(img);
  polaroidModalInner.appendChild(photoArea);

  const caption = document.createElement('p');
  caption.className = 'polaroid-modal-caption';
  caption.textContent = photo.caption || '';
  polaroidModalInner.appendChild(caption);

  polaroidModal.classList.remove('hidden');
  polaroidModalOpen = true;
}

function closePolaroidModal() {
  polaroidModal.classList.add('hidden');
  polaroidModalInner.innerHTML = '';
  // Delay the flag so the closing tap can't immediately start a swipe below
  setTimeout(() => { polaroidModalOpen = false; }, 50);
}

polaroidModal.addEventListener('click', closePolaroidModal);

/* ------------------------------------------------------------------
   11. INIT
------------------------------------------------------------------ */
function init() {
  populateContent();
  initEnvelope();
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
