(() => {
  'use strict';

  const config = {
    preloaderMinTime: 1200,
    scrollOffset: 70,
    particleInterval: 800,
    animationThreshold: 0.1,
    debounceDelay: 10
  };

  const state = {
    isPreloaderVisible: true,
    isMobileMenuOpen: false,
    particlesEnabled: window.matchMedia('(min-width: 768px)').matches,
    particleAnimationId: null
  };

  const elements = {};

  function initElements() {
    elements.preloader = document.getElementById('preloader');
    elements.header = document.getElementById('header');
    elements.mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    elements.navMenu = document.querySelector('.nav-menu');
    elements.navLinks = document.querySelectorAll('.nav-link');
    elements.mobileNav = document.querySelector('.mobile-nav');
    elements.mobileNavToggle = document.querySelector('.mobile-nav-toggle');
    elements.mobileNavMenu = document.querySelector('.mobile-nav-menu');
    elements.mobileNavLinks = document.querySelectorAll('.mobile-nav-menu a');
    elements.particleCanvas = document.getElementById('particleCanvas');
    elements.animatedSections = document.querySelectorAll('.fade-in');
  }

  function hidePreloader() {
    if (!state.isPreloaderVisible || !elements.preloader) return;
    
    elements.preloader.classList.add('fade-out');
    state.isPreloaderVisible = false;
    document.body.classList.remove('loading');
    
    setTimeout(() => {
      if (elements.preloader) {
        elements.preloader.style.display = 'none';
      }
    }, 800);
  }

  function initPreloader() {
    const startTime = performance.now();
    
    const checkLoaded = () => {
      const elapsed = performance.now() - startTime;
      
      if (document.readyState === 'complete' && elapsed >= config.preloaderMinTime) {
        hidePreloader();
      } else if (elapsed < config.preloaderMinTime) {
        requestAnimationFrame(checkLoaded);
      } else {
        hidePreloader();
      }
    };

    if (document.readyState === 'complete') {
      setTimeout(hidePreloader, config.preloaderMinTime);
    } else {
      window.addEventListener('load', checkLoaded);
    }
  }

  function toggleMobileMenu(open = null) {
    const shouldOpen = open !== null ? open : !state.isMobileMenuOpen;
    state.isMobileMenuOpen = shouldOpen;

    if (elements.mobileMenuBtn) {
      elements.mobileMenuBtn.classList.toggle('active', shouldOpen);
      elements.mobileMenuBtn.setAttribute('aria-expanded', shouldOpen);
    }

    if (elements.navMenu) {
      elements.navMenu.classList.toggle('active', shouldOpen);
    }
  }

  function toggleMobileNav(open = null) {
    const shouldOpen = open !== null ? open : !elements.mobileNavMenu?.classList.contains('active');
    
    if (elements.mobileNavMenu) {
      elements.mobileNavMenu.classList.toggle('active', shouldOpen);
    }

    if (elements.mobileNavToggle) {
      elements.mobileNavToggle.setAttribute('aria-expanded', shouldOpen);
      const icon = elements.mobileNavToggle.querySelector('i');
      if (icon) {
        icon.classList.toggle('fa-bars', !shouldOpen);
        icon.classList.toggle('fa-times', shouldOpen);
      }
    }
  }

  function smoothScrollTo(targetId) {
    const target = document.querySelector(targetId);
    if (!target) return;

    const targetPosition = target.getBoundingClientRect().top + window.pageYOffset;
    const startPosition = window.pageYOffset;
    const distance = targetPosition - startPosition - config.scrollOffset;
    const duration = 800;
    let start = null;

    const animation = (currentTime) => {
      if (start === null) start = currentTime;
      const timeElapsed = currentTime - start;
      const progress = Math.min(timeElapsed / duration, 1);
      const ease = easeInOutCubic(progress);
      
      window.scrollTo(0, startPosition + distance * ease);
      
      if (timeElapsed < duration) {
        requestAnimationFrame(animation);
      }
    };

    requestAnimationFrame(animation);
  }

  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function initNavigation() {
    if (elements.mobileMenuBtn) {
      elements.mobileMenuBtn.addEventListener('click', () => toggleMobileMenu());
    }

    if (elements.mobileNavToggle) {
      elements.mobileNavToggle.addEventListener('click', () => toggleMobileNav());
    }

    document.addEventListener('click', (e) => {
      if (!elements.mobileNavMenu?.contains(e.target) && 
          !elements.mobileNavToggle?.contains(e.target) &&
          elements.mobileNavMenu?.classList.contains('active')) {
        toggleMobileNav(false);
      }

      if (!elements.navMenu?.contains(e.target) && 
          !elements.mobileMenuBtn?.contains(e.target) &&
          state.isMobileMenuOpen) {
        toggleMobileMenu(false);
      }
    });

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = anchor.getAttribute('href');
        
        smoothScrollTo(targetId);
        toggleMobileMenu(false);
        toggleMobileNav(false);
      });
    });

    const navHighlight = debounce(() => {
      const scrollPos = window.scrollY + config.scrollOffset + 100;
      const sections = document.querySelectorAll('section[id]');
      
      sections.forEach(section => {
        const top = section.offsetTop;
        const height = section.offsetHeight;
        const id = section.getAttribute('id');
        
        if (scrollPos >= top && scrollPos < top + height) {
          elements.navLinks.forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
          });
          elements.mobileNavLinks.forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
          });
        }
      });
    }, 10);

    window.addEventListener('scroll', navHighlight);
  }

  class ParticleSystem {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.particles = [];
      this.maxParticles = 50;
      this.init();
    }

    init() {
      this.resize();
      window.addEventListener('resize', debounce(() => this.resize(), 300));
    }

    resize() {
      const rect = this.canvas.parentElement.getBoundingClientRect();
      this.canvas.width = rect.width;
      this.canvas.height = rect.height;
    }

    createParticle() {
      return {
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        radius: Math.random() * 2 + 1,
        opacity: Math.random() * 0.5 + 0.2,
        color: Math.random() > 0.5 ? '#00ff41' : '#00e6ff'
      };
    }

    update() {
      if (this.particles.length < this.maxParticles && Math.random() > 0.95) {
        this.particles.push(this.createParticle());
      }

      this.particles = this.particles.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.opacity *= 0.995;

        return p.opacity > 0.01 && 
               p.x > -10 && p.x < this.canvas.width + 10 &&
               p.y > -10 && p.y < this.canvas.height + 10;
      });
    }

    draw() {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      
      this.particles.forEach(p => {
        this.ctx.globalAlpha = p.opacity;
        this.ctx.fillStyle = p.color;
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        this.ctx.fill();
      });

      this.ctx.globalAlpha = 1;
    }

    animate() {
      this.update();
      this.draw();
      state.particleAnimationId = requestAnimationFrame(() => this.animate());
    }

    start() {
      if (!state.particleAnimationId) {
        this.animate();
      }
    }

    stop() {
      if (state.particleAnimationId) {
        cancelAnimationFrame(state.particleAnimationId);
        state.particleAnimationId = null;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.particles = [];
      }
    }
  }

  function initParticles() {
    if (!elements.particleCanvas || !state.particlesEnabled) return;
    
    const particleSystem = new ParticleSystem(elements.particleCanvas);
    particleSystem.start();

    const mediaQuery = window.matchMedia('(min-width: 768px)');
    mediaQuery.addEventListener('change', (e) => {
      state.particlesEnabled = e.matches;
      if (e.matches) {
        particleSystem.start();
      } else {
        particleSystem.stop();
      }
    });
  }

  function initScrollEffects() {
    const updateHeader = debounce(() => {
      if (elements.header) {
        elements.header.classList.toggle('scrolled', window.scrollY > 50);
      }
    }, config.debounceDelay);

    window.addEventListener('scroll', updateHeader);
  }

  function initAnimations() {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (prefersReducedMotion) {
      elements.animatedSections.forEach(el => {
        el.classList.add('visible');
      });
      return;
    }

    const observerOptions = {
      threshold: config.animationThreshold,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    elements.animatedSections.forEach(section => {
      observer.observe(section);
    });
  }

  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  function handleKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        toggleMobileMenu(false);
        toggleMobileNav(false);
      }

      if (e.key === 'Tab') {
        document.body.classList.add('keyboard-nav');
      }
    });

    document.addEventListener('mousedown', () => {
      document.body.classList.remove('keyboard-nav');
    });
  }

  function init() {
    initElements();
    initPreloader();
    initNavigation();
    initScrollEffects();
    initAnimations();
    initParticles();
    handleKeyboardNavigation();
    
    console.log('✨ Portfolio initialized successfully');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();