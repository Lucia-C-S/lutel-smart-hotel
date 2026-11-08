// Accordion image gallery, plain JavaScript version.
// The original file was a React + GSAP component. This practice requires plain browser
// JavaScript, so the motion lives in accordion-gallery.css (CSS transitions) and this file
// only builds the panels and marks which one is active.

// Edit this list to change the pictures and captions.
const ITEMS = [
  { image: '/styles/accordion-image/images/cama.jpeg', label: 'Suites' },
  { image: '/styles/accordion-image/images/cama1.jpeg', label: 'Double rooms' },
  { image: '/styles/accordion-image/images/cama2.jpeg', label: 'Twin rooms' },
  { image: '/styles/accordion-image/images/vistas.jpeg', label: 'Views' },
  { image: '/styles/accordion-image/images/sofa.jpeg', label: 'Lounge' },
  { image: '/styles/accordion-image/images/spa.jpeg', label: 'Spa' },
  { image: '/styles/accordion-image/images/tarta.jpeg', label: 'Patisserie' },
];
const DEFAULT_INDEX = 3;   // panel open on page load
const EXPAND_RATIO = 0.52; // share of the width taken by the open panel
const TILT = 3;            // degrees of rotation on the closed panels
const PARALLAX = 0.5;      // how far the photos slide inside closed panels
const GAP = 10;            // pixels between panels

function createPanel(item) {
  const panel = document.createElement('div');
  panel.className = 'ag-panel';
  panel.setAttribute('role', 'listitem');
  panel.setAttribute('aria-label', item.label);

  const image = document.createElement('img');
  image.src = item.image;
  image.alt = item.label;
  image.draggable = false;
  const media = document.createElement('span');
  media.className = 'ag-panel__media';
  media.append(image);
  const overlay = document.createElement('span');
  overlay.className = 'ag-panel__overlay';
  const frame = document.createElement('span');
  frame.className = 'ag-panel__frame';
  frame.append(media, overlay);

  const text = document.createElement('span');
  text.className = 'ag-panel__text';
  text.textContent = item.label;
  const label = document.createElement('span');
  label.className = 'ag-panel__label';
  label.setAttribute('aria-hidden', 'true');
  label.append(text);

  panel.append(frame, label);
  return panel;
}

function initGallery(root) {
  const count = ITEMS.length;
  const ratio = Math.min(Math.max(EXPAND_RATIO, 0.2), 0.9);
  const panels = ITEMS.map(createPanel);
  let active = DEFAULT_INDEX;
  let mediaSize = 320;

  // Flex-grow that makes the open panel take `ratio` of the width.
  root.style.setProperty('--ag-gap', `${GAP}px`);
  root.style.setProperty('--ag-grow', String((ratio * (count - 1)) / (1 - ratio)));
  root.replaceChildren(...panels);

  function setActive(index) {
    active = index;
    panels.forEach((panel, i) => {
      const isActive = i === active;
      panel.classList.toggle('ag-panel--active', isActive);
      panel.tabIndex = isActive ? 0 : -1; // only the open panel is a Tab stop
      if (isActive) panel.setAttribute('aria-current', 'true');
      else panel.removeAttribute('aria-current');

      // Closed panels tilt away from the open one, and their photos drift slightly.
      const rotation = isActive ? 0 : i < active ? TILT : -TILT;
      const drift = Math.max(-1.5, Math.min(1.5, active - i));
      panel.style.setProperty('--ag-rot', `${rotation}deg`);
      panel.style.setProperty('--ag-shift', isActive ? '0px' : `${drift * PARALLAX * mediaSize * 0.06}px`);
    });
  }

  panels.forEach((panel, i) => {
    panel.addEventListener('mouseenter', () => setActive(i));
    panel.addEventListener('click', () => setActive(i)); // touch screens have no hover
    panel.addEventListener('focus', () => setActive(i));
    panel.addEventListener('keydown', event => {
      const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
      if (!step) return;
      event.preventDefault();
      panels[(i + step + count) % count].focus(); // the focus event opens that panel
    });
  });

  // Photos keep a width proportional to the gallery so they slide instead of stretching.
  new ResizeObserver(() => {
    const usable = Math.max(root.getBoundingClientRect().width - GAP * (count - 1), 120);
    mediaSize = Math.max(140, usable * ratio * 1.22);
    root.style.setProperty('--ag-media-size', `${mediaSize}px`);
    setActive(active);
  }).observe(root);

  setActive(active);
}

const gallery = document.getElementById('hotel-gallery');
if (gallery) initGallery(gallery);
