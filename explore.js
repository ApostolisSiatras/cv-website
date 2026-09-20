(() => {
  const tabs = [...document.querySelectorAll('[data-lens]')];
  const panels = [...document.querySelectorAll('[data-lens-panel]')];
  const explorer = document.querySelector('.research-explorer');
  if (!tabs.length || !explorer) return;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const select = (name, animate = true) => {
    if (!panels.some(panel => panel.dataset.lensPanel === name)) return;
    explorer.dataset.theme = name;
    tabs.forEach(tab => {
      const active = tab.dataset.lens === name;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
    });
    panels.forEach(panel => {
      panel.getAnimations?.().forEach(animation => animation.cancel());
      panel.hidden = panel.dataset.lensPanel !== name;
      if (!panel.hidden && animate && !reducedMotion) {
        panel.animate?.([{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 300, easing: 'ease-out' });
      }
    });
  };
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => select(tab.dataset.lens));
    tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next === undefined) return;
      event.preventDefault();
      select(tabs[next].dataset.lens);
      tabs[next].focus();
    });
  });
  document.querySelector('.research-tabs').hidden = false;
  const linked = panels.find(panel => `#${panel.id}` === location.hash);
  select(linked?.dataset.lensPanel || tabs[0].dataset.lens, false);
})();
