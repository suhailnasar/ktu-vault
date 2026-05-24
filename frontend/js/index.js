const ICONS = {
  notes: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`,
  qp: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><circle cx="10" cy="14" r="2"/><path d="m20 20-3-3"/></svg>`,
  model_qp: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><polyline points="9 15 11 17 15 13"/></svg>`,
  syllabus: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`
};

const CAT_LABELS = {
  notes: "Notes",
  qp: "Question Paper",
  model_qp: "Model QP",
  syllabus: "Syllabus"
};

function getFilter() {
  return JSON.parse(localStorage.getItem("ktu_filter") || '{}');
}

function clearFilter() {
  localStorage.removeItem("ktu_filter");
  document.getElementById("filter-chip").style.display = "none";
  loadResources(currentCat);
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
      <div class="res-sub">${r.subject_name}</div>
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

function showSkeletons(container, count = 4) {
  container.innerHTML = "";
  for (let i = 0; i < count; i++) {
    const sk = document.createElement("div");
    sk.style.cssText = `height:74px;background:var(--surface);border-radius:14px;margin-bottom:8px;position:relative;overflow:hidden;border:1px solid var(--border)`;
    sk.innerHTML = `<div style="position:absolute;inset:0;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.03),transparent);animation:shimmer 1.5s infinite"></div>`;
    container.appendChild(sk);
  }
}

async function loadResources(category = "all", keyword = "") {
  const list = document.getElementById("resource-list");
  const label = document.getElementById("section-label");
  const chip = document.getElementById("filter-chip");
  const filter = getFilter();

  showSkeletons(list);

  const params = {};
  if (category !== "all") params.category = category;
  if (keyword) params.keyword = keyword;

  if (filter.semester && filter.branch) {
    params.semester = filter.semester;
    params.branch = filter.branch;
    chip.style.display = "block";
    chip.textContent = `S${filter.semester} · ${filter.branch} ✕`;
    label.textContent = keyword
      ? `Results for "${keyword}"`
      : category === "all"
      ? `S${filter.semester} · ${filter.branch}`
      : `${CAT_LABELS[category]}`;
  } else {
    chip.style.display = "none";
    label.textContent = keyword
      ? `Results for "${keyword}"`
      : category === "all" ? "All Resources" : CAT_LABELS[category];
  }

  
try {
    let results;
    try {
      results = await apiGet("/api/resources/search", params);
    } catch (e) {
      // Retry once after 1 second
      await new Promise(r => setTimeout(r, 1000));
      results = await apiGet("/api/resources/search", params);
    }
    list.innerHTML = "";
    if (results.length === 0) {
      list.innerHTML = `<div class="empty"><div class="empty-icon"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg></div><p>No resources found.<br>Try a different filter.</p></div>`;
      return;
    }

    results.forEach(r => list.appendChild(createCard(r)));
  } catch (e) {
    list.innerHTML = `<div class="empty"><p>Could not load resources.<br>Make sure the server is running.</p></div>`;
  }
}

function loadContinueReading() {
  const section = document.getElementById("continue-section");
  const list = document.getElementById("continue-list");
  const keys = Object.keys(localStorage).filter(k => k.startsWith("prog_"));

  const active = keys
    .map(k => ({ id: k.replace("prog_", ""), ...JSON.parse(localStorage.getItem(k)) }))
    .filter(d => d.percent > 0 && d.percent < 100);

  if (active.length === 0) { section.style.display = "none"; return; }

  section.style.display = "block";
  list.innerHTML = "";

  active.forEach(d => {
    const card = document.createElement("div");
    card.className = "res-card fade-in";
    card.innerHTML = `
      <div class="res-thumb thumb-${d.category}">
        <div style="opacity:0.5;color:#fff">${ICONS[d.category] || ICONS.notes}</div>
      </div>
      <div class="res-info">
        <div class="res-cat cat-${d.category}">${CAT_LABELS[d.category]}</div>
        <div class="res-title">${d.title}</div>
        <div class="res-sub">${d.subject}</div>
        <div class="res-prog"><div class="res-prog-fill" style="width:${d.percent}%"></div></div>
      </div>
      <div class="res-arrow">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
      </div>
    `;
    card.addEventListener("click", () => location.href = `viewer.html?id=${d.id}`);
    list.appendChild(card);
  });
}

let currentCat = "all";

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

loadContinueReading();
loadResources();