(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const progress = document.querySelector('.scroll-progress');
  const backTop = document.querySelector('.back-top');
  let scheduled = false;

  const updateScroll = () => {
    const distance = document.documentElement.scrollHeight - window.innerHeight;
    if (progress) progress.style.transform = `scaleX(${distance > 0 ? Math.min(1, window.scrollY / distance) : 0})`;
    if (backTop) backTop.hidden = window.scrollY < 600;
    scheduled = false;
  };
  window.addEventListener('scroll', () => {
    if (!scheduled) { scheduled = true; requestAnimationFrame(updateScroll); }
  }, { passive: true });
  window.addEventListener('resize', updateScroll);
  window.addEventListener('load', updateScroll);
  backTop?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: reducedMotion ? 'instant' : 'smooth' });
    document.querySelector('.brand')?.focus({ preventScroll: true });
  });

  const controls = document.querySelector('.publication-controls');
  const publications = [...document.querySelectorAll('.pub')];
  const buttons = [...document.querySelectorAll('[data-filter]')];
  if (controls && publications.length) {
    controls.hidden = false;
    buttons.forEach(button => button.addEventListener('click', () => {
      const filter = button.dataset.filter;
      buttons.forEach(other => other.setAttribute('aria-pressed', String(other === button)));
      publications.forEach(publication => {
        publication.hidden = filter !== 'all' && publication.dataset.kind !== filter;
        if (!publication.hidden && !reducedMotion) publication.animate?.([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 230, easing: 'ease-out' });
      });
      const count = publications.filter(publication => !publication.hidden).length;
      document.querySelector('#filter-status').textContent = `${count} publication${count === 1 ? '' : 's'} shown`;
      updateScroll();
    }));
  }

  // Semantic disclosures work even when JavaScript is disabled.
  document.querySelectorAll('details').forEach(detail => detail.addEventListener('toggle', () => {
    if (detail.closest('.project')) {
      const label = detail.querySelector('summary > span:first-child');
      if (label) label.textContent = detail.open ? 'Close project' : 'Explore project';
    }
    updateScroll();
  }));

  if ('IntersectionObserver' in window) {
    const sections = [...document.querySelectorAll('main > section[id]')];
    const links = [...document.querySelectorAll('nav a[href^="#"]')];
    const activeSections = new Map();
    const sectionObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => activeSections.set(entry.target.id, entry.isIntersecting));
      const firstVisible = sections.find(section => activeSections.get(section.id));
      links.forEach(link => {
        if (firstVisible && link.hash === `#${firstVisible.id}`) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    }, { rootMargin: '-10% 0px -55% 0px', threshold: 0 });
    sections.forEach(section => sectionObserver.observe(section));

    if (!reducedMotion) {
      const revealObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            revealObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.07 });
      document.querySelectorAll('.section-top,.note-card,.project,.person,.about-grid,.career-entry,.service-grid article,.map-shell,.home-note').forEach((element, index) => {
        element.style.setProperty('--reveal-delay', `${(index % 3) * 65}ms`);
        element.classList.add('reveal');
        revealObserver.observe(element);
      });
    }
  }
  updateScroll();
})();
