/* JobSecured - site interactions
   1. Missed-call ROI calculator
   2. Mobile nav toggle
   3. Scroll reveals (respects reduced motion)
   4. Lead form submit UX (Formspree AJAX)
*/
(function () {
  "use strict";

  // Signal that JS is alive; reveal animations only engage after this.
  document.documentElement.classList.add("js-ready");

  var PLAN_PRICE = 299;        // Full Coverage - single source of truth
  var LOW_VOLUME_NET = 500;    // at or below this net/mo, suggest the starter tier
  var fmt = function (n) {
    return "$" + Math.round(n).toLocaleString("en-US");
  };

  /* ---------- 1. ROI calculator ---------- */
  var missed = document.getElementById("missed");
  var ticket = document.getElementById("ticket");
  var close = document.getElementById("close");

  function calc() {
    if (!missed) return;
    var m = +missed.value, t = +ticket.value, c = +close.value / 100;
    document.getElementById("missedVal").textContent = m;
    document.getElementById("ticketVal").textContent = fmt(t);
    document.getElementById("closeVal").textContent = close.value + "%";

    // weekly missed calls -> monthly (x 4.33), recovered at close rate
    var lost = m * 4.33 * t * c;
    var net = lost - PLAN_PRICE;
    document.getElementById("lostMonthly").innerHTML = fmt(lost) + "<small>/mo</small>";
    var netEl = document.getElementById("netMonthly");
    var note = document.getElementById("calcNote");
    netEl.textContent = fmt(Math.max(net, 0));
    if (net <= 0) {
      note.innerHTML =
        "At this volume, start with <strong>Missed\u2011Call Guard at $199</strong> and grow from there.";
    } else if (net <= LOW_VOLUME_NET) {
      note.innerHTML =
        "That's <strong>" + fmt(net * 12) + "</strong> a year back. At this volume, " +
        "<strong>Missed\u2011Call Guard at $199</strong> may fit better - same 24/7 pickup, lower cost.";
    } else {
      note.innerHTML =
        "That's <strong>" + fmt(net * 12) +
        "</strong> a year - from calls you're already getting.";
    }
  }
  [missed, ticket, close].forEach(function (el) {
    if (el) el.addEventListener("input", calc);
  });
  calc();

  /* ---------- 2. Mobile nav ---------- */
  var toggle = document.querySelector(".nav-toggle");
  var mobileNav = document.querySelector(".mobile-nav");
  if (toggle && mobileNav) {
    toggle.addEventListener("click", function () {
      var open = mobileNav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    mobileNav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        mobileNav.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ---------- 3. Scroll reveals ---------- */
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var reveals = document.querySelectorAll(".reveal");
  if (reduced || !("IntersectionObserver" in window)) {
    reveals.forEach(function (el) { el.classList.add("in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.15 });
    reveals.forEach(function (el) { io.observe(el); });
  }

  /* ---------- 4. Lead form ---------- */
  var form = document.querySelector(".lead-form");
  if (form) {
    form.addEventListener("submit", function (e) {
      // If the Formspree ID hasn't been set yet, don't fire a dead request.
      if (form.action.indexOf("YOUR_FORM_ID") !== -1) {
        // Formspree not wired yet: open a pre-filled text instead. A lead
        // captured by SMS beats a form that apologizes.
        e.preventDefault();
        var fd = new FormData(form);
        var body = "Callback request - " + (fd.get("name") || "") +
          (fd.get("company") ? ", " + fd.get("company") : "") +
          ". Best number: " + (fd.get("phone") || "");
        window.location.href = "sms:+12105000096?&body=" + encodeURIComponent(body);
        return;
      }
      e.preventDefault();
      var btn = form.querySelector("button");
      btn.disabled = true;
      btn.textContent = "Sending…";
      fetch(form.action, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" }
      })
        .then(function (r) {
          if (r.ok) {
            form.outerHTML =
              '<div class="form-success">Got it. James will call you back the same day.</div>';
          } else {
            throw new Error();
          }
        })
        .catch(function () {
          btn.disabled = false;
          btn.textContent = "Request a callback";
          alert("That didn't go through. Call or text (210) 500-0096 instead.");
        });
    });
  }
})();
