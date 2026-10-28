/* Comportamiento del sitio. Cada bloque se activa solo si su elemento
   existe en la página, así que este mismo archivo sirve para todas. */
(function () {
  "use strict";

  var FLEET = window.__FLEET || [];

  function usd(n) { return "$" + n.toLocaleString("en-US"); }
  function unitLabel(y) { return y.unit === "hour" ? "per hour" : (y.unitNote || "per trip"); }

  /* ---------------- filtros del listado ---------------- */
  var listing = document.getElementById("listing");
  if (listing) {
    var fType = "all", fSize = "all", fGuests = 0;
    var countEl = document.getElementById("count");

    function applyFilter() {
      var shown = 0;
      listing.querySelectorAll(".lcard").forEach(function (c) {
        var ok = (fType === "all" || c.getAttribute("data-type") === fType) &&
                 (fSize === "all" || c.getAttribute("data-size") === fSize) &&
                 (fGuests === 0 || parseInt(c.getAttribute("data-max"), 10) >= fGuests);
        c.hidden = !ok; if (ok) shown++;
      });
      if (countEl) {
        var t = shown + (shown === 1 ? " boat" : " boats");
        countEl.textContent = fGuests > 0
          ? t + " that take " + fGuests + " or more guests"
          : t + " available";
      }
    }

    function wire(id, set) {
      var el = document.getElementById(id); if (!el) return;
      el.addEventListener("click", function (e) {
        var b = e.target.closest("button"); if (!b) return;
        set(b);
        this.querySelectorAll("button").forEach(function (x) {
          x.setAttribute("aria-pressed", String(x === b));
        });
        applyFilter();
      });
    }
    wire("f-type", function (b) { fType = b.getAttribute("data-type"); });
    wire("f-size", function (b) { fSize = b.getAttribute("data-size"); });
    applyFilter();

    var search = document.getElementById("search-bar");
    if (search) {
      search.addEventListener("submit", function (e) {
        e.preventDefault();
        var g = parseInt(document.getElementById("s-guests").value, 10) || 1;
        fGuests = g;
        fType = document.getElementById("s-occasion").value === "Sportfishing" ? "fishing" : "all";
        fSize = "all";
        document.querySelectorAll("#f-type button").forEach(function (x) {
          x.setAttribute("aria-pressed", String(x.getAttribute("data-type") === fType));
        });
        document.querySelectorAll("#f-size button").forEach(function (x) {
          x.setAttribute("aria-pressed", String(x.getAttribute("data-size") === "all"));
        });
        applyFilter();
        try {
          var q = new URLSearchParams({
            date: document.getElementById("s-date").value,
            guests: g,
            hours: document.getElementById("s-hours").value
          });
          history.replaceState(null, "", "?" + q.toString() + "#boats");
        } catch (err) {}
        document.getElementById("boats").scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }

  /* ---------------- fechas por defecto ---------------- */
  ["s-date", "q-date", "r-date"].forEach(function (id) {
    var el = document.getElementById(id); if (!el) return;
    var d = new Date(); d.setDate(d.getDate() + 14);
    el.min = new Date().toISOString().slice(0, 10);
    if (!el.value) el.value = d.toISOString().slice(0, 10);
  });

  /* ---------------- reserva ---------------- */
  var ypick = document.getElementById("ypick");
  if (ypick && FLEET.length) {
    var R = { yacht: null, hours: 4, guests: 8, pack: "all" };
    var $ = function (id) { return document.getElementById(id); };

    ypick.innerHTML = FLEET.map(function (y) {
      return '<label><input type="radio" name="ry" value="' + y.slug + '">' +
        '<img src="/img/y' + y.n + y.shot + '.jpg" alt="' + y.name + ' ' + y.feet +
          ' ft charter boat in Cabo San Lucas" loading="lazy" width="1200" height="750">' +
        '<span class="yp"><span class="yp-name">' + y.name + '</span> ' +
        '<span class="yp-ft">' + y.feet + ' ft</span>' +
        '<span class="yp-rate">' + y.guests + ' guests · from ' + usd(y.usd) + ' ' + unitLabel(y) + '</span>' +
        '</span></label>';
    }).join("");

    function calc() {
      var y = R.yacht; if (!y) return null;
      var rate = R.pack === "all" ? y.usdAll : y.usd;
      var perHour = y.unit === "hour";
      var base = perHour ? rate * R.hours : rate;
      var extraN = Math.max(0, R.guests - y.guests);
      var extra = extraN * y.extraUsd;
      var total = base + extra, dep = Math.round(total / 2);
      return { rate: rate, perHour: perHour, base: base, extraN: extraN,
               extra: extra, total: total, deposit: dep, balance: total - dep };
    }

    function renderSummary() {
      var y = R.yacht, head = $("sum-yacht"), sub = $("sum-sub"), body = $("sum-body");
      if (!y) {
        head.textContent = "—";
        sub.textContent = "Select a boat to begin";
        body.innerHTML = '<p class="soft" style="font-size:.88rem">Pick a boat above and the price appears here.</p>';
        return;
      }
      var c = calc();
      head.textContent = y.name + " " + y.feet + " ft";
      sub.textContent = "N° " + y.n + " · up to " + y.max + " guests";
      var r = "";
      r += row("Date", $("r-date").value || "—");
      r += row("Departure", $("r-time").value);
      r += row("Duration", c.perHour ? R.hours + " hours" : (y.unitNote || "Per trip"));
      r += row("Guests", R.guests);
      r += row("Package", R.pack === "all" ? "All inclusive" : "Boat only");
      r += row(c.perHour ? usd(c.rate) + " × " + R.hours + " h" : "Charter", usd(c.base));
      if (c.extraN > 0)
        r += row(c.extraN + " extra guest" + (c.extraN > 1 ? "s" : "") + " × " + usd(y.extraUsd), usd(c.extra));
      r += '<div class="sum-row total"><span>Total</span><span>' + usd(c.total) + '</span></div>';
      r += '<div class="sum-row dep"><span>Deposit now (50%)</span><span>' + usd(c.deposit) + '</span></div>';
      r += '<div class="sum-row dep"><span>Balance on the day</span><span>' + usd(c.balance) + '</span></div>';
      r += '<p class="sum-note">Whole boat, not per person. Includes captain and crew, fuel, port permits and marina fees. Crew gratuity is not included.</p>';
      body.innerHTML = r;
    }
    function row(a, b) { return '<div class="sum-row"><span>' + a + '</span><span>' + b + '</span></div>'; }

    function sync() {
      R.hours = parseInt($("r-hours").value, 10) || 4;
      R.guests = parseInt($("r-guests").value, 10) || 1;
      var p = document.querySelector('input[name="rp"]:checked');
      R.pack = p ? p.value : "all";

      var y = R.yacht, o = $("pk-rate-only"), a = $("pk-rate-all");
      if (y) {
        var sfx = y.unit === "hour" ? " / hour" : " / trip";
        o.textContent = usd(y.usd) + sfx; a.textContent = usd(y.usdAll) + sfx;
      } else { o.textContent = "—"; a.textContent = "—"; }

      var hf = $("r-hours"), dis = !!(y && y.unit !== "hour");
      hf.disabled = dis;
      hf.closest(".field").style.opacity = dis ? ".45" : "1";

      var w = $("cap-warn");
      if (y && R.guests > y.max) {
        w.hidden = false;
        w.textContent = "The " + y.name + " " + y.feet + " ft takes " + y.max +
          " guests. For " + R.guests + " you need a bigger boat — the Seavana 63 ft carries 20.";
      } else { w.hidden = true; w.textContent = ""; }

      renderSummary();
    }

    ypick.addEventListener("change", function (e) {
      if (e.target.name !== "ry") return;
      R.yacht = FLEET.filter(function (f) { return f.slug === e.target.value; })[0];
      sync();
    });
    ["r-date", "r-time", "r-hours", "r-guests"].forEach(function (id) {
      $(id).addEventListener("input", sync);
    });
    $("pack").addEventListener("change", sync);

    function warn(m) { var w = $("cap-warn"); w.hidden = false; w.textContent = m; }

    function goStep(n) {
      if (n >= 2 && !R.yacht) {
        warn("Pick a boat first.");
        ypick.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
      if (n >= 2 && !$("r-date").value) { warn("Choose a charter date."); $("r-date").focus(); return; }
      if (n === 3) {
        var f = $("reserve-form");
        if (!f.checkValidity()) { f.reportValidity(); return; }
        var y = R.yacht, c = calc();
        $("pay-amount").textContent = usd(c.deposit) + " USD";
        $("pay-recap").innerHTML =
          "<strong style='color:var(--ink)'>" + y.name + " " + y.feet + " ft</strong> · " +
          (c.perHour ? R.hours + " hours" : (y.unitNote || "per trip")) + " · " + R.guests + " guests<br>" +
          $("r-date").value + " at " + $("r-time").value + " · " +
          (R.pack === "all" ? "All inclusive" : "Boat only") + "<br>Total " + usd(c.total) +
          " · balance of " + usd(c.balance) + " due on the day";
      }
      document.querySelectorAll(".step-panel").forEach(function (p) {
        p.classList.toggle("on", p.getAttribute("data-panel") === String(n));
      });
      document.querySelectorAll("#steps div").forEach(function (d) {
        if (d.getAttribute("data-step") === String(n)) d.setAttribute("aria-current", "step");
        else d.removeAttribute("aria-current");
      });
      $("steps").scrollIntoView({ behavior: "smooth", block: "start" });
    }

    document.addEventListener("click", function (e) {
      var b = e.target.closest("[data-go]"); if (!b) return;
      goStep(parseInt(b.getAttribute("data-go"), 10));
    });

    $("pay-btn").addEventListener("click", function () {
      var y = R.yacht, c = calc(), note = $("pay-note");
      note.hidden = false;
      note.innerHTML =
        "<strong>Stripe is not connected on this draft.</strong> On the live site this button opens Stripe " +
        "Checkout — Stripe&rsquo;s own hosted page — where the card is entered. The card never touches this " +
        "site, which is what keeps it out of PCI scope.<br><br><strong>Reservation to send meanwhile:</strong>" +
        "<span style='font-family:var(--f-mono);font-size:.8rem;display:block;margin-top:9px;line-height:1.8'>" +
        y.name + " " + y.feet + " ft · " + (c.perHour ? R.hours + " h" : (y.unitNote || "per trip")) +
        " · " + R.guests + " guests<br>" + $("r-date").value + " " + $("r-time").value + " · " +
        (R.pack === "all" ? "All inclusive" : "Boat only") + "<br>Total " + usd(c.total) +
        " · deposit " + usd(c.deposit) + "<br>" + $("r-name").value + " · " + $("r-email").value +
        " · " + $("r-phone").value + "</span>";
      this.textContent = "Checkout not connected yet";
      this.disabled = true; this.style.opacity = ".5";
      note.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });

    /* preselección desde ?boat= o desde la ficha de un barco */
    try {
      var want = new URLSearchParams(location.search).get("boat");
      if (want) {
        var input = ypick.querySelector('input[value="' + want + '"]');
        if (input) {
          input.checked = true;
          R.yacht = FLEET.filter(function (f) { return f.slug === want; })[0];
        }
      }
      var qs = new URLSearchParams(location.search);
      if (qs.get("guests")) $("r-guests").value = qs.get("guests");
      if (qs.get("date")) $("r-date").value = qs.get("date");
      if (qs.get("hours")) $("r-hours").value = qs.get("hours");
    } catch (err) {}
    sync();
  }

  /* ---------------- formulario de contacto ---------------- */
  var qf = document.getElementById("quote-form");
  if (qf) {
    qf.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!qf.checkValidity()) { qf.reportValidity(); return; }
      var g = function (id) { return (document.getElementById(id) || {}).value || ""; };
      document.getElementById("quote-summary").textContent =
        "CHARTER INQUIRY — B.A. CREW YACHT CHARTER CO.\n" +
        "Date: " + g("q-date") + "\nHours: " + g("q-hours") + "\nGuests: " + g("q-guests") + "\n" +
        "Boat: " + g("q-yacht") + "\nOccasion: " + g("q-occasion") + "\nName: " + g("q-name") + "\n" +
        "Email: " + g("q-email") + "\nPhone: " + (g("q-phone") || "—") + "\n" +
        "Notes: " + (g("q-notes") || "—");
      var box = document.getElementById("quote-result");
      box.hidden = false;
      box.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }

  var copy = document.getElementById("copy-btn");
  if (copy) {
    copy.addEventListener("click", function () {
      var btn = this, el = document.getElementById("quote-summary");
      var done = function () {
        btn.textContent = "Copied";
        setTimeout(function () { btn.textContent = "Copy summary"; }, 1800);
      };
      try {
        navigator.clipboard.writeText(el.textContent).then(done).catch(function () {
          var r = document.createRange(); r.selectNodeContents(el);
          var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
          btn.textContent = "Select and copy";
        });
      } catch (err) { btn.textContent = "Select and copy"; }
    });
  }
})();
