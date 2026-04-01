import React, { useEffect, useRef } from 'react';

export default function AuthHeroVisual() {
  const visualRef = useRef(null);
  const effectRef = useRef(null);

  useEffect(() => {
    let mounted = true;

    const initEffect = async () => {
      try {
        const [{ default: VantaWaves }, THREE] = await Promise.all([
          import('vanta/dist/vanta.waves.min'),
          import('three'),
        ]);

        if (!mounted || !visualRef.current || effectRef.current) {
          return;
        }

        visualRef.current.classList.remove('auth-vanta-fallback');

        effectRef.current = VantaWaves({
          el: visualRef.current,
          THREE,
          mouseControls: true,
          touchControls: true,
          gyroControls: false,
          minHeight: 280,
          minWidth: 280,
          scale: 1,
          scaleMobile: 1,
          backgroundColor: 0x0d1b2a,
          backgroundAlpha: 0,
          color: 0x7dd3fc,
          shininess: 42,
          waveHeight: 18,
          waveSpeed: 0.9,
          zoom: 0.95,
        });
      } catch {
        if (mounted && visualRef.current) {
          visualRef.current.classList.add('auth-vanta-fallback');
        }
      }
    };

    initEffect();

    return () => {
      mounted = false;
      if (effectRef.current) {
        effectRef.current.destroy();
        effectRef.current = null;
      }
    };
  }, []);

  return <div ref={visualRef} className="auth-vanta-layer auth-vanta-fallback" aria-hidden="true" />;
}
