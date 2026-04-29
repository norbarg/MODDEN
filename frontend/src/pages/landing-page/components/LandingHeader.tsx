// src/pages/landing-page/components/LandingHeader.tsx
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../../shared/routes/routes';
import logoOrange from '../../../assets/modden-logo-orange.svg';

export function LandingHeader() {
  const [isVisible, setIsVisible] = useState(true);
  const [isScrolling, setIsScrolling] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const scrollTimeoutRef = useRef<number | null>(null);
  const isHoveredRef = useRef(false);

  const hideHeaderAfterDelay = () => {
    if (scrollTimeoutRef.current) {
      window.clearTimeout(scrollTimeoutRef.current);
    }

    scrollTimeoutRef.current = window.setTimeout(() => {
      if (!isHoveredRef.current && window.scrollY > 20) {
        setIsVisible(false);
        setIsScrolling(false);
      }
    }, 700);
  };

  useEffect(() => {
    isHoveredRef.current = isHovered;

    if (!isHovered && window.scrollY > 20) {
      hideHeaderAfterDelay();
    }
  }, [isHovered]);

  useEffect(() => {
    const handleScroll = () => {
      const isTop = window.scrollY <= 20;

      if (isTop) {
        setIsVisible(true);
        setIsScrolling(false);

        if (scrollTimeoutRef.current) {
          window.clearTimeout(scrollTimeoutRef.current);
        }

        return;
      }

      setIsVisible(true);
      setIsScrolling(true);

      if (!isHoveredRef.current) {
        hideHeaderAfterDelay();
      }
    };

    handleScroll();

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);

      if (scrollTimeoutRef.current) {
        window.clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  return (
    <header
      className={`landing-header ${isScrolling ? 'landing-header--scrolled' : ''} ${
        !isVisible ? 'landing-header--hidden' : ''
      }`}
      onMouseEnter={() => {
        isHoveredRef.current = true;
        setIsHovered(true);
        setIsVisible(true);
      }}
      onMouseLeave={() => {
        isHoveredRef.current = false;
        setIsHovered(false);
      }}
    >
      <Link to={ROUTES.LANDING} className="landing-header__logo-link">
        <img src={logoOrange} alt="MODDEN" className="landing-header__logo" />
      </Link>

      <Link to={ROUTES.LOGIN} className="landing-header__sign-in">
        Sign in
      </Link>
    </header>
  );
}
