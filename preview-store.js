/* 推荐语收集：优先同源 API，否则 localStorage（静态站） */
(function (global) {
  const STORAGE_KEY = "recommend-preview-submissions-v1";
  const ADMIN_PASS = "123";

  function uid() {
    return "s_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
  }

  function readLocal() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    } catch {
      return [];
    }
  }

  function writeLocal(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }

  async function apiAvailable() {
    try {
      const res = await fetch("/api/recommend-submissions", { method: "GET", cache: "no-store" });
      return res.ok;
    } catch {
      return false;
    }
  }

  async function listSubmissions() {
    if (await apiAvailable()) {
      const res = await fetch("/api/recommend-submissions", { cache: "no-store" });
      const data = await res.json();
      return Array.isArray(data.items) ? data.items : [];
    }
    return readLocal();
  }

  function buildItem(payload, prev) {
    return {
      id: (prev && prev.id) || uid(),
      createdAt: (prev && prev.createdAt) || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      bookName: String(payload.bookName || "").trim(),
      bookId: String(payload.bookId || "").trim(),
      authorName: String(payload.authorName || "").trim(),
      authorId: String(payload.authorId || "").trim(),
      carouselRec: String(payload.carouselRec || "").trim(),
      oneLiner: String(payload.oneLiner || "").trim(),
    };
  }

  async function addSubmission(payload) {
    const bookId = String(payload.bookId || "").trim();
    if (await apiAvailable()) {
      const res = await fetch("/api/recommend-submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookName: payload.bookName,
          bookId,
          authorName: payload.authorName,
          authorId: payload.authorId,
          carouselRec: payload.carouselRec,
          oneLiner: payload.oneLiner,
        }),
      });
      if (!res.ok) throw new Error("提交失败");
      const data = await res.json();
      return {
        item: data.item,
        replaced: Boolean(data.replaced),
      };
    }

    const list = readLocal();
    const idx = list.findIndex((it) => String(it.bookId) === bookId && bookId);
    const replaced = idx >= 0;
    const item = buildItem(payload, replaced ? list[idx] : null);
    if (replaced) list.splice(idx, 1);
    list.unshift(item);
    writeLocal(list);
    return { item, replaced };
  }

  async function clearSubmissions() {
    if (await apiAvailable()) {
      const res = await fetch("/api/recommend-submissions", { method: "DELETE" });
      if (!res.ok) throw new Error("清空失败");
      return;
    }
    writeLocal([]);
  }

  function checkAdminPass(pass) {
    return String(pass || "") === ADMIN_PASS;
  }

  global.RecommendStore = {
    STORAGE_KEY,
    ADMIN_PASS_HINT: "123",
    listSubmissions,
    addSubmission,
    clearSubmissions,
    checkAdminPass,
    apiAvailable,
  };
})(window);
