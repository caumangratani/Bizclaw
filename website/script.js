// ============================================================
// BizClaw Landing Page — script.js
// Bizgenix AI Solutions Pvt. Ltd.
// ============================================================

/**
 * Escape HTML special characters to prevent XSS when
 * inserting user-provided strings into the DOM.
 */
function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

document.addEventListener('DOMContentLoaded', () => {

  // ----------------------------------------------------------
  // 1. Mobile Menu Toggle
  // ----------------------------------------------------------
  const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
  const mobileMenu = document.querySelector('.mobile-menu');

  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      mobileMenuBtn.classList.toggle('active');
      mobileMenu.classList.toggle('active');
      document.body.classList.toggle('menu-open');
    });

    // Close when a link inside is clicked
    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mobileMenuBtn.classList.remove('active');
        mobileMenu.classList.remove('active');
        document.body.classList.remove('menu-open');
      });
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (mobileMenu.classList.contains('active') &&
          !mobileMenu.contains(e.target) &&
          !mobileMenuBtn.contains(e.target)) {
        mobileMenuBtn.classList.remove('active');
        mobileMenu.classList.remove('active');
        document.body.classList.remove('menu-open');
      }
    });
  }

  // ----------------------------------------------------------
  // 2. Sticky Header Enhancement
  // ----------------------------------------------------------
  const header = document.querySelector('.header');

  const handleHeaderScroll = () => {
    if (!header) return;
    if (window.scrollY > 100) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  };

  window.addEventListener('scroll', handleHeaderScroll, { passive: true });
  handleHeaderScroll(); // run once on load

  // ----------------------------------------------------------
  // 3. Stat Counter Animation
  // ----------------------------------------------------------
  const statNumbers = document.querySelectorAll('[data-target]');

  const animateCounter = (el) => {
    const target = parseInt(el.getAttribute('data-target'), 10);
    const duration = 2000; // ms
    const startTime = performance.now();

    const easeOutQuart = (t) => 1 - Math.pow(1 - t, 4);

    const tick = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutQuart(progress);
      const current = Math.round(easedProgress * target);

      el.textContent = current.toLocaleString('en-IN');

      if (progress < 1) {
        requestAnimationFrame(tick);
      }
    };

    requestAnimationFrame(tick);
  };

  if (statNumbers.length > 0) {
    const statObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    statNumbers.forEach(el => statObserver.observe(el));
  }

  // ----------------------------------------------------------
  // 4. Scroll Animations (Fade In Up)
  // ----------------------------------------------------------
  const animatableSelectors = [
    '.problem-card',
    '.feature-card',
    '.step-card',
    '.channel-card',
    '.pricing-card',
    '.testimonial-card',
    '.integration-item',
  ];

  // Group elements by their parent so we can stagger siblings
  const parentGroups = new Map();

  animatableSelectors.forEach(selector => {
    document.querySelectorAll(selector).forEach(el => {
      el.classList.add('animate-on-scroll');
      const parent = el.parentElement;
      if (!parentGroups.has(parent)) {
        parentGroups.set(parent, []);
      }
      parentGroups.get(parent).push(el);
    });
  });

  // Assign staggered animation-delay based on sibling index
  parentGroups.forEach(children => {
    children.forEach((el, index) => {
      el.style.animationDelay = `${index * 0.1}s`;
    });
  });

  const scrollAnimObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.animate-on-scroll').forEach(el => {
    scrollAnimObserver.observe(el);
  });

  // ----------------------------------------------------------
  // 5. Smooth Scrolling
  // ----------------------------------------------------------
  const HEADER_OFFSET = 80;

  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const href = anchor.getAttribute('href');
      if (href === '#') return;

      const target = document.querySelector(href);
      if (!target) return;

      e.preventDefault();

      // Close mobile menu if open
      if (mobileMenu && mobileMenu.classList.contains('active')) {
        mobileMenuBtn.classList.remove('active');
        mobileMenu.classList.remove('active');
        document.body.classList.remove('menu-open');
      }

      const top = target.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });

  // ----------------------------------------------------------
  // 6. Active Nav Link Highlighting
  // ----------------------------------------------------------
  const navLinks = document.querySelectorAll('.nav-links a');
  const sections = [];

  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href && href.startsWith('#')) {
      const section = document.querySelector(href);
      if (section) {
        sections.push({ el: section, link });
      }
    }
  });

  const highlightNav = () => {
    const scrollPos = window.scrollY + HEADER_OFFSET + 100;

    let currentSection = null;
    for (let i = sections.length - 1; i >= 0; i--) {
      if (scrollPos >= sections[i].el.offsetTop) {
        currentSection = sections[i];
        break;
      }
    }

    navLinks.forEach(l => l.classList.remove('active'));
    if (currentSection) {
      currentSection.link.classList.add('active');
    }
  };

  window.addEventListener('scroll', highlightNav, { passive: true });
  highlightNav();

  // ----------------------------------------------------------
  // 8. Pricing Card Tilt Effect
  // ----------------------------------------------------------
  document.querySelectorAll('.pricing-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((y - centerY) / centerY) * -4; // max 4deg
      const rotateY = ((x - centerX) / centerX) * 4;

      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });

  // ----------------------------------------------------------
  // 9. Hero Background Pattern (CSS-driven, JS injects style)
  // ----------------------------------------------------------
  const heroBgPattern = document.querySelector('.hero-bg-pattern');
  if (heroBgPattern && !document.getElementById('hero-pattern-style')) {
    const style = document.createElement('style');
    style.id = 'hero-pattern-style';
    style.textContent = [
      '.hero-bg-pattern {',
      '  position: absolute;',
      '  inset: 0;',
      '  overflow: hidden;',
      '  pointer-events: none;',
      '  z-index: 0;',
      '}',
      '.hero-bg-pattern::before {',
      '  content: "";',
      '  position: absolute;',
      '  inset: -50%;',
      '  background-image: radial-gradient(circle, rgba(245,166,35,0.08) 1px, transparent 1px);',
      '  background-size: 40px 40px;',
      '  animation: patternDrift 20s linear infinite;',
      '}',
      '.hero-bg-pattern::after {',
      '  content: "";',
      '  position: absolute;',
      '  inset: 0;',
      '  background: radial-gradient(ellipse at 30% 50%, rgba(233,69,96,0.06) 0%, transparent 60%),',
      '              radial-gradient(ellipse at 70% 30%, rgba(15,52,96,0.08) 0%, transparent 50%);',
      '  animation: patternPulse 8s ease-in-out infinite alternate;',
      '}',
      '@keyframes patternDrift {',
      '  from { transform: translate(0, 0); }',
      '  to   { transform: translate(40px, 40px); }',
      '}',
      '@keyframes patternPulse {',
      '  from { opacity: 0.5; }',
      '  to   { opacity: 1; }',
      '}',
    ].join('\n');
    document.head.appendChild(style);
  }

}); // end DOMContentLoaded


// ----------------------------------------------------------
// 7. Contact Form Handler (global scope for inline onsubmit)
// ----------------------------------------------------------
function handleSubmit(event) {
  event.preventDefault();

  const form = event.target;

  // Grab values from inputs (they lack name attrs, so use position)
  const inputs = form.querySelectorAll('input, select, textarea');
  const name     = (inputs[0]?.value || '').trim();
  const phone    = (inputs[1]?.value || '').trim();
  const city     = (inputs[2]?.value || '').trim();
  const business = (inputs[3]?.value || '').trim();
  const employees = (inputs[4]?.value || '').trim();
  const message  = (inputs[5]?.value || '').trim();

  // Build WhatsApp pre-filled message
  const waText = encodeURIComponent(
    `Hi, I'm ${name} from ${business || 'my company'} (${city || 'India'}). ` +
    `Employees: ${employees || 'N/A'}. ${message || 'I want to know about BizClaw.'}`
  );
  const waURL = `https://wa.me/919999999999?text=${waText}`;

  // Build thank-you UI using safe DOM methods
  form.replaceChildren(); // clear form

  const wrapper = document.createElement('div');
  wrapper.className = 'form-success';

  const icon = document.createElement('div');
  icon.className = 'form-success-icon';
  icon.textContent = '\u2713';
  wrapper.appendChild(icon);

  const heading = document.createElement('h3');
  heading.textContent = name ? `Thank You, ${name}!` : 'Thank You!';
  wrapper.appendChild(heading);

  const para = document.createElement('p');
  para.textContent = "We've received your request. Our team will reach out within 24 hours.";
  wrapper.appendChild(para);

  const waLink = document.createElement('a');
  waLink.href = waURL;
  waLink.className = 'btn btn-whatsapp';
  waLink.style.marginTop = '1.5rem';
  waLink.style.display = 'inline-flex';
  waLink.setAttribute('target', '_blank');
  waLink.setAttribute('rel', 'noopener noreferrer');

  const waIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  waIcon.setAttribute('width', '20');
  waIcon.setAttribute('height', '20');
  waIcon.setAttribute('viewBox', '0 0 24 24');
  waIcon.setAttribute('fill', 'currentColor');
  const path1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path1.setAttribute('d', 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z');
  const path2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path2.setAttribute('d', 'M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z');
  waIcon.appendChild(path1);
  waIcon.appendChild(path2);
  waLink.appendChild(waIcon);

  const waSpan = document.createElement('span');
  waSpan.textContent = 'Or WhatsApp Us Directly';
  waLink.appendChild(waSpan);

  wrapper.appendChild(waLink);
  form.appendChild(wrapper);
}
