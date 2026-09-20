(() => {
  const map = document.querySelector('.world-map');
  if (!map) return;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const choices = [...document.querySelectorAll('[data-map-choice]')];
  const panels = [...document.querySelectorAll('.map-detail')];
  const views = [...document.querySelectorAll('[data-map-view]')];
  const steps = [...document.querySelectorAll('[data-map-step]')];
  const boxes = { world: [0, 0, 960, 400], connections: [470, 58, 245, 140], europe: [480, 49, 105, 105] };
  const europeanPlaces = new Set(['fribourg', 'aegean', 'tartu', 'privact', 'cyberalytics']);
  const visual = document.querySelector('.map-visual');
  const tooltip = document.querySelector('.map-tooltip');
  let selected = 'fribourg', view = 'world', frame;

  const drawView = box => {
    map.setAttribute('viewBox', box.join(' '));
    const scale = Math.max(box[2] / 960, box[3] / 400);
    map.querySelectorAll('.pin-dot').forEach(pin => pin.setAttribute('r', 4 * scale));
    map.querySelectorAll('.pin-halo').forEach(pin => pin.setAttribute('r', 8 * scale));
    map.querySelectorAll('.pin-hit').forEach(pin => pin.setAttribute('r', 8 * scale));
  };
  const changeView = name => {
    if (!boxes[name]) return;
    view = name;
    if (tooltip) tooltip.hidden = true;
    views.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.mapView === name)));
    cancelAnimationFrame(frame);
    const start = map.getAttribute('viewBox').split(/\s+/).map(Number);
    const end = boxes[name];
    if (reducedMotion) { drawView(end); return; }
    const started = performance.now();
    const animate = now => {
      const progress = Math.min(1, (now - started) / 480);
      const eased = 1 - Math.pow(1 - progress, 3);
      drawView(start.map((value, i) => value + (end[i] - value) * eased));
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
  };
  const selectPlace = (id, moveMap = false) => {
    const nextPanel = panels.find(panel => panel.dataset.place === id);
    if (!nextPanel) return;
    const changed = selected !== id;
    selected = id;
    panels.forEach(panel => {
      panel.getAnimations?.().forEach(animation => animation.cancel());
      panel.hidden = panel.dataset.place !== id;
    });
    if (changed && !reducedMotion) nextPanel.animate?.([{ opacity: 0, transform: 'translateX(12px)' }, { opacity: 1, transform: 'translateX(0)' }], { duration: 260, easing: 'ease-out' });
    choices.forEach(choice => {
      const members = (choice.dataset.mapMembers || choice.dataset.mapChoice).split(' ');
      const active = members.includes(id);
      choice.classList.toggle('is-active', active);
      choice.classList.toggle('is-industry-active', active && ['privact', 'cyberalytics'].includes(id));
      if (choice.tagName.toLowerCase() === 'button') choice.setAttribute('aria-pressed', String(active));
      else if (active) choice.setAttribute('aria-current', 'true');
      else choice.removeAttribute('aria-current');
    });
    if ((moveMap && view === 'world') || (view === 'europe' && !europeanPlaces.has(id))) changeView('connections');
    return nextPanel;
  };
  choices.forEach(choice => choice.addEventListener('click', event => {
    event.preventDefault();
    const wasInsidePanel = Boolean(choice.closest('.map-detail'));
    const panel = selectPlace(choice.dataset.mapChoice, true);
    if (wasInsidePanel && panel) {
      const heading = panel.querySelector('h3');
      heading?.setAttribute('tabindex', '-1');
      heading?.focus({ preventScroll: true });
    }
  }));
  steps.forEach(button => button.addEventListener('click', () => {
    const index = panels.findIndex(panel => panel.dataset.place === selected);
    const next = (index + Number(button.dataset.mapStep) + panels.length) % panels.length;
    selectPlace(panels[next].dataset.place, true);
  }));
  views.forEach(button => button.addEventListener('click', () => {
    if (button.dataset.mapView === 'europe' && !europeanPlaces.has(selected)) selectPlace('fribourg');
    changeView(button.dataset.mapView);
  }));

  // Preview names on hover or keyboard focus; clicking commits the selection.
  if (visual && tooltip) {
    const showTooltip = (choice, event) => {
      if (event?.pointerType === 'touch') return;
      const members = (choice.dataset.mapMembers || choice.dataset.mapChoice).split(' ');
      tooltip.textContent = members.map(id => panels.find(panel => panel.dataset.place === id)?.querySelector('h3')?.textContent).filter(Boolean).join(' · ');
      tooltip.hidden = false;
      const box = visual.getBoundingClientRect();
      const target = choice.getBoundingClientRect();
      const x = event?.clientX ?? target.left + target.width / 2;
      const y = event?.clientY ?? target.top;
      tooltip.style.left = `${Math.max(12, Math.min(box.width - tooltip.offsetWidth - 12, x - box.left + 12))}px`;
      tooltip.style.top = `${Math.max(12, Math.min(box.height - tooltip.offsetHeight - 12, y - box.top - tooltip.offsetHeight - 12))}px`;
    };
    map.querySelectorAll('[data-map-choice]').forEach(choice => {
      choice.addEventListener('pointerenter', event => showTooltip(choice, event));
      choice.addEventListener('pointermove', event => showTooltip(choice, event));
      choice.addEventListener('focus', () => showTooltip(choice));
      choice.addEventListener('pointerleave', () => { tooltip.hidden = true; });
      choice.addEventListener('blur', () => { tooltip.hidden = true; });
    });
  }
  document.querySelector('.map-views').hidden = false;
  document.querySelector('.map-picker').hidden = false;
  const stepper = document.querySelector('.map-stepper');
  if (stepper) stepper.hidden = false;
  const linkedPlace = location.hash.startsWith('#institution-') ? location.hash.slice(13) : null;
  selectPlace(panels.some(panel => panel.dataset.place === linkedPlace) ? linkedPlace : selected);
})();
