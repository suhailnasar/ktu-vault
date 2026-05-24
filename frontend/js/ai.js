let chatHistory = JSON.parse(localStorage.getItem("ktu_chat_history") || "[]");
let selectedResource = null;
let selectedFile = null;
let currentChatId = null;
let currentChatMessages = [];

// Drawer
const drawer = document.getElementById("drawer");
const overlay = document.getElementById("drawer-overlay");

document.getElementById("hamburger").addEventListener("click", () => {
  drawer.classList.add("open");
  overlay.classList.add("show");
});

document.getElementById("drawer-close").addEventListener("click", closeDrawer);
overlay.addEventListener("click", closeDrawer);

function closeDrawer() {
  drawer.classList.remove("open");
  overlay.classList.remove("show");
}

// New chat
document.getElementById("new-chat-btn").addEventListener("click", () => {
  document.getElementById("chat-messages").innerHTML = "";
  document.getElementById("chat-welcome").style.display = "flex";
  selectedResource = null;
  currentChatId = Date.now().toString();
  currentChatMessages = [];
  clearFile();
  closeDrawer();
});

// Quick prompts
document.querySelectorAll(".quick-prompt").forEach(p => {
  p.addEventListener("click", () => {
    document.getElementById("chat-input").value = p.dataset.prompt;
    document.getElementById("chat-input").focus();
    closeDrawer();
  });
});

// Suggestions
document.querySelectorAll(".suggestion").forEach(s => {
  s.addEventListener("click", () => {
    sendMessage(s.dataset.text);
  });
});

// Chat history UI
function renderHistory() {
  const container = document.getElementById("chat-history");
  if (chatHistory.length === 0) {
    container.innerHTML = `<div style="font-size:0.78rem;color:var(--text-3);padding:8px 0">No previous chats yet.</div>`;
    return;
  }
  container.innerHTML = "";
  chatHistory.slice().reverse().forEach((chat) => {
    const div = document.createElement("div");
    div.className = "history-item";
    div.textContent = chat.title;
    div.addEventListener("click", () => {
      // Restore conversation without re-sending
      document.getElementById("chat-messages").innerHTML = "";
      document.getElementById("chat-welcome").style.display = "none";
      chat.messages.forEach(msg => addMessage(msg.role, msg.text));
      closeDrawer();
    });
    container.appendChild(div);
  });
}

renderHistory();

// Add message bubble
function addMessage(role, text) {
  document.getElementById("chat-welcome").style.display = "none";
  const messages = document.getElementById("chat-messages");

  const msg = document.createElement("div");
  msg.className = `msg msg-${role}`;

  const avatar = document.createElement("div");
  avatar.className = "msg-avatar";
  avatar.innerHTML = role === "ai"
    ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`
    : "You";

  const bubble = document.createElement("div");
  bubble.className = "msg-bubble";
  bubble.textContent = text;

  msg.appendChild(avatar);
  msg.appendChild(bubble);
  messages.appendChild(msg);

  messages.scrollTop = messages.scrollHeight;
  return bubble;
}

function addTypingIndicator() {
  document.getElementById("chat-welcome").style.display = "none";
  const messages = document.getElementById("chat-messages");
  const msg = document.createElement("div");
  msg.className = "msg msg-ai msg-typing";
  msg.id = "typing-indicator";
  msg.innerHTML = `
    <div class="msg-avatar" style="background:var(--primary-dim);color:var(--primary)">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
    </div>
    <div class="msg-bubble">
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
    </div>
  `;
  messages.appendChild(msg);
  messages.scrollTop = messages.scrollHeight;
}

function removeTypingIndicator() {
  const t = document.getElementById("typing-indicator");
  if (t) t.remove();
}

// Send message
async function sendMessage(text) {
  if (!text.trim() && !selectedFile) return;

  const input = document.getElementById("chat-input");
  const sendBtn = document.getElementById("send-btn");
  const messageText = text || input.value.trim();
  input.value = "";
  input.style.height = "auto";
  sendBtn.disabled = true;

  addMessage("user", messageText + (selectedResource ? ` [📎 ${selectedResource.title}]` : selectedFile ? ` [📎 ${selectedFile.name}]` : ""));
  addTypingIndicator();

  try {
    let response;

    if (selectedResource) {
      // Send with vault resource context
      response = await apiPost("/api/ai/chat-with-resource", {
        message: messageText,
        resource_id: selectedResource.id
      });
    }else if (selectedFile) {
  const isImage = selectedFile.type.startsWith("image/");
  const formData = new FormData();
  formData.append("message", messageText);

  if (isImage) {
    formData.append("image", selectedFile);
    const res = await fetch(`${BASE_URL}/api/ai/chat-with-image`, {
      method: "POST",
      body: formData
    });
    response = await res.json();
  } else {
    formData.append("file", selectedFile);
    const res = await fetch(`${BASE_URL}/api/ai/chat-with-file`, {
      method: "POST",
      body: formData
    });
    response = await res.json();
  }
}
    else {
      // Normal chat
      response = await apiPost("/api/ai/explain", {
        topic: messageText,
        subject: ""
      });
    }

    removeTypingIndicator();
const answer = response.explanation || response.answer || "No response received.";
addMessage("ai", answer);

// Check if PDF couldn't be read properly
if (answer.toLowerCase().includes("promotional") || 
    answer.toLowerCase().includes("can't see") ||
    answer.toLowerCase().includes("cannot read") ||
    answer.toLowerCase().includes("no content") ||
    answer.toLowerCase().includes("doesn't contain")) {
  setTimeout(() => {
    addMessage("ai", "This document seems to be image-based and I couldn't read its content properly. Try uploading a photo or screenshot of the specific page you want help with — I can read images directly.");
  }, 500);
}
    // Add to current chat messages
currentChatMessages.push({ role: "user", text: messageText });
currentChatMessages.push({ role: "ai", text: answer });

// Find or create chat in history
if (currentChatId) {
  const existingIndex = chatHistory.findIndex(c => c.id === currentChatId);
  if (existingIndex >= 0) {
    chatHistory[existingIndex].messages = currentChatMessages;
  } else {
    chatHistory.push({
      id: currentChatId,
      title: messageText.substring(0, 40) + (messageText.length > 40 ? "..." : ""),
      messages: currentChatMessages
    });
  }
} else {
  currentChatId = Date.now().toString();
  chatHistory.push({
    id: currentChatId,
    title: messageText.substring(0, 40) + (messageText.length > 40 ? "..." : ""),
    messages: currentChatMessages
  });
}

if (chatHistory.length > 20) chatHistory.shift();
localStorage.setItem("ktu_chat_history", JSON.stringify(chatHistory));
renderHistory();

  } catch (e) {
    removeTypingIndicator();
    addMessage("ai", "Something went wrong. Make sure the server is running.");
    console.error(e);
  }

  sendBtn.disabled = false;
  clearFile();
}
// Send button
document.getElementById("send-btn").addEventListener("click", () => {
  sendMessage(document.getElementById("chat-input").value);
});

// Enter key
document.getElementById("chat-input").addEventListener("keydown", e => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage(document.getElementById("chat-input").value);
  }
});

// Auto resize textarea
document.getElementById("chat-input").addEventListener("input", function () {
  this.style.height = "auto";
  this.style.height = Math.min(this.scrollHeight, 120) + "px";
});

// Attach menu
const attachBtn = document.getElementById("attach-btn");
const attachMenu = document.getElementById("attach-menu");

attachBtn.addEventListener("click", e => {
  e.stopPropagation();
  attachMenu.classList.toggle("open");
});

document.addEventListener("click", () => attachMenu.classList.remove("open"));

// Pick from device
document.getElementById("pick-from-device").addEventListener("click", () => {
  document.getElementById("file-input").click();
  attachMenu.classList.remove("open");
});

document.getElementById("file-input").addEventListener("change", e => {
  const file = e.target.files[0];
  if (!file) return;
  selectedFile = file;
  document.getElementById("file-name").textContent = file.name;
  document.getElementById("file-preview").style.display = "block";
});

// Pick from vault
document.getElementById("pick-from-vault").addEventListener("click", () => {
  openVaultModal();
  attachMenu.classList.remove("open");
});

async function openVaultModal() {
  document.getElementById("vault-modal").style.display = "flex";
  const list = document.getElementById("vault-list");
  list.innerHTML = `<div class="empty"><p>Loading...</p></div>`;

  const filter = JSON.parse(localStorage.getItem("ktu_filter") || '{"semester":"3","branch":"CSE"}');

  try {
    const results = await apiGet("/api/resources/search", {
      semester: filter.semester,
      branch: filter.branch
    });

    list.innerHTML = "";
    results.forEach(r => {
      const item = document.createElement("div");
      item.className = "res-card fade-in";
      item.style.marginBottom = "8px";
      item.innerHTML = `
        <div class="res-thumb thumb-${r.category}" style="width:40px;height:46px">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        </div>
        <div class="res-info">
          <div class="res-cat cat-${r.category}" style="font-size:0.65rem">${r.category.toUpperCase()}</div>
          <div class="res-title" style="font-size:0.8rem">${r.title}</div>
          <div class="res-sub">${r.subject_name}</div>
        </div>
      `;
      item.addEventListener("click", () => {
        selectedResource = r;
        document.getElementById("file-name").textContent = r.title;
        document.getElementById("file-preview").style.display = "block";
        closeVaultModal();
        document.getElementById("chat-input").placeholder = `Asking about: ${r.title}`;
      });
      list.appendChild(item);
    });
  } catch (e) {
    list.innerHTML = `<div class="empty"><p>Could not load resources.</p></div>`;
  }
}

function closeVaultModal() {
  document.getElementById("vault-modal").style.display = "none";
}

document.getElementById("vault-modal").addEventListener("click", e => {
  if (e.target === document.getElementById("vault-modal")) closeVaultModal();
});

let vaultSearchTimer;
document.getElementById("vault-search").addEventListener("input", async e => {
  clearTimeout(vaultSearchTimer);
  vaultSearchTimer = setTimeout(async () => {
    const keyword = e.target.value.trim();
    if (!keyword) { openVaultModal(); return; }
    const list = document.getElementById("vault-list");
    const results = await apiGet("/api/resources/search", { keyword });
    list.innerHTML = "";
    results.forEach(r => {
      const item = document.createElement("div");
      item.className = "res-card";
      item.style.marginBottom = "8px";
      item.innerHTML = `
        <div class="res-info">
          <div class="res-cat cat-${r.category}">${r.category.toUpperCase()}</div>
          <div class="res-title">${r.title}</div>
          <div class="res-sub">${r.subject_name}</div>
        </div>
      `;
      item.addEventListener("click", () => {
        selectedResource = r;
        document.getElementById("file-name").textContent = r.title;
        document.getElementById("file-preview").style.display = "block";
        closeVaultModal();
      });
      list.appendChild(item);
    });
  }, 300);
});

function clearFile() {
  selectedFile = null;
  selectedResource = null;
  document.getElementById("file-preview").style.display = "none";
  document.getElementById("file-input").value = "";
  document.getElementById("chat-input").placeholder = "Ask anything KTU related...";
}