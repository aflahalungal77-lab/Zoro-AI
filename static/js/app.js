const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const messagesEl = document.getElementById("messages");
const welcomeScreen = document.getElementById("welcomeScreen");
const newChatBtn = document.getElementById("newChatBtn");
const menuBtn = document.getElementById("menuBtn");
const sidebar = document.getElementById("sidebar");
const sidebarBackdrop = document.getElementById("sidebarBackdrop");
const chatHistory = document.getElementById("chatHistory");
const historyEmpty = document.getElementById("historyEmpty");
const historyCount = document.getElementById("historyCount");
const currentChatTitle = document.getElementById("currentChatTitle");
const clearChatBtn = document.getElementById("clearChatBtn");

const STORAGE_KEY = "zoro-ai-conversations-v1";
let conversations = loadConversations();
let activeConversationId = null;
let isSending = false;

function loadConversations() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function saveConversations() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations.slice(0, 30)));
  } catch (error) {
    console.warn("Could not save local chat history:", error);
  }
}

function activeConversation() {
  return conversations.find((item) => item.id === activeConversationId) || null;
}

function createConversation() {
  const item = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: "New conversation",
    messages: [],
    updatedAt: Date.now()
  };
  conversations.unshift(item);
  activeConversationId = item.id;
  saveConversations();
  renderHistory();
  renderConversation();
  closeSidebar();
  messageInput.focus();
}

function renderHistory() {
  chatHistory.replaceChildren();
  historyCount.textContent = String(conversations.length);
  historyEmpty.hidden = conversations.length > 0;

  conversations.forEach((item) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `history-item${item.id === activeConversationId ? " active" : ""}`;
    button.title = item.title;

    const icon = document.createElement("span");
    icon.className = "history-icon";
    icon.textContent = "◷";
    const title = document.createElement("span");
    title.className = "history-title";
    title.textContent = item.title;

    button.append(icon, title);
    button.addEventListener("click", () => {
      activeConversationId = item.id;
      renderHistory();
      renderConversation();
      closeSidebar();
    });
    chatHistory.append(button);
  });
}

function renderConversation() {
  const item = activeConversation();
  messagesEl.replaceChildren();
  const hasMessages = Boolean(item && item.messages.length);
  welcomeScreen.hidden = hasMessages;
  messagesEl.classList.toggle("has-messages", hasMessages);
  currentChatTitle.textContent = item?.title || "New conversation";

  if (item) {
    item.messages.forEach((message) => addMessage(message.content, message.role, false));
  }
  scrollToBottom();
}

function addMessage(content, role, shouldScroll = true) {
  const row = document.createElement("article");
  row.className = `message-row ${role === "user" ? "user-row" : "assistant-row"}`;

  const avatar = document.createElement("div");
  avatar.className = "message-avatar";
  avatar.textContent = role === "user" ? "You" : "z";
  avatar.setAttribute("aria-hidden", "true");

  const body = document.createElement("div");
  body.className = "message-content";

  if (role === "assistant") {
    const meta = document.createElement("div");
    meta.className = "message-meta";
    meta.textContent = "ZORO AI";
    const text = document.createElement("div");
    text.className = "assistant-text";
    // textContent keeps model output safe; no untrusted HTML is executed.
    text.textContent = content;
    body.append(meta, text);
  } else {
    body.textContent = content;
  }

  row.append(avatar, body);
  messagesEl.append(row);
  if (shouldScroll) scrollToBottom();
  return row;
}

function showThinking() {
  const row = document.createElement("article");
  row.className = "message-row assistant-row thinking-row";
  const avatar = document.createElement("div");
  avatar.className = "message-avatar";
  avatar.textContent = "z";
  const body = document.createElement("div");
  body.className = "message-content";
  const meta = document.createElement("div");
  meta.className = "message-meta";
  meta.textContent = "ZORO AI";
  const card = document.createElement("div");
  card.className = "thinking-card";
  const mark = document.createElement("span");
  mark.className = "thinking-mark";
  mark.textContent = "✳";
  const label = document.createElement("span");
  label.textContent = "Thinking through your request";
  const dots = document.createElement("span");
  dots.className = "thinking-dots";
  dots.innerHTML = "<i></i><i></i><i></i>";
  card.append(mark, label, dots);
  body.append(meta, card);
  row.append(avatar, body);
  messagesEl.append(row);
  scrollToBottom();
  return row;
}

function scrollToBottom() {
  const chatArea = document.getElementById("chatArea");
  requestAnimationFrame(() => { chatArea.scrollTop = chatArea.scrollHeight; });
}

function updateComposer() {
  sendBtn.disabled = !messageInput.value.trim() || isSending;
}

function setTitleFromFirstMessage(item, content) {
  if (item.title === "New conversation") {
    item.title = content.replace(/\s+/g, " ").trim().slice(0, 38) || "New conversation";
    currentChatTitle.textContent = item.title;
  }
}

async function sendMessage() {
  const content = messageInput.value.trim();
  if (!content || isSending) return;
  if (!activeConversation()) createConversation();

  const item = activeConversation();
  setTitleFromFirstMessage(item, content);
  item.messages.push({ role: "user", content });
  item.updatedAt = Date.now();
  saveConversations();
  renderHistory();
  welcomeScreen.hidden = true;
  messagesEl.classList.add("has-messages");
  addMessage(content, "user");

  messageInput.value = "";
  messageInput.style.height = "auto";
  isSending = true;
  updateComposer();
  const thinking = showThinking();

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: item.messages.map(({ role, content: messageContent }) => ({ role, content: messageContent }))
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || "The request could not be completed.");
    if (typeof data.reply !== "string" || !data.reply.trim()) throw new Error("Zoro did not return a response. Please try again.");

    item.messages.push({ role: "assistant", content: data.reply });
    item.updatedAt = Date.now();
    saveConversations();
    thinking.remove();
    addMessage(data.reply, "assistant");
  } catch (error) {
    thinking.remove();
    // Keep the user's message in the conversation so they can retry with context.
    const errorRow = addMessage(`I couldn't complete that request. ${error.message}`, "assistant");
    errorRow.classList.add("error-row");
  } finally {
    isSending = false;
    updateComposer();
    messageInput.focus();
  }
}

function clearCurrentConversation() {
  const item = activeConversation();
  if (!item) return;
  item.messages = [];
  item.title = "New conversation";
  item.updatedAt = Date.now();
  saveConversations();
  renderHistory();
  renderConversation();
  messageInput.focus();
}

function closeSidebar() {
  sidebar.classList.remove("open");
  sidebarBackdrop.classList.remove("show");
}

sendBtn.addEventListener("click", sendMessage);
messageInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    sendMessage();
  }
});
messageInput.addEventListener("input", () => {
  messageInput.style.height = "auto";
  messageInput.style.height = `${Math.min(messageInput.scrollHeight, 155)}px`;
  updateComposer();
});
newChatBtn.addEventListener("click", createConversation);
clearChatBtn.addEventListener("click", clearCurrentConversation);
menuBtn.addEventListener("click", () => {
  sidebar.classList.add("open");
  sidebarBackdrop.classList.add("show");
});
sidebarBackdrop.addEventListener("click", closeSidebar);
document.querySelectorAll(".suggestion").forEach((button) => {
  button.addEventListener("click", () => {
    messageInput.value = button.dataset.prompt || "";
    messageInput.dispatchEvent(new Event("input"));
    messageInput.focus();
  });
});

document.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    createConversation();
  }
});

renderHistory();
if (conversations.length) {
  activeConversationId = conversations[0].id;
  renderHistory();
  renderConversation();
} else {
  welcomeScreen.hidden = false;
  messagesEl.classList.remove("has-messages");
}
updateComposer();
