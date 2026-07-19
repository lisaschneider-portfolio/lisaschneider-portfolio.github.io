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
    const buttons = Array.from(document.querySelectorAll('[data-wcag-toggle]'));
    if (!buttons.length || !document.body) return;

    const labels = buttons.map(function (button) {
      return button.querySelector('[data-wcag-label]');
    });

    function updateThemeImages(isEnabled) {
      const themedImages = Array.from(document.querySelectorAll('[data-theme-image]'));
      themedImages.forEach(function (image) {
        const defaultSrc = image.getAttribute('data-default-src');
        const accessibleSrc = image.getAttribute('data-accessible-src');
        if (!defaultSrc || !accessibleSrc) return;
        image.setAttribute('src', isEnabled ? accessibleSrc : defaultSrc);
      });
    }

    function applyMode(isEnabled) {
      if (isEnabled) {
        document.body.setAttribute(THEME_ATTRIBUTE, ACCESSIBLE_THEME);
      } else {
        document.body.removeAttribute(THEME_ATTRIBUTE);
      }
      updateThemeImages(isEnabled);
      buttons.forEach(function (button, index) {
        button.classList.toggle('is-active', isEnabled);
        button.setAttribute('aria-pressed', String(isEnabled));
        if (labels[index]) {
          labels[index].textContent = isEnabled ? 'WCAG mode: on' : 'WCAG mode: off';
        }
      });
    }

    function toggleAccessibleTheme() {
      enabled = !enabled;
      writeStoredMode(enabled);
      applyMode(enabled);
    }

    let enabled = readStoredMode();
    applyMode(enabled);

    window.toggleAccessibleTheme = toggleAccessibleTheme;

    buttons.forEach(function (button) {
      button.addEventListener('click', toggleAccessibleTheme);

      button.addEventListener('keydown', function (event) {
        if (event.key === ' ' || event.key === 'Enter') {
          event.preventDefault();
          button.click();
        }
      });
    });
  }

  function initMobileNavigation() {
    const menuToggles = Array.from(document.querySelectorAll('[data-mobile-menu-toggle]'));
    if (!menuToggles.length) return;

    menuToggles.forEach(function (toggle) {
      const menuId = toggle.getAttribute('aria-controls');
      if (!menuId) return;
      const menu = document.getElementById(menuId);
      if (!menu) return;

      toggle.addEventListener('click', function () {
        const expanded = toggle.getAttribute('aria-expanded') === 'true';
        toggle.setAttribute('aria-expanded', String(!expanded));
        menu.classList.toggle('hidden', expanded);
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      initAccessibilityModeToggle();
      initMobileNavigation();
    });
  } else {
    initAccessibilityModeToggle();
    initMobileNavigation();
  }
})();
