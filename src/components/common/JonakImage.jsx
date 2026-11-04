import React, { useState, useEffect } from 'react';
import { assetUrl } from '../../config/apiConfig';

/**
 * JonakImage - Resilient, CLS-free, branded image component
 * - Corrects GitHub Pages base subpath automatically via assetUrl
 * - Shows smooth skeleton placeholder while loading
 * - Retries with fallbackSrc or jpg format on failure
 * - Falls back to a branded Jonak badge if all assets fail
 * - Guarantees zero broken image icons
 */
export function JonakImage({
  src,
  alt = 'Jonak Hotel & Restaurant Barpeta',
  fallbackSrc,
  aspectRatio,
  className = '',
  style = {},
  loading = 'lazy',
  decoding = 'async',
  onClick,
  ...props
}) {
  const [loadStage, setLoadStage] = useState('primary'); // 'primary' | 'fallback' | 'branded_fallback'
  const [isLoaded, setIsLoaded] = useState(false);

  // Compute actual URLs
  const primaryUrl = assetUrl(src);
  const secondaryUrl = fallbackSrc 
    ? assetUrl(fallbackSrc) 
    : (src && src.endsWith('.webp') ? assetUrl(src.replace(/\.webp$/, '.jpg')) : null);

  useEffect(() => {
    setLoadStage('primary');
    setIsLoaded(false);
  }, [src]);

  const handleError = () => {
    if (loadStage === 'primary' && secondaryUrl && secondaryUrl !== primaryUrl) {
      setLoadStage('fallback');
      setIsLoaded(false);
    } else {
      setLoadStage('branded_fallback');
      setIsLoaded(true);
    }
  };

  const currentSrc = loadStage === 'primary' ? primaryUrl : (secondaryUrl || primaryUrl);

  const containerStyle = {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#071616',
    ...(aspectRatio ? { aspectRatio } : {}),
    ...style
  };

  if (loadStage === 'branded_fallback') {
    return (
      <div 
        className={`jonak-img-fallback-container ${className}`} 
        style={{
          ...containerStyle,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #002B2B 0%, #001A1A 100%)',
          color: '#F5C542',
          textAlign: 'center',
          padding: '1rem',
          border: '1px solid rgba(245, 197, 66, 0.2)'
        }}
        onClick={onClick}
        role="img"
        aria-label={alt}
      >
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" stroke="#F5C542" strokeWidth="1.5" />
          <path d="M12 7V13C12 14.5 11 15.5 9.5 15.5C8 15.5 7 14.5 7 13" stroke="#F5C542" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <span style={{ fontSize: '0.72rem', fontWeight: 700, marginTop: '0.4rem', letterSpacing: '0.05em' }}>
          JONAK BARPETA
        </span>
        <span style={{ fontSize: '0.65rem', color: '#CBD5E1', opacity: 0.8, marginTop: '0.2rem' }}>
          {alt}
        </span>
      </div>
    );
  }

  return (
    <div className={`jonak-img-wrapper ${className}`} style={containerStyle} onClick={onClick}>
      {/* Subtle skeleton shimmer during load */}
      {!isLoaded && (
        <div 
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(90deg, #041d1d 0%, #0b3232 50%, #041d1d 100%)',
            backgroundSize: '200% 100%',
            animation: 'jonakShimmer 1.5s infinite linear',
            zIndex: 1
          }} 
        />
      )}
      <img
        src={currentSrc}
        alt={alt}
        loading={loading}
        decoding={decoding}
        onLoad={() => setIsLoaded(true)}
        onError={handleError}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
          opacity: isLoaded ? 1 : 0,
          transition: 'opacity 0.25s ease-in-out'
        }}
        {...props}
      />
    </div>
  );
}

export default JonakImage;
