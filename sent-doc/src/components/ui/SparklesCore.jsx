import React, { memo, useEffect, useId, useMemo, useState } from 'react';
import Particles, { initParticlesEngine } from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';
import { motion, useAnimation } from 'motion/react';

function joinClassNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

function SparklesCore({
  id,
  className,
  background,
  minSize,
  maxSize,
  speed,
  particleColor,
  particleDensity,
}) {
  const [initialized, setInitialized] = useState(false);
  const controls = useAnimation();
  const generatedId = useId();
  const particlesId = id || generatedId;

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => {
      setInitialized(true);
    });
  }, []);

  const options = useMemo(
    () => ({
      background: {
        color: {
          value: background || '#000000',
        },
      },
      detectRetina: true,
      fpsLimit: 120,
      fullScreen: {
        enable: false,
        zIndex: 1,
      },
      interactivity: {
        events: {
          onClick: {
            enable: true,
            mode: 'push',
          },
          onHover: {
            enable: false,
            mode: 'repulse',
          },
          resize: true,
        },
        modes: {
          push: {
            quantity: 4,
          },
          repulse: {
            distance: 200,
            duration: 0.4,
          },
        },
      },
      particles: {
        color: {
          value: particleColor || '#ffffff',
        },
        collisions: {
          enable: false,
        },
        move: {
          direction: 'none',
          enable: true,
          outModes: {
            default: 'out',
          },
          speed: {
            min: 0.1,
            max: 1,
          },
        },
        number: {
          density: {
            enable: true,
            width: 400,
            height: 400,
          },
          value: particleDensity || 1200,
        },
        opacity: {
          value: {
            min: 0.1,
            max: 1,
          },
          animation: {
            enable: true,
            speed: speed || 4,
            sync: false,
            mode: 'auto',
            startValue: 'random',
          },
        },
        shape: {
          type: 'circle',
        },
        size: {
          value: {
            min: minSize || 0.4,
            max: maxSize || 1,
          },
        },
      },
    }),
    [background, maxSize, minSize, particleColor, particleDensity, speed]
  );

  const handleParticlesLoaded = async (container) => {
    if (!container) return;

    controls.start({
      opacity: 1,
      transition: {
        duration: 1,
      },
    });
  };

  return (
    <motion.div animate={controls} className={joinClassNames('sparkles-core-shell', className)}>
      {initialized ? (
        <Particles
          id={particlesId}
          className="sparkles-core-canvas"
          particlesLoaded={handleParticlesLoaded}
          options={options}
        />
      ) : null}
    </motion.div>
  );
}

export default memo(SparklesCore);
