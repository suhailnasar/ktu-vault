let selectedSem = "3";
let selectedBranch = "CSE";

function saveFilter() {
    localStorage.setItem("ktu_filter", JSON.stringify({
        semester: selectedSem,
        branch: selectedBranch
    }));
    document.getElementById("browse-filter-chip").style.display = "block";
}

function clearBrowseFilter() {
    localStorage.removeItem("ktu_filter");
    selectedSem = null;
    selectedBranch = null;
    document.querySelectorAll(".sem-btn").forEach(b => b.classList.remove("selected"));
    document.querySelectorAll(".branch-btn").forEach(b => b.classList.remove("selected"));
    document.getElementById("browse-filter-chip").style.display = "none";
    document.getElementById("subject-list").innerHTML = `<div class="empty"><p>Select your semester and branch above to see available subjects.</p></div>`;
}

function loadSavedFilter() {
  const saved = JSON.parse(localStorage.getItem("ktu_filter") || '{}');
  if (!saved.semester || !saved.branch) return;

  selectedSem = saved.semester;
  selectedBranch = saved.branch;

  document.querySelectorAll(".sem-btn").forEach(b => {
    b.classList.toggle("selected", b.dataset.sem === selectedSem);
  });
  document.querySelectorAll(".branch-btn").forEach(b => {
    b.classList.toggle("selected", b.dataset.branch === selectedBranch);
  });

  document.getElementById("browse-filter-chip").style.display = "block";
  loadSubjects();
}

async function loadSubjects() {
  const list = document.getElementById("subject-list");
  list.innerHTML = `<div class="empty"><p>Select your Semester and Branch</p></div>`;

  try {
    const results = await apiGet("/api/resources/search", {
      semester: selectedSem,
      branch: selectedBranch
    });

    if (results.length === 0) {
      list.innerHTML = `<div class="empty"><p>No resources found for this selection.</p></div>`;
      return;
    }

    // Group by subject
    const subjects = {};
    results.forEach(r => {
      if (!subjects[r.subject_code]) {
        subjects[r.subject_code] = {
          code: r.subject_code,
          name: r.subject_name,
          count: 0
        };
      }
      subjects[r.subject_code].count++;
    });

    list.innerHTML = "";
    Object.values(subjects).forEach(s => {
      const card = document.createElement("div");
      card.className = "subject-card fade-in";
      card.innerHTML = `
        <div class="subject-card-info">
          <div class="subject-code">${s.code}</div>
          <div class="subject-name">${s.name}</div>
          <div class="subject-count">${s.count} resource${s.count > 1 ? "s" : ""}</div>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
      `;
      card.addEventListener("click", () => {
        location.href = `library.html?subject_code=${s.code}&semester=${selectedSem}&branch=${selectedBranch}`;
      });
      list.appendChild(card);
    });

  } catch (e) {
    list.innerHTML = `<div class="empty"><p>Could not load. Check server.</p></div>`;
  }
}

// Semester buttons
document.querySelectorAll(".sem-btn").forEach(b => {
  b.addEventListener("click", () => {
    document.querySelectorAll(".sem-btn").forEach(x => x.classList.remove("selected"));
    b.classList.add("selected");
    selectedSem = b.dataset.sem;
    saveFilter();
    loadSubjects();
  });
});

// Branch buttons
document.querySelectorAll(".branch-btn").forEach(b => {
  b.addEventListener("click", () => {
    document.querySelectorAll(".branch-btn").forEach(x => x.classList.remove("selected"));
    b.classList.add("selected");
    selectedBranch = b.dataset.branch;
    saveFilter();
    loadSubjects();
  });
});

document.addEventListener("DOMContentLoaded", () => {
    loadSavedFilter();
});
loadSubjects();