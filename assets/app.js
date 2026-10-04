const $ = (sel) => document.querySelector(sel);
const thumb = (id, q = "hqdefault") => `https://i.ytimg.com/vi/${id}/${q}.jpg`;
const fmtDate = (iso) =>
  new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
const PAGE = document.body.dataset.page;

// ---------- Layout commun (header, footer, modale) ----------
const NAV = [
  ["index.html", "Accueil", "home"],
  ["blog.html", "Articles", "blog"],
  ["videos.html", "Vidéos", "videos"],
  ["communaute.html", "Communauté", "communaute"],
  ["apropos.html", "À propos", "apropos"],
];
const SUB_URL = CHANNEL.url + "?sub_confirmation=1";

document.body.insertAdjacentHTML("afterbegin", `
  <header class="nav">
    <a class="brand" href="index.html">
      <img src="assets/avatar.jpg" alt="">
      <span>Karim <b>Aquariophilie</b> TN</span>
    </a>
    <button class="night-toggle" aria-label="Mode nuit de l'aquarium" aria-pressed="false">
      <svg class="i-moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg>
      <svg class="i-sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.5"/><path d="M12 1.5v3M12 19.5v3M1.5 12h3M19.5 12h3M4.6 4.6l2.1 2.1M17.3 17.3l2.1 2.1M4.6 19.4l2.1-2.1M17.3 6.7l2.1-2.1"/></svg>
    </button>
    <button class="burger" aria-label="Menu">☰</button>
    <nav>
      ${NAV.map(([href, label, key]) => {
        const active = key === PAGE || (PAGE === "article" && key === "blog");
        return `<a href="${href}"${active ? ' class="active"' : ""}>${label}</a>`;
      }).join("")}
      <a class="btn btn-sm" href="${SUB_URL}" target="_blank" rel="noopener">S'abonner</a>
    </nav>
  </header>`);

document.body.insertAdjacentHTML("beforeend", `
  <footer>
    <div class="container footer-grid">
      <div>
        <a class="brand" href="index.html"><img src="assets/avatar.jpg" alt=""><span>Karim <b>Aquariophilie</b> TN</span></a>
        <p>Crevettes, poissons et aquascaping depuis la Tunisie.</p>
      </div>
      <div>
        <h4>Le site</h4>
        ${NAV.map(([href, label]) => `<a href="${href}">${label}</a>`).join("")}
      </div>
      <div>
        <h4>Suivre Karim</h4>
        <a href="${CHANNEL.url}" target="_blank" rel="noopener">Chaîne YouTube</a>
        <a href="${CHANNEL.url}/shorts" target="_blank" rel="noopener">Shorts</a>
      </div>
    </div>
    <p class="copy">© ${new Date().getFullYear()} Karim Aquariophilie TN · Fait avec passion (et beaucoup d'eau)</p>
  </footer>
  <div class="modal" id="modal" hidden>
    <div class="modal-box">
      <button class="modal-close" aria-label="Fermer">×</button>
      <div class="modal-frame" id="modal-frame"></div>
    </div>
  </div>`);

$(".burger").addEventListener("click", () => $(".nav").classList.toggle("open"));

// Lecteur vidéo en modale (chargé seulement au clic)
const modal = $("#modal");
function openVideo(id, short) {
  $("#modal-frame").className = "modal-frame" + (short ? " is-short" : "");
  $("#modal-frame").innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
  modal.hidden = false;
}
function closeVideo() {
  modal.hidden = true;
  $("#modal-frame").innerHTML = "";
}
modal.addEventListener("click", (e) => {
  if (e.target === modal || e.target.classList.contains("modal-close")) closeVideo();
});
document.addEventListener("keydown", (e) => e.key === "Escape" && closeVideo());
document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-video]");
  if (el) openVideo(el.dataset.video, el.dataset.short === "1");
});

// ---------- Composants ----------
const articleCard = (a) => `
  <a class="card" href="article.html?a=${a.slug}">
    <div class="card-img"><img loading="lazy" src="${thumb(a.cover)}" alt=""></div>
    <div class="card-body">
      <span class="tag tag-${a.cat}">${CATEGORIES[a.cat]}</span>
      <h3>${a.title}</h3>
      <p>${a.excerpt}</p>
      <small>${fmtDate(a.date)} · ${a.read} min de lecture</small>
    </div>
  </a>`;

const videoCard = (v) => `
  <button class="vcard" data-video="${v.id}">
    <div class="card-img"><img loading="lazy" src="${thumb(v.id, "mqdefault")}" alt=""><span class="play">▶</span><span class="dur">${v.dur}</span></div>
    <div class="vbody"><h4>${v.title}</h4><small>${v.views} vues · ${v.date}</small></div>
  </button>`;

const shortCard = (v) => `
  <button class="scard" data-video="${v.id}" data-short="${v.short ? 1 : 0}" style="background-image:url(${thumb(v.id)})">
    <span class="play">▶</span>
    <div><h4>${v.title}</h4><small>${v.views} vues</small></div>
  </button>`;

function filterBar(el, cats, onPick, labels = CATEGORIES) {
  const items = [["all", "Tout"], ...cats.map((c) => [c, labels[c]])];
  el.innerHTML = items.map(([k, l], i) => `<button data-cat="${k}" class="${i ? "" : "active"}">${l}</button>`).join("");
  el.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    el.querySelectorAll("button").forEach((x) => x.classList.toggle("active", x === b));
    onPick(b.dataset.cat);
  });
}
const usedCats = (list) => Object.keys(CATEGORIES).filter((c) => list.some((x) => x.cat === c));
const parseViews = (s) => parseFloat(s.replace(",", ".")) * (s.includes("k") ? 1000 : 1);

// ---------- Accueil ----------
if (PAGE === "home") {
  const totalViews = VIDEOS.reduce((n, v) => n + parseViews(v.views), 0);
  $("#stats").innerHTML = `
    <li><b>${CHANNEL.videoCount}</b> vidéos</li>
    <li><b>${CHANNEL.subscribers}</b> abonnés</li>
    <li><b>${Math.floor(totalViews / 1000)} k+</b> vues</li>
    <li><b>${ARTICLES.length}</b> articles</li>`;

  const [first, ...rest] = ARTICLES;
  $("#featured").innerHTML = `
    <a class="feature" href="article.html?a=${first.slug}">
      <img src="${thumb(first.cover, "hqdefault")}" alt="">
      <div>
        <span class="tag tag-${first.cat}">${CATEGORIES[first.cat]}</span>
        <h3>${first.title}</h3>
        <p>${first.excerpt}</p>
        <span class="link">Lire l'article →</span>
      </div>
    </a>`;
  $("#article-grid").innerHTML = rest.slice(0, 3).map(articleCard).join("");

  const popular = [...VIDEOS].sort((a, b) => parseViews(b.views) - parseViews(a.views)).slice(0, 6);
  $("#popular").innerHTML = popular.map(shortCard).join("");

  // compteurs animés
  document.querySelectorAll("#stats b").forEach((b) => {
    const [, num, suffix] = b.textContent.match(/^(\d+)(.*)$/) || [];
    if (!num) return;
    b.textContent = "0" + suffix;
    const t0 = performance.now(), dur = 1600;
    const step = (now) => {
      const k = Math.min(1, (now - t0) / dur), e = 1 - (1 - k) ** 4;
      b.textContent = Math.round(num * e) + suffix;
      if (k < 1) requestAnimationFrame(step);
    };
    setTimeout(() => requestAnimationFrame(step), 400);
  });
}

// ---------- Blog ----------
if (PAGE === "blog") {
  let cat = "all", q = "";
  const norm = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const render = () => {
    const list = ARTICLES.filter((a) =>
      (cat === "all" || a.cat === cat) &&
      norm(a.title + " " + a.excerpt + " " + a.body).includes(norm(q)));
    $("#article-grid").innerHTML = list.map(articleCard).join("") || "<p class='empty'>Aucun article trouvé.</p>";
  };
  filterBar($("#article-filters"), usedCats(ARTICLES), (c) => { cat = c; render(); });
  $("#search").addEventListener("input", (e) => { q = e.target.value; render(); });
  render();
}

// ---------- Vidéos ----------
if (PAGE === "videos") {
  const render = (cat) => {
    const pick = (v) => cat === "all" || v.cat === cat;
    $("#video-grid").innerHTML = VIDEOS.filter((v) => !v.short && pick(v)).map(videoCard).join("") || "<p class='empty'>Aucune vidéo dans cette catégorie.</p>";
    $("#shorts-grid").innerHTML = VIDEOS.filter((v) => v.short && pick(v)).map(shortCard).join("") || "<p class='empty'>Aucun short dans cette catégorie.</p>";
  };
  filterBar($("#video-filters"), usedCats(VIDEOS), render);
  render("all");
}

// ---------- Article ----------
if (PAGE === "article") {
  const slug = new URLSearchParams(location.search).get("a");
  const a = ARTICLES.find((x) => x.slug === slug) || ARTICLES[0];
  document.title = `${a.title} – Karim Aquariophilie TN`;
  const vids = a.videos.map((id) => VIDEOS.find((v) => v.id === id)).filter(Boolean);
  $("#article").dataset.slug = a.slug;
  $("#article").innerHTML = `
    <header class="article-hero" style="background-image:linear-gradient(180deg,rgba(4,30,48,.55),rgba(4,30,48,.95)),url(${thumb(a.cover, "hqdefault")})">
      <div class="container narrow">
        <a class="back" href="blog.html">← Tous les articles</a>
        <span class="tag tag-${a.cat}">${CATEGORIES[a.cat]}</span>
        <h1>${a.title}</h1>
        <p class="meta">${fmtDate(a.date)} · ${a.read} min de lecture · par Karim</p>
      </div>
    </header>
    <div class="container narrow prose">
      ${a.body}
      <h2>En vidéo</h2>
      <div class="article-videos">
        ${vids.map((v) => (v.short ? shortCard(v) : videoCard(v))).join("")}
      </div>
    </div>`;
  $("#related").innerHTML = ARTICLES.filter((x) => x !== a)
    .sort((x, y) => (y.cat === a.cat) - (x.cat === a.cat))
    .slice(0, 3).map(articleCard).join("");
}

// ---------- Animations d'interface ----------
const REDUCED_MOTION = matchMedia("(prefers-reduced-motion: reduce)").matches;

// Apparition au défilement (y compris pour le contenu chargé plus tard : forum, commentaires)
const REVEAL_SEL = ".card, .feature, .vcard, .scard, .topic, .post, .panel, .cta-box, .section-head, .about, .values > *, .prose > *";
if (!REDUCED_MOTION && "IntersectionObserver" in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      en.target.classList.add("in");
      io.unobserve(en.target);
      en.target.addEventListener("transitionend", () => en.target.classList.remove("reveal", "in"), { once: true });
    });
  }, { rootMargin: "0px 0px -8% 0px" });
  const prepare = (root) => {
    const els = root.matches?.(REVEAL_SEL) ? [root] : [...root.querySelectorAll?.(REVEAL_SEL) || []];
    els.forEach((el) => {
      if (el.dataset.revealed) return;
      el.dataset.revealed = "1";
      const siblings = [...el.parentElement.children].filter((c) => c.matches(REVEAL_SEL));
      el.style.transitionDelay = (Math.max(0, siblings.indexOf(el)) % 6) * 70 + "ms";
      el.classList.add("reveal");
      io.observe(el);
    });
  };
  prepare(document.body);
  new MutationObserver((muts) => muts.forEach((m) => m.addedNodes.forEach((n) => n.nodeType === 1 && prepare(n))))
    .observe(document.body, { childList: true, subtree: true });
}

// Cartes en 3D qui suivent la souris, avec reflet
if (!REDUCED_MOTION && matchMedia("(hover: hover)").matches) {
  document.addEventListener("pointermove", (e) => {
    const card = e.target.closest(".card, .feature, .vcard");
    document.querySelectorAll(".tilting").forEach((c) => c !== card && untilt(c));
    if (!card || card.classList.contains("reveal")) return;
    const r = card.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    const k = card.classList.contains("feature") ? 3 : 7;
    card.classList.add("tilting");
    card.style.transform = `perspective(900px) rotateX(${(0.5 - y) * k}deg) rotateY(${(x - 0.5) * k}deg) translateY(-4px)`;
    card.style.setProperty("--gx", x * 100 + "%");
    card.style.setProperty("--gy", y * 100 + "%");
  });
  function untilt(c) {
    c.classList.remove("tilting");
    c.style.transform = "";
  }
}

// Petites bulles qui s'échappent des boutons au clic
document.addEventListener("pointerdown", (e) => {
  const btn = e.target.closest(".btn");
  if (!btn || REDUCED_MOTION) return;
  const r = btn.getBoundingClientRect();
  for (let i = 0; i < 9; i++) {
    const b = document.createElement("span");
    b.className = "pop-bubble";
    const s = 4 + Math.random() * 9;
    Object.assign(b.style, {
      left: e.clientX - r.left - s / 2 + "px", top: e.clientY - r.top - s / 2 + "px", width: s + "px", height: s + "px",
      "--dx": (Math.random() - 0.5) * 90 + "px", "--dy": -30 - Math.random() * 70 + "px",
      animationDelay: Math.random() * 80 + "ms",
    });
    btn.appendChild(b);
    b.addEventListener("animationend", () => b.remove());
  }
});
