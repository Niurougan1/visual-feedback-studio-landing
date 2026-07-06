(function () {
  "use strict";
  var root = document.documentElement;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia && window.matchMedia("(pointer: fine)").matches;
  var yearEl = $("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- theme + language ---------- */
  var themeBtn = $("#themeBtn"), langBtn = $("#langBtn");
  function setTheme(t) {
    root.dataset.theme = t === "light" ? "light" : "dark";
    if (themeBtn) themeBtn.textContent = t === "light" ? "◑" : "◐";
    try { localStorage.setItem("vfs2-theme", root.dataset.theme); } catch (_) {}
    if (window.__fluidTheme) window.__fluidTheme();
  }
  function setLang(l) {
    var zh = l === "zh";
    root.lang = zh ? "zh-CN" : "en";
    if (langBtn) langBtn.textContent = zh ? "中" : "EN";
    var titleEn = document.body && document.body.getAttribute("data-title-en");
    var titleZh = document.body && document.body.getAttribute("data-title-zh");
    document.title = zh ? (titleZh || "Visual Feedback Studio — 在界面真正运行的地方审它") : (titleEn || "Visual Feedback Studio — Review interfaces where they run");
    try { localStorage.setItem("vfs2-lang", l); } catch (_) {}
    var f = $("#liveFrame");
    if (f) {
      var want = zh ? "demo-site/index.zh.html" : "demo-site/index.html";
      if (f.getAttribute("src") !== want) f.setAttribute("src", want);
    }
    if (window.__loopLabel) window.__loopLabel();
  }
  var st = null, sl = null;
  try { st = localStorage.getItem("vfs2-theme"); sl = localStorage.getItem("vfs2-lang"); } catch (_) {}
  setTheme(st || "dark");
  setLang(sl || "en");
  if (themeBtn) themeBtn.addEventListener("click", function () { setTheme(root.dataset.theme === "dark" ? "light" : "dark"); });
  if (langBtn) langBtn.addEventListener("click", function () { setLang(root.lang.indexOf("zh") === 0 ? "en" : "zh"); });

  /* ---------- fluid shader ---------- */
  (function fluid() {
    var canvas = $("#fluid");
    var gl = canvas.getContext("webgl", { alpha: true, antialias: false });
    if (!gl) return;
    var vsrc = "attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}";
    var fsrc = [
      "precision mediump float;",
      "uniform vec2 r;uniform float t;uniform vec2 m;",
      "uniform vec3 c0;uniform vec3 c1;uniform vec3 c2;",
      "float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}",
      "float n(vec2 p){vec2 i=floor(p);vec2 f=fract(p);f=f*f*(3.-2.*f);",
      "return mix(mix(h(i),h(i+vec2(1.,0.)),f.x),mix(h(i+vec2(0.,1.)),h(i+vec2(1.,1.)),f.x),f.y);}",
      "float fbm(vec2 p){float v=0.;float a=.5;for(int i=0;i<5;i++){v+=a*n(p);p*=2.03;a*=.5;}return v;}",
      "void main(){",
      "vec2 uv=gl_FragCoord.xy/r;vec2 asp=vec2(r.x/r.y,1.);vec2 p=uv*asp;",
      "vec2 mm=(m-.5)*.35;",
      "float q1=fbm(p*1.35+vec2(t*.05,-t*.03)+mm);",
      "float q2=fbm(p*1.15-vec2(t*.04,t*.06)-mm*.6);",
      "vec2 w=vec2(q1,q2);",
      "float f=fbm(p*1.6+w*1.9+vec2(t*.025,-t*.02));",
      "vec3 col=mix(c0,c1,smoothstep(.18,.78,f));",
      "col=mix(col,c2,smoothstep(.62,.98,fbm(p*2.2+w*2.6-t*.02))*.55);",
      "float vig=smoothstep(1.35,.35,length(uv-.5));",
      "gl_FragColor=vec4(col,vig*.9);",
      "}"
    ].join("");
    function sh(type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; }
    var prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, vsrc));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fsrc));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 3,-1, -1,3]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    var u = {
      r: gl.getUniformLocation(prog, "r"), t: gl.getUniformLocation(prog, "t"),
      m: gl.getUniformLocation(prog, "m"),
      c0: gl.getUniformLocation(prog, "c0"), c1: gl.getUniformLocation(prog, "c1"), c2: gl.getUniformLocation(prog, "c2")
    };
    var colors = { c0: [0,0,0], c1: [0,0,0], c2: [0,0,0] };
    window.__fluidTheme = function () {
      var dark = root.dataset.theme !== "light";
      colors.c0 = dark ? [0.043, 0.047, 0.031] : [0.957, 0.957, 0.925];
      colors.c1 = dark ? [0.086, 0.106, 0.043] : [0.898, 0.914, 0.831];
      colors.c2 = dark ? [0.235, 0.310, 0.078] : [0.686, 0.761, 0.420];
    };
    window.__fluidTheme();
    var mx = .5, my = .5, tx = .5, ty = .5;
    window.addEventListener("pointermove", function (e) {
      tx = e.clientX / window.innerWidth; ty = 1 - e.clientY / window.innerHeight;
    }, { passive: true });
    function resize() {
      var d = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.floor(window.innerWidth * d * .75);
      canvas.height = Math.floor(window.innerHeight * d * .75);
      gl.viewport(0, 0, canvas.width, canvas.height);
    }
    resize();
    window.addEventListener("resize", resize, { passive: true });
    var start = performance.now();
    function draw(now) {
      mx += (tx - mx) * .04; my += (ty - my) * .04;
      gl.uniform2f(u.r, canvas.width, canvas.height);
      gl.uniform1f(u.t, (now - start) / 1000 * (reduce ? 0.05 : 0.32));
      gl.uniform2f(u.m, mx, my);
      gl.uniform3fv(u.c0, colors.c0); gl.uniform3fv(u.c1, colors.c1); gl.uniform3fv(u.c2, colors.c2);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (!reduce) requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);
    if (reduce) requestAnimationFrame(draw);
  })();

  /* ---------- character heat trail ---------- */
  (function trail() {
    if (reduce || !fine) return;
    var canvas = $("#trail");
    var ctx = canvas.getContext("2d");
    if (!ctx) return;
    var CELL = 13, dpr = 1, cols = 0, rows = 0, heat = new Float32Array(0), glyphs = [];
    var CHARS = ["0","0","o","=","+","·","-"];
    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = innerWidth * dpr; canvas.height = innerHeight * dpr;
      canvas.style.width = innerWidth + "px"; canvas.style.height = innerHeight + "px";
      cols = Math.ceil(innerWidth / CELL); rows = Math.ceil(innerHeight / CELL);
      heat = new Float32Array(cols * rows); glyphs = new Array(cols * rows);
    }
    resize();
    addEventListener("resize", resize, { passive: true });
    var lx = null, ly = null, running = false;
    function frame() {
      running = false;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      ctx.font = '10px ui-monospace, Menlo, monospace';
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      var rgb = root.dataset.theme === "light" ? "40,44,28" : "233,236,223";
      var alive = false;
      for (var y = 0; y < rows; y++) for (var x = 0; x < cols; x++) {
        var i = y * cols + x, h = heat[i];
        if (h <= .025) { heat[i] = 0; continue; }
        alive = true;
        ctx.fillStyle = "rgba(" + rgb + "," + (h * .55).toFixed(3) + ")";
        ctx.fillText(glyphs[i] || "0", x * CELL + CELL / 2, y * CELL + CELL / 2);
        heat[i] = h * .94;
      }
      if (alive) queue();
    }
    function queue() { if (!running) { running = true; requestAnimationFrame(frame); } }
    addEventListener("pointermove", function (e) {
      var dx = lx == null ? 1 : e.clientX - lx, dy = ly == null ? 0 : e.clientY - ly;
      lx = e.clientX; ly = e.clientY;
      var cx = Math.floor(e.clientX / CELL), cy = Math.floor(e.clientY / CELL);
      for (var oy = -3; oy <= 3; oy++) for (var ox = -3; ox <= 3; ox++) {
        var gx = cx + ox, gy = cy + oy;
        if (gx < 0 || gy < 0 || gx >= cols || gy >= rows) continue;
        var add = Math.max(0, 1 - (ox*ox + oy*oy) / 10) * (.5 + Math.random() * .5);
        var i = gy * cols + gx;
        if (add > heat[i]) {
          heat[i] = Math.min(1, add);
          glyphs[i] = Math.random() < .45
            ? (Math.abs(dx) >= Math.abs(dy) ? (dx < 0 ? "<" : ">") : (dy < 0 ? "^" : "v"))
            : CHARS[(Math.random() * CHARS.length) | 0];
        }
      }
      queue();
    }, { passive: true });
  })();

  /* ---------- custom cursor ---------- */
  (function cursor() {
    if (!fine || reduce) { $$(".cur-dot,.cur-ring").forEach(function (n) { n.remove(); }); return; }
    var dot = $(".cur-dot"), ring = $(".cur-ring");
    var x = -100, y = -100, rx = -100, ry = -100;
    addEventListener("pointermove", function (e) { x = e.clientX; y = e.clientY; }, { passive: true });
    (function loop() {
      rx += (x - rx) * .16; ry += (y - ry) * .16;
      dot.style.transform = "translate(" + x + "px," + y + "px) translate(-50%,-50%)";
      ring.style.transform = "translate(" + rx + "px," + ry + "px) translate(-50%,-50%)";
      requestAnimationFrame(loop);
    })();
    document.addEventListener("mouseover", function (e) {
      document.body.classList.toggle("cur-on-link", !!e.target.closest("a,button,summary"));
    });
  })();

  /* ---------- magnetic elements ---------- */
  if (fine && !reduce) {
    $$("[data-mag]").forEach(function (el) {
      var b = null;
      el.addEventListener("pointerenter", function () { b = el.getBoundingClientRect(); });
      el.addEventListener("pointermove", function (e) {
        if (!b) b = el.getBoundingClientRect();
        var dx = (e.clientX - b.left - b.width / 2) / b.width;
        var dy = (e.clientY - b.top - b.height / 2) / b.height;
        el.style.transform = "translate(" + dx * 7 + "px," + dy * 6 + "px)";
      });
      el.addEventListener("pointerleave", function () {
        b = null;
        el.style.transform = "";
      });
    });
  }

  /* ---------- panel spotlight ---------- */
  $$("[data-spot]").forEach(function (panel) {
    panel.addEventListener("pointermove", function (e) {
      var b = panel.getBoundingClientRect();
      panel.style.setProperty("--mx", ((e.clientX - b.left) / b.width * 100) + "%");
      panel.style.setProperty("--my", ((e.clientY - b.top) / b.height * 100) + "%");
    });
  });

  /* ---------- reveals: progressive in AND out ---------- */
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (reduce) { e.target.classList.add("in"); return; }
      e.target.classList.toggle("in", e.isIntersecting);
    });
  }, { threshold: .08, rootMargin: "-4% 0px -4% 0px" });
  $$(".rv, .codebox").forEach(function (el) { io.observe(el); });

  /* ---------- silky inertial scrolling ---------- */
  (function silk() {
    var doc = document.documentElement;
    var target = pageYOffset, current = target, raf = null;
    function max() { return doc.scrollHeight - innerHeight; }
    function clampY(v) { return Math.max(0, Math.min(max(), v)); }
    function step() {
      current += (target - current) * .095;
      if (Math.abs(target - current) < .4) { current = target; raf = null; }
      else raf = requestAnimationFrame(step);
      doc.scrollTop = current;
      document.body.scrollTop = current;
    }
    function go(y) {
      target = clampY(y);
      current = pageYOffset;
      if (!raf) raf = requestAnimationFrame(step);
    }
    window.__silkTo = function (y) {
      if (reduce) { scrollTo(0, clampY(y)); return; }
      go(y);
    };
    if (!reduce && fine) {
      addEventListener("wheel", function (e) {
        if (e.ctrlKey || e.metaKey) return;
        var d = e.deltaY;
        if (e.deltaMode === 1) d *= 16; else if (e.deltaMode === 2) d *= innerHeight;
        e.preventDefault();
        target = clampY((raf ? target : pageYOffset) + d);
        if (!raf) { current = pageYOffset; raf = requestAnimationFrame(step); }
      }, { passive: false });
    }
    addEventListener("scroll", function () {
      if (!raf) { target = current = pageYOffset; }
    }, { passive: true });
    /* anchor links ride the same inertia */
    document.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest('a[href^="#"]');
      if (!a) return;
      var el = document.querySelector(a.getAttribute("href"));
      if (!el) return;
      e.preventDefault();
      window.__silkTo(el.getBoundingClientRect().top + pageYOffset - 57);
    });
  })();

  /* ---------- scroll progress + hero parallax ---------- */
  (function meter() {
    var bar = $("#spBar");
    var core = $(".hero-core");
    var tick = false;
    addEventListener("scroll", function () {
      if (tick) return;
      tick = true;
      requestAnimationFrame(function () {
        tick = false;
        var m = document.documentElement.scrollHeight - innerHeight;
        if (bar && m > 0) bar.style.transform = "scaleX(" + (pageYOffset / m) + ")";
        if (core && !reduce) {
          var y = Math.min(pageYOffset, innerHeight);
          core.style.transform = "translateY(" + y * .18 + "px)";
          core.style.opacity = String(Math.max(0, 1 - y / innerHeight * 1.15));
        }
      });
    }, { passive: true });
  })();

  /* ---------- stat count-up ---------- */
  (function counts() {
    var els = $$("[data-count]");
    if (!els.length) return;
    var cio = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        cio.unobserve(e.target);
        var el = e.target.matches("i") ? e.target : e.target.querySelector("i") || e.target;
        var to = Number(e.target.getAttribute("data-count") || 0);
        if (reduce || to === 0) { el.textContent = String(to); return; }
        var t0 = performance.now(), dur = 900;
        (function tickup(now) {
          var p = Math.min(1, (now - t0) / dur);
          el.textContent = String(Math.round(to * (1 - Math.pow(1 - p, 3))));
          if (p < 1) requestAnimationFrame(tickup);
        })(t0);
      });
    }, { threshold: .6 });
    els.forEach(function (el) { cio.observe(el); });
  })();

  /* ---------- manifesto word reveal ---------- */
  (function mani() {
    var q = $("#maniQ");
    if (!q) return;
    function wrapNode(node, zh) {
      Array.prototype.slice.call(node.childNodes).forEach(function (ch) {
        if (ch.nodeType === 3) {
          var frag = document.createDocumentFragment();
          var tokens = zh ? ch.textContent.split("") : ch.textContent.split(/(\s+)/);
          tokens.forEach(function (t) {
            if (!t) return;
            if (/^\s+$/.test(t)) { frag.appendChild(document.createTextNode(t)); return; }
            var s = document.createElement("span");
            s.className = "w";
            s.textContent = t;
            frag.appendChild(s);
          });
          node.replaceChild(frag, ch);
        } else if (ch.nodeType === 1) {
          wrapNode(ch, zh);
        }
      });
    }
    $$("span[data-en], span[data-zh]", q).forEach(function (node) {
      wrapNode(node, node.hasAttribute("data-zh"));
    });
    $$(".w", q).forEach(function (w, i) { w.style.setProperty("--wd", (i * .035) + "s"); });
    var mio = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (reduce) { $("#mani").classList.add("in"); return; }
        $("#mani").classList.toggle("in", e.isIntersecting);
      });
    }, { threshold: .35 });
    mio.observe(q);
  })();

  /* ---------- faq: exclusive accordion ---------- */
  (function faq() {
    var items = $$(".faq details");
    items.forEach(function (d) {
      d.addEventListener("toggle", function () {
        if (!d.open) return;
        items.forEach(function (o) { if (o !== d && o.open) o.open = false; });
      });
    });
  })();


  /* ---------- command copy ---------- */
  (function copies() {
    $$('[data-copy-value]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var value = btn.getAttribute('data-copy-value') || '';
        function done(ok) {
          var prev = btn.textContent;
          btn.textContent = ok ? (root.lang.indexOf('zh') === 0 ? '已复制' : 'Copied') : (root.lang.indexOf('zh') === 0 ? '复制失败' : 'Copy failed');
          setTimeout(function () { btn.textContent = prev; }, 1500);
        }
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(value).then(function () { done(true); }, function () { done(false); });
        } else {
          try {
            var ta = document.createElement('textarea');
            ta.value = value;
            ta.setAttribute('readonly', '');
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            ta.remove();
            done(true);
          } catch (_) { done(false); }
        }
      });
    });
  })();

  /* ---------- persistent nav ---------- */
  var nav = $("#nav");
  if (nav) nav.classList.remove("hide");

  /* ---------- hero ticker ---------- */
  (function ticker() {
    var el = $("#ticker");
    if (!el || reduce) return;
    var items = [
      ["round 04 · 3 items · 1 accepted", "第 04 轮 · 3 条反馈 · 1 项已接受"],
      ["button.cta · handoff ready", "button.cta · 可交接"],
      ["verified against original feedback", "已对照原始反馈验证"],
      ["local receiver · nothing leaves your machine", "本地 receiver · 数据不出你的电脑"]
    ];
    var i = 0;
    setInterval(function () {
      i = (i + 1) % items.length;
      el.style.opacity = 0;
      setTimeout(function () {
        el.textContent = root.lang.indexOf("zh") === 0 ? items[i][1] : items[i][0];
        el.style.opacity = "";
      }, 300);
    }, 3200);
    el.style.transition = "opacity .3s ease";
  })();

  /* ---------- loop scrub ---------- */
  (function loopScrub() {
    var zone = $("#loopZone"), grid = $("#loopGrid"), frame = $("#frame");
    if (!zone || !frame) return;
    var steps = $$(".loop-step", grid);
    var total = steps.length, idx = -1;
    var stickyOk = window.matchMedia ? window.matchMedia("(min-width: 1001px) and (min-height: 640px)") : { matches: true };
    var stepBar = $("#frameStep");
    var labelTimer = null;
    function updateLabel(instant) {
      if (!stepBar || idx < 0) return;
      var zh = root.lang.indexOf("zh") === 0;
      var t = steps[idx] && steps[idx].querySelector(".t [data-" + (zh ? "zh" : "en") + "]");
      if (!t) t = steps[idx] && steps[idx].querySelector(".t");
      var text = "0" + (idx + 1) + " · " + (t ? t.textContent.trim() : "");
      if (instant || reduce) { stepBar.textContent = text; return; }
      stepBar.classList.add("swap");
      if (labelTimer) clearTimeout(labelTimer);
      labelTimer = setTimeout(function () {
        stepBar.textContent = text;
        stepBar.classList.remove("swap");
      }, 180);
    }
    window.__loopLabel = function () { updateLabel(true); };
    function setK(k) {
      k = Math.max(0, Math.min(total - 1, k));
      if (k === idx) return;
      var first = idx < 0;
      idx = k;
      frame.setAttribute("data-k", String(k));
      steps.forEach(function (s, i) { s.classList.toggle("on", i === k); });
      grid.classList.toggle("done", k === total - 1);
      updateLabel(first);
      if (!first && !reduce) {
        frame.classList.remove("kick");
        void frame.offsetWidth;
        frame.classList.add("kick");
      }
    }
    var tick = false;
    function onScroll() {
      if (tick) return;
      tick = true;
      requestAnimationFrame(function () {
        tick = false;
        if (!stickyOk.matches) return;
        var range = zone.offsetHeight - innerHeight;
        if (range <= 0) return;
        var p = Math.max(0, Math.min(1, -zone.getBoundingClientRect().top / range));
        grid.style.setProperty("--p", String(p));
        setK(Math.min(total - 1, Math.floor(p * total)));
      });
    }
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onScroll, { passive: true });
    steps.forEach(function (s, i) {
      s.addEventListener("click", function () {
        if (stickyOk.matches) {
          var range = zone.offsetHeight - innerHeight;
          var top = zone.getBoundingClientRect().top + pageYOffset;
          var dest = top + ((i + .5) / total) * range;
          if (window.__silkTo) window.__silkTo(dest);
          else scrollTo({ top: dest, behavior: reduce ? "auto" : "smooth" });
          return;
        }
        setK(i);
        grid.style.setProperty("--p", String((i + 1) / total));
      });
    });
    setK(0);
    onScroll();
  })();
})();
