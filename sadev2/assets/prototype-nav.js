(function () {
  'use strict';

  const routes = {
    home: '/home_dashboard/',
    'home-dashboard': '/home_dashboard/',
    track: '/daily_symptom_tracking/',
    concern: '/concern_selection/',
    care: '/care_route_selection/',
    journal: '/private_journal/',
    community: '/sad_folk_community/',
    folk: '/sad_folk_community/',
    'verified-provider-directory': '/verified_provider_directory/',
    'profile-settings': '/profile/'
  };

  const current = location.pathname === '/'
    ? 'welcome_to_sad'
    : location.pathname.split('/').filter(Boolean)[0] || 'welcome_to_sad';

  const normalize = value => (value || '').replace(/\s+/g, ' ').trim().toLowerCase();
  const go = path => { location.href = path; };

  function toast(message) {
    let box = document.getElementById('sade-prototype-toast');
    if (!box) {
      box = document.createElement('div');
      box.id = 'sade-prototype-toast';
      box.setAttribute('role', 'status');
      box.setAttribute('aria-live', 'polite');
      document.body.appendChild(box);
    }
    box.textContent = message;
    box.classList.add('is-visible');
    clearTimeout(window.__sadeToastTimer);
    window.__sadeToastTimer = setTimeout(() => box.classList.remove('is-visible'), 2400);
  }

  const screenActions = {
    welcome_to_sad: [
      ['begin with sadé', '/auth/'],
      ['already have an account?', '/auth/?mode=login']
    ],
    baseline_health_setup: [
      ['save and continue', '/onboarding_health/'],
      ['save & close', '/home_dashboard/']
    ],
    daily_symptom_tracking: [
      ['save today’s log', '/calendar_and_pattern_insight/']
    ],
    concern_selection: [
      ['continue', '/concern_intake/']
    ],
    concern_intake: [
      ['see my next step', '/next_step_result/']
    ],
    next_step_result: [
      ['book virtual consultation', '/verified_provider_directory/'],
      ['find a provider', '/verified_provider_directory/'],
      ['prepare appointment summary', '/prepare_for_your_appointment/']
    ],
    care_route_selection: [
      ['view virtual appointments', '/verified_provider_directory/'],
      ['search directory', '/verified_provider_directory/'],
      ['prepare for an existing appointment', '/prepare_for_your_appointment/']
    ],
    verified_provider_directory: [
      ['view profile & times', '/provider_profile/']
    ],
    provider_profile: [
      ['book consultation', '/appointment_and_price_review/']
    ],
    appointment_and_price_review: [
      ['confirm & pay ₦18,500', '/booking_confirmation/']
    ],
    booking_confirmation: [
      ['review health summary', '/review_and_share/'],
      ['prepare for your consultation', '/prepare_for_consultation/'],
      ['view appointment', '/consultation_lobby/'],
      ['return to home dashboard', '/home_dashboard/']
    ],
    prepare_for_consultation: [
      ['start preparation', '/review_and_share/']
    ],
    review_and_share: [
      ['share with provider', '/consultation_lobby/'],
      ['preview summary', '/preparation_pack_ready/']
    ],
    consultation_lobby: [
      ['join consultation', '/follow_up_plan/'],
      ['leave waiting room', '/booking_confirmation/']
    ],
    follow_up_plan: [
      ['continue my plan', '/home_dashboard/'],
      ['return to home dashboard', '/home_dashboard/']
    ],
    prepare_for_your_appointment: [
      ['review my pack', '/appointment_preparation_pack/']
    ],
    appointment_preparation_pack: [
      ['pay and create pack', '/preparation_pack_ready/']
    ],
    preparation_pack_ready: [
      ['return to home dashboard', '/home_dashboard/']
    ]
  };

  function actionFor(element) {
    const aria = normalize(element.getAttribute('aria-label'));
    const text = normalize(element.textContent);
    const candidates = screenActions[current] || [];
    for (const [label, path] of candidates) {
      const key = normalize(label);
      if (text.includes(key) || aria.includes(key)) return path;
    }
    return null;
  }

  document.addEventListener('click', function (event) {
    const element = event.target.closest('a,button');
    if (!element) return;

    const backLabel = normalize(element.getAttribute('aria-label'));
    if (backLabel === 'back' || backLabel === 'go back') return;

    const dataPath = element.getAttribute('data-path');
    if (dataPath) {
      event.preventDefault();
      if (routes[dataPath]) return go(routes[dataPath]);
      return toast('This area is not included in this prototype.');
    }

    const target = actionFor(element);
    if (target) {
      event.preventDefault();
      event.stopImmediatePropagation();
      return go(target);
    }

    if (current === 'next_step_result' && normalize(element.getAttribute('aria-label')).includes('prepare appointment summary')) {
      event.preventDefault();
      return go('/prepare_for_your_appointment/');
    }

    if (current === 'verified_provider_directory' && element.hasAttribute('data-doctor')) {
      event.preventDefault();
      return go('/provider_profile/');
    }

    const text = normalize(element.textContent);
    if (current === 'booking_confirmation' && (text.includes('add to calendar') || text.includes('reschedule or cancel'))) {
      event.preventDefault();
      return toast('This action is simulated in the prototype.');
    }
    if (current === 'profile' && element.classList.contains('profile-demo-action')) {
      event.preventDefault();
      return toast('This profile action is simulated in the prototype.');
    }
    if (current === 'private_journal' && text.includes('write an entry')) {
      event.preventDefault();
      return toast('Journal entry creation will be tested in the functional MVP.');
    }

    const href = element.getAttribute('href');
    if (href === '#' || (href && href.startsWith('#signin'))) {
      event.preventDefault();
      return toast('This action is not included in this prototype.');
    }
  }, true);

  document.addEventListener('DOMContentLoaded', function () {
    document.documentElement.dataset.sadePrototype = 'true';
    const badge = document.createElement('div');
    badge.id = 'sade-prototype-badge';
    badge.textContent = 'Prototype';
    badge.setAttribute('aria-label', 'Sadé usability prototype');
    document.body.appendChild(badge);
  });
})();
