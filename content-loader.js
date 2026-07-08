/* ============================================================
   Баатарай Ургоо — загрузчик контента.
   Дизайн (вёрстка/CSS) НЕ трогается. Этот скрипт только
   подставляет тексты/фото/цены из content.json (или из правок
   админки в localStorage) поверх готового дизайна.
   Публичный сайт НЕ обращается к зарубежным серверам.
   ============================================================ */
(function () {
  "use strict";

  // --- источник контента: правки админки (localStorage) > встроенный > content.json ---
  async function loadContent() {
    // Публичный сайт ВСЕГДА показывает опубликованный content.js (свежий, мимо кэша).
    // Раньше здесь сначала читался черновик из localStorage — из-за него правки
    // «не обновлялись» на том браузере, где открывали админку. Теперь content.js в приоритете.
    try {
      var r = await fetch("content.js?ts=" + Date.now(), { cache: "no-store" });
      if (r.ok) { (0, eval)(await r.text()); if (window.__CONTENT) return window.__CONTENT; }
    } catch (e) {}
    if (window.__CONTENT) return window.__CONTENT; // встроенный (напр. file://)
    // Крайний случай (нет сети): черновик админки.
    try {
      var ls = localStorage.getItem("baatarai_content");
      if (ls) return JSON.parse(ls);
    } catch (e) {}
    return null;
  }

  // --- helpers ---
  function qs(sel, root) { return (root || document).querySelector(sel); }
  function qsa(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  // задать видимый текст элемента, сохраняя дочерние элементы (svg, <br>, <small> и т.п.)
  function setText(el, val) {
    if (!el || val == null) return;
    var done = false;
    for (var i = 0; i < el.childNodes.length; i++) {
      var n = el.childNodes[i];
      if (n.nodeType === 3 && n.nodeValue.trim()) { n.nodeValue = val; done = true; break; }
    }
    if (!done) el.appendChild(document.createTextNode(val));
  }
  function setTextSel(sel, val, root) { setText(qs(sel, root), val); }
  function setHTML(sel, html, root) { var el = qs(sel, root); if (el && html != null) el.innerHTML = html; }
  function setImg(sel, val, root) { var el = qs(sel, root); if (el && val) el.setAttribute("src", val); }
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

  function apply(c) {
    if (!c) return;

    // ---------- Max messenger: показать кнопки, если задана ссылка ----------
    var maxLink = (c.settings && c.settings.max_link) || "";
    if (maxLink) {
      qsa(".max-link").forEach(function (el) { el.setAttribute("href", maxLink); el.removeAttribute("hidden"); });
    }

    // ---------- NAV ----------
    if (c.nav) {
      var brandSpan = qs(".nav .brand > span:not(.mark)");
      if (brandSpan) setText(brandSpan, c.nav.brand);
      setTextSel(".nav .brand small", c.nav.brand_sub);
      setTextSel(".nav .nav-cta", c.nav.cta);
      var map = { link_about: "#about", link_owner: "#owner", link_events: "#events", link_menu: "#menu", link_hotel: "#hotel", link_contacts: "#contacts" };
      Object.keys(map).forEach(function (k) { setTextSel('#navLinks a[href="' + map[k] + '"]', c.nav[k]); });
    }

    // ---------- HERO ----------
    if (c.hero) {
      var h = c.hero;
      setImg(".hero-bg img", h.image);
      setTextSel(".hero .eyebrow", h.eyebrow);
      var h1 = qs(".hero h1"); if (h1) setText(h1, h.title);       // текст до <br>
      setTextSel(".hero h1 .accent", h.title_accent);
      setTextSel(".hero .tag", h.tag);
      if (h.artist != null) { var _aw = esc(h.artist).trim().split(/\s+/); var _last = _aw.pop(); setHTML(".hero .artist", "★ " + (_aw.length ? _aw.join(" ") + " " : "") + "<b>" + _last + "</b>"); }
      setTextSel(".hero .actions .btn-primary", h.cta_primary);
      setTextSel(".hero .actions .btn-ghost", h.cta_ghost);
      var facts = qsa(".hero .facts .fact");
      [["fact1_n", "fact1_t"], ["fact2_n", "fact2_t"], ["fact3_n", "fact3_t"], ["fact4_n", "fact4_t"]].forEach(function (p, i) {
        if (facts[i]) { setText(qs("b", facts[i]), h[p[0]]); setText(qs("span", facts[i]), h[p[1]]); }
      });
    }

    // ---------- FORMAT STRIP ----------
    if (c.format) {
      var its = qsa(".format .it");
      [["i1_h", "i1_p"], ["i2_h", "i2_p"], ["i3_h", "i3_p"]].forEach(function (p, i) {
        if (its[i]) { setText(qs("h4", its[i]), c.format[p[0]]); setText(qs("p", its[i]), c.format[p[1]]); }
      });
    }

    // ---------- ABOUT ----------
    if (c.about) {
      var a = c.about, root = qs("#about");
      setTextSel("#about .eyebrow .num", a.eyebrow_num);
      setText(qs("#about .about-text .eyebrow"), a.eyebrow); // текст рядом с .num
      setTextSel("#about h2", a.title);
      var ps = qsa("#about .about-text p");
      [a.p1, a.p2, a.p3].forEach(function (v, i) { if (ps[i]) setText(ps[i], v); });
      var chips = qsa("#about .chip");
      (a.chips || []).forEach(function (v, i) { if (chips[i]) setText(chips[i], v); });
      var aph = qsa("#about .about-photos img");
      [a.photo1, a.photo2, a.photo3].forEach(function (v, i) { if (aph[i]) aph[i].setAttribute("src", v); });
    }

    // ---------- OWNER ----------
    if (c.owner) {
      var o = c.owner;
      setImg(".owner-photo img", o.image);
      setTextSel(".owner-photo .badge", o.badge);
      setTextSel("#owner .eyebrow .num", o.eyebrow_num);
      setText(qs("#owner .owner-text .eyebrow"), o.eyebrow);
      setTextSel("#owner h2", o.title);
      setTextSel("#owner blockquote", o.quote);
      var ops = qsa("#owner .owner-text p");
      [o.p1, o.p2].forEach(function (v, i) { if (ops[i]) setText(ops[i], v); });
      setTextSel("#owner .owner-text .btn", o.cta);
    }

    // ---------- generic: секции с заголовком (num/eyebrow/title/lead) ----------
    function head(id, obj) {
      if (!obj) return;
      setTextSel("#" + id + " .eyebrow .num", obj.eyebrow_num);
      var eb = qs("#" + id + " .eyebrow"); if (eb) setText(eb, obj.eyebrow);
      setTextSel("#" + id + " h2", obj.title);
      setTextSel("#" + id + " .lead", obj.lead);
    }

    // ---------- EVENTS (динамически) ----------
    if (c.events) {
      head("events", c.events);
      var eg = qs("#events .events-grid");
      if (eg) {
        eg.innerHTML = "";
        (c.events.cards || []).forEach(function (d) {
          if (!d) return;
          var el = document.createElement("div"); el.className = "event";
          el.innerHTML = '<img src="' + esc(d.img) + '" alt="' + esc(d.h || "") + '" loading="lazy"><div class="cap"><h3>' + esc(d.h || "") + '</h3><p>' + esc(d.p || "") + '</p></div>';
          eg.appendChild(el);
        });
      }
      setTextSel("#events .events-cta p", c.events.cta_text);
      setTextSel("#waEventBtn", c.events.cta_button);
    }

    // ---------- HALLS (динамически) ----------
    if (c.halls) {
      head("halls", c.halls);
      var hg = qs("#halls .halls-grid");
      if (hg) {
        hg.innerHTML = "";
        (c.halls.cards || []).forEach(function (d) {
          if (!d) return;
          var el = document.createElement("div"); el.className = "hall";
          el.innerHTML = '<img src="' + esc(d.img) + '" alt="' + esc(d.h || "") + '" loading="lazy"><div class="cap"><h3>' + esc(d.h || "") + '</h3><p>' + esc(d.p || "") + '</p></div>';
          hg.appendChild(el);
        });
      }
    }

    // ---------- MENU: фирменные блюда (динамически) + полное меню страницами ----------
    if (c.menu) {
      head("menu", c.menu);
      var mgrid = qs("#menu .menu-grid");
      if (mgrid) {
        mgrid.innerHTML = "";
        (c.menu.dishes || []).forEach(function (d) {
          if (!d) return;
          var art = document.createElement("article"); art.className = "dish";
          art.innerHTML = '<div class="ph"><img src="' + esc(d.img) + '" alt="' + esc(d.h || "") + '" loading="lazy"></div>' +
            '<div class="body"><span class="tagline">' + esc(d.tag || "") + '</span><h3>' + esc(d.h || "") + '</h3><p>' + esc(d.p || "") + '</p>' +
            '<div class="price"><b>' + (d.price ? esc(d.price) + " ₽" : "— ₽") + '</b><small>' + esc(d.price_note || "") + '</small></div></div>';
          mgrid.appendChild(art);
        });
      }
      setTextSel("#menu .menu-note", c.menu.note);
      setTextSel("#menu .btn-gold", c.menu.full_menu_button);
      // Полное меню — страницы (сканы с ценами)
      var pages = c.menu.pages || [];
      var mwrap = mgrid ? (mgrid.closest(".wrap") || mgrid.parentNode) : null;
      var pwrap = qs("#menu-pages");
      if (!pwrap && mwrap && pages.length) { pwrap = document.createElement("div"); pwrap.id = "menu-pages"; pwrap.style.marginTop = "44px"; mwrap.appendChild(pwrap); }
      if (pwrap) {
        pwrap.innerHTML = '<div style="text-align:center;max-width:760px;margin:0 auto 20px"><h2 class="section-title">' + esc(c.menu.pages_title || "Полное меню") + '</h2><p class="lead" style="margin:0 auto">' + esc(c.menu.pages_lead || "") + '</p></div><div class="menu-pages-grid" style="display:flex;flex-wrap:wrap;justify-content:center;gap:14px;max-width:900px;margin:0 auto"></div>';
        var pg = pwrap.querySelector(".menu-pages-grid");
        pages.forEach(function (p) {
          if (!p || !p.img) return;
          var fig = document.createElement("figure");
          fig.style.cssText = "margin:0;border-radius:10px;overflow:hidden;cursor:zoom-in;box-shadow:0 6px 20px rgba(0,0,0,.28);flex:1 1 150px;max-width:165px";
          fig.innerHTML = '<img src="' + esc(p.img) + '" alt="' + esc(p.cap || "Страница меню") + '" loading="lazy" style="width:100%;display:block">';
          pg.appendChild(fig);
        });
      }
    }

    // ---------- HOTEL: превью + номера (динамически) ----------
    if (c.hotel) {
      head("hotel", c.hotel);
      var hsecWrap = qs("#hotel .wrap");
      if (c.hotel.image && hsecWrap) {
        var hh = qs("#hotel-hero");
        if (!hh) { hh = document.createElement("div"); hh.id = "hotel-hero"; hh.style.cssText = "border-radius:14px;overflow:hidden;margin:0 0 26px;box-shadow:0 10px 40px rgba(0,0,0,.3)"; hsecWrap.insertBefore(hh, hsecWrap.firstChild); }
        hh.innerHTML = '<img src="' + esc(c.hotel.image) + '" alt="Ноён-отель" loading="lazy" style="width:100%;display:block">';
      }
      var rg = qs("#hotel .rooms-grid");
      if (rg) {
        rg.innerHTML = "";
        (c.hotel.rooms || []).forEach(function (d) {
          if (!d) return;
          var el = document.createElement("div"); el.className = "room";
          el.innerHTML = '<div class="ph"><img src="' + esc(d.img) + '" alt="' + esc(d.h || "") + '" loading="lazy"></div><div class="body"><span class="tag">' + esc(d.tag || "") + '</span><h3>' + esc(d.h || "") + '</h3><p>' + esc(d.p || "") + '</p></div>';
          rg.appendChild(el);
        });
      }
    }

    // ---------- GALLERY (динамическая: любое число фото/видео) ----------
    if (c.gallery) {
      head("gallery", c.gallery);
      var ggrid = qs("#gallery .gallery-grid");
      if (ggrid) {
        if (!document.getElementById("ve-style")) {
          var vs = document.createElement("style"); vs.id = "ve-style";
          vs.textContent = ".gallery-grid .video-embed{position:relative;width:100%;padding-bottom:62%;height:0;overflow:hidden}.gallery-grid .video-embed iframe{position:absolute;inset:0;width:100%;height:100%;border:0}";
          document.head.appendChild(vs);
        }
        ggrid.innerHTML = "";
        (c.gallery.photos || []).forEach(function (d, i) {
          if (!d || (!d.img && !d.video)) return;
          var fig = document.createElement("figure");
          fig.className = (i === 0 ? "g-wide g-tall" : (i === 3 ? "g-wide" : ""));
          if (d.video) {
            fig.innerHTML = '<div class="video-embed"><iframe src="' + esc(d.video) + '" allow="autoplay; encrypted-media; fullscreen; picture-in-picture" allowfullscreen loading="lazy"></iframe></div>' + (d.cap ? '<figcaption>' + esc(d.cap) + '</figcaption>' : '');
          } else {
            fig.innerHTML = '<img src="' + esc(d.img) + '" alt="' + esc(d.cap || "") + '" loading="lazy">' + (d.cap ? '<figcaption>' + esc(d.cap) + '</figcaption>' : '');
          }
          ggrid.appendChild(fig);
        });
      }
    }

    // ---------- ОТЗЫВЫ (TripAdvisor, динамически) ----------
    if (c.reviews) {
      var rv = c.reviews;
      var rsec = qs("#reviews");
      if (!rsec) {
        rsec = document.createElement("section");
        rsec.id = "reviews";
        var bk = qs("#booking");
        if (bk && bk.parentNode) bk.parentNode.insertBefore(rsec, bk);
        else document.body.appendChild(rsec);
      }
      rsec.style.cssText = "padding:70px 24px";
      var starsOf = function (n) { n = Math.round(Number(n) || 5); var s = ""; for (var i = 0; i < 5; i++) s += (i < n ? "★" : "☆"); return s; };
      var cards = (rv.items || []).map(function (r) {
        if (!r || !r.text) return "";
        return '<figure style="margin:0;background:var(--card,#211a11);border:1px solid var(--line,rgba(212,173,98,.2));border-radius:16px;padding:22px;display:flex;flex-direction:column;gap:11px">'
          + '<div style="color:var(--gold,#d4ad62);letter-spacing:3px;font-size:15px">' + starsOf(r.stars) + '</div>'
          + (r.title ? '<h3 style="font-family:var(--serif,Georgia,serif);font-weight:700;font-size:20px;line-height:1.2;margin:0;color:var(--cream,#f5eee1)">' + esc(r.title) + '</h3>' : '')
          + '<p style="margin:0;color:var(--muted,#b3a489);font-size:14.5px;line-height:1.62;flex:1">' + esc(r.text) + '</p>'
          + '<figcaption style="font-size:13px;color:var(--cream,#f5eee1);border-top:1px solid var(--line,rgba(212,173,98,.2));padding-top:12px">' + esc(r.name || "Гость") + (r.city ? ' <span style="color:var(--muted,#b3a489)">· ' + esc(r.city) + '</span>' : '') + (r.date ? ' <span style="color:var(--muted,#b3a489)">· ' + esc(r.date) + '</span>' : '') + '</figcaption>'
          + '</figure>';
      }).join("");
      rsec.innerHTML = '<div class="wrap">'
        + '<div style="text-align:center;max-width:680px;margin:0 auto">'
        + '<div class="eyebrow" style="justify-content:center"><span class="num">' + esc(rv.eyebrow_num || "08") + '</span> ' + esc(rv.eyebrow || "Отзывы") + '</div>'
        + '<h2 class="section-title">' + esc(rv.title || "Что говорят гости") + '</h2>'
        + '<p class="lead" style="margin:0 auto">' + esc(rv.lead || "") + '</p>'
        + (rv.ta_rating ? '<div style="display:inline-flex;align-items:center;gap:9px;margin-top:16px;background:var(--card,#211a11);border:1px solid var(--line,rgba(212,173,98,.2));border-radius:999px;padding:8px 18px"><span style="color:var(--gold,#d4ad62);font-size:15px">★</span><b style="color:var(--cream,#f5eee1);font-size:16px">' + esc(rv.ta_rating) + '</b><span style="color:var(--muted,#b3a489);font-size:13.5px">из 5 на TripAdvisor' + (rv.ta_count ? ' · ' + esc(rv.ta_count) + ' отзывов' : '') + '</span></div>' : '')
        + '</div>'
        + '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:18px;margin:30px auto 26px;max-width:1080px">' + cards + '</div>'
        + (rv.ta_url ? '<div style="text-align:center"><a href="' + esc(rv.ta_url) + '" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:9px;background:#34e0a1;color:#04231a;border-radius:999px;padding:14px 26px;font-weight:700;font-size:15px;text-decoration:none">' + esc(rv.cta || "Все отзывы на TripAdvisor →") + '</a></div>' : '')
        + '</div>';
    }

    // ---------- BOOKING ----------
    if (c.booking) {
      head("booking", c.booking);
      setTextSel("#depAmount", c.booking.deposit_amount_label);
      setTextSel("#depDesc", c.booking.deposit_desc);
      var panels = qsa("#booking .booking-grid .panel");
      if (panels[1]) {
        setText(qs("h3", panels[1]), c.booking.contact_title);
        setText(qs(".sub", panels[1]), c.booking.contact_sub);
      }
    }

    // ---------- CONTACTS ----------
    if (c.contacts) {
      var ct = c.contacts;
      setTextSel("#contacts .eyebrow .num", ct.eyebrow_num);
      var ceb = qs("#contacts .eyebrow"); if (ceb) setText(ceb, ct.eyebrow);
      setTextSel("#contacts h2", ct.title);
      var items = qsa("#contacts .info-item");
      // порядок: адрес, телефон, часы, почта, соцсети
      if (items[0]) setHTML(".info-item:nth-child(1) p", esc(ct.address).replace(/,\s*/, ",<br />"), qs("#contacts"));
      var tels = qsa('#contacts .info-item:nth-child(2) a');
      if (tels[0]) setText(tels[0], ct.phone1);
      if (tels[1]) setText(tels[1], ct.phone2);
      if (items[2]) setText(qs("p", items[2]), ct.hours);
      var mail = qs('#contacts a[href^="mailto:"]'); if (mail) setText(mail, ct.email);
      var vk = qs('#contacts .info-item:nth-child(5) a'); if (vk) setText(vk, ct.vk_label);
    }

    // ---------- FOOTER ----------
    if (c.footer) {
      setTextSel(".site .foot-brand p", c.footer.about);
      var yr = qs("#year"); var cp = yr && yr.parentNode;
      // копирайт содержит год + текст + ссылку «Админка» — трогаем аккуратно
    }
  }

  // ---------- ЛАЙТБОКС: клик по фото → большое фото на весь экран ----------
  function initLightbox() {
    var units = qsa("#about .about-photos figure, #events .event, #halls .hall, #menu .dish, #menu-pages figure, #hotel .room, #gallery figure, .owner-photo");
    var imgs = [];
    units.forEach(function (u) { var im = u.querySelector("img"); if (im) imgs.push(im); });
    if (!imgs.length) return;

    var css = document.createElement("style");
    css.textContent =
      "#lb-ov{position:fixed;inset:0;z-index:9999;background:rgba(12,10,8,.94);display:none;align-items:center;justify-content:center}" +
      "#lb-ov.on{display:flex}" +
      "#lb-ov img{max-width:92vw;max-height:86vh;object-fit:contain;border-radius:6px;box-shadow:0 10px 60px rgba(0,0,0,.6);user-select:none}" +
      "#lb-cap{position:absolute;bottom:22px;left:0;right:0;text-align:center;color:#f2ece0;font-size:15px;padding:0 20px}" +
      "#lb-close{position:absolute;top:16px;right:24px;color:#fff;font-size:40px;line-height:1;cursor:pointer;opacity:.85}" +
      "#lb-close:hover{opacity:1}" +
      ".lb-nav{position:absolute;top:50%;transform:translateY(-50%);color:#fff;font-size:44px;cursor:pointer;opacity:.7;padding:16px;user-select:none}" +
      ".lb-nav:hover{opacity:1}#lb-prev{left:10px}#lb-next{right:10px}" +
      "@media(max-width:600px){.lb-nav{font-size:30px;padding:8px}#lb-close{font-size:32px}}";
    document.head.appendChild(css);

    var ov = document.createElement("div");
    ov.id = "lb-ov";
    ov.innerHTML = '<span id="lb-close">&times;</span><span class="lb-nav" id="lb-prev">&#10094;</span><img id="lb-img" alt="" /><span class="lb-nav" id="lb-next">&#10095;</span><div id="lb-cap"></div>';
    document.body.appendChild(ov);

    var lbImg = document.getElementById("lb-img"), lbCap = document.getElementById("lb-cap"), idx = 0;
    function show(i) {
      idx = (i + imgs.length) % imgs.length;
      var im = imgs[idx];
      lbImg.src = im.currentSrc || im.src;
      var cap = im.getAttribute("alt") || "";
      var fig = im.closest("figure");
      if (fig) { var fc = fig.querySelector("figcaption"); if (fc) cap = fc.textContent; }
      lbCap.textContent = cap;
      ov.classList.add("on");
    }
    function close() { ov.classList.remove("on"); }
    units.forEach(function (u) { var im = u.querySelector("img"); if (!im) return; u.style.cursor = "zoom-in"; u.addEventListener("click", function () { show(imgs.indexOf(im)); }); });
    document.getElementById("lb-close").addEventListener("click", close);
    document.getElementById("lb-prev").addEventListener("click", function (e) { e.stopPropagation(); show(idx - 1); });
    document.getElementById("lb-next").addEventListener("click", function (e) { e.stopPropagation(); show(idx + 1); });
    ov.addEventListener("click", function (e) { if (e.target === ov) close(); });
    document.addEventListener("keydown", function (e) {
      if (!ov.classList.contains("on")) return;
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") show(idx - 1);
      else if (e.key === "ArrowRight") show(idx + 1);
    });
  }

  var __booted = false;
  function boot() {
    if (__booted) return; __booted = true;
    loadContent().then(function (c) { apply(c); initLightbox(); });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
