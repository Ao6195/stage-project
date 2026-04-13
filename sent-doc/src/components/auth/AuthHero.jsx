import React, { memo } from 'react';
import AuthHeroVisual from './AuthHeroVisual';

function AuthHero({
  title,
  accent,
  caption,
  mode,
  compactTitle = false,
}) {
  return (
    <section className="auth-hero compact-hero auth-hero-smokey">
      <AuthHeroVisual
        title={title}
        accent={accent}
        caption={caption}
        mode={mode}
        compactTitle={compactTitle}
      />
    </section>
  );
}

export default memo(AuthHero);
