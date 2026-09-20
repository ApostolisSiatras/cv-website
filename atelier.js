(() => {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  document.querySelectorAll('.portrait-sheet,.note-card,.project').forEach(card => {
    card.dataset.tilt = 'true';
    let frame;
    card.addEventListener('pointermove', event => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const box = card.getBoundingClientRect();
        const x = Math.max(-.5, Math.min(.5, (event.clientX - box.left) / box.width - .5));
        const y = Math.max(-.5, Math.min(.5, (event.clientY - box.top) / box.height - .5));
        card.style.setProperty('--tilt-x', `${-y * 8}deg`);
        card.style.setProperty('--tilt-y', `${x * 8}deg`);
      });
    });
    card.addEventListener('pointerleave', () => {
      cancelAnimationFrame(frame);
      card.style.setProperty('--tilt-x', '0deg');
      card.style.setProperty('--tilt-y', '0deg');
    });
  });
})();
