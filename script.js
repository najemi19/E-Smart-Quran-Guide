    "legal.content.p1": "Les droits du texte coranique appartiennent à leurs sources. L’affichage reflète les API ; la mise en forme peut varier.",
    "legal.terms.title": "Conditions générales",
    "legal.terms.resp.h": "Utilisation responsable",
    "legal.terms.resp.p1": "Utilisez le service à des fins personnelles et éducatives. Tout usage abusif ou nuisible est interdit.",
    "legal.terms.acc.h": "Exactitude",
    "legal.terms.acc.p1": "Nous visons l’exactitude, mais des erreurs peuvent survenir suite à des changements des services externes.",
    "legal.terms.upd.h": "Mises à jour",
    "legal.terms.upd.p1": "Le projet peut être mis à jour sans préavis ; votre usage continu vaut acceptation.",
    "legal.terms.disc.h": "Avertissement",
    "legal.terms.disc.p1": "Nous déclinons toute responsabilité quant à l’utilisation des résultats ; consultez des sources d’autorité si nécessaire.",
    "legal.rules.title": "Règles et notes religieuses",
    "legal.rules.note.h": "Avis",
    "legal.rules.note.p1": "Le texte coranique et le tafsir concis proviennent de sources publiques. Consultez des savants pour les questions détaillées.",
    "legal.rules.quote.h": "Citation et usage",
    "legal.rules.quote.p1": "Vous pouvez citer les versets avec la sourate et l’ayah. Vérifiez dans un Mushaf approuvé pour les contextes officiels.",
    "legal.rules.etiquette.h": "Étiquette de récitation",
    "legal.rules.etiquette.li1": "Pureté et respect lors de la lecture.",
    "legal.rules.etiquette.li2": "Évitez d’extraire des versets hors contexte.",
    "legal.rules.etiquette.li3": "Cherchez le savoir et consultez des spécialistes en cas de doute.",
    "credits.by": "Conception et développement : <strong>Tarek Najemi</strong> — Tous droits réservés à <strong>E-Smart Market Pro</strong>",
    "toast.copied": "Verset copié",
    "toast.copyFail": "Échec de la copie",
    "toast.addedFav": "Ajouté aux favoris",
    "toast.alreadyFav": "Déjà dans les favoris",
    "toast.goto": "Accès au verset dans les résultats",
    "toast.searchApprox": "Recherche approximative du verset",
    "status.searching": "⏳ Recherche...",
    "status.minChars": "Saisissez au moins 3 caractères.",
    "status.noResults": "Aucun résultat. Essayez un autre mot-clé.",
    "status.pageEmpty": "Aucun élément sur cette page.",
    "status.error": "Une erreur est survenue durant la recherche.",
    "voice.unsupported": "La recherche vocale n’est pas prise en charge",
    "voice.failed": "Échec du démarrage de la voix",
    "confirm.clearFav": "Effacer tous les favoris ?"
  }
};

// ---------- i18n helpers ----------
const LANG_KEY = "smart-quran:lang";
function getLang() {
  return localStorage.getItem(LANG_KEY) || "ar";
}
function setLang(lang) {
  localStorage.setItem(LANG_KEY, lang);
  applyI18N(lang);
  applyDir(lang);
}
function t(key, lang = getLang()) {
  return I18N[lang]?.[key] ?? I18N["ar"][key] ?? key;
}
function applyI18N(lang = getLang()) {
  document.title = t("app.title", lang);
  // textContent
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    // some fields require innerHTML (credits)
    if (key === "credits.by") el.innerHTML = t(key, lang);
    else el.textContent = t(key, lang);
  });
  // placeholders
  document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
    const key = el.getAttribute("data-i18n-placeholder");
    el.setAttribute("placeholder", t(key, lang));
  });
  // toggle tafsir buttons currently rendered
  document.querySelectorAll(".toggle-tafsir").forEach(btn => {
    if (btn.dataset.open === "1") btn.textContent = t("actions.tafsir.hide", lang);
    else btn.textContent = t("actions.tafsir.show", lang);
  });
  // update counts/pager labels formatting next render
  updateCountsLang(lang);
}
function applyDir(lang = getLang()) {
  const isRTL = lang === "ar";
  document.documentElement.lang = lang;
  document.documentElement.dir = isRTL ? "rtl" : "ltr";
}

// format helpers
let formatCount = (n) => `${n} نتيجة`;
function updateCountsLang(lang) {
  if (lang === "ar") formatCount = (n) => `${n} نتيجة`;
  else if (lang === "en") formatCount = (n) => `${n} results`;
  else formatCount = (n) => `${n} résultats`;
}

// ---------- DOM/selectors/state ----------
const qs = (sel, el = document) => el.querySelector(sel);
const qsa = (sel, el = document) => [...el.querySelectorAll(sel)];

const state = {
  query: "",
  edition: "quran-simple",
  tafsirId: 169,
  page: 1,
  perPage: 10,
  results: [],
  total: 0,
  dark: false
};

const els = {
  input: qs("#queryInput"),
  searchBtn: qs("#searchBtn"),
  voiceBtn: qs("#voiceBtn"),
  darkToggle: qs("#darkMode"),
  themeToggle: qs("#themeToggle"),
  editionSelect: qs("#editionSelect"),
  tafsirSelect: qs("#tafsirSelect"),
  resultsList: qs("#resultsList"),
  resultCount: qs("#resultCount"),
  resultsStatus: qs("#resultsStatus"),
  prevPage: qs("#prevPage"),
  nextPage: qs("#nextPage"),
  pageInfo: qs("#pageInfo"),
  favList: qs("#favList"),
  clearFav: qs("#clearFav"),
  verseItemTpl: qs("#verseItemTpl")
};

// ---------- Theme ----------
function applyTheme(dark) {
  const root = document.documentElement;
  root.classList.toggle("light", !dark);
  root.classList.toggle("dark", dark);
  els.darkToggle.checked = dark;
  els.themeToggle.textContent = dark ? "🌞" : "🌙";
}
function initTheme() {
  const saved = localStorage.getItem("smart-quran:theme");
  if (saved) state.dark = saved === "dark";
  else state.dark = window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
  applyTheme(state.dark);
}
function toggleTheme() {
  state.dark = !state.dark;
  applyTheme(state.dark);
  localStorage.setItem("smart-quran:theme", state.dark ? "dark" : "light");
}

// ---------- API helpers ----------
const ALQURAN_SEARCH_CANDIDATES = (q, edition) => ([
  `https://api.alquran.cloud/v1/search/${encodeURIComponent(q)}/${edition}`,
  `https://api.alquran.cloud/v1/search/${encodeURIComponent(q)}/all/ar`
]);
const TAFSIR_URL = (surah, ayah, tafsirId = 169) =>
  `https://api.quran.com/api/v4/tafsirs/${tafsirId}/by_ayah/${surah}:${ayah}?language=ar`;

// ---------- Favorites persistence ----------
const FAVORITES_KEY = "smart-quran:favorites";
function loadFavorites() {
  try { return JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]"); }
  catch { return []; }
}
function saveFavorites(list) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(list));
}
let favorites = loadFavorites();

// ---------- Search ----------
async function searchQuery(q, edition) {
  const urls = ALQURAN_SEARCH_CANDIDATES(q, edition);
  for (const url of urls) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`${res.status}`);
      const json = await res.json();
      if (json?.data?.matches && Array.isArray(json.data.matches)) {
        return {
          matches: json.data.matches,
          count: json.data.count ?? json.data.matches.length
        };
      }
    } catch {
      // try next
    }
  }
  throw new Error(t("status.error"));
}

function renderResultsPage() {
  const start = (state.page - 1) * state.perPage;
  const end = start + state.perPage;
  const pageItems = state.results.slice(start, end);

  els.resultsList.innerHTML = "";
  if (!pageItems.length) {
    els.resultsStatus.textContent = t("status.pageEmpty");
  } else {
    els.resultsStatus.textContent = "";
  }

  for (const m of pageItems) {
    const node = els.verseItemTpl.content.cloneNode(true);
    const surahBadge = node.querySelector(".surah");
    const ayahBadge = node.querySelector(".ayah");
    const textEl = node.querySelector(".verse-text");
    const btnTafsir = node.querySelector(".toggle-tafsir");
    const btnFav = node.querySelector(".save-fav");
    const btnCopy = node.querySelector(".copy-verse");
    const tafsirBox = node.querySelector(".tafsir");
    const tafsirContent = node.querySelector(".tafsir-content");

    const surahName = m.surah?.name || m.surah?.englishName || "سورة";
    const surahNumber = m.surah?.number || m.number || 0;
    const ayahInSurah = (m.numberInSurah ?? m.number) || 0;
    const text = m.text || "";

    const lang = getLang();
    if (lang === "ar") {
      surahBadge.textContent = `سورة ${surahName} (${surahNumber})`;
      ayahBadge.textContent = `آية ${ayahInSurah}`;
    } else if (lang === "en") {
      surahBadge.textContent = `Surah ${surahName} (${surahNumber})`;
      ayahBadge.textContent = `Ayah ${ayahInSurah}`;
    } else {
      surahBadge.textContent = `Sourate ${surahName} (${surahNumber})`;
      ayahBadge.textContent = `Verset ${ayahInSurah}`;
    }

    textEl.textContent = text;

    const verseKey = `${surahNumber}:${ayahInSurah}`;
    btnFav.addEventListener("click", () => addFavorite({ verseKey, text, surahName }));
    btnCopy.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(`${text} — [${verseKey}]`);
        toast(t("toast.copied"));
      } catch {
        toast(t("toast.copyFail"));
      }
    });

    // tafsir toggle
    btnTafsir.dataset.open = "0";
    btnTafsir.textContent = t("actions.tafsir.show");
    btnTafsir.addEventListener("click", async () => {
      const open = btnTafsir.dataset.open === "1";
      if (open) {
        tafsirBox.classList.remove("open");
        btnTafsir.dataset.open = "0";
        btnTafsir.textContent = t("actions.tafsir.show");
        return;
      }
      btnTafsir.disabled = true;
      btnTafsir.textContent = t("status.searching");
      try {
        const tfs = await fetchTafsir(surahNumber, ayahInSurah, state.tafsirId);
        tafsirContent.innerHTML = tfs || `<em>${lang === "ar" ? "لم يتوفر تفسير لهذه الآية الآن." : lang === "en" ? "No tafsir available for this verse now." : "Aucun tafsir disponible pour ce verset pour le moment."}</em>`;
        tafsirBox.classList.add("open");
        btnTafsir.dataset.open = "1";
        btnTafsir.textContent = t("actions.tafsir.hide");
      } catch {
        tafsirContent.innerHTML = `<span style="color:#ffb3b3">${lang === "ar" ? "تعذر جلب التفسير. حاول لاحقًا." : lang === "en" ? "Failed to fetch tafsir. Try again later." : "Échec du chargement du tafsir. Réessayez plus tard."}</span>`;
        tafsirBox.classList.add("open");
        btnTafsir.dataset.open = "1";
        btnTafsir.textContent = t("actions.tafsir.hide");
      } finally {
        btnTafsir.disabled = false;
      }
    });

    els.resultsList.appendChild(node);
  }

  const totalPages = Math.max(1, Math.ceil(state.total / state.perPage));
  els.pageInfo.textContent = `${state.page} / ${totalPages}`;
  els.prevPage.disabled = state.page <= 1;
  els.nextPage.disabled = state.page >= totalPages;
}

async function doSearch() {
  const q = (els.input.value || "").trim();
  if (q.length < 3) {
    els.resultsStatus.textContent = t("status.minChars");
    els.resultsList.innerHTML = "";
    els.resultCount.textContent = "";
    return;
  }
  state.query = q;
  state.page = 1;
  els.resultsStatus.textContent = t("status.searching");
  els.resultCount.textContent = "";
  els.resultsList.innerHTML = "";

  try {
    const { matches, count } = await searchQuery(q, state.edition);
    state.results = matches;
    state.total = count;
    els.resultCount.textContent = formatCount(count);
    els.resultsStatus.textContent = count ? "" : t("status.noResults");
    renderResultsPage();
  } catch (e) {
    els.resultsStatus.textContent = t("status.error");
  }
}

// ---------- Tafsir ----------
async function fetchTafsir(surah, ayah, tafsirId) {
  const url = TAFSIR_URL(surah, ayah, tafsirId);
  const res = await fetch(url);
  if (!res.ok) throw new Error("tafsir-failed");
  const json = await res.json();
  const text = json?.tafsir?.text || json?.data?.tafsir?.text || json?.data?.text || "";
  return sanitizeTafsir(text);
}

function sanitizeTafsir(html) {
  const div = document.createElement("div");
  div.innerHTML = html;
  const allowed = ["B", "STRONG", "EM", "I", "U", "BR", "P", "SPAN", "SMALL"];
  qsa("*", div).forEach(el => {
    if (!allowed.includes(el.tagName)) {
      el.replaceWith(...el.childNodes);
    } else {
      [...el.attributes].forEach(attr => {
        if (!["style"].includes(attr.name)) el.removeAttribute(attr.name);
      });
    }
  });
  return div.innerHTML;
}

// ---------- Favorites ----------
function addFavorite(item) {
  if (favorites.some(f => f.verseKey === item.verseKey)) {
    toast(t("toast.alreadyFav"));
    return;
  }
  favorites.unshift({ ...item, savedAt: Date.now() });
  saveFavorites(favorites);
  renderFavorites();
  toast(t("toast.addedFav"));
}
function removeFavorite(verseKey) {
  favorites = favorites.filter(f => f.verseKey !== verseKey);
  saveFavorites(favorites);
  renderFavorites();
}
function renderFavorites() {
  els.favList.innerHTML = "";
  if (!favorites.length) {
    const lang = getLang();
    els.favList.innerHTML = `<p class="muted">${lang === "ar" ? "لا توجد عناصر مضافة بعد." : lang === "en" ? "No favorites yet." : "Aucun favori pour le moment."}</p>`;
    return;
  }
  for (const f of favorites) {
    const wrap = document.createElement("div");
    wrap.className = "fav-item";
    wrap.innerHTML = `
      <div class="fav-head">
        <div class="fav-keys">[${f.verseKey}] — ${f.surahName}</div>
        <div class="fav-actions">
          <button class="btn small ghost" data-copy>${getLang()==="ar"?"نسخ":getLang()==="en"?"Copy":"Copier"}</button>
          <button class="btn small ghost" data-go>${getLang()==="ar"?"عرض":getLang()==="en"?"Go":"Voir"}</button>
          <button class="btn small" data-del>${getLang()==="ar"?"حذف":getLang()==="en"?"Delete":"Supprimer"}</button>
        </div>
      </div>
      <div class="fav-text">${f.text}</div>
    `;
    wrap.querySelector("[data-del]").addEventListener("click", () => removeFavorite(f.verseKey));
    wrap.querySelector("[data-copy]").addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(`${f.text} — [${f.verseKey}]`); toast(t("toast.copied")); } catch { toast(t("toast.copyFail")); }
    });
    wrap.querySelector("[data-go]").addEventListener("click", () => {
      const [s, a] = f.verseKey.split(":").map(Number);
      const idx = state.results.findIndex(m => (m.surah?.number === s) && (m.numberInSurah === a));
      if (idx >= 0) {
        const targetPage = Math.floor(idx / state.perPage) + 1;
        state.page = targetPage;
        renderResultsPage();
        scrollToTop();
        toast(t("toast.goto"));
      } else {
        els.input.value = f.text.split(" ").slice(0, 3).join(" ");
        doSearch().then(() => toast(t("toast.searchApprox")));
      }
    });
    els.favList.appendChild(wrap);
  }
}

// ---------- Voice search ----------
function initVoice() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    els.voiceBtn.disabled = true;
    els.voiceBtn.title = t("voice.unsupported");
    return;
  }
  const rec = new SR();
  rec.lang = getLang() === "ar" ? "ar" : getLang() === "en" ? "en-US" : "fr-FR";
  rec.interimResults = false;
  rec.maxAlternatives = 1;

  rec.onstart = () => {
    els.voiceBtn.textContent = "🎙️";
    els.voiceBtn.disabled = true;
  };
  rec.onerror = () => {
    els.voiceBtn.textContent = t("search.voice");
    els.voiceBtn.disabled = false;
    toast(t("voice.failed"));
  };
  rec.onend = () => {
    els.voiceBtn.textContent = t("search.voice");
    els.voiceBtn.disabled = false;
  };
  rec.onresult = (e) => {
    const transcript = e.results[0][0].transcript || "";
    els.input.value = transcript;
    doSearch();
  };

  els.voiceBtn.addEventListener("click", () => {
    try { rec.start(); } catch { /* ignore */ }
  });
}

// ---------- Pagination ----------
els.prevPage.addEventListener("click", () => {
  if (state.page > 1) {
    state.page--; renderResultsPage(); scrollToTop();
  }
});
els.nextPage.addEventListener("click", () => {
  const totalPages = Math.max(1, Math.ceil(state.total / state.perPage));
  if (state.page < totalPages) {
    state.page++; renderResultsPage(); scrollToTop();
  }
});

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ---------- Toast ----------
let toastTimer;
function toast(msg, ms = 1800) {
  let tdiv = qs("#toast");
  if (!tdiv) {
    tdiv = document.createElement("div");
    tdiv.id = "toast";
    tdiv.style.position = "fixed";
    tdiv.style.bottom = "18px";
    tdiv.style.left = "50%";
    tdiv.style.transform = "translateX(-50%)";
    tdiv.style.background = "rgba(20,20,20,.85)";
    tdiv.style.color = "#fff";
    tdiv.style.padding = "10px 14px";
    tdiv.style.borderRadius = "10px";
    tdiv.style.fontSize = "0.95rem";
    tdiv.style.boxShadow = "0 8px 20px rgba(0,0,0,.25)";
    tdiv.style.zIndex = "9999";
    document.body.appendChild(tdiv);
  }
  tdiv.textContent = msg;
  tdiv.style.opacity = "1";
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { tdiv.style.opacity = "0"; }, ms);
}

// ---------- Language switching ----------
qsa("[data-lang]").forEach(btn => {
  btn.addEventListener("click", () => {
    const lang = btn.getAttribute("data-lang");
    setLang(lang);
    // Re-label result count and favorites buttons
    els.resultCount.textContent = state.total ? formatCount(state.total) : "";
    renderFavorites();
  });
});

// ---------- Events init ----------
window.addEventListener("DOMContentLoaded", () => {
  // Language and direction
  applyDir(getLang());
  applyI18N(getLang());

  initTheme();
  renderFavorites();
  initVoice();

  // Bind controls
  els.searchBtn.addEventListener("click", doSearch);
  els.input.addEventListener("keydown", (e) => { if (e.key === "Enter") doSearch(); });

  els.editionSelect.addEventListener("change", (e) => {
    state.edition = e.target.value;
    if (state.query) doSearch();
  });
  els.tafsirSelect.addEventListener("change", (e) => {
    state.tafsirId = Number(e.target.value) || 169;
  });

  els.darkToggle.addEventListener("change", toggleTheme);
  els.themeToggle.addEventListener("click", toggleTheme);

  els.clearFav.addEventListener("click", () => {
    if (!favorites.length) return;
    if (confirm(t("confirm.clearFav"))) {
      favorites = []; saveFavorites(favorites); renderFavorites(); toast(t("fav.clear"));
    }
  });
});
function searchByCategory() {
  const category = document.getElementById('categoryFilter').value;
  if (category) {
    // هنا نربط كل قسم بكلمات مفتاحية
    const keywordsMap = {
      "تجارة": "بيع شراء ميزان",
      "تعليم": "علم تعليم",
      "إدارة": "عدل شورى",
      "إعلام": "قول صدق",
      "استثمار": "زرع حرث",
      "مالية": "دين قرض"
    };
    searchQuran(keywordsMap[category]);
  }
}

function searchQuran(query) {
  const keyword = query || document.getElementById('keywordSearch').value.trim();
  if (!keyword) return;

  fetch(`https://api.alquran.cloud/v1/search/${encodeURIComponent(keyword)}/all/ar`)
    .then(res => res.json())
    .then(data => {
      const tbody = document.querySelector('#quranTable tbody');
      tbody.innerHTML = '';
      data.data.matches.forEach(match => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${document.getElementById('categoryFilter').value || '—'}</td>
          <td>${match.text} [${match.surah.name}:${match.numberInSurah}]</td>
          <td><button onclick="showTafsir(${match.number})">📘 عرض التفسير</button></td>
          <td>—</td>
        `;
        tbody.appendChild(tr);
      });
    });
}
