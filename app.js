const STORAGE_KEY = "resource_manager_data_v1";
const SESSION_KEY = "resource_manager_session_v1";

const AUTH_USERS = [
  {
    username: "ceo@techzick.com",
    password: "Techzick@123",
    name: "Techzick CEO",
    role: "manager",
  },
  {
    username: "ops@techzick.com",
    password: "Techzick@123",
    name: "Ops Recruiter",
    role: "recruiter",
  },
];

const ROLE_PERMISSIONS = {
  manager: {
    canView: true,
    canAdd: true,
    canEdit: true,
    canExit: true,
    canDelete: true,
  },
  recruiter: {
    canView: true,
    canAdd: true,
    canEdit: true,
    canExit: false,
    canDelete: false,
  },
};

const el = {
  authShell: document.getElementById("authShell"),
  appShell: document.getElementById("appShell"),
  loginForm: document.getElementById("loginForm"),
  loginUsername: document.getElementById("loginUsername"),
  loginPassword: document.getElementById("loginPassword"),
  loginError: document.getElementById("loginError"),
  currentUserLabel: document.getElementById("currentUserLabel"),
  logoutBtn: document.getElementById("logoutBtn"),
  form: document.getElementById("resourceForm"),
  resetBtn: document.getElementById("resetForm"),
  addResourceBtn: document.getElementById("openResourceModal"),
  closeResourceBtn: document.getElementById("closeResourceModal"),
  cancelResourceBtn: document.getElementById("cancelResourceModal"),
  modal: document.getElementById("resourceModal"),
  modalOverlay: document.getElementById("resourceModalOverlay"),
  modalTitle: document.getElementById("modalTitle"),
  table: document.getElementById("resourceTable"),
  typeFilter: document.getElementById("typeFilter"),
  statusFilter: document.getElementById("statusFilter"),
  search: document.getElementById("search"),
  resourceId: document.getElementById("resourceId"),
  name: document.getElementById("name"),
  role: document.getElementById("role"),
  resourceLevel: document.getElementById("resourceLevel"),
  referredBy: document.getElementById("referredBy"),
  resourceType: document.getElementById("resourceType"),
  status: document.getElementById("status"),
  allocation: document.getElementById("allocation"),
  contractedPayment: document.getElementById("contractedPayment"),
  contractType: document.getElementById("contractType"),
  contractReference: document.getElementById("contractReference"),
  contractFile: document.getElementById("contractFile"),
  contractFileHint: document.getElementById("contractFileHint"),
  paymentCycle: document.getElementById("paymentCycle"),
  paymentMethod: document.getElementById("paymentMethod"),
  paymentStatus: document.getElementById("paymentStatus"),
  startDate: document.getElementById("startDate"),
  nextPaymentDate: document.getElementById("nextPaymentDate"),
  exitDate: document.getElementById("exitDate"),
  paymentDetails: document.getElementById("paymentDetails"),
};

const tabButtons = Array.from(document.querySelectorAll("[data-tab]"));
const tabPanels = Array.from(document.querySelectorAll("[data-tab-panel]"));

let resources = loadResources();
let currentSession = loadSession();

function loadResources() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveResources() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(resources));
}

function loadSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveSession(session) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

function getPermissions() {
  if (!currentSession) {
    return {
      canView: false,
      canAdd: false,
      canEdit: false,
      canExit: false,
      canDelete: false,
    };
  }

  return ROLE_PERMISSIONS[currentSession.role] || ROLE_PERMISSIONS.recruiter;
}

function can(permissionName) {
  return Boolean(getPermissions()[permissionName]);
}

function enforce(permissionName, message) {
  if (can(permissionName)) {
    return true;
  }

  window.alert(message);
  return false;
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatMoney(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value || 0);
}

function sanitizeStatusClass(status) {
  return String(status || "").replace(/\s+/g, "-");
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Could not read selected file."));
    reader.readAsDataURL(file);
  });
}

function findAuthUser(username, password) {
  return AUTH_USERS.find((user) => user.username === username && user.password === password);
}

function showAuthScreen() {
  el.authShell.classList.remove("hidden");
  el.appShell.classList.add("hidden");
}

function showAppScreen() {
  el.authShell.classList.add("hidden");
  el.appShell.classList.remove("hidden");
}

function applyAuthorizationUI() {
  const permissions = getPermissions();
  el.addResourceBtn.disabled = !permissions.canAdd;
  el.addResourceBtn.title = permissions.canAdd ? "Add Resource" : "You do not have permission to add resources.";

  if (currentSession) {
    el.currentUserLabel.textContent = `${currentSession.name} (${currentSession.role})`;
  } else {
    el.currentUserLabel.textContent = "";
  }
}

function getFilteredResources() {
  if (!can("canView")) {
    return [];
  }

  const type = el.typeFilter.value;
  const status = el.statusFilter.value;
  const term = el.search.value.trim().toLowerCase();

  return resources.filter((item) => {
    const typeMatch = type === "All" || item.resourceType === type;
    const statusMatch = status === "All" || item.status === status;
    const name = (item.name || "").toLowerCase();
    const role = (item.role || "").toLowerCase();
    const referredBy = (item.referredBy || "").toLowerCase();
    const searchMatch = !term || name.includes(term) || role.includes(term) || referredBy.includes(term);

    return typeMatch && statusMatch && searchMatch;
  });
}

function renderActions(r) {
  const actions = [];

  if (can("canEdit")) {
    actions.push(`<button data-action="edit" data-id="${r.id}">Edit</button>`);
  }

  if (can("canExit")) {
    actions.push(`<button data-action="exit" data-id="${r.id}">Mark Exit</button>`);
  }

  if (can("canDelete")) {
    actions.push(`<button class="danger" data-action="delete" data-id="${r.id}">Delete</button>`);
  }

  return actions.length ? actions.join("") : "<small>View only</small>";
}

function renderTable() {
  if (!can("canView")) {
    el.table.innerHTML = '<tr><td colspan="12" class="empty">Sign in with valid credentials to view resources.</td></tr>';
    return;
  }

  const list = getFilteredResources();

  if (!list.length) {
    el.table.innerHTML = '<tr><td colspan="12" class="empty">No resources found for this view.</td></tr>';
    return;
  }

  el.table.innerHTML = list
    .map(
      (r) => `
      <tr>
        <td><strong>${escapeHtml(r.name)}</strong><br /><small>${escapeHtml(r.paymentDetails || "-")}</small></td>
        <td>${escapeHtml(r.role)}</td>
        <td>${escapeHtml(r.resourceLevel || "-")}</td>
        <td><span class="badge">${escapeHtml(r.resourceType)}</span></td>
        <td><span class="badge status-${sanitizeStatusClass(r.status)}">${escapeHtml(r.status)}</span></td>
        <td>${escapeHtml(r.referredBy || "-")}</td>
        <td>${r.allocation}%</td>
        <td>${formatMoney(Number(r.contractedPayment))}<br /><small>${escapeHtml(r.paymentCycle)}</small></td>
        <td>
          <small>${escapeHtml(r.contractType || "-")}</small><br />
          <small>${escapeHtml(r.contractReference || "-")}</small><br />
          ${
            r.contractDocument
              ? `<a href="${r.contractDocument.dataUrl}" download="${escapeHtml(r.contractDocument.name)}">Download</a>`
              : "<small>-</small>"
          }
        </td>
        <td>${escapeHtml(r.paymentStatus)}<br /><small>${escapeHtml(r.paymentMethod)}</small></td>
        <td>
          <small>Start: ${escapeHtml(r.startDate)}</small><br />
          <small>Next: ${escapeHtml(r.nextPaymentDate || "-")}</small><br />
          <small>Exit: ${escapeHtml(r.exitDate || "-")}</small>
        </td>
        <td>
          <div class="row-actions">
            ${renderActions(r)}
          </div>
        </td>
      </tr>
    `
    )
    .join("");
}

function resetForm() {
  el.form.reset();
  el.resourceId.value = "";
  el.status.value = "Active";
  el.resourceLevel.value = "L1";
  el.contractType.value = "Offer Letter";
  el.contractFileHint.textContent = "Supported for local tracking in browser storage.";
}

function openModal(title = "Add Resource") {
  if (!enforce("canAdd", "You are not authorized to add resources.")) {
    return;
  }

  el.modalTitle.textContent = title;
  el.modal.classList.add("open");
  el.modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
}

function closeModal() {
  el.modal.classList.remove("open");
  el.modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
}

function setActiveTab(tabName) {
  tabButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.tab === tabName);
  });

  tabPanels.forEach((panel) => {
    panel.classList.toggle("active", panel.dataset.tabPanel === tabName);
  });
}

async function getFormPayload(existingContractDocument) {
  let contractDocument = existingContractDocument || null;
  const selectedFile = el.contractFile.files[0];

  if (selectedFile) {
    const maxBytes = 1.5 * 1024 * 1024;
    if (selectedFile.size > maxBytes) {
      throw new Error("Contract/offer file is too large. Keep it under 1.5 MB.");
    }

    const dataUrl = await readFileAsDataUrl(selectedFile);
    contractDocument = {
      name: selectedFile.name,
      type: selectedFile.type || "application/octet-stream",
      size: selectedFile.size,
      dataUrl,
    };
  }

  return {
    id: el.resourceId.value || crypto.randomUUID(),
    name: el.name.value.trim(),
    role: el.role.value.trim(),
    resourceLevel: el.resourceLevel.value,
    referredBy: el.referredBy.value.trim(),
    resourceType: el.resourceType.value,
    status: el.status.value,
    allocation: Number(el.allocation.value),
    contractedPayment: Number(el.contractedPayment.value),
    contractType: el.contractType.value,
    contractReference: el.contractReference.value.trim(),
    contractDocument,
    paymentCycle: el.paymentCycle.value,
    paymentMethod: el.paymentMethod.value,
    paymentStatus: el.paymentStatus.value,
    startDate: el.startDate.value,
    nextPaymentDate: el.nextPaymentDate.value,
    exitDate: el.exitDate.value,
    paymentDetails: el.paymentDetails.value.trim(),
  };
}

function populateForm(item) {
  el.resourceId.value = item.id;
  el.name.value = item.name;
  el.role.value = item.role;
  el.resourceLevel.value = item.resourceLevel || "L1";
  el.referredBy.value = item.referredBy || "";
  el.resourceType.value = item.resourceType;
  el.status.value = item.status;
  el.allocation.value = item.allocation;
  el.contractedPayment.value = item.contractedPayment;
  el.contractType.value = item.contractType || "Offer Letter";
  el.contractReference.value = item.contractReference || "";
  el.paymentCycle.value = item.paymentCycle;
  el.paymentMethod.value = item.paymentMethod;
  el.paymentStatus.value = item.paymentStatus;
  el.startDate.value = item.startDate;
  el.nextPaymentDate.value = item.nextPaymentDate;
  el.exitDate.value = item.exitDate || "";
  el.paymentDetails.value = item.paymentDetails || "";
  el.contractFile.value = "";
  el.contractFileHint.textContent = item.contractDocument
    ? `Current file: ${item.contractDocument.name}`
    : "No contract/offer file attached yet.";
}

function upsertResource(payload) {
  const index = resources.findIndex((r) => r.id === payload.id);

  if (index >= 0) {
    resources[index] = payload;
  } else {
    resources.push(payload);
  }

  saveResources();
  renderTable();
}

function handleLogin(event) {
  event.preventDefault();

  const username = el.loginUsername.value.trim();
  const password = el.loginPassword.value;
  const user = findAuthUser(username, password);

  if (!user) {
    el.loginError.textContent = "Invalid username or password.";
    return;
  }

  currentSession = {
    username: user.username,
    name: user.name,
    role: user.role,
  };
  saveSession(currentSession);

  el.loginError.textContent = "";
  el.loginForm.reset();
  showAppScreen();
  applyAuthorizationUI();
  renderTable();
}

function handleLogout() {
  closeModal();
  clearSession();
  currentSession = null;
  showAuthScreen();
}

el.loginForm.addEventListener("submit", handleLogin);
el.logoutBtn.addEventListener("click", handleLogout);

el.form.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!enforce("canAdd", "You are not authorized to add resources.")) {
    return;
  }

  try {
    const existing = resources.find((r) => r.id === el.resourceId.value);
    const payload = await getFormPayload(existing?.contractDocument || null);
    upsertResource(payload);
    resetForm();
    closeModal();
  } catch (error) {
    window.alert(error.message);
  }
});

el.resetBtn.addEventListener("click", resetForm);
el.addResourceBtn.addEventListener("click", () => {
  resetForm();
  openModal("Add Resource");
});
el.closeResourceBtn.addEventListener("click", closeModal);
el.cancelResourceBtn.addEventListener("click", closeModal);
el.modalOverlay.addEventListener("click", closeModal);

el.contractFile.addEventListener("change", () => {
  const selectedFile = el.contractFile.files[0];
  el.contractFileHint.textContent = selectedFile
    ? `Selected file: ${selectedFile.name}`
    : "Supported for local tracking in browser storage.";
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && el.modal.classList.contains("open")) {
    closeModal();
  }
});

[el.typeFilter, el.statusFilter, el.search].forEach((node) => {
  node.addEventListener("input", renderTable);
});

tabButtons.forEach((button) => {
  button.addEventListener("click", () => setActiveTab(button.dataset.tab));
});

el.table.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;

  const id = button.dataset.id;
  const action = button.dataset.action;
  const target = resources.find((r) => r.id === id);

  if (!target) return;

  if (action === "edit") {
    if (!enforce("canEdit", "You are not authorized to edit resources.")) {
      return;
    }

    populateForm(target);
    openModal("Edit Resource");
    return;
  }

  if (action === "exit") {
    if (!enforce("canExit", "You are not authorized to mark exits.")) {
      return;
    }

    const today = new Date().toISOString().slice(0, 10);
    target.status = "Exited";
    target.exitDate = today;
    saveResources();
    renderTable();
    return;
  }

  if (action === "delete") {
    if (!enforce("canDelete", "You are not authorized to delete resources.")) {
      return;
    }

    resources = resources.filter((r) => r.id !== id);
    saveResources();
    renderTable();
  }
});

setActiveTab("resources");

if (currentSession && ROLE_PERMISSIONS[currentSession.role]) {
  showAppScreen();
  applyAuthorizationUI();
  renderTable();
} else {
  showAuthScreen();
}
