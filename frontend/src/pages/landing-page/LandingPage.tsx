//src/pages/landing-page/LandingPage.tsx
import { type CSSProperties, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { LandingHeader } from './components/LandingHeader';
import { ROUTES } from '../../shared/routes/routes';

import heroLogo from '../../assets/landing/hero-logo.svg';
import heroBackground from '../../assets/landing/hero-bg.svg';

import sliderImage01 from '../../assets/landing/slider/slide-01.svg';
import sliderImage02 from '../../assets/landing/slider/slide-02.svg';
import sliderImage03 from '../../assets/landing/slider/slide-03.svg';
import sliderImage04 from '../../assets/landing/slider/slide-04.svg';
import sliderImage05 from '../../assets/landing/slider/slide-05.svg';
import sliderImage06 from '../../assets/landing/slider/slide-06.svg';
import sliderImage07 from '../../assets/landing/slider/slide-07.svg';

import sliderArrow from '../../assets/landing/slider/slider-arrow.svg';

import toolImage01 from '../../assets/landing/tools/tool-01.svg';
import toolImage02 from '../../assets/landing/tools/tool-02.svg';
import toolImage03 from '../../assets/landing/tools/tool-03.svg';
import toolImage04 from '../../assets/landing/tools/tool-04.svg';
import toolImage05 from '../../assets/landing/tools/tool-05.svg';
import toolImage06 from '../../assets/landing/tools/tool-06.svg';
import toolImage07 from '../../assets/landing/tools/tool-07.svg';
import toolImage08 from '../../assets/landing/tools/tool-08.svg';
import toolImage09 from '../../assets/landing/tools/tool-09.svg';

import createPreview from '../../assets/landing/create-preview.svg';
import createArrow from '../../assets/landing/create-arrow.svg';

import footerLogo from '../../assets/modden-logo-orange.svg';
import instagramIcon from '../../assets/landing/social-instagram.svg';
import facebookIcon from '../../assets/landing/social-facebook.svg';
import pinterestIcon from '../../assets/landing/social-pinterest.svg';

import bottomBrandLogo from '../../assets/landing/bottom-brand-logo.svg';

import './LandingPage.css';

const sliderImages = [
  { src: sliderImage01, alt: 'MODDEN project preview 1' },
  { src: sliderImage02, alt: 'MODDEN project preview 2' },
  { src: sliderImage03, alt: 'MODDEN project preview 3' },
  { src: sliderImage04, alt: 'MODDEN project preview 4' },
  { src: sliderImage05, alt: 'MODDEN project preview 5' },
  { src: sliderImage06, alt: 'MODDEN project preview 6' },
  { src: sliderImage07, alt: 'MODDEN project preview 7' },
];

const tools = [
  {
    title: 'Custom Templates',
    description: 'Create and save your own reusable layouts.',
    image: toolImage01,
  },
  {
    title: 'Logo Design',
    description: 'Create simple logos and icons.',
    image: toolImage02,
  },
  {
    title: 'Free Drawing',
    description: 'Sketch directly on the canvas.',
    image: toolImage03,
  },
  {
    title: 'Text Styling',
    description: 'Edit fonts, size and colors.',
    image: toolImage04,
  },
  {
    title: 'Shape Tools',
    description: 'Add and customize basic shapes.',
    image: toolImage05,
  },
  {
    title: 'Infographics',
    description: 'Present information in a visual way.',
    image: toolImage06,
  },
  {
    title: 'Photo Filters',
    description: 'Apply simple effects to images.',
    image: toolImage07,
  },
  {
    title: 'Photo Frames',
    description: 'Create reusable framed compositions.',
    image: toolImage08,
  },
  {
    title: 'Social Media Posts',
    description: 'Design content for modern platforms.',
    image: toolImage09,
  },
];

const footerColumns = [
  {
    title: 'Create',
    items: ['Social media posts', 'Banners', 'Logos', 'Infographics', 'Custom designs', 'Photo edits'],
  },
  {
    title: 'Projects',
    items: ['New project', 'My projects', 'My templates', 'Export', 'History'],
  },
  {
    title: 'Resources',
    items: ['Templates', 'Design tools', 'Inspiration', 'Guides'],
  },
  {
    title: 'Explore',
    items: ['Editor', 'Quick actions', 'Photo tools', 'Brand kit', 'Design ideas'],
  },
  {
    title: 'Support',
    items: ['Help Center', 'Tutorials', 'FAQs', 'Contact us'],
  },
];

function getVisibleSlides() {
  if (window.innerWidth <= 640) return 1;
  if (window.innerWidth <= 980) return 2;
  return 4;
}

export function LandingPage() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [visibleSlides, setVisibleSlides] = useState(3);
  const [isSliderPaused, setIsSliderPaused] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [bottomReveal, setBottomReveal] = useState(0);
  const bottomRevealTimeoutRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);

  const maxSlideIndex = useMemo(
    () => Math.max(sliderImages.length - visibleSlides, 0),
    [visibleSlides],
  );

  useEffect(() => {
    const updateVisibleSlides = () => {
      const nextVisibleSlides = getVisibleSlides();

      setVisibleSlides(nextVisibleSlides);
      setActiveSlide((prev) => Math.min(prev, Math.max(sliderImages.length - nextVisibleSlides, 0)));
    };

    updateVisibleSlides();

    window.addEventListener('resize', updateVisibleSlides);

    return () => {
      window.removeEventListener('resize', updateVisibleSlides);
    };
  }, []);

  useEffect(() => {
    if (isSliderPaused) return;

    const intervalId = window.setInterval(() => {
      setActiveSlide((prev) => (prev >= maxSlideIndex ? 0 : prev + 1));
    }, 2600);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isSliderPaused, maxSlideIndex]);

  useEffect(() => {
  let frameId = 0;

  const handleScroll = () => {
    if (frameId) return;

    frameId = window.requestAnimationFrame(() => {
      setScrollY(window.scrollY);
      frameId = 0;
    });
  };

  handleScroll();

  window.addEventListener('scroll', handleScroll, { passive: true });

  return () => {
    window.removeEventListener('scroll', handleScroll);

    if (frameId) {
      window.cancelAnimationFrame(frameId);
    }
  };
}, []);

useEffect(() => {
  const isPageBottom = () => {
    const documentHeight = document.documentElement.scrollHeight;
    const viewportHeight = window.innerHeight;
    const currentScrollY = window.scrollY;

    return documentHeight - viewportHeight - currentScrollY < 18;
  };

  const revealBottomBrand = (power = 1) => {
    setBottomReveal(Math.min(Math.max(power, 0), 1));

    if (bottomRevealTimeoutRef.current) {
      window.clearTimeout(bottomRevealTimeoutRef.current);
    }

    bottomRevealTimeoutRef.current = window.setTimeout(() => {
      setBottomReveal(0);
    }, 420);
  };

  const handleWheel = (event: WheelEvent) => {
    if (!isPageBottom() || event.deltaY <= 0) return;

    const power = Math.min(event.deltaY / 120, 1);
    revealBottomBrand(power);
  };

  const handleTouchStart = (event: TouchEvent) => {
    touchStartYRef.current = event.touches[0]?.clientY ?? null;
  };

  const handleTouchMove = (event: TouchEvent) => {
    if (!isPageBottom()) return;

    const startY = touchStartYRef.current;
    const currentY = event.touches[0]?.clientY;

    if (startY === null || currentY === undefined) return;

    const swipeDistance = startY - currentY;

    if (swipeDistance > 8) {
      const power = Math.min(swipeDistance / 90, 1);
      revealBottomBrand(power);
    }
  };

  window.addEventListener('wheel', handleWheel, { passive: true });
  window.addEventListener('touchstart', handleTouchStart, { passive: true });
  window.addEventListener('touchmove', handleTouchMove, { passive: true });

  return () => {
    window.removeEventListener('wheel', handleWheel);
    window.removeEventListener('touchstart', handleTouchStart);
    window.removeEventListener('touchmove', handleTouchMove);

    if (bottomRevealTimeoutRef.current) {
      window.clearTimeout(bottomRevealTimeoutRef.current);
    }
  };
}, []);

  const handlePrevSlide = () => {
    setActiveSlide((prev) => (prev <= 0 ? maxSlideIndex : prev - 1));
  };

  const handleNextSlide = () => {
    setActiveSlide((prev) => (prev >= maxSlideIndex ? 0 : prev + 1));
  };

  const heroBackgroundStyle: CSSProperties = {
    transform: `translate3d(0, ${scrollY * 0.2}px, 0) scale(1.08)`,
  };

  const heroLogoStyle: CSSProperties = {
    transform: `translate3d(0, ${scrollY * -0.08}px, 0)`,
  };

  const whiteShellStyle: CSSProperties = {
    transform: `translate3d(0, ${Math.max(scrollY - 300, 0) * -0.035}px, 0)`,
  };

  const darkShellStyle: CSSProperties = {
    transform: `translate3d(0, ${Math.max(scrollY - 900, 0) * -0.018}px, 0)`,
  };

  const createImageStyle: CSSProperties = {
    transform: `translate3d(0, ${Math.max(scrollY - 1450, 0) * 0.035}px, 0)`,
  };

  const bottomBrandStyle = {
  '--bottom-reveal': bottomReveal,
} as CSSProperties;

const bottomLogoTranslateY =
  80 + Math.max(scrollY - 2300, 0) * -0.012 + bottomReveal * 58;

const bottomLogoScale = 1 + bottomReveal * 0.018;

const bottomLogoStyle: CSSProperties = {
  transform: `translate3d(0, ${bottomLogoTranslateY}px, 0) scale(${bottomLogoScale})`,
};

  const sliderTrackStyle = {
    '--active-slide': activeSlide,
    '--visible-slides': visibleSlides,
  } as CSSProperties;

  return (
    <main className="landing-page">
      <LandingHeader />

      <section className="landing-hero">
        <div
          className="landing-hero__background"
          style={{
            ...heroBackgroundStyle,
            backgroundImage: `url(${heroBackground})`,
          }}
        />

        <div className="landing-hero__overlay" />

        <div className="landing-hero__content">
          <img
            src={heroLogo}
            alt="MODDEN"
            className="landing-hero__logo"
            style={heroLogoStyle}
          />
        </div>
      </section>

      <section className="landing-section landing-section--white">
        <div className="landing-shell landing-shell--white" style={whiteShellStyle}>
          <div className="landing-intro">
            <p className="landing-intro__text">
              Everything you need to create anything
            </p>
             <p className="landing-intro__text2">
              Whether you’re a student, content creator, small business owner, 
              marketer, or just someone with an idea, MODDEN gives you the tools to 
              bring it to life.
            </p>
          </div>

          <div
            className="landing-slider"
            onMouseEnter={() => setIsSliderPaused(true)}
            onMouseLeave={() => setIsSliderPaused(false)}
          >
            <button
              type="button"
              className="landing-slider__button landing-slider__button--prev"
              aria-label="Previous slide"
              onClick={handlePrevSlide}
            >
              <img src={sliderArrow} alt="" />
            </button>

            <div className="landing-slider__viewport">
              <div className="landing-slider__track" style={sliderTrackStyle}>
                {sliderImages.map((slide) => (
                  <article className="landing-slide" key={slide.alt}>
                    <img src={slide.src} alt={slide.alt} className="landing-slide__image" />
                  </article>
                ))}
              </div>
            </div>

            <button
              type="button"
              className="landing-slider__button landing-slider__button--next"
              aria-label="Next slide"
              onClick={handleNextSlide}
            >
              <img src={sliderArrow} alt="" />
            </button>
          </div>
        </div>
      </section>

      <section className="landing-section landing-section--dark">
        <div className="landing-shell landing-shell--dark" style={darkShellStyle}>
          <div className="landing-tools__intro">
            <p className="landing-tools__eyebrow">Creative workflow</p>

            <h2>Powerful tools, simple workflow</h2>

            <p className="landing-tools__description">
              Create designs, edit photos, build logos, 
              and work on visual projects without unnecessary complexity.
            </p>
          </div>

          <div className="landing-tools__grid">
            {tools.map((tool) => (
              <article
                key={tool.title}
                className="landing-tool-card"
                style={
                  {
                    '--tool-hover-image': `url(${tool.image})`,
                  } as CSSProperties
                }
              >
                <div className="landing-tool-card__content">
                  <h3>{tool.title}</h3>
                  <p>{tool.description}</p>
                </div>
              </article>
            ))}
          </div>

          <div className="landing-create">
            <div className="landing-create__visual" style={createImageStyle}>
              <img src={createPreview} alt="Create in MODDEN" />
            </div>

            <Link to={ROUTES.LOGIN} className="landing-create__content">
              <span>Create</span>
              <img src={createArrow} alt="" />
            </Link>
          </div>

          <footer className="landing-footer">
            <div className="landing-footer__columns">
              {footerColumns.map((column) => (
                <div className="landing-footer__column" key={column.title}>
                  <h3>{column.title}</h3>

                  <ul>
                    {column.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="landing-footer__bottom">
              <img src={footerLogo} alt="MODDEN" className="landing-footer__logo" />

              <nav className="landing-footer__links" aria-label="Footer navigation">
                <span>About</span>
                <span>Log in</span>
                <span>Privacy Policy</span>
                <span>Terms of Use</span>
              </nav>

              <div className="landing-footer__socials" aria-label="Social media">
                <span className="landing-footer__social">
                  <img src={instagramIcon} alt="Instagram" />
                </span>

                <span className="landing-footer__social">
                  <img src={facebookIcon} alt="Facebook" />
                </span>

                <span className="landing-footer__social">
                  <img src={pinterestIcon} alt="Pinterest" />
                </span>
              </div>
            </div>

            <p className="landing-footer__copyright">Copyright © 2026</p>
          </footer>
        </div>
      </section>

      <section className="landing-bottom-brand" style={bottomBrandStyle}>
        <img
          src={bottomBrandLogo}
          alt="MODDEN"
          className="landing-bottom-brand__logo"
          style={bottomLogoStyle}
        />
      </section>
    </main>
  );
}
