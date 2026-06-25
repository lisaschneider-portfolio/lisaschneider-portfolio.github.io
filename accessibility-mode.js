(function () {
  'use strict';

  const STORAGE_KEY = 'wcagAccessibilityMode';
  const THEME_ATTRIBUTE = 'data-theme';
  const ACCESSIBLE_THEME = 'accessible';

  function readStoredMode() {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch (error) {
      return false;
    }
  }

  function writeStoredMode(isEnabled) {
    try {
      localStorage.setItem(STORAGE_KEY, String(isEnabled));
    } catch (error) {
      // Ignore storage errors (private mode, disabled storage).
    }
  }

  function initAccessibilityModeToggle() {
    const button = document.querySelector('[data-wcag-toggle]');
    if (!button || !document.body) return;

    const label = button.querySelector('[data-wcag-label]');

    function applyMode(isEnabled) {
      if (isEnabled) {
        document.body.setAttribute(THEME_ATTRIBUTE, ACCESSIBLE_THEME);
      } else {
        document.body.removeAttribute(THEME_ATTRIBUTE);
      }
      button.classList.toggle('is-active', isEnabled);
      button.setAttribute('aria-pressed', String(isEnabled));
      if (label) {
        label.textContent = isEnabled ? 'WCAG mode: on' : 'WCAG mode: off';
      }
    }

    function toggleAccessibleTheme() {
      enabled = !enabled;
      writeStoredMode(enabled);
      applyMode(enabled);
    }

    let enabled = readStoredMode();
    applyMode(enabled);

    window.toggleAccessibleTheme = toggleAccessibleTheme;

    button.addEventListener('click', toggleAccessibleTheme);

    button.addEventListener('keydown', function (event) {
      if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault();
        button.click();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAccessibilityModeToggle);
  } else {
    initAccessibilityModeToggle();
  }
})();
