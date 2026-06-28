/* ============================================================
   KD STUDIOS — Museum 3D (Pedestals / Click-to-open overlay)
   ============================================================ */

(() => {
  const page = document.body?.dataset?.page;
  if (page !== 'home') return;

  const canvas = document.getElementById('museumCanvas');
  if (!canvas) return;

  const apps = window.__KD_MUSEUM_APPS__;
  if (!Array.isArray(apps) || apps.length === 0) return;

  const w = canvas.clientWidth || 500;
  const h = canvas.clientHeight || 300;
  canvas.width = w;
  canvas.height = h;

  const drawFallback = (text) => {
    try {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(44,36,24,0.88)';
      ctx.font = '600 14px monospace';
      ctx.fillText(text, 16, 28);
    } catch {}
  };

  import('https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js')
    .then((THREE) => {
      const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
      renderer.setSize(w, h);
      renderer.setPixelRatio(window.devicePixelRatio || 1);

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0xf8f2ea);

      const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 1000);
      camera.position.set(0, 2.3, 10.5);
      camera.lookAt(0, 1.2, 0);

      // Lights (warm mahali feel)
      const ambient = new THREE.AmbientLight(0xfff2d6, 0.70);
      scene.add(ambient);

      const dir = new THREE.DirectionalLight(0xfff1d0, 0.95);
      dir.position.set(6, 10, 6);
      scene.add(dir);

      const rim = new THREE.DirectionalLight(0xffffff, 0.55);
      rim.position.set(-6, 8, -6);
      scene.add(rim);

      // Subtle reflective floor (glassy sheen)
      const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(30, 30),
        new THREE.MeshPhongMaterial({
          color: 0xffffff,
          shininess: 90,
          specular: 0xffffff,
          transparent: true,
          opacity: 0.18
        })
      );
      floor.rotation.x = -Math.PI / 2;
      floor.position.y = 0;
      scene.add(floor);


      // Pedestals layout: Center hall
      // We place apps in two rows with spacing.
      const group = new THREE.Group();
      scene.add(group);

      const pedestalMeshes = [];
      const iconSprites = [];

      const pedestalTopSize = 1.05;
      const pedestalHeight = 0.7;
      const pedestalWidth = 1.25;

      const rowZ = 1.7;
      const backRowZ = -1.2;
      const colX = [-2.7, 0, 2.7];

      // Ensure we map first 3 to front row, next to back
      const positions = [
        { x: colX[0], z: rowZ, scale: 1 },
        { x: colX[1], z: rowZ, scale: 1 },
        { x: colX[2], z: rowZ, scale: 1 },
        { x: colX[0], z: backRowZ, scale: 0.95 },
        { x: colX[2], z: backRowZ, scale: 0.95 }
      ];

      const loader = new THREE.TextureLoader();

      // Simple materials
      const pedestalMat = new THREE.MeshPhongMaterial({ color: 0xf0e8de, shininess: 60 });
      const pedestalEdgeMat = new THREE.MeshPhongMaterial({ color: 0xd4c9bc, shininess: 30 });

      // Click detection
      const raycaster = new THREE.Raycaster();
      const pointer = new THREE.Vector2();

      const openOverlay = (appId) => {
        const fn = window.__KD_OPEN_OVERLAY__;
        if (typeof fn !== 'function') return;
        const app = apps.find((a) => a.id === appId);
        if (app) fn(app);
      };

      const createPedestal = (app, i) => {
        const p = positions[i] || positions[0];
        const scale = p.scale || 1;

        const pedestalGroup = new THREE.Group();
        pedestalGroup.position.set(p.x, 0, p.z);
        pedestalGroup.scale.setScalar(scale);

        // Base
        const base = new THREE.Mesh(
          new THREE.BoxGeometry(pedestalWidth, pedestalHeight, 0.95),
          pedestalMat
        );
        base.position.y = pedestalHeight / 2;
        pedestalGroup.add(base);

        const top = new THREE.Mesh(
          new THREE.BoxGeometry(pedestalTopSize, 0.12, pedestalTopSize),
          pedestalEdgeMat
        );
        top.position.y = pedestalHeight + 0.06;
        pedestalGroup.add(top);

        // Icon panel (plane) sitting on top
        const planeGeo = new THREE.PlaneGeometry(0.75, 0.75);
        const placeholder = new THREE.MeshBasicMaterial({ color: 0xfffbf5, transparent: true, opacity: 0.95 });
        const iconPlane = new THREE.Mesh(planeGeo, placeholder);
        iconPlane.position.y = pedestalHeight + 0.18;
        iconPlane.rotation.x = 0;
        pedestalGroup.add(iconPlane);

        // Hover / click interaction
        pedestalGroup.userData.appId = app.id;
        pedestalMeshes.push(pedestalGroup);

        // Load icon texture
        loader.load(
          app.icon,
          (texture) => {
            // Best effort for non-cross-origin icons (icons are local)
            texture.colorSpace = THREE.SRGBColorSpace;
            const mat = new THREE.MeshBasicMaterial({ map: texture, transparent: true, opacity: 1 });
            iconPlane.material = mat;
          },
          undefined,
          () => {
            // keep placeholder
          }
        );

        group.add(pedestalGroup);
      };

      apps.slice(0, 5).forEach((app, i) => createPedestal(app, i));

      const onPointerMove = (e) => {
        const rect = canvas.getBoundingClientRect();
        pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        pointer.y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      };

      const onClick = () => {
        raycaster.setFromCamera(pointer, camera);
        // Intersect with child groups (approx)
        const intersects = raycaster.intersectObjects(group.children, true);
        if (!intersects || !intersects.length) return;

        // Find nearest pedestal group with userData
        for (const hit of intersects) {
          let obj = hit.object;
          while (obj && !obj.userData?.appId) obj = obj.parent;
          if (obj?.userData?.appId) {
            openOverlay(obj.userData.appId);
            return;
          }
        }
      };

      canvas.addEventListener('pointermove', onPointerMove);
      canvas.addEventListener('click', onClick);

      let t = 0;
      const animate = () => {
        t += 0.01;
        // gentle camera orbit
        const radius = 10.5;
        camera.position.x = Math.sin(t * 0.35) * 0.15;
        camera.position.z = radius + Math.cos(t * 0.35) * 0.3;
        camera.lookAt(0, 1.2, 0);

        renderer.render(scene, camera);
        requestAnimationFrame(animate);
      };

      animate();

      // Resize support
      const onResize = () => {
        const nw = canvas.clientWidth || w;
        const nh = canvas.clientHeight || h;
        renderer.setSize(nw, nh);
        camera.aspect = nw / nh;
        camera.updateProjectionMatrix();
      };
      window.addEventListener('resize', onResize);
    })
    .catch((err) => {
      drawFallback('Three.js failed to load');
    });
})();



