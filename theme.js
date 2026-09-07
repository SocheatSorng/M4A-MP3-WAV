(function () {
  "use strict";

  var STORAGE_KEY = "theme";

  function readStoredTheme() {
    try {
      return localStorage.getItem(STORAGE_KEY) || "default";
    } catch (e) {
      return "default";
    }
  }

  function writeStoredTheme(theme) {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch (e) {
      /* storage unavailable — theme just won't persist */
    }
  }

  function applyTheme(theme) {
    var root = document.documentElement;
    if (theme === "glass") {
      root.setAttribute("data-theme", "glass");
    } else {
      root.removeAttribute("data-theme");
    }
    var buttons = document.querySelectorAll(".theme-toggle");
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].setAttribute("aria-pressed", theme === "glass" ? "true" : "false");
    }
  }

  applyTheme(readStoredTheme());

  document.addEventListener("DOMContentLoaded", function () {
    var buttons = document.querySelectorAll(".theme-toggle");
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].addEventListener("click", function () {
        var next = readStoredTheme() === "glass" ? "default" : "glass";
        writeStoredTheme(next);
        applyTheme(next);
      });
    }
  });
})();
