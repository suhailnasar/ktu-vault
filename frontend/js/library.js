const ICONS = {
  notes: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`,
  qp: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><circle cx="10" cy="14" r="2"/></svg>`,
  model_qp: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><polyline points="9 15 11 17 15 13"/></svg>`,
  syllabus: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`
};

const CAT_LABELS = {
  notes: "Notes",
  qp: "Question Paper",
  model_qp: "Model QP",
  syllabus: "Syllabus"
};

const urlParams = new URLSearchParams(window.location.search);
const urlSubject = urlParams.get("subject_code");
const urlSemester = urlParams.get("semester");
const urlBranch = urlParams.get("branch");
const urlCategory = urlParams.get("category");

if (urlSubject) {
  document.getElementById("lib-title").textContent = urlSubject;
}

const savedFilter = JSON.parse(localStorage.getItem("ktu_filter") || '{}');
const sem = urlSemester || savedFilter.semester || null;
const branch = urlBranch || savedFilter.branch || null;

const chip = document.getElementById("lib-chip");
if (sem && branch) {
  chip.textContent = `S${sem} · ${branch} ✕`;
  chip.style.display = "block";
} else {
  chip.style.display = "none";
}

function clearLibFilter() {
  localStorage.removeItem("ktu_filter");
  window.location.href = "library.html";
}

function getProgress(id) {
  const d = localStorage.getItem(`prog_${id}`);
  return d ? JSON.parse(d) : null;
}

function createCard(r) {
  const prog = getProgress(r.id);
  const card = document.createElement("div");
  card.className = "res-card fade-in";
  card.innerHTML = `
    <div class="res-thumb thumb-${r.category}">
      <div style="opacity:0.5;color:#fff">${ICONS[r.category] || ICONS.notes}</div>
    </div>
    <div class="res-info">
      <div class="res-cat cat-${r.category}">${CAT_LABELS[r.category]}</div>
      <div class="res-title">${r.title}</div>
      <div class="res-sub">${r.subject_name} · ${r.subject_code}</div>
      ${prog ? `<div class="res-prog"><div class="res-prog-fill" style="width:${prog.percent}%"></div></div>` : ""}
    </div>
    <div class="res-arrow">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
    </div>
  `;
  card.addEventListener("click", () => {
    location.href = `viewer.html?id=${r.id}`;
  });
  return card;
}

function showSkeletons(count = 4) {
  const list = document.getElementById("resource-list");
  list.innerHTML = "";
  for (let i = 0; i < count; i++) {
    const sk = document.createElement("div");
    sk.style.cssText = `height:74px;background:var(--surface);border-radius:14px;margin-bottom:8px;position:relative;overflow:hidden;border:1px solid var(--border)`;
    list.appendChild(sk);
  }
}

let currentCat = urlCategory || "all";

async function loadResources(category, keyword = "") {
  const list = document.getElementById("resource-list");
  const label = document.getElementById("result-label");
  showSkeletons();

  const searchParams = {};
  if (sem) searchParams.semester = sem;
  if (branch) searchParams.branch = branch;
  if (urlSubject) searchParams.subject_code = urlSubject;
  if (category && category !== "all") searchParams.category = category;
  if (keyword) searchParams.keyword = keyword;

  label.textContent = keyword
    ? `Results for "${keyword}"`
    : urlSubject
    ? `${CAT_LABELS[category] || "All"} · ${urlSubject}`
    : sem && branch
    ? `S${sem} · ${branch}`
    : CAT_LABELS[category] || "All Resources";

  try {
    const results = await apiGet("/api/resources/search", searchParams);
    list.innerHTML = "";

    if (results.length === 0) {
      list.innerHTML = `<div class="empty"><p>No resources found.<br>Try a different filter.</p></div>`;
      return;
    }

    results.forEach(r => list.appendChild(createCard(r)));
  } catch (e) {
    list.innerHTML = `<div class="empty"><p>Could not load. Check server.</p></div>`;
  }
}

if (urlCategory) {
  document.querySelectorAll(".pill").forEach(p => {
    p.classList.remove("active");
    p.classList.add("inactive");
    if (p.dataset.cat === urlCategory) {
      p.classList.add("active");
      p.classList.remove("inactive");
    }
  });
}

document.querySelectorAll(".pill").forEach(p => {
  p.addEventListener("click", () => {
    document.querySelectorAll(".pill").forEach(x => {
      x.classList.remove("active");
      x.classList.add("inactive");
    });
    p.classList.remove("inactive");
    p.classList.add("active");
    currentCat = p.dataset.cat;
    loadResources(currentCat);
  });
});

let searchTimer;
document.getElementById("search-input").addEventListener("input", e => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    loadResources(currentCat, e.target.value.trim());
  }, 400);
});

loadResources(currentCat);