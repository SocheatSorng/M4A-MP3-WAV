(function () {
  "use strict";

  var overlay;
  var targetX = window.innerWidth / 2;
  var targetY = window.innerHeight * 0.35;
  var raf = null;

  function createOverlay() {
    overlay = document.createElement("div");
    overlay.className = "darkness-overlay";
    overlay.setAttribute("aria-hidden", "true");
    document.body.appendChild(overlay);
    apply();
  }

  function apply() {
    overlay.style.setProperty("--spot-x", targetX + "px");
    overlay.style.setProperty("--spot-y", targetY + "px");
    raf = null;
  }

  function onMove(x, y) {
    targetX = x;
    targetY = y;
    if (!raf) raf = requestAnimationFrame(apply);
  }

  document.addEventListener("DOMContentLoaded", function () {
    createOverlay();

    window.addEventListener("mousemove", function (event) {
      onMove(event.clientX, event.clientY);
    }, { passive: true });

    window.addEventListener("touchmove", function (event) {
      if (event.touches && event.touches[0]) {
        onMove(event.touches[0].clientX, event.touches[0].clientY);
      }
    }, { passive: true });

    window.addEventListener("resize", function () {
      targetX = Math.min(targetX, window.innerWidth);
      targetY = Math.min(targetY, window.innerHeight);
    });
  });
})();
