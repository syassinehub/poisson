// Couche de données du forum et des commentaires.
// Supabase si SUPABASE_CONFIG est rempli, sinon localStorage (mode démo).

const DB_LIMITS = { author: 40, title: 120, body: 4000 };

const db = (() => {
  const useSupabase = Boolean(SUPABASE_CONFIG.url && SUPABASE_CONFIG.anonKey);

  function clean({ author, title, body }) {
    const out = {
      author: (author || "").trim().slice(0, DB_LIMITS.author),
      body: (body || "").trim().slice(0, DB_LIMITS.body),
    };
    if (title !== undefined) out.title = title.trim().slice(0, DB_LIMITS.title);
    if (!out.author || !out.body || out.title === "") throw new Error("Merci de remplir tous les champs.");
    return out;
  }

  // ---------- Supabase ----------
  if (useSupabase) {
    const client = import("https://esm.sh/@supabase/supabase-js@2").then(({ createClient }) =>
      createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey));
    const run = async (fn) => {
      const { data, error } = await fn(await client);
      if (error) throw new Error(error.message);
      return data;
    };
    return {
      mode: "supabase",
      listTopics: () => run((c) => c.from("topics").select("*, replies(count)").order("created_at", { ascending: false })
        .then((r) => ({ ...r, data: r.data?.map((t) => ({ ...t, reply_count: t.replies[0]?.count || 0 })) }))),
      getTopic: (id) => run((c) => c.from("topics").select("*").eq("id", id).single()),
      addTopic: (t) => run((c) => c.from("topics").insert({ ...clean(t), category: t.category }).select().single()),
      listReplies: (topicId) => run((c) => c.from("replies").select("*").eq("topic_id", topicId).order("created_at")),
      addReply: (r) => run((c) => c.from("replies").insert({ ...clean(r), topic_id: r.topic_id })),
      listComments: (slug) => run((c) => c.from("comments").select("*").eq("article_slug", slug).order("created_at")),
      addComment: (r) => run((c) => c.from("comments").insert({ ...clean(r), article_slug: r.article_slug })),
    };
  }

  // ---------- localStorage (démo) ----------
  const KEY = "kat-demo-db";
  const load = () => {
    const saved = JSON.parse(localStorage.getItem(KEY) || "null");
    if (saved) return saved;
    return {
      topics: [{
        id: "welcome", category: "presentations", author: "Équipe du blog",
        title: "Bienvenue dans la communauté !",
        body: "Présentez-vous ici : votre ville, vos bacs, vos espèces préférées. Photos et questions bienvenues.",
        created_at: new Date().toISOString(),
      }],
      replies: [], comments: [],
    };
  };
  const save = (d) => localStorage.setItem(KEY, JSON.stringify(d));
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const insert = (table, row) => {
    const d = load();
    const full = { id: uid(), created_at: new Date().toISOString(), ...row };
    d[table].push(full);
    save(d);
    return full;
  };
  const byDate = (a, b) => a.created_at.localeCompare(b.created_at);

  return {
    mode: "demo",
    listTopics: async () => {
      const d = load();
      return d.topics.map((t) => ({ ...t, reply_count: d.replies.filter((r) => r.topic_id === t.id).length }))
        .sort(byDate).reverse();
    },
    getTopic: async (id) => load().topics.find((t) => t.id === id) || null,
    addTopic: async (t) => insert("topics", { ...clean(t), category: t.category }),
    listReplies: async (topicId) => load().replies.filter((r) => r.topic_id === topicId).sort(byDate),
    addReply: async (r) => insert("replies", { ...clean(r), topic_id: r.topic_id }),
    listComments: async (slug) => load().comments.filter((c) => c.article_slug === slug).sort(byDate),
    addComment: async (r) => insert("comments", { ...clean(r), article_slug: r.article_slug }),
  };
})();
