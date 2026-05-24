const params = new URLSearchParams(window.location.search);
const resourceId = params.get("id");

let resource = null;
let moduleCount = 4; // default
let panelOpen = false;

async function loadResource() {
  if (!resourceId) return;

  try {
    const all = await apiGet("/api/resources/search", {});
    resource = all.find(r => r.id == resourceId);

    if (!resource) return;

    document.getElementById("viewer-title").textContent = resource.title;
    document.getElementById("tracker-subject").textContent = resource.subject_name;
    document.title = resource.title + " — KTU Vault";
    const pdfUrl = `/api/resources/file/${resourceId}`;
    document.getElementById("pdf-frame").src = pdfUrl;
    document.getElementById("download-btn").href = pdfUrl;
    document.getElementById("download-btn").download = resource.title + ".pdf";

    if (resource.category === "notes") {
  loadProgress();
  renderModules();
  document.querySelector("button[onclick='togglePanel()']").style.display = "block";
} else {
  document.getElementById("tracker-bar").style.display = "none";
  document.querySelector("button[onclick='togglePanel()']").style.display = "none";
}
  } catch (e) {
    console.error(e);
  }
}

function getModuleKey(moduleNum) {
  return `module_${resource.subject_code}_${moduleNum}`;
}

function loadProgress() {
  const completed = getCompletedModules();
  const percent = Math.round((completed / moduleCount) * 100);
  updateProgressBar(percent);

  // Save to localStorage for home page cards
  localStorage.setItem(`prog_${resourceId}`, JSON.stringify({
    percent,
    title: resource.title,
    subject: resource.subject_name,
    category: resource.category,
    timestamp: Date.now()
  }));
}

function getCompletedModules() {
  let count = 0;
  for (let i = 1; i <= moduleCount; i++) {
    if (localStorage.getItem(getModuleKey(i)) === "done") count++;
  }
  return count;
}

function updateProgressBar(percent) {
  document.getElementById("tracker-fill").style.width = percent + "%";
  document.getElementById("tracker-percent").textContent = percent + "%";
}

function renderModules() {
  const list = document.getElementById("module-list");
  list.innerHTML = "";

  for (let i = 1; i <= moduleCount; i++) {
    const isDone = localStorage.getItem(getModuleKey(i)) === "done";
    const item = document.createElement("div");
    item.style.cssText = "display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border)";
    item.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px">
        <div style="width:28px;height:28px;background:${isDone ? 'var(--primary)' : 'var(--surface-3)'};border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:0.75rem;font-weight:700;color:${isDone ? '#fff' : 'var(--text-3)'}">
          ${isDone ? '✓' : i}
        </div>
        <div style="font-size:0.85rem;color:${isDone ? 'var(--text)' : 'var(--text-2)'}">Module ${i}</div>
      </div>
      <button onclick="toggleModule(${i})" style="background:${isDone ? 'rgba(124,111,239,0.15)' : 'var(--surface-2)'};border:1px solid ${isDone ? 'rgba(124,111,239,0.3)' : 'var(--border)'};border-radius:8px;padding:6px 12px;font-size:0.75rem;font-weight:600;color:${isDone ? 'var(--primary)' : 'var(--text-3)'};cursor:pointer;font-family:inherit">
        ${isDone ? 'Done ✓' : 'Mark Done'}
      </button>
    `;
    list.appendChild(item);
  }
}

function toggleModule(moduleNum) {
  const key = getModuleKey(moduleNum);
  const isDone = localStorage.getItem(key) === "done";

  if (isDone) {
    localStorage.removeItem(key);
  } else {
    localStorage.setItem(key, "done");
  }

  loadProgress();
  renderModules();
}

function togglePanel() {
  const panel = document.getElementById("module-panel");
  panelOpen = !panelOpen;
  panel.style.display = panelOpen ? "block" : "none";
}

document.getElementById("ai-btn").addEventListener("click", () => {
  if (resource) {
    localStorage.setItem("ai_context", JSON.stringify({
      resource_id: resourceId,
      subject_code: resource.subject_code,
      title: resource.title
    }));
  }
  location.href = "ai.html";
});

loadResource();
currentChatId = Date.now().toString();