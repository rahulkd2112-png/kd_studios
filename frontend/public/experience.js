(() => {
  const page = document.body.dataset.page;
  if (!page || page !== 'home') return;

  const root = document.body;
  const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const canvas = document.getElementById('kd-three-canvas');

  if (!canvas || typeof window.THREE === 'undefined') {
    root.style.cursor = '';
    return;
  }

  const loader = document.createElement('div');
  loader.id = 'kd-loader';
  loader.innerHTML = `
    <div class="kd-loader-bg"></div>
    <canvas class="kd-loader-canvas" aria-hidden="true"></canvas>
    <div class="kd-loader-center">
      <div class="kd-loader-mark" aria-hidden="true">
        <div class="kd-loader-mark-core"></div>
        <div class="kd-loader-mark-energy"></div>
        <div class="kd-loader-mark-glass"></div>
      </div>
      <div class="kd-loader-text">
        <div class="kd-loader-title">KD Studios</div>
        <div class="kd-loader-sub">Loading apps, games, websites, and dashboards</div>
      </div>
    </div>
  `;
  root.appendChild(loader);
  root.classList.add('kd-loading');

  const cursor = document.createElement('div');
  cursor.id = 'kd-cursor';
  cursor.innerHTML = '<div class="kd-cursor-glow"></div><div class="kd-cursor-ring"></div><div class="kd-cursor-crosshair"></div>';
  if (!isTouch) {
    root.appendChild(cursor);
    root.style.cursor = 'none';
  }

  let loaderRecoveryTimer = 0;
  let experienceReady = false;

  const stopLoading = () => {
    window.clearTimeout(loaderRecoveryTimer);
    window.removeEventListener('error', handleExperienceError);
    root.classList.remove('kd-loading');
    loader.remove();
  };

  const recoverExperience = () => {
    window.clearTimeout(loaderRecoveryTimer);
    window.removeEventListener('error', handleExperienceError);
    root.classList.remove('kd-loading');
    loader.remove();
    cursor.remove();
    root.style.cursor = '';
  };

  const handleExperienceError = () => {
    if (!experienceReady) {
      recoverExperience();
    }
  };

  window.addEventListener('error', handleExperienceError);
  loaderRecoveryTimer = window.setTimeout(recoverExperience, isReduced ? 2500 : 5200);


  const mouse = { x: 0, y: 0 };
  const cursorState = { x: window.innerWidth / 2, y: window.innerHeight / 2, targetX: window.innerWidth / 2, targetY: window.innerHeight / 2 };

  const updateCursor = () => {
    cursorState.x += (cursorState.targetX - cursorState.x) * 0.18;
    cursorState.y += (cursorState.targetY - cursorState.y) * 0.18;
    cursor.style.left = `${cursorState.x}px`;
    cursor.style.top = `${cursorState.y}px`;
  };

  const animateCursor = () => {
    updateCursor();
    requestAnimationFrame(animateCursor);
  };

  const pointerMove = (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    cursorState.targetX = event.clientX;
    cursorState.targetY = event.clientY;
    let target = event.target;
    while (target && target.nodeType !== 1) {
      target = target.parentNode;
    }
    target = target && target.closest ? target.closest('[data-magnetic], a, button') : null;
    cursor.dataset.magnetic = target ? 'true' : 'false';
  };

  if (!isTouch) {
    window.addEventListener('pointermove', pointerMove, { passive: true });
    window.addEventListener('pointerleave', () => {
      cursorState.targetX = window.innerWidth / 2;
      cursorState.targetY = window.innerHeight / 2;
    });
  }

  const resizeThree = () => {
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(dpr);
    renderer.setSize(rect.width, rect.height, false);
    camera.aspect = rect.width / rect.height;
    camera.updateProjectionMatrix();
  };

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2('#020818', 0.0035);

  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 1200);
  camera.position.set(0, 1.5, 8.4);

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
  renderer.setClearColor(0x000000, 0);
  renderer.physicallyCorrectLights = true;

  const ambient = new THREE.AmbientLight(0x7ad8ff, 0.4);
  const key = new THREE.DirectionalLight(0xc8eeff, 1.1);
  key.position.set(-1.6, 2.4, 2.2);
  const fill = new THREE.DirectionalLight(0x8b94ff, 0.75);
  fill.position.set(1.8, 0.8, 1.2);
  const rim = new THREE.PointLight(0x9bf0ff, 2.2, 20, 2);
  rim.position.set(-2.4, 1.6, -3.4);
  scene.add(ambient, key, fill, rim);

  const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xcbf8ff,
    metalness: 0.1,
    roughness: 0.06,
    transmission: 0.92,
    thickness: 1.2,
    ior: 1.52,
    reflectivity: 0.7,
    clearcoat: 0.75,
    clearcoatRoughness: 0.14,
    opacity: 0.98,
    transparent: true,
    envMapIntensity: 1.15,
  });

  const crystal = new THREE.Group();
  const shardGeometry = new THREE.OctahedronGeometry(1.2, 0);
  const shardCount = 7;

  for (let i = 0; i < shardCount; i++) {
    const shard = new THREE.Mesh(shardGeometry, glassMaterial);
    shard.scale.setScalar(0.72 + Math.random() * 0.35);
    shard.position.set((Math.random() - 0.5) * 2.6, (Math.random() - 0.5) * 2.2, (Math.random() - 0.5) * 2.4);
    shard.rotation.set(Math.random() * 1.8, Math.random() * 1.8, Math.random() * 1.8);
    crystal.add(shard);
  }

  const coreGeo = new THREE.IcosahedronGeometry(1.5, 1);
  const core = new THREE.Mesh(coreGeo, new THREE.MeshPhysicalMaterial({
    color: 0x8ee5ff,
    emissive: 0x54c4ff,
    emissiveIntensity: 0.42,
    metalness: 0.05,
    roughness: 0.15,
    transmission: 0.88,
    thickness: 0.8,
    opacity: 0.98,
    transparent: true,
    envMapIntensity: 1.1,
  }));
  crystal.add(core);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(3.8, 0.07, 24, 100),
    new THREE.MeshBasicMaterial({ color: 0x6ef3ff, transparent: true, opacity: 0.16 })
  );
  ring.rotation.x = Math.PI / 2;
  crystal.add(ring);

  const ring2 = new THREE.Mesh(
    new THREE.TorusGeometry(4.45, 0.04, 22, 100),
    new THREE.MeshBasicMaterial({ color: 0xcc9bff, transparent: true, opacity: 0.14 })
  );
  ring2.rotation.x = Math.PI / 2;
  ring2.rotation.z = Math.PI / 2.9;
  crystal.add(ring2);

  const halo = new THREE.Mesh(
    new THREE.SphereGeometry(5.5, 38, 28),
    new THREE.MeshBasicMaterial({ color: 0x69d5ff, transparent: true, opacity: 0.06 })
  );
  crystal.add(halo);

  scene.add(crystal);

  const particleGroup = new THREE.Group();
  const particleGeometry = new THREE.SphereGeometry(0.08, 10, 10);
  for (let i = 0; i < 22; i++) {
    const particle = new THREE.Mesh(particleGeometry, new THREE.MeshBasicMaterial({ color: 0x7fd8ff, transparent: true, opacity: 0.22 }));
    const distance = 3.8 + Math.random() * 1.8;
    const angle = Math.random() * Math.PI * 2;
    particle.position.set(Math.cos(angle) * distance, (Math.random() - 0.5) * 2.6, Math.sin(angle) * distance);
    particle.scale.setScalar(0.5 + Math.random() * 0.9);
    particleGroup.add(particle);
  }
  scene.add(particleGroup);

  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(25, 12),
    new THREE.MeshBasicMaterial({ color: 0x041225, transparent: true, opacity: 0.32 })
  );
  plane.position.set(0, -2.6, -3.3);
  plane.rotation.x = -0.26;
  scene.add(plane);

  const edges = new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(1.5, 1));
  const edgeLines = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x79cafe, transparent: true, opacity: 0.18 }));
  crystal.add(edgeLines);

  const clock = new THREE.Clock();

  const revealElements = document.querySelectorAll('.reveal');
  const initReveal = () => {
    if (window.gsap && window.ScrollTrigger) {
      gsap.registerPlugin(ScrollTrigger);
      gsap.utils.toArray('.reveal').forEach((element) => {
        gsap.fromTo(element,
          { autoAlpha: 0, y: 50 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 1.2,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: element,
              start: 'top 82%',
              once: true,
            },
          });
      });

      ScrollTrigger.create({
        trigger: '.kd-stats-grid',
        start: 'top 85%',
        onEnter: () => {
          document.querySelectorAll('.kd-stats-grid strong').forEach((node) => {
            const target = +node.dataset.value;
            gsap.to(node, {
              innerText: target,
              snap: { innerText: 1 },
              duration: 1.8,
              ease: 'power2.out',
              onUpdate: () => {
                node.textContent = Math.floor(node.innerText).toLocaleString();
              }
            });
          });
        }
      });

      gsap.from('.kd-orbit-core', { autoAlpha: 0, y: 40, duration: 1.4, ease: 'power3.out', delay: 0.25 });
    } else {
      revealElements.forEach((el) => {
        el.style.opacity = '1';
        el.style.transform = 'none';
      });
    }
  };

  const initMagneticCards = () => {
    document.querySelectorAll('[data-magnetic]').forEach((card) => {
      card.addEventListener('pointermove', (event) => {
        const rect = card.getBoundingClientRect();
        const dx = (event.clientX - (rect.left + rect.width / 2)) * 0.08;
        const dy = (event.clientY - (rect.top + rect.height / 2)) * 0.08;
        card.style.transform = `translate3d(${dx}px, ${dy}px, 0) rotateX(${dy * 0.03}deg) rotateY(${dx * 0.03}deg)`;
      });
      card.addEventListener('pointerleave', () => {
        card.style.transform = 'translate3d(0,0,0) rotateX(0) rotateY(0)';
      });
    });
  };

  const initBackdrop = () => {
    if (isReduced) return;
    const particleSurface = document.createElement('canvas');
    particleSurface.id = 'kd-backdrop-canvas';
    particleSurface.style.position = 'fixed';
    particleSurface.style.inset = '0';
    particleSurface.style.zIndex = '-3';
    particleSurface.style.pointerEvents = 'none';
    root.appendChild(particleSurface);

    const ctx = particleSurface.getContext('2d');
    const nodes = Array.from({ length: 14 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.2,
      vy: (Math.random() - 0.5) * 0.2,
      alpha: 0.06 + Math.random() * 0.06,
    }));

    const resizeBackdrop = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      particleSurface.width = window.innerWidth * dpr;
      particleSurface.height = window.innerHeight * dpr;
      particleSurface.style.width = `${window.innerWidth}px`;
      particleSurface.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    window.addEventListener('resize', resizeBackdrop);
    resizeBackdrop();

    const draw = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      nodes.forEach((node) => {
        node.x += node.vx;
        node.y += node.vy;
        if (node.x < -40) node.x = window.innerWidth + 40;
        if (node.x > window.innerWidth + 40) node.x = -40;
        if (node.y < -40) node.y = window.innerHeight + 40;
        if (node.y > window.innerHeight + 40) node.y = -40;

        const gradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, 62);
        gradient.addColorStop(0, `rgba(127, 216, 255, ${node.alpha})`);
        gradient.addColorStop(1, 'rgba(127, 216, 255, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(node.x, node.y, 64, 0, Math.PI * 2);
        ctx.fill();
      });
      requestAnimationFrame(draw);
    };
    draw();
  };

  const initLoader = () => {
    const loaderCanvas = loader.querySelector('.kd-loader-canvas');
    const ctx = loaderCanvas.getContext('2d');
    const resizeLoader = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      loaderCanvas.width = window.innerWidth * dpr;
      loaderCanvas.height = window.innerHeight * dpr;
      loaderCanvas.style.width = `${window.innerWidth}px`;
      loaderCanvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const shards = Array.from({ length: isReduced ? 10 : 28 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight * 0.5,
      vx: (Math.random() - 0.5) * 2.4,
      vy: (Math.random() - 0.5) * 2.6,
      rot: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 0.12,
      size: 12 + Math.random() * 18,
    }));

    resizeLoader();
    window.addEventListener('resize', resizeLoader);

    const start = performance.now();
    const drawFrame = (time) => {
      const t = Math.min(1, (time - start) / (isReduced ? 900 : 2800));
      const width = loaderCanvas.width / (window.devicePixelRatio || 1);
      const height = loaderCanvas.height / (window.devicePixelRatio || 1);
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = 'rgba(3, 7, 19, 0.98)';
      ctx.fillRect(0, 0, width, height);

      const phase1 = Math.min(1, t / 0.18);
      const phase2 = Math.min(1, Math.max(0, (t - 0.18) / 0.4));
      const phase3 = Math.min(1, Math.max(0, (t - 0.58) / 0.24));
      const phase4 = Math.min(1, Math.max(0, (t - 0.82) / 0.18));

      for (let i = 0; i < 50 * phase1; i++) {
        const angle = (i / 50) * Math.PI * 2;
        const radius = phase1 * 220 + i * 1.5;
        const x = width / 2 + Math.cos(angle) * radius;
        const y = height / 2 + Math.sin(angle) * radius * 0.4;
        ctx.beginPath();
        ctx.fillStyle = `rgba(127, 216, 255, ${0.08 * phase1})`;
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      shards.forEach((shard, index) => {
        const targetX = width / 2 + Math.sin(index + shard.rot) * 40;
        const targetY = height / 2 + Math.cos(index + shard.rot) * 20;
        if (phase2 > 0.05) {
          shard.x += (targetX - shard.x) * 0.02;
          shard.y += (targetY - shard.y) * 0.02;
        } else {
          shard.x += shard.vx;
          shard.y += shard.vy;
        }
        shard.rot += shard.vr;
        ctx.save();
        ctx.translate(shard.x, shard.y);
        ctx.rotate(shard.rot);
        ctx.globalAlpha = 0.35 + 0.4 * phase2;
        ctx.beginPath();
        ctx.moveTo(-shard.size * 0.5, -shard.size * 0.3);
        ctx.lineTo(shard.size * 0.2, -shard.size * 0.6);
        ctx.lineTo(shard.size * 0.55, shard.size * 0.1);
        ctx.lineTo(-shard.size * 0.15, shard.size * 0.55);
        ctx.closePath();
        ctx.fillStyle = 'rgba(159, 234, 255, 0.55)';
        ctx.fill();
        ctx.restore();
      });

      if (phase3 > 0) {
        ctx.save();
        ctx.translate(width / 2, height / 2);
        ctx.globalAlpha = phase3;
        ctx.fillStyle = 'rgba(127, 216, 255, 0.16)';
        ctx.strokeStyle = 'rgba(159, 234, 255, 0.45)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-54, -92);
        ctx.lineTo(12, -116);
        ctx.lineTo(88, -12);
        ctx.lineTo(23, 106);
        ctx.lineTo(-18, 92);
        ctx.lineTo(-64, 12);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }

      if (phase4 > 0) {
        ctx.save();
        ctx.translate(width / 2, height / 2);
        ctx.globalAlpha = 0.5 * phase4;
        ctx.strokeStyle = 'rgba(127, 216, 255, 0.9)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, 0, 88, 0, Math.PI * 2 * phase4);
        ctx.stroke();
        ctx.restore();
      }

      const fade = t > 0.92 ? (t - 0.92) / 0.08 : 0;
      loader.style.opacity = String(1 - Math.min(1, fade));
      if (t >= 0.998) {
        window.removeEventListener('resize', resizeLoader);
        stopLoading();
        return;
      }
      requestAnimationFrame(drawFrame);
    };

    requestAnimationFrame(drawFrame);
  };

  const initThree = () => {
    if (!canvas) return;
    resizeThree();
    window.addEventListener('resize', resizeThree);
  };

  const animateThree = () => {
    const elapsed = clock.getElapsedTime();
    crystal.rotation.y += 0.0025;
    crystal.rotation.x = 0.28 + Math.sin(elapsed * 0.35) * 0.08 + mouse.y * 0.08;
    crystal.rotation.z = Math.cos(elapsed * 0.12) * 0.05;
    particleGroup.children.forEach((particle, index) => {
      const angle = elapsed * 0.18 + index * 0.34;
      const radius = 4.4 + Math.sin(elapsed * 0.6 + index) * 0.18;
      particle.position.x = Math.cos(angle) * radius;
      particle.position.z = Math.sin(angle) * radius;
      particle.position.y = Math.sin(elapsed * 0.42 + index) * 0.22;
    });

    const mag = cursor.dataset.magnetic === 'true' ? 1.2 : 1;
    const ring = cursor.querySelector('.kd-cursor-ring');
    const glow = cursor.querySelector('.kd-cursor-glow');
    const cross = cursor.querySelector('.kd-cursor-crosshair');
    if (ring) ring.style.transform = `translate(-50%, -50%) scale(${mag})`;
    if (glow) glow.style.transform = `translate(-50%, -50%) scale(${1.25 + (mag - 1) * 0.45})`;
    if (cross) cross.style.opacity = cursor.dataset.magnetic === 'true' ? '0.55' : '0.32';

    renderer.render(scene, camera);
    requestAnimationFrame(animateThree);
  };

  const init = () => {
    initLoader();
    initReveal();
    initMagneticCards();
    initBackdrop();
    initThree();
    animateThree();
    if (!isTouch) {
      animateCursor();
    }
    experienceReady = true;
  };

  try {
    init();
  } catch (error) {
    console.error('KD home experience failed to initialize:', error);
    recoverExperience();
  }
})();
