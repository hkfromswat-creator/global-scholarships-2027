// ============================================================
// GLOBAL SCHOLARSHIPS 2027 - Main Application
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const grid = document.getElementById('scholarships');
  const clearAllBtn = document.getElementById('clear-all');
  const sortBySelect = document.getElementById('sort-by');
  const countrySelect = document.getElementById('country-select');
  const subjectSelect = document.getElementById('subject-select');
  const mainSearch = document.getElementById('mainSearch');
  const heroSearch = document.getElementById('heroSearch');
  const heroSearchBtn = document.getElementById('heroSearchBtn');
  const resultsCount = document.getElementById('results-count');
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');
  const activeFilters = document.getElementById('activeFilters');
  const backToTop = document.getElementById('backToTop');

  // Stats elements
  const totalStats = document.getElementById('total-scholarships');
  const fullyFundedStats = document.getElementById('fully-funded');
  const pakistaniStats = document.getElementById('pakistani-students');
  const totalCountries = document.getElementById('total-countries');
  const footerCount = document.getElementById('footer-count');
  const heroTotal = document.getElementById('hero-total');
  const heroFunded = document.getElementById('hero-funded');
  const heroCountries = document.getElementById('hero-countries');
  const heroSubjects = document.getElementById('hero-subjects');

  // Data
  let allScholarships = [];

  // Filter state
  const state = {
    level: 'all',
    funding: 'all',
    country: '',
    subject: '',
    searchTerm: ''
  };

  // ============================================================
  // LOAD DATA
  // ============================================================
  try {
    if (!window.SCHOLARSHIPS || !Array.isArray(window.SCHOLARSHIPS)) {
      throw new Error('Data not found. Make sure data.js is loaded before script.js.');
    }
    allScholarships = window.SCHOLARSHIPS;

    allScholarships.forEach(s => {
      if (!s.subjects || !Array.isArray(s.subjects)) s.subjects = ['Other'];
    });

    console.log(`Loaded ${allScholarships.length} scholarship records`);
  } catch (err) {
    console.error('Load error:', err);
    grid.innerHTML = `
      <div class="loading-spinner">
        <i class="fas fa-exclamation-triangle" style="font-size:3rem;color:#ef4444"></i>
        <p>Unable to load scholarship data. Make sure data.js is in the same folder.</p>
      </div>`;
    return;
  }

  // ============================================================
  // HELPERS
  // ============================================================
  function formatDeadline(d) {
    if (!d) return 'Not specified';
    const date = new Date(d);
    if (isNaN(date)) return 'Not specified';
    return date.toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  function getSubjectTags(subjects) {
    if (!subjects || !Array.isArray(subjects)) return '';
    return subjects.slice(0, 2).join(', ');
  }

  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ============================================================
  // POPULATE COUNTRY DROPDOWN
  // ============================================================
  function populateCountrySelect() {
    if (!countrySelect) return;

    const countryMap = {};
    allScholarships.forEach(s => {
      if (s.country) countryMap[s.country] = (countryMap[s.country] || 0) + 1;
    });

    const sorted = Object.entries(countryMap).sort((a, b) => a[0].localeCompare(b[0]));

    // Keep first option, add rest
    countrySelect.innerHTML = '<option value="">All Countries (' + sorted.length + ')</option>';
    sorted.forEach(([country, count]) => {
      const opt = document.createElement('option');
      opt.value = country;
      opt.textContent = country + ' (' + count + ')';
      countrySelect.appendChild(opt);
    });
  }

  // ============================================================
  // POPULATE SUBJECT DROPDOWN
  // ============================================================
  function populateSubjectSelect() {
    if (!subjectSelect) return;

    const subjectMap = {};
    allScholarships.forEach(s => {
      if (s.subjects) {
        s.subjects.forEach(sub => {
          const key = sub.trim();
          subjectMap[key] = (subjectMap[key] || 0) + 1;
        });
      }
    });

    const sorted = Object.entries(subjectMap).sort((a, b) => a[0].localeCompare(b[0]));

    subjectSelect.innerHTML = '<option value="">All Subjects (' + sorted.length + ')</option>';
    sorted.forEach(([subject, count]) => {
      const opt = document.createElement('option');
      opt.value = subject;
      opt.textContent = subject + ' (' + count + ')';
      subjectSelect.appendChild(opt);
    });
  }

  // ============================================================
  // FILTER MATCHING
  // ============================================================
  function matchesFilters(schol) {
    // Level
    if (state.level !== 'all' && schol.degree_level !== state.level) return false;

    // Funding
    if (state.funding !== 'all' && schol.funding_type !== state.funding) return false;

    // Country
    if (state.country && schol.country !== state.country) return false;

    // Subject
    if (state.subject) {
      if (!schol.subjects || !schol.subjects.includes(state.subject)) return false;
    }

    // Search
    if (state.searchTerm) {
      const term = state.searchTerm.toLowerCase();
      const matches = (
        (schol.title && schol.title.toLowerCase().includes(term)) ||
        (schol.university && schol.university.toLowerCase().includes(term)) ||
        (schol.country && schol.country.toLowerCase().includes(term)) ||
        (schol.academic_requirements && schol.academic_requirements.toLowerCase().includes(term))
      );
      if (!matches) return false;
    }

    return true;
  }

  // ============================================================
  // SORTING
  // ============================================================
  function sortScholarships(list) {
    const sortBy = sortBySelect ? sortBySelect.value : 'default';
    const sorted = [...list];

    if (sortBy === 'latest') {
      // Newest records first (higher ID = newer)
      sorted.sort((a, b) => (Number(b.id) || 0) - (Number(a.id) || 0));
    } else if (sortBy === 'deadline') {
      sorted.sort((a, b) => {
        const da = new Date(a.application_deadline).getTime();
        const db = new Date(b.application_deadline).getTime();
        if (isNaN(da) && isNaN(db)) return 0;
        if (isNaN(da)) return 1;
        if (isNaN(db)) return -1;
        return da - db;
      });
    } else if (sortBy === 'alpha') {
      sorted.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    } else if (sortBy === 'funding') {
      sorted.sort((a, b) => {
        if (a.funding_type === 'fully funded' && b.funding_type !== 'fully funded') return -1;
        if (a.funding_type !== 'fully funded' && b.funding_type === 'fully funded') return 1;
        return 0;
      });
    }

    return sorted;
  }

  // ============================================================
  // RENDER CARD
  // ============================================================
  function renderCard(schol) {
    const isFullyFunded = schol.funding_type === 'fully funded';
    const level = schol.degree_level || '';
    const subjectTags = getSubjectTags(schol.subjects);
    const deadline = formatDeadline(schol.application_deadline);
    const status = schol.application_status || 'pending';
    const isPakistani = schol.eligible_nationalities &&
      schol.eligible_nationalities.toLowerCase().includes('pakistan');

    const article = document.createElement('article');
    article.className = 'scholarship-card';
    article.setAttribute('data-id', schol.id);

    article.innerHTML = `
      <div class="card-image">
        ${isFullyFunded ? '<span class="fully-funded-badge">Fully Funded</span>' : ''}
        ${level ? `<span class="level-badge">${escapeHtml(level)}</span>` : ''}
      </div>
      <div class="card-body">
        <h3 class="card-title" title="${escapeHtml(schol.title)}">${escapeHtml(schol.title)}</h3>
        <div class="card-university">
          <span>${escapeHtml(schol.university || '')}</span>
          ${schol.country ? `<span class="country-name">${escapeHtml(schol.country)}</span>` : ''}
        </div>
        <p class="card-desc">${escapeHtml(schol.academic_requirements || 'Details available on the official scholarship page.')}</p>
        ${subjectTags ? `<div class="card-subjects"><i class="fas fa-book" style="font-size:0.7rem"></i> ${escapeHtml(subjectTags)}</div>` : ''}
        <div class="eligibility">
          <strong><i class="fas fa-user-check" style="font-size:0.7rem"></i> Eligible:</strong>
          ${escapeHtml(schol.eligible_nationalities || 'International students')}
        </div>
        ${isPakistani ? '<div class="status-badge" style="background:#dcfce7;color:#166534">Pakistan Eligible</div>' : ''}
        <a href="${escapeHtml(schol.application_url || '#')}" target="_blank" rel="noopener" class="card-link" onclick="event.stopPropagation()">
          <i class="fas fa-external-link-alt"></i> Apply Now
        </a>
        <div class="card-meta">
          <span><i class="fas fa-calendar-alt"></i> ${deadline}</span>
          <span style="text-transform:capitalize">${escapeHtml(status)}</span>
        </div>
      </div>
    `;

    article.addEventListener('click', () => showDetailPage(schol));
    return article;
  }

  // ============================================================
  // RENDER CARDS
  // ============================================================
  function renderCards(scholarships) {
    if (scholarships.length === 0) {
      grid.innerHTML = `
        <div class="no-results">
          <i class="fas fa-search"></i>
          <p>No scholarships match your criteria.</p>
          <p style="font-size:0.9rem;margin-top:0.5rem">Try adjusting your filters or search terms.</p>
        </div>`;
      if (resultsCount) resultsCount.textContent = '0 scholarships found';
      return;
    }

    const fragment = document.createDocumentFragment();
    scholarships.forEach((schol, i) => {
      const card = renderCard(schol);
      // Stagger entrance (cap the delay so big lists stay snappy)
      card.style.animationDelay = Math.min(i, 24) * 35 + 'ms';
      fragment.appendChild(card);
    });

    grid.innerHTML = '';
    grid.appendChild(fragment);

    if (resultsCount) {
      resultsCount.textContent = `${scholarships.length.toLocaleString()} scholarships found`;
    }
  }

  // ============================================================
  // ACTIVE FILTERS SUMMARY
  // ============================================================
  function renderActiveFilters() {
    if (!activeFilters) return;

    const chips = [];

    if (state.level !== 'all') {
      chips.push({ label: 'Level: ' + state.level.charAt(0).toUpperCase() + state.level.slice(1), clear: () => {
        state.level = 'all';
        levelBtns.forEach(b => b.classList.toggle('active', b.getAttribute('data-filter') === 'all'));
      }});
    }
    if (state.funding !== 'all') {
      chips.push({ label: 'Funding: ' + (state.funding === 'fully funded' ? 'Fully Funded' : 'Partial'), clear: () => {
        state.funding = 'all';
        fundingBtns.forEach(b => b.classList.toggle('active', b.getAttribute('data-funding') === 'all'));
      }});
    }
    if (state.country) {
      chips.push({ label: 'Country: ' + state.country, clear: () => {
        state.country = '';
        if (countrySelect) countrySelect.value = '';
      }});
    }
    if (state.subject) {
      chips.push({ label: 'Subject: ' + state.subject, clear: () => {
        state.subject = '';
        if (subjectSelect) subjectSelect.value = '';
      }});
    }
    if (state.searchTerm) {
      chips.push({ label: 'Search: "' + state.searchTerm + '"', clear: () => {
        state.searchTerm = '';
        if (mainSearch) mainSearch.value = '';
        if (heroSearch) heroSearch.value = '';
      }});
    }

    if (chips.length === 0) {
      activeFilters.hidden = true;
      activeFilters.innerHTML = '';
      return;
    }

    activeFilters.hidden = false;
    activeFilters.innerHTML = '';
    chips.forEach(chip => {
      const el = document.createElement('span');
      el.className = 'af-chip';
      el.innerHTML = `${escapeHtml(chip.label)}<span class="af-x" role="button" aria-label="Remove filter" tabindex="0">&times;</span>`;
      const x = el.querySelector('.af-x');
      x.addEventListener('click', () => { chip.clear(); applyFilters(); });
      x.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); chip.clear(); applyFilters(); } });
      activeFilters.appendChild(el);
    });
  }

  // ============================================================
  // APPLY FILTERS
  // ============================================================
  function applyFilters() {
    const filtered = allScholarships.filter(schol => matchesFilters(schol));
    const sorted = sortScholarships(filtered);
    renderCards(sorted);
    renderActiveFilters();
  }

  // ============================================================
  // RENDER STATS
  // ============================================================
  function renderStats() {
    const total = allScholarships.length;
    const fullyFunded = allScholarships.filter(s => s.funding_type === 'fully funded').length;
    const pakistani = allScholarships.filter(s =>
      s.eligible_nationalities && s.eligible_nationalities.toLowerCase().includes('pakistan')
    ).length;
    const countries = [...new Set(allScholarships.map(s => s.country).filter(Boolean))].length;
    const subjects = [...new Set(allScholarships.flatMap(s => s.subjects))].length;

    if (totalStats) totalStats.textContent = total.toLocaleString();
    if (fullyFundedStats) fullyFundedStats.textContent = fullyFunded.toLocaleString();
    if (pakistaniStats) pakistaniStats.textContent = pakistani.toLocaleString();
    if (totalCountries) totalCountries.textContent = countries.toLocaleString();
    if (footerCount) footerCount.textContent = total.toLocaleString();

    if (heroTotal) heroTotal.textContent = total.toLocaleString();
    if (heroFunded) heroFunded.textContent = fullyFunded.toLocaleString();
    if (heroCountries) heroCountries.textContent = countries.toLocaleString();
    if (heroSubjects) heroSubjects.textContent = subjects.toLocaleString();
  }

  // ============================================================
  // DETAIL MODAL
  // ============================================================
  function showDetailPage(schol) {
    const overlay = document.createElement('div');
    overlay.className = 'detail-overlay';

    const benefits = [];
    if (schol.tuition_fee_coverage) benefits.push(`<li><strong>Tuition:</strong> ${escapeHtml(schol.tuition_fee_coverage)}</li>`);
    if (schol.monthly_stipend) benefits.push(`<li><strong>Stipend:</strong> ${escapeHtml(schol.monthly_stipend)}</li>`);
    if (schol.accommodation_support) benefits.push(`<li><strong>Accommodation:</strong> ${escapeHtml(schol.accommodation_support)}</li>`);
    if (schol.travel_allowance) benefits.push(`<li><strong>Travel:</strong> ${escapeHtml(schol.travel_allowance)}</li>`);
    if (schol.health_insurance) benefits.push(`<li><strong>Health Insurance:</strong> ${escapeHtml(schol.health_insurance)}</li>`);

    const docs = schol.required_documents && schol.required_documents.length > 0
      ? `<ul>${schol.required_documents.map(d => `<li>${escapeHtml(d)}</li>`).join('')}</ul>`
      : '<p>Not specified by official source.</p>';

    overlay.innerHTML = `
      <div class="detail-modal">
        <button class="close-detail" aria-label="Close">&times;</button>
        <h2>${escapeHtml(schol.title)}</h2>

        <div class="detail-section">
          <div class="detail-section-title">University & Location</div>
          <div class="detail-section-value">
            <strong>${escapeHtml(schol.university || 'Not specified')}</strong><br>
            ${schol.city ? escapeHtml(schol.city) + ', ' : ''}${escapeHtml(schol.country || 'Not specified')}
          </div>
        </div>

        <div class="detail-section">
          <div class="detail-section-title">Degree Level</div>
          <div class="detail-section-value" style="text-transform:capitalize">${escapeHtml(schol.degree_level || 'Not specified')}</div>
        </div>

        <div class="detail-section">
          <div class="detail-section-title">Subjects</div>
          <div class="detail-section-value">${schol.subjects ? schol.subjects.map(escapeHtml).join(', ') : 'Not specified'}</div>
        </div>

        <div class="detail-section">
          <div class="detail-section-title">Funding</div>
          <div class="detail-section-value" style="text-transform:capitalize">${escapeHtml(schol.funding_type || 'Not specified')}</div>
        </div>

        ${benefits.length > 0 ? `
        <div class="detail-section">
          <div class="detail-section-title">Benefits</div>
          <div class="detail-section-value"><ul>${benefits.join('')}</ul></div>
        </div>` : ''}

        <div class="detail-section">
          <div class="detail-section-title">Eligible Nationalities</div>
          <div class="detail-section-value">${escapeHtml(schol.eligible_nationalities || 'Not specified by official source.')}</div>
        </div>

        <div class="detail-section">
          <div class="detail-section-title">Academic Requirements</div>
          <div class="detail-section-value">${escapeHtml(schol.academic_requirements || 'Not specified by official source.')}</div>
        </div>

        <div class="detail-section">
          <div class="detail-section-title">English Language (IELTS/TOEFL)</div>
          <div class="detail-section-value">${escapeHtml(schol.ielts_toefl || 'Not specified by official source.')}</div>
        </div>

        <div class="detail-section">
          <div class="detail-section-title">Required Documents</div>
          <div class="detail-section-value">${docs}</div>
        </div>

        <div class="detail-section">
          <div class="detail-section-title">Application Dates</div>
          <div class="detail-section-value">
            <strong>Opening:</strong> ${escapeHtml(schol.application_opening_date || 'Not specified')}<br>
            <strong>Deadline:</strong> ${formatDeadline(schol.application_deadline)}<br>
            <strong>Duration:</strong> ${escapeHtml(schol.scholarship_duration || 'Not specified')}
          </div>
        </div>

        <div class="detail-section">
          <div class="detail-section-title">Application Instructions</div>
          <div class="detail-section-value">${escapeHtml(schol.application_instructions || 'Apply via the official scholarship portal.')}</div>
        </div>

        <div class="detail-section">
          <div class="detail-section-title">Application Status</div>
          <div class="detail-section-value" style="text-transform:capitalize">${escapeHtml(schol.application_status || 'pending verification')}</div>
        </div>

        <div class="detail-links">
          <a href="${escapeHtml(schol.application_url || '#')}" target="_blank" rel="noopener" class="detail-link-btn apply">
            <i class="fas fa-paper-plane"></i> Apply Now
          </a>
          <a href="${escapeHtml(schol.official_info_url || schol.source_url || '#')}" target="_blank" rel="noopener" class="detail-link-btn official">
            <i class="fas fa-external-link-alt"></i> Official Website
          </a>
        </div>

        <p class="detail-verification">Last verified: ${escapeHtml(schol.last_verified || 'Not specified')}</p>
      </div>
    `;

    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';

    function closeOverlay() {
      document.body.removeChild(overlay);
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKey);
    }

    function onKey(e) {
      if (e.key === 'Escape') closeOverlay();
    }

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay || e.target.closest('.close-detail')) {
        closeOverlay();
      }
    });

    document.addEventListener('keydown', onKey);
  }

  // ============================================================
  // EVENT BINDINGS
  // ============================================================

  // Degree level buttons
  const levelBtns = document.querySelectorAll('.filter-btn[data-filter]');
  levelBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      levelBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.level = btn.getAttribute('data-filter');
      applyFilters();
    });
  });

  // Funding buttons
  const fundingBtns = document.querySelectorAll('.filter-btn[data-funding]');
  fundingBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      fundingBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.funding = btn.getAttribute('data-funding');
      applyFilters();
    });
  });

  // Country dropdown
  if (countrySelect) {
    countrySelect.addEventListener('change', (e) => {
      state.country = e.target.value;
      applyFilters();
    });
  }

  // Subject dropdown
  if (subjectSelect) {
    subjectSelect.addEventListener('change', (e) => {
      state.subject = e.target.value;
      applyFilters();
    });
  }

  // Sort dropdown
  if (sortBySelect) {
    sortBySelect.addEventListener('change', applyFilters);
  }

  // Main search (in filter bar)
  if (mainSearch) {
    let debounceTimer;
    mainSearch.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        state.searchTerm = e.target.value.trim();
        if (heroSearch) heroSearch.value = e.target.value;
        applyFilters();
      }, 300);
    });
  }

  // Hero search
  if (heroSearch) {
    heroSearch.addEventListener('input', (e) => {
      state.searchTerm = e.target.value.trim();
      if (mainSearch) mainSearch.value = e.target.value;
      applyFilters();
    });
  }

  if (heroSearchBtn) {
    heroSearchBtn.addEventListener('click', () => {
      state.searchTerm = heroSearch.value.trim();
      if (mainSearch) mainSearch.value = heroSearch.value;
      applyFilters();
      document.getElementById('browse').scrollIntoView({ behavior: 'smooth' });
    });
  }

  // Clear all
  if (clearAllBtn) {
    clearAllBtn.addEventListener('click', () => {
      state.level = 'all';
      state.funding = 'all';
      state.country = '';
      state.subject = '';
      state.searchTerm = '';

      // Reset UI
      levelBtns.forEach(b => b.classList.remove('active'));
      if (levelBtns[0]) levelBtns[0].classList.add('active');
      fundingBtns.forEach(b => b.classList.remove('active'));
      if (fundingBtns[0]) fundingBtns[0].classList.add('active');
      if (countrySelect) countrySelect.value = '';
      if (subjectSelect) subjectSelect.value = '';
      if (sortBySelect) sortBySelect.value = 'default';
      if (mainSearch) mainSearch.value = '';
      if (heroSearch) heroSearch.value = '';

      applyFilters();
    });
  }

  // Hamburger menu
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      const open = navLinks.classList.toggle('active');
      hamburger.classList.toggle('active', open);
      hamburger.setAttribute('aria-expanded', String(open));
    });

    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navLinks.classList.remove('active');
        hamburger.setAttribute('aria-expanded', 'false');
      });
    });

    // Close menu on outside click
    document.addEventListener('click', (e) => {
      if (navLinks.classList.contains('active') &&
          !navLinks.contains(e.target) && !hamburger.contains(e.target)) {
        navLinks.classList.remove('active');
        hamburger.classList.remove('active');
        hamburger.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // Latest Scholarships — sorts by newest and scrolls to grid
  const latestLink = document.getElementById('latestLink');
  if (latestLink) {
    latestLink.addEventListener('click', (e) => {
      e.preventDefault();
      if (sortBySelect) sortBySelect.value = 'latest';
      applyFilters();
      // Close mobile menu
      if (navLinks) navLinks.classList.remove('active');
      if (hamburger) hamburger.classList.remove('active');
      // Scroll to scholarship grid
      document.getElementById('browse').scrollIntoView({ behavior: 'smooth' });
    });
  }

  // Filter panel is always visible on mobile (no collapse)

  // Back to top
  if (backToTop) {
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        backToTop.classList.toggle('visible', window.scrollY > 500);
        ticking = false;
      });
    }, { passive: true });

    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ============================================================
  // INITIAL RENDER
  // ============================================================
  populateCountrySelect();
  populateSubjectSelect();
  renderStats();
  applyFilters();

  console.log('Application initialized successfully');
});
