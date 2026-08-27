/* Najważniejsze ustawienia wydarzenia — edytuj tutaj. */
const EVENT_CONFIG = {
  mode: 'before', // Zmień na 'after', aby włączyć podsumowanie po wydarzeniu.
  name: 'Śląska Kuźnia Młodych Przedsiębiorców',
  start: '2026-09-25T15:00:00+02:00',
  end: '2026-09-25T20:00:00+02:00',
  venue: 'D9 Space, Katowice',
  siteUrl: 'https://kuzniamlodych.pl/'
};

(() => {
  'use strict';
  document.body.dataset.eventMode = EVENT_CONFIG.mode;

  const header = document.querySelector('.site-header');
  const progress = document.querySelector('.page-progress span');
  const mobileSticky = document.querySelector('.mobile-sticky');
  const timeline = document.querySelector('.timeline');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const onScroll = () => {
    const y = window.scrollY;
    header?.classList.toggle('scrolled', y > 24);
    const max = document.documentElement.scrollHeight - innerHeight;
    if (progress) progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    if (mobileSticky) {
      const registrationTop = document.querySelector('#rejestracja')?.getBoundingClientRect().top ?? Infinity;
      mobileSticky.classList.toggle('visible', y > innerHeight * .75 && registrationTop > innerHeight * .65);
    }

    if (timeline) {
      const rect = timeline.getBoundingClientRect();
      const timelineProgress = Math.max(0, Math.min(1, (innerHeight * .65 - rect.top) / Math.max(1, rect.height)));
      timeline.style.setProperty('--timeline-progress', timelineProgress.toFixed(3));
    }

    if (!reduceMotion) {
      document.querySelectorAll('[data-parallax]').forEach(element => {
        const amount = Number(element.dataset.parallax) || 0;
        element.style.transform = `translate3d(0,${y * amount}px,0)`;
      });
    }
  };
  onScroll();
  addEventListener('scroll', onScroll, { passive: true });

  const menuToggle = document.querySelector('.menu-toggle');
  const mobileMenu = document.querySelector('.mobile-menu');
  const closeMenu = () => {
    menuToggle?.setAttribute('aria-expanded', 'false');
    menuToggle?.setAttribute('aria-label', 'Otwórz menu');
    mobileMenu?.setAttribute('aria-hidden', 'true');
    mobileMenu?.classList.remove('open');
    document.body.classList.remove('menu-open');
  };
  menuToggle?.addEventListener('click', () => {
    const open = menuToggle.getAttribute('aria-expanded') !== 'true';
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'Zamknij menu' : 'Otwórz menu');
    mobileMenu?.setAttribute('aria-hidden', String(!open));
    mobileMenu?.classList.toggle('open', open);
    document.body.classList.toggle('menu-open', open);
    if (open) mobileMenu?.querySelector('a')?.focus();
  });
  mobileMenu?.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });

  const countdown = document.querySelector('[data-countdown]');
  if (countdown) {
    const target = new Date(EVENT_CONFIG.start).getTime();
    const nodes = Object.fromEntries(['days','hours','minutes','seconds'].map(key => [key, countdown.querySelector(`[data-unit="${key}"]`)]));
    const tick = () => {
      const distance = Math.max(0, target - Date.now());
      const values = {days:Math.floor(distance/86400000),hours:Math.floor(distance/3600000)%24,minutes:Math.floor(distance/60000)%60,seconds:Math.floor(distance/1000)%60};
      Object.entries(values).forEach(([key,value]) => { if (nodes[key]) nodes[key].textContent = String(value).padStart(2,'0'); });
    };
    tick(); setInterval(tick, 1000);
  }

  const revealItems = [...document.querySelectorAll('.reveal')];
  if (reduceMotion || !('IntersectionObserver' in window)) revealItems.forEach(item => item.classList.add('in-view'));
  else {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('in-view'); observer.unobserve(entry.target); }
    }), { threshold: .12, rootMargin: '0px 0px -5% 0px' });
    revealItems.forEach((item,index) => { item.style.transitionDelay = `${Math.min(index % 3,2) * 70}ms`; observer.observe(item); });
  }

  const toCalendarDate = iso => new Date(iso).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');
  const googleUrl = new URL('https://calendar.google.com/calendar/render');
  googleUrl.search = new URLSearchParams({action:'TEMPLATE',text:EVENT_CONFIG.name,dates:`${toCalendarDate(EVENT_CONFIG.start)}/${toCalendarDate(EVENT_CONFIG.end)}`,location:EVENT_CONFIG.venue,details:`Praktyczne wydarzenie dla młodych przedsiębiorców. ${EVENT_CONFIG.siteUrl}`}).toString();
  document.querySelectorAll('[data-calendar="google"]').forEach(link => link.href = googleUrl.toString());

  document.querySelectorAll('.accordion details').forEach(details => details.addEventListener('toggle', () => {
    if (!details.open) return;
    document.querySelectorAll('.accordion details[open]').forEach(other => { if (other !== details) other.open = false; });
  }));

  const expertsCarousel = document.querySelector('[data-experts-carousel]');
  if (expertsCarousel) {
    const previous = document.querySelector('[data-carousel-prev]');
    const next = document.querySelector('[data-carousel-next]');
    const carouselLabel = document.querySelector('.carousel-controls span');
    const coarsePointer = matchMedia('(pointer: coarse)').matches;
    if (coarsePointer) {
      if (carouselLabel) carouselLabel.textContent = 'Przesuń palcem';
      expertsCarousel.setAttribute('aria-label', 'Lista panelistów. Przesuń palcem w lewo lub w prawo, aby zobaczyć kolejne osoby.');
    }
    const scrollDistance = () => {
      const firstCard = expertsCarousel.querySelector('.expert-placeholder');
      const gap = parseFloat(getComputedStyle(expertsCarousel).columnGap) || 0;
      return (firstCard?.getBoundingClientRect().width || expertsCarousel.clientWidth * .8) + gap;
    };
    const updateControls = () => {
      const end = expertsCarousel.scrollWidth - expertsCarousel.clientWidth;
      if (previous) previous.disabled = expertsCarousel.scrollLeft <= 4;
      if (next) next.disabled = expertsCarousel.scrollLeft >= end - 4;
    };
    const move = direction => expertsCarousel.scrollBy({
      left: scrollDistance() * direction,
      behavior: reduceMotion ? 'auto' : 'smooth'
    });
    previous?.addEventListener('click', () => move(-1));
    next?.addEventListener('click', () => move(1));
    expertsCarousel.addEventListener('keydown', event => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      move(event.key === 'ArrowLeft' ? -1 : 1);
    });
    expertsCarousel.addEventListener('scroll', updateControls, { passive: true });
    addEventListener('resize', updateControls);
    updateControls();
  }

  const form = document.querySelector('#registration-form');
  if (form) {
    const submit = form.querySelector('.form-submit');
    const status = form.querySelector('.form-status');
    const fields = {
      firstName: { element: form.elements.firstName, message: 'Wpisz imię (minimum 2 znaki).' },
      lastName: { element: form.elements.lastName, message: 'Wpisz nazwisko (minimum 2 znaki).' },
      email: { element: form.elements.email, message: 'Wpisz poprawny adres e-mail.' }
    };
    const validEmail = value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    const validate = (key, field) => {
      const value = field.element.value.trim();
      const valid = key === 'email' ? validEmail(value) : value.length >= 2;
      field.element.classList.toggle('invalid', !valid);
      field.element.setAttribute('aria-invalid', String(!valid));
      field.element.parentElement.querySelector('.field-error').textContent = valid ? '' : field.message;
      return valid;
    };
    Object.entries(fields).forEach(([key,field]) => field.element.addEventListener('blur', () => validate(key,field)));
    form.addEventListener('submit', async event => {
      event.preventDefault();
      status.className = 'form-status'; status.textContent = '';
      const allValid = Object.entries(fields).map(([key,field]) => validate(key,field)).every(Boolean);
      if (!allValid) { status.classList.add('error'); status.textContent = 'Sprawdź zaznaczone pola.'; form.querySelector('.invalid')?.focus(); return; }
      submit.classList.add('loading'); submit.disabled = true;
      try {
        const response = await fetch(form.action, {method:'POST',body:new FormData(form),headers:{'X-Requested-With':'XMLHttpRequest'}});
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data.success) throw new Error(data.message || 'Nie udało się wysłać formularza.');
        form.reset();
        status.classList.add('success');
        status.innerHTML = data.emailSent === false
          ? '<strong>Dziękujemy za rejestrację!</strong><br>Zapis został przyjęty. Potwierdzenie e-mail wyślemy po uruchomieniu poczty organizatora.'
          : '<strong>Dziękujemy za rejestrację!</strong><br>Potwierdzenie wysłaliśmy na Twój adres e-mail.';
      } catch (error) {
        status.classList.add('error');
        status.textContent = error.message || 'Wystąpił błąd serwera. Spróbuj ponownie za chwilę.';
      } finally {
        submit.classList.remove('loading'); submit.disabled = false;
      }
    });
  }
})();

