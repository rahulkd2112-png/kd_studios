(() => {
  // Museum Theme — Shared motion/reveal init for all pages.
  const page = document.body?.dataset?.page;

  const isReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  // Mark JS enabled so .reveal transitions can run.
  document.documentElement.classList.add('js-enabled');

  // Loader page-transition (fade-in)
  const maybeInitPageFade = () => {
    const shell = document.querySelector('.museum-shell') || document.querySelector('.site-shell') || document.body;
    if (!shell) return;

    shell.style.willChange = 'transform, opacity';
    shell.style.opacity = '0';
    shell.style.transform = 'translateY(10px)';

    requestAnimationFrame(() => {
      if (isReduced) {
        shell.style.opacity = '1';
        shell.style.transform = 'translateY(0)';
        return;
      }
      shell.animate(
        [
          { opacity: 0, transform: 'translateY(10px)' },
          { opacity: 1, transform: 'translateY(0px)' }
        ],
        { duration: 700, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)', fill: 'forwards' }
      );
    });
  };

  // Reveal + counters via IntersectionObserver
  const initReveal = () => {
    const revealItems = document.querySelectorAll('.reveal');
    if (!revealItems.length) return;

    const runGsap = !!(window.gsap && window.ScrollTrigger);

    if (runGsap && !isReduced) {
      try {
        const { gsap, ScrollTrigger } = window;
        gsap.registerPlugin(ScrollTrigger);

        gsap.utils.toArray('.reveal').forEach((el) => {
          gsap.fromTo(
            el,
            { autoAlpha: 0, y: 30 },
            {
              autoAlpha: 1,
              y: 0,
              duration: 1.1,
              ease: 'power3.out',
              scrollTrigger: { trigger: el, start: 'top 85%', once: true }
            }
          );
        });

        const counterNodes = document.querySelectorAll('[data-value]');
        if (counterNodes.length) {
          ScrollTrigger.create({
            trigger: counterNodes[0],
            start: 'top 85%',
            onEnter: () => {
              counterNodes.forEach((node) => {
                const target = Number(node.dataset.value);
                if (!Number.isFinite(target)) return;
                gsap.to({ v: 0 }, {
                  v: target,
                  duration: 1.8,
                  ease: 'power2.out',
                  onUpdate: function () {
                    node.textContent = Math.round(this.targets()[0].v).toLocaleString();
                  }
                });
              });
            }
          });
        }
      } catch {
        // fallback to IntersectionObserver
      }
    }

    // Fallback reveal
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.16 }
    );

    revealItems.forEach((el) => {
      el.classList.remove('visible');
      observer.observe(el);
    });
  };

  // Parallax
  const initParallax = () => {
    if (isReduced) return;
    const nodes = document.querySelectorAll('[data-parallax]');
    if (!nodes.length) return;

    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const y = window.scrollY || 0;
        nodes.forEach((node) => {
          const strength = Number(node.dataset.parallax || '0.08');
          node.style.transform = `translate3d(0, ${y * strength}px, 0)`;
        });
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  };

  const init = () => {
    maybeInitPageFade();
    initReveal();
    initParallax();
  };

  init();
})();
