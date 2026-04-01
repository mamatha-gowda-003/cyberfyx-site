import { searchIndex as staticIndex, type SearchEntry } from '../data/search-index';

let resolvedIndex: SearchEntry[] = staticIndex;

async function initSearchIndex(apiBaseUrl: string) {
  if (!apiBaseUrl) return;
  try {
    const res = await fetch(`${apiBaseUrl}/api/v1/public/site/search-index`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) resolvedIndex = data;
    }
  } catch { /* use static fallback */ }
}

document.addEventListener('DOMContentLoaded', () => {
  initSiteSearch();

  const metaTag = document.querySelector('meta[name="cyberfyx-api-base"]');
  const apiBaseUrl = metaTag ? (metaTag.getAttribute('content') ?? '') : '';
  initSearchIndex(apiBaseUrl);
});

function initSiteSearch() {
  const navActions = document.querySelector('.nav-actions');
  if (!navActions) return;

  // Find the quote button to insert before it
  const quoteButton = navActions?.querySelector('[href="/contact"]');
  if (!quoteButton) return;

  const searchWrapper = document.createElement('div');
  searchWrapper.className = 'site-search';

  const searchButton = document.createElement('button');
  searchButton.type = 'button';
  searchButton.className = 'site-search-btn';
  searchButton.setAttribute('aria-label', 'Search website');
  searchButton.setAttribute('aria-expanded', 'false');
  searchButton.innerHTML = '<i class="fa-solid fa-magnifying-glass"></i>';
  searchWrapper.appendChild(searchButton);

  const dropdown = document.createElement('div');
  dropdown.className = 'site-search-dropdown';
  dropdown.innerHTML = `
    <div class="site-search-bar">
      <i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
      <input class="site-search-input" type="search" placeholder="Search services, industries, careers, contact..." autocomplete="off">
      <button class="site-search-close" type="button" aria-label="Close search">
        <i class="fa-solid fa-xmark"></i>
      </button>
    </div>
    <div class="site-search-results"></div>
  `;
  searchWrapper.appendChild(dropdown);
  navActions.insertBefore(searchWrapper, quoteButton);

  const input = dropdown.querySelector('.site-search-input') as HTMLInputElement;
  const results = dropdown.querySelector('.site-search-results') as HTMLDivElement;
  const closeButton = dropdown.querySelector('.site-search-close') as HTMLButtonElement;
  const pageEntries = getSearchEntries();

  function renderResults(query = '') {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      results.innerHTML = '<div class="site-search-empty">Start typing to search the website.</div>';
      return;
    }

    const queryTokens = normalizedQuery.split(/\s+/).filter(Boolean);
    const matches = pageEntries
      .filter(entry => queryTokens.every(token => entry.searchText.includes(token)))
      .slice(0, 10);

    if (!matches.length) {
      results.innerHTML = '<div class="site-search-empty">No matching pages found. Try keywords like cybersecurity, contact, services, or industries.</div>';
      return;
    }

    results.innerHTML = matches.map(entry => `
      <a class="site-search-result" href="${entry.href}">
        <strong>${entry.title}</strong>
        <small>${entry.section}</small>
      </a>
    `).join('');
  }

  function openSearch() {
    searchWrapper.classList.add('open');
    searchButton.setAttribute('aria-expanded', 'true');
    renderResults(input.value);
    window.setTimeout(() => input.focus(), 50);
  }

  function closeSearch() {
    searchWrapper.classList.remove('open');
    searchButton.setAttribute('aria-expanded', 'false');
  }

  searchButton.addEventListener('click', () => {
    if (searchWrapper.classList.contains('open')) {
      closeSearch();
    } else {
      openSearch();
    }
  });

  closeButton.addEventListener('click', closeSearch);
  input.addEventListener('input', () => renderResults(input.value));

  document.addEventListener('click', event => {
    if (searchWrapper.classList.contains('open') && !searchWrapper.contains(event.target as Node)) {
      closeSearch();
    }
  });

  results.addEventListener('click', event => {
    const resultLink = (event.target as HTMLElement).closest('.site-search-result');
    if (resultLink) {
      closeSearch();
    }
  });

  document.addEventListener('keydown', event => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      if (searchWrapper.classList.contains('open')) {
        closeSearch();
      } else {
        openSearch();
      }
    }

    if (event.key === 'Escape' && searchWrapper.classList.contains('open')) {
      closeSearch();
    }
  });

  renderResults();
}

function getSearchEntries() {
  return staticIndex.map(entry => {
    const section = entry.url === '/'
      ? 'Home'
      : entry.url.replace(/\//g, ' ').replace(/^\s+|\s+$/g, '').replace(/-/g, ' ');

    return {
      href: entry.url,
      title: entry.title,
      section: section.replace(/\b\w/g, char => char.toUpperCase()),
      searchText: `${entry.title} ${entry.text} ${section} ${entry.url} ${entry.keywords.join(' ')}`
        .toLowerCase()
        .replace(/[^a-z0-9\s./+-]/g, ' ')
    };
  });
}
