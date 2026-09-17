/* 推荐语收集：优先同源 API，否则 localStorage（静态站） */
(function (global) {
  const STORAGE_KEY = "recommend-preview-submissions-v1";
  const ADMIN_PASS = "staff888";

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

  async function addSubmission(payload) {
    const item = {
      id: uid(),
      createdAt: new Date().toISOString(),
      bookName: String(payload.bookName || "").trim(),
      bookId: String(payload.bookId || "").trim(),
      authorName: String(payload.authorName || "").trim(),
      authorId: String(payload.authorId || "").trim(),
      carouselRec: String(payload.carouselRec || "").trim(),
      oneLiner: String(payload.oneLiner || "").trim(),
    };
    if (await apiAvailable()) {
      const res = await fetch("/api/recommend-submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!res.ok) throw new Error("提交失败");
      const data = await res.json();
      return data.item || item;
    }
    const list = readLocal();
    list.unshift(item);
    writeLocal(list);
    return item;
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
    ADMIN_PASS_HINT: "staff888",
    listSubmissions,
    addSubmission,
    clearSubmissions,
    checkAdminPass,
    apiAvailable,
  };
})(window);
