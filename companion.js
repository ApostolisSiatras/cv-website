(() => {
  const imageURL = new URL('assets/companion/doodle-poses.png', document.currentScript.src).href;
  const parkourURL = new URL('assets/companion/parkour-poses.png', document.currentScript.src).href;
  const conceptURL = new URL('assets/companion/question-idea-poses.png', document.currentScript.src).href;
  const familyURL = new URL('assets/companion/kozani-family.png', document.currentScript.src).href;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const storageKey = 'siatras-decorative-motion-paused';
  let paused = false;
  try { paused = localStorage.getItem(storageKey) === 'true'; } catch { /* Storage is optional. */ }
  let still = reduced.matches || paused;
  let imageReady = false;
  let parkourReady = false;
  let conceptReady = false;
  let pointer = null;
  let pointerFrame = 0;
  let lastScroll = scrollY;
  let scrollFrame = 0;
  const wrap = document.querySelector('.wrap');
  const controllers = [];
  const visibleDoodles = new Set();
  const names = { book: 'reading doodle', laptop: 'coding doodle', oboe: 'oboe-playing doodle', highfive: 'high-fiving doodles', question: 'questioning doodle', idea: 'inventor doodle' };
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  // A small homecoming lives with the Kozani paragraph, independent of hover.
  const homeCopy = document.querySelector('.home-note-copy');
  const home = homeCopy && document.createElement('button');
  let familyReady = false;
  let homeInView = false;
  let homeTimers = [];
  const clearHomeTimers = () => { homeTimers.forEach(clearTimeout); homeTimers = []; };
  if (home) {
    home.type = 'button';
    home.className = 'homecoming';
    home.hidden = true;
    home.setAttribute('aria-label', 'Replay the boy meeting Mum, Dad and his sister, then going home together in Kozani');
    home.innerHTML = '<span class="home-stage" aria-hidden="true"><span class="home-journey"><img class="home-family-art" alt="" width="1536" height="1024"><span class="home-boy"><span class="doodle-parkour"></span></span></span><img class="home-house-art" alt="" width="1536" height="1024"><span class="home-window-boy"><span class="doodle-sprite"></span></span><span class="home-smoke"><span>∿</span><span>∿</span><span>∿</span></span></span><span class="home-replay" aria-hidden="true">Home, again. <span>↻</span></span>';
    homeCopy.append(home);
    const house = home.querySelector('.home-house-art');
    const family = home.querySelector('.home-family-art');
    let loaded = 0;
    const ready = () => { familyReady = ++loaded === 2; updateHome(); };
    house.onload = ready;
    family.onload = ready;
    house.src = family.src = familyURL;
    home.addEventListener('click', playHome);
    home.querySelector('.home-boy').addEventListener('animationend', event => {
      if (event.animationName === 'doodle-homecoming') home.dataset.state = 'home';
    });
    const observer = new IntersectionObserver(entries => {
      homeInView = entries[0].isIntersecting;
      updateHome();
    }, { threshold: .15 });
    observer.observe(home);
  }
  function playHome() {
    if (!home || still || !homeInView || !familyReady || !imageReady || !parkourReady || document.hidden) return;
    clearHomeTimers();
    home.classList.remove('is-playing');
    void home.offsetWidth;
    home.dataset.state = 'running';
    home.dataset.phase = 'walking';
    home.classList.add('is-playing');
    homeTimers.push(setTimeout(() => { home.dataset.phase = 'meeting'; }, 4200));
    homeTimers.push(setTimeout(() => { home.dataset.phase = 'walking-home'; }, 5640));
    homeTimers.push(setTimeout(() => { home.dataset.phase = 'inside'; }, 11200));
  }
  function updateHome() {
    if (!home) return;
    home.hidden = still || !familyReady || !imageReady || !parkourReady;
    const visible = !home.hidden && homeInView && !document.hidden;
    const wasVisible = home.classList.contains('is-visible');
    home.classList.toggle('is-visible', visible);
    if (visible && !wasVisible) playHome();
    if (!visible) { clearHomeTimers(); home.classList.remove('is-playing'); }
  }


  // Each heading is its own little stage. Native scrolling carries it with the text;
  // only transform keyframes animate, so there is no fixed-position scroll chasing.
  const headingSelectors = '.section-top h2, .explorer-header h2, .music-recognition h3, .article h1, .article .body h2';
  document.querySelectorAll(headingSelectors).forEach((heading, index) => {
    const section = heading.closest('section');
    const mode = heading.closest('.explorer-header') ? 'question' :
      section?.id === 'projects' ? 'idea' :
      heading.closest('.music-recognition') ? 'oboe' :
      section?.id === 'collaborations' ? 'highfive' :
      ['projects', 'career', 'academic-work'].includes(section?.id) ? 'laptop' : 'book';
    const holder = document.createElement('div');
    holder.className = 'doodle-heading';
    heading.before(holder);
    const stage = document.createElement('div');
    stage.className = 'heading-doodle-stage';
    stage.dataset.context = mode;
    stage.dataset.pose = mode;
    stage.hidden = true;
    stage.innerHTML = `<button type="button" class="doodle-button" aria-label="Play with the ${names[mode]} above this heading"><span class="doodle-facing" aria-hidden="true"><span class="doodle-sprite"></span><span class="doodle-parkour"></span><span class="doodle-concept"></span><span class="doodle-question-mark">?</span><span class="doodle-bulb"></span><span class="doodle-notes"><span>♪</span><span>♩</span></span></span></button>`;
    holder.append(stage, heading);
    const actor = stage.querySelector('button');
    let inView = false;
    let playing = false;
    let motion = null;
    let sequence = 0;
    let turns = index;
    let x = 0;
    let base = 0;
    let size = 96;
    let stageWidth = 0;
    let timers = [];
    const frame = (dx, dy = 0, angle = 0, sx = 1, sy = sx) => ({ transform: `translate3d(${dx}px,${dy}px,0) rotate(${angle}deg) scale(${sx},${sy})` });
    const setPose = pose => { stage.dataset.pose = pose; };
    function schedule(fn, delay) { timers.push(setTimeout(fn, delay)); }
    function stop() {
      sequence++;
      timers.forEach(clearTimeout);
      timers = [];
      motion?.cancel();
      motion = null;
      playing = false;
    }
    function measureStage() {
      stageWidth = holder.getBoundingClientRect().width;
      stageWidth = Math.min(stageWidth, 520);
      size = innerWidth < 600 ? 88 : 100;
      base = clamp(stageWidth * .42 - size / 2, 4, Math.max(4, stageWidth - size - 4));
      actor.style.left = `${base}px`;
      actor.style.top = `${120 - size * .86}px`;
      stage.style.setProperty('--doodle-size', `${size}px`);
      x = clamp(x, -base + 2, Math.max(-base + 2, stageWidth - base - size - 2));
      if (!playing) actor.style.transform = frame(x).transform;
    }
    function alive() { return inView && !still && imageReady && parkourReady && (!(mode === 'question' || mode === 'idea') || conceptReady) && !document.hidden; }
    function animate(frames, duration, finish) {
      const id = sequence;
      playing = true;
      motion = actor.animate(frames, { duration, fill: 'forwards', easing: 'linear' });
      motion.onfinish = () => {
        if (id !== sequence) return;
        actor.style.transform = frames[frames.length - 1].transform;
        motion.cancel();
        motion = null;
        playing = false;
        finish?.();
      };
    }
    function idle() {
      stage.dataset.state = 'idle';
      setPose(mode);
      stage.style.setProperty('--facing', '1');
      actor.tabIndex = 0;
      if (mode === 'idea') ideaSequence();
      // If a mouse is still there at landing, react again without a sudden teleport.
      if (pointer) schedule(() => react(pointer), 250);
    }
    function ideaSequence() {
      if (!alive() || playing || stage.dataset.state !== 'idle') return;
      setPose('idea-reach');
      stage.dataset.ideaPhase = 'spark';
      schedule(() => { stage.dataset.ideaPhase = 'catch'; }, 900);
      schedule(() => { setPose('idea-place'); stage.dataset.ideaPhase = 'use'; }, 2100);
      schedule(() => { setPose('laptop'); stage.dataset.ideaPhase = 'working'; }, 3400);
      schedule(ideaSequence, 7800);
    }
    function appear() {
      if (!alive()) return;
      stop();
      measureStage();
      x = 0;
      stage.dataset.state = 'entering';
      actor.tabIndex = 0;
      stage.style.setProperty('--facing', '1');
      const entrances = mode === 'question' ? ['peek','lean','stroll'] :
        mode === 'book' ? ['stroll','lean','peek','vault'] :
        mode === 'oboe' ? ['stroll','lean','slide','peek'] : ['stroll','slide','peek','vault'];
      const variant = entrances[turns++ % entrances.length];
      stage.dataset.entrance = variant;
      const restingPose = mode === 'idea' ? 'laptop' : mode;
      if (mode === 'highfive') {
        stage.dataset.entrance = 'meet';
        setPose(mode);
        animate([
          {...frame(-size * .7, 0, -3), opacity:0, offset:0, easing:'ease-out'},
          {...frame(0, 0, 1), opacity:1, offset:.75, easing:'ease-out'},
          {...frame(0), opacity:1, offset:1}
        ], 1100, idle);
        return;
      }
      if (variant === 'peek') {
        setPose('peek');
        schedule(() => setPose(restingPose), 980);
        animate([
          {...frame(0, size), offset:0, easing:'ease-out'},
          {...frame(0, size * .3, -5), offset:.28},
          {...frame(0, size * .3, 5), offset:.55, easing:'ease-in-out'},
          {...frame(0, size * .24), offset:.66, easing:'ease-out'},
          {...frame(0), offset:1}
        ], 1500, idle);
        return;
      }
      if (variant === 'lean') {
        setPose(restingPose);
        animate([
          {...frame(-base - size, 0, -16), opacity:0, offset:0, easing:'ease-out'},
          {...frame(-14, 0, -9), opacity:1, offset:.65, easing:'ease-in-out'},
          {...frame(0, 0, 2), opacity:1, offset:.88},
          {...frame(0), opacity:1, offset:1}
        ], 1400, idle);
        return;
      }
      if (variant === 'stroll') {
        setPose('run');
        schedule(() => setPose(restingPose), 1360);
        animate([
          {...frame(-base - size), offset:0},
          {...frame(-10), offset:.82, easing:'ease-out'},
          {...frame(0), offset:1}
        ], 1700, idle);
        return;
      }
      if (variant === 'slide') {
        setPose('run');
        stage.style.setProperty('--facing', '-1');
        schedule(() => setPose('land'), 800);
        animate([
          {...frame(stageWidth - base, 8, 12, 1.03, .85), offset:0, easing:'cubic-bezier(.2,.6,.3,1)'},
          {...frame(-12, 4, -12, 1.08, .86), offset:.76, easing:'ease-out'},
          {...frame(0), offset:1}
        ], 1100, idle);
        return;
      }
      setPose('jump');
      schedule(() => setPose('land'), 800);
      animate([
        {...frame(-base - size, 28, -18), offset:0, easing:'cubic-bezier(.2,.7,.35,1)'},
        {...frame(-size * .5, -27, -7), offset:.48, easing:'cubic-bezier(.55,0,.9,.65)'},
        {...frame(0, 3, 0, 1.06, .9), offset:.85, easing:'ease-out'},
        {...frame(0), offset:1}
      ], 1100, idle);
    }
    function escape(point, force = false) {
      if (!alive() || playing) return;
      const rect = actor.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height * .46;
      const dx = point ? cx - point.x : (turns % 2 ? 1 : -1);
      const dy = point ? cy - point.y : -1;
      if (!force && Math.hypot(dx, dy) > size * .9) return;
      const direction = Math.abs(dx) > 8 ? Math.sign(dx) : (turns % 2 ? 1 : -1);
      const lo = -base + 2;
      const hi = stageWidth - base - size - 2;
      const room = direction > 0 ? hi - x : x - lo;
      const duck = dy > 15 || room < size * .65;
      const destination = clamp(x + direction * size * (duck ? .8 : 1.25), lo, hi);
      const start = x;
      stop();
      turns++;
      stage.dataset.state = 'evading';
      stage.dataset.dodge = direction > 0 ? 'right' : 'left';
      stage.dataset.maneuver = duck ? 'duck' : dy < -12 ? 'leap' : 'backflip';
      stage.style.setProperty('--facing', String(direction));
      setPose(mode === 'highfive' ? mode : duck ? 'run' : 'jump');
      if (duck) {
        actor.tabIndex = -1;
        animate([
          {...frame(start), offset:0, easing:'ease-out'},
          {...frame(start - direction * 7, 5, -direction * 10, 1.07, .82), offset:.15},
          {...frame(destination, 0, direction * 10), offset:.64, easing:'ease-in'},
          {...frame(destination + direction * 12, size * 1.15, direction * 25, .8), offset:1}
        ], 750, () => {
          x = destination;
          stage.dataset.state = 'hidden';
          schedule(peek, 650);
        });
      } else {
        const flip = Math.abs(dy) <= 12 && mode !== 'highfive' && turns % 3 === 0;
        const grounded = Math.abs(dy) <= 18 && !flip;
        stage.dataset.maneuver = grounded ? 'sidestep' : flip ? 'backflip' : 'leap';
        if (grounded) {
          setPose(mode === 'highfive' ? mode : 'run');
          animate([
            {...frame(start), offset:0, easing:'ease-in'},
            {...frame(start - direction * 3, 0, -direction * 3), offset:.12},
            {...frame(destination, 0, direction * 3), offset:.86, easing:'ease-out'},
            {...frame(destination), offset:1}
          ], 950, () => { x = destination; idle(); });
          return;
        }
        if (flip) schedule(() => setPose('tuck'), 180);
        schedule(() => setPose(mode === 'highfive' ? mode : 'land'), 700);
        animate([
          {...frame(start), offset:0, easing:'ease-in'},
          {...frame(start - direction * 6, 6, -direction * 7, 1.05, .82), offset:.14, easing:'cubic-bezier(.15,.7,.3,1)'},
          {...frame((start + destination) / 2, -32, flip ? direction * 170 : direction * 13, .94), offset:.5},
          {...frame(destination, 3, flip ? direction * 360 : 0, 1.08, .88), offset:.85, easing:'ease-out'},
          {...frame(destination, 0, flip ? direction * 360 : 0), offset:1}
        ], 960, () => { x = destination; actor.style.transform = frame(x).transform; idle(); });
      }
    }
    function peek() {
      if (!alive()) return;
      setPose('peek');
      stage.dataset.state = 'peeking';
      actor.tabIndex = 0;
      // Re-enter on whichever side is farther from the cursor.
      const box = stage.getBoundingClientRect();
      x = pointer?.x > box.left + box.width / 2 ? -base + 8 : Math.max(-base + 8, stageWidth - base - size - 8);
      animate([frame(x, size), frame(x, size * .3)], 500, () => {
        schedule(() => {
          if (!alive()) return;
          setPose(mode);
          animate([frame(x, size * .45, 0, .9), {...frame(x), easing:'ease-out'}], 600, idle);
        }, 900);
      });
    }
    function react(point) { if (stage.dataset.state === 'idle' || stage.dataset.state === 'peeking') escape(point); }
    function sync() {
      stage.hidden = still || !imageReady || !parkourReady || ((mode === 'question' || mode === 'idea') && !conceptReady);
      if (alive()) {
        if (!visibleDoodles.has(controller)) { visibleDoodles.add(controller); measureStage(); appear(); }
      } else {
        visibleDoodles.delete(controller);
        stop();
        stage.dataset.state = 'offscreen';
      }
    }
    actor.addEventListener('click', event => {
      const point = event.detail ? {x:event.clientX, y:event.clientY} : null;
      escape(point, true);
    });
    actor.addEventListener('keydown', event => { if (event.key === 'Escape') appear(); });
    const controller = { stage, actor, react, escape, sync, measureStage, stop };
    controllers.push(controller);
    const observer = new IntersectionObserver(entries => {
      inView = entries[0].isIntersecting;
      sync();
    }, {threshold:.2, rootMargin:'-100px 0px -20px 0px'});
    observer.observe(stage);
  });
  document.addEventListener('pointermove', event => {
    if (event.pointerType === 'touch' || still) return;
    pointer = { x:event.clientX, y:event.clientY };
    if (!pointerFrame) pointerFrame = requestAnimationFrame(() => {
      pointerFrame = 0;
      visibleDoodles.forEach(doodle => doodle.react(pointer));
    });
  }, {passive:true});
  document.addEventListener('pointerdown', event => {
    if (still || (event.pointerType !== 'touch' && event.pointerType !== 'pen')) return;
    pointer = null;
    visibleDoodles.forEach(doodle => doodle.react({x:event.clientX, y:event.clientY}));
  }, {passive:true});
  document.addEventListener('pointerleave', () => { pointer = null; });
  const image = new Image();
  image.onload = () => { imageReady = true; controllers.forEach(doodle => doodle.sync()); updateHome(); };
  image.src = imageURL;
  const parkourImage = new Image();
  parkourImage.onload = () => { parkourReady = true; controllers.forEach(doodle => doodle.sync()); updateHome(); };
  parkourImage.src = parkourURL;
  const conceptImage = new Image();
  conceptImage.onload = () => { conceptReady = true; controllers.forEach(doodle => doodle.sync()); };
  conceptImage.src = conceptURL;
  // Falling snippets occupy the upper, already-passed area and the page gutters.
  const canvas = document.createElement('canvas');
  canvas.className = 'code-drift';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.append(canvas);
  const context = canvas.getContext('2d');
  let width = innerWidth;
  let height = innerHeight;
  let gutter = 0;
  let codeTop = 100;
  let codeBottom = 250;
  let particles = [];
  let lastSpawn = 0;
  let animationFrame = 0;
  let lastTime = 0;
  const fragments = ['{ curiosity }', 'const idea', 'privacy()', '→', 'return insight', '01', 'λ', '< / >', 'if (human)', 'read(); think();'];
  const smallFragments = ['{', '}', ';', 'λ', '0', '1'];
  function measure() {
    width = innerWidth;
    height = innerHeight;
    gutter = Math.max(0, wrap.getBoundingClientRect().left - 3);
    codeTop = (document.querySelector('.site-header')?.getBoundingClientRect().height || 90) + 10;
    codeBottom = Math.max(codeTop + 70, height * .34);
    const ratio = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context?.setTransform(ratio, 0, 0, ratio, 0, 0);
    particles = [];
  }
  function spawn(now) {
    if (!context || now - lastSpawn < 80) return;
    lastSpawn = now;
    for (let i = 0; i < 2; i++) {
      const upper = gutter < 35 || Math.random() < .78;
      const words = upper ? fragments : smallFragments;
      const left = 4 + Math.random() * Math.max(1, gutter - 20);
      particles.push({ text: words[Math.floor(Math.random() * words.length)],
        x: upper ? 12 + Math.random() * Math.max(1, width - 150) : Math.random() < .5 ? left : width - gutter + left,
        y: upper ? codeTop + 10 + Math.random() * (codeBottom - codeTop) * .35 : Math.random() * height * .65,
        life:1, speed:upper ? 32 + Math.random() * 30 : 65 + Math.random() * 40,
        size:upper ? (width < 600 ? 14 : 16) : 12, sway:Math.random() * Math.PI * 2 });
    }
    if (particles.length > 28) particles.splice(0, particles.length - 28);
  }
  function paint(now) {
    animationFrame = 0;
    if (still || document.hidden) { lastTime = 0; return; }
    const dt = Math.min((now - (lastTime || now)) / 1000, .04);
    lastTime = now;
    context?.clearRect(0, 0, width, height);
    if (context) {
      context.save();
      context.beginPath();
      context.rect(0, codeTop, width, codeBottom - codeTop);
      context.rect(0, codeTop, gutter, Math.max(0, height - codeTop - 70));
      context.rect(width - gutter, codeTop, gutter, Math.max(0, height - codeTop - 70));
      context.clip();
      particles = particles.filter(particle => particle.life > 0 && particle.y < height - 70);
      particles.forEach(particle => {
        particle.life -= dt * .5;
        particle.y += particle.speed * dt;
        context.globalAlpha = Math.max(0, Math.min(.68, particle.life * .8));
        context.fillStyle = '#985038';
        context.font = `${particle.size}px ui-monospace, monospace`;
        context.fillText(particle.text, particle.x + Math.sin(now / 800 + particle.sway) * 2, particle.y);
      });
      context.restore();
    }
    if (particles.length) animationFrame = requestAnimationFrame(paint);
    else lastTime = 0;
  }


  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'motion-toggle';
  toggle.innerHTML = '<span class="motion-symbol" aria-hidden="true"></span><span class="motion-label"></span>';
  document.body.append(toggle);
  function updateMotion() {
    still = reduced.matches || paused;
    document.body.classList.toggle('motion-paused', still);
    toggle.disabled = reduced.matches;
    toggle.setAttribute('aria-pressed', String(still));
    toggle.querySelector('.motion-symbol').textContent = still ? '▷' : 'Ⅱ';
    toggle.querySelector('.motion-label').textContent = reduced.matches ? 'Motion reduced' : paused ? 'Resume motion' : 'Pause motion';
    toggle.setAttribute('aria-label', reduced.matches ? 'Doodles and code motion are off, following your device preference' : paused ? 'Resume doodles and code motion' : 'Pause doodles and code motion');
    if (still) {
      particles = [];
      cancelAnimationFrame(animationFrame);
      cancelAnimationFrame(pointerFrame);
      pointerFrame = animationFrame = 0;
      context?.clearRect(0, 0, width, height);
    }
    controllers.forEach(doodle => doodle.sync());
    updateHome();
  }
  toggle.addEventListener('click', () => {
    paused = !paused;
    try { localStorage.setItem(storageKey, String(paused)); } catch { /* Optional local preference. */ }
    updateMotion();
  });
  reduced.addEventListener('change', updateMotion);
  updateMotion();

  addEventListener('scroll', () => {
    if (scrollFrame) return;
    scrollFrame = requestAnimationFrame(now => {
      scrollFrame = 0;
      const delta = scrollY - lastScroll;
      lastScroll = scrollY;
      if (still || Math.abs(delta) < 1) return;
      if (delta > 0) spawn(now);
      if (!animationFrame) animationFrame = requestAnimationFrame(paint);
    });
  }, { passive:true });
  const refresh = () => { measure(); controllers.forEach(doodle => doodle.measureStage()); updateHome(); };
  addEventListener('resize', refresh);
  addEventListener('load', refresh);
  addEventListener('pageshow', refresh);
  window.visualViewport?.addEventListener('resize', refresh);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(animationFrame);
      cancelAnimationFrame(pointerFrame);
      pointerFrame = animationFrame = 0;
      particles = [];
      lastTime = 0;
      context?.clearRect(0, 0, width, height);
    } else refresh();
    controllers.forEach(doodle => doodle.sync());
    updateHome();
  });
  measure();
})();
