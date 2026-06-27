# KD Studios Labs Futuristic Website — Build Plan (UI-first)

## Completed
- Added cinematic loader + animated space background + custom cursor on homepage.
  - `frontend/public/experience.js`
  - `frontend/public/index.html`
  - `frontend/public/styles.css`

## Next (to make it closer to the prompt)
1. Replace placeholder crystal logo in `experience.js` with real KD crystal-glass 3D logo.
   - Prefer: Three.js + custom glass shader + bloom.
2. Upgrade homepage hero to a true 3D scene (Three.js) with:
   - refraction/reflection
   - volumetric glow / bloom
   - energy waves
   - cursor interaction affecting lighting.
3. Add scroll storytelling with GSAP ScrollTrigger (layered parallax + holographic cards).
4. Implement sections (Who We Are, Product Ecosystem, Food Scan AI, Tech Stack orbit, AI Lab, Portfolio, Stats, Contact) matching the spec.
5. Performance hardening for Lighthouse 95+: lazy loading + reduced-motion fallback.

