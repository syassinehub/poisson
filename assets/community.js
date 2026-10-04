// Forum (communaute.html) et commentaires (article.html).
// Tout contenu saisi par un visiteur passe par esc() avant d'être inséré dans la page.

const FORUM_CATS = {
  presentations: "Présentations",
  crevettes: "Crevettes",
  poissons: "Poissons",
  plantes: "Plantes & aquascaping",
  problemes: "Maladies & problèmes",
  echanges: "Échanges & annonces",
};

const esc = (s) => String(s).replace(/[&<>"']/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const fmtText = (s) => esc(s).replace(/\n/g, "<br>");
const timeAgo = (iso) => {
  const s = (Date.now() - new Date(iso)) / 1000;
  if (s < 60) return "à l'instant";
  if (s < 3600) return `il y a ${Math.floor(s / 60)} min`;
  if (s < 86400) return `il y a ${Math.floor(s / 3600)} h`;
  if (s < 86400 * 30) return `il y a ${Math.floor(s / 86400)} j`;
  return fmtDate(iso);
};
const avatar = (name) => {
  const hue = [...name].reduce((h, c) => h + c.charCodeAt(0), 0) % 360;
  return `<span class="avatar" style="background:hsl(${hue} 55% 42%)">${esc(name.trim()[0] || "?").toUpperCase()}</span>`;
};
const savedName = () => localStorage.getItem("kat-pseudo") || "";

function demoBanner(el) {
  if (db.mode === "demo") el.insertAdjacentHTML("afterbegin",
    `<p class="notice">Mode démo : les messages sont enregistrés seulement dans ce navigateur. Connectez Supabase pour les partager avec tout le monde.</p>`);
}

// Gère un formulaire : désactive le bouton, affiche l'erreur, mémorise le pseudo.
function bindForm(form, onSubmit) {
  if (form.author) form.author.value = savedName();
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = form.querySelector("button[type=submit]");
    const err = form.querySelector(".form-error");
    btn.disabled = true;
    err.textContent = "";
    try {
      const data = Object.fromEntries(new FormData(form));
      localStorage.setItem("kat-pseudo", data.author.trim());
      await onSubmit(data);
      form.reset();
      form.author.value = savedName();
    } catch (ex) {
      err.textContent = ex.message || "Une erreur est survenue.";
    } finally {
      btn.disabled = false;
    }
  });
}

const postHTML = (p, cls = "post") => `
  <div class="${cls}">
    ${avatar(p.author)}
    <div>
      <p class="post-meta"><b>${esc(p.author)}</b> · ${timeAgo(p.created_at)}</p>
      <p>${fmtText(p.body)}</p>
    </div>
  </div>`;

// ---------- Commentaires d'article ----------
if (PAGE === "article") {
  const slug = $("#article").dataset.slug;
  const box = $("#comments");
  demoBanner(box);
  const list = $("#comment-list");
  const render = async () => {
    try {
      const items = await db.listComments(slug);
      $("#comment-count").textContent = items.length;
      list.innerHTML = items.map((c) => postHTML(c)).join("") ||
        "<p class='empty'>Aucun commentaire pour l'instant. Soyez le premier !</p>";
    } catch (ex) {
      list.innerHTML = `<p class="form-error">Impossible de charger les commentaires : ${esc(ex.message)}</p>`;
    }
  };
  bindForm($("#comment-form"), async (d) => {
    await db.addComment({ ...d, article_slug: slug });
    await render();
  });
  render();
}

// ---------- Forum ----------
if (PAGE === "communaute") {
  const topicId = new URLSearchParams(location.search).get("t");
  const root = $("#forum");
  demoBanner(root);

  const catOptions = Object.entries(FORUM_CATS).map(([k, l]) => `<option value="${k}">${l}</option>`).join("");

  if (!topicId) {
    // Liste des sujets
    $("#forum-body").innerHTML = `
      <div class="forum-layout">
        <div>
          <div class="filters" id="forum-filters"></div>
          <div id="topic-list" class="topic-list"><p class="empty">Chargement…</p></div>
        </div>
        <aside class="panel">
          <h3>Nouveau sujet</h3>
          <form id="topic-form" class="form">
            <label>Pseudo<input name="author" required maxlength="${DB_LIMITS.author}"></label>
            <label>Catégorie<select name="category">${catOptions}</select></label>
            <label>Titre<input name="title" required maxlength="${DB_LIMITS.title}"></label>
            <label>Message<textarea name="body" rows="6" required maxlength="${DB_LIMITS.body}"></textarea></label>
            <p class="form-error"></p>
            <button class="btn" type="submit">Publier</button>
          </form>
          <p class="hint">Restez courtois, pas de vente d'espèces protégées. Les messages hors charte seront supprimés.</p>
        </aside>
      </div>`;

    let topics = [], cat = "all";
    const render = () => {
      const list = topics.filter((t) => cat === "all" || t.category === cat);
      $("#topic-list").innerHTML = list.map((t) => `
        <a class="topic" href="communaute.html?t=${encodeURIComponent(t.id)}">
          ${avatar(t.author)}
          <div class="topic-main">
            <span class="tag tag-forum">${esc(FORUM_CATS[t.category] || t.category)}</span>
            <h3>${esc(t.title)}</h3>
            <p class="post-meta">par <b>${esc(t.author)}</b> · ${timeAgo(t.created_at)}</p>
          </div>
          <div class="topic-count"><b>${t.reply_count}</b><small>réponse${t.reply_count > 1 ? "s" : ""}</small></div>
        </a>`).join("") || "<p class='empty'>Aucun sujet dans cette catégorie. Lancez la discussion !</p>";
    };
    const load = async () => {
      try {
        topics = await db.listTopics();
        render();
      } catch (ex) {
        $("#topic-list").innerHTML = `<p class="form-error">Impossible de charger le forum : ${esc(ex.message)}</p>`;
      }
    };
    filterBar($("#forum-filters"), Object.keys(FORUM_CATS), (c) => { cat = c; render(); }, FORUM_CATS);
    bindForm($("#topic-form"), async (d) => {
      const t = await db.addTopic(d);
      location.href = `communaute.html?t=${encodeURIComponent(t.id)}`;
    });
    load();
  } else {
    // Un sujet et ses réponses
    (async () => {
      const body = $("#forum-body");
      try {
        const t = await db.getTopic(topicId);
        if (!t) throw new Error("Ce sujet n'existe pas ou a été supprimé.");
        document.title = `${t.title} – Communauté – Karim Aquariophilie TN`;
        body.innerHTML = `
          <a class="back dark" href="communaute.html">← Tous les sujets</a>
          <article class="thread">
            <span class="tag tag-forum">${esc(FORUM_CATS[t.category] || t.category)}</span>
            <h2>${esc(t.title)}</h2>
            ${postHTML(t, "post post-first")}
            <h3 class="replies-title">Réponses</h3>
            <div id="reply-list"></div>
            <form id="reply-form" class="form panel">
              <h3>Répondre</h3>
              <label>Pseudo<input name="author" required maxlength="${DB_LIMITS.author}"></label>
              <label>Message<textarea name="body" rows="5" required maxlength="${DB_LIMITS.body}"></textarea></label>
              <p class="form-error"></p>
              <button class="btn" type="submit">Envoyer</button>
            </form>
          </article>`;
        const renderReplies = async () => {
          const replies = await db.listReplies(t.id);
          $("#reply-list").innerHTML = replies.map((r) => postHTML(r)).join("") ||
            "<p class='empty'>Pas encore de réponse.</p>";
        };
        bindForm($("#reply-form"), async (d) => {
          await db.addReply({ ...d, topic_id: t.id });
          await renderReplies();
        });
        renderReplies();
      } catch (ex) {
        body.innerHTML = `<a class="back dark" href="communaute.html">← Tous les sujets</a><p class="form-error">${esc(ex.message)}</p>`;
      }
    })();
  }
}
