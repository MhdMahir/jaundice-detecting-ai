(function initHistoryPage() {
  const list = document.getElementById("historyList");
  const summary = document.getElementById("historySummary");
  const clearButton = document.getElementById("clearHistoryBtn");

  if (!list) return;

  function accountId() {
    return localStorage.getItem("userEmail") || localStorage.getItem("userName");
  }

  function historyKey() {
    const user = accountId() || "local";
    return `screeningHistory:${user.toLowerCase()}`;
  }

  function readHistory() {
    try {
      return JSON.parse(localStorage.getItem(historyKey())) || [];
    } catch {
      return [];
    }
  }

  function writeHistory(history) {
    localStorage.setItem(historyKey(), JSON.stringify(history));
  }

  function formatDate(value) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "Unknown date";

    return date.toLocaleString([], {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function confidenceLabel(entry) {
    let confidence = entry.confidence;

    if (confidence === null || confidence === undefined) return "Confidence unavailable";
    if (confidence <= 1) confidence *= 100;

    return `${Number(confidence).toFixed(1)}% confidence`;
  }

  function isPositive(entry) {
    return String(entry.prediction || entry.result?.prediction || "")
      .toLowerCase()
      .includes("positive");
  }

  function viewEntry(entry) {
    if (entry.image) localStorage.setItem("uploadedImage", entry.image);
    if (entry.result) {
      localStorage.setItem("predictionResult", JSON.stringify(entry.result));
    }
    window.location.href = "/result";
  }

  function deleteEntry(id) {
    const next = readHistory().filter((entry) => entry.id !== id);
    writeHistory(next);
    render();
  }

  function emptyState(title, text, actionHref, actionLabel) {
    list.className = "history-empty";
    list.innerHTML = "";

    const icon = document.createElement("div");
    icon.className = "history-empty-icon";
    icon.innerHTML = '<span class="material-icons">history</span>';

    const heading = document.createElement("h2");
    heading.textContent = title;

    const copy = document.createElement("p");
    copy.textContent = text;

    const action = document.createElement("a");
    action.className = "btn-primary";
    action.href = actionHref;
    action.innerHTML = `<span class="material-icons" style="font-size: 18px">arrow_forward</span>${actionLabel}`;

    list.append(icon, heading, copy, action);
  }

  function render() {
    const loggedIn = Boolean(accountId());
    const history = readHistory();

    if (!loggedIn) {
      summary.textContent = "Log in to view your saved screening history.";
      clearButton.hidden = true;
      emptyState(
        "Log in to view history",
        "Your previous screening images and results appear here after sign in.",
        "/login",
        "Log In"
      );
      return;
    }

    if (!history.length) {
      summary.textContent = "No saved screenings yet.";
      clearButton.hidden = true;
      emptyState(
        "No history yet",
        "Upload an image and run an analysis. The result will be saved here automatically.",
        "/upload",
        "Upload Image"
      );
      return;
    }

    summary.textContent = `${history.length} saved screening${
      history.length === 1 ? "" : "s"
    }.`;
    clearButton.hidden = false;
    list.className = "history-grid";
    list.innerHTML = "";

    history.forEach((entry) => {
      const card = document.createElement("article");
      card.className = `history-card ${isPositive(entry) ? "is-positive" : "is-negative"}`;

      const imageWrap = document.createElement("div");
      imageWrap.className = "history-image";

      const image = document.createElement("img");
      image.src = entry.image || "";
      image.alt = "Previously uploaded screening image";
      imageWrap.appendChild(image);

      const body = document.createElement("div");
      body.className = "history-card-body";

      const badge = document.createElement("span");
      badge.className = "history-badge";
      badge.textContent = isPositive(entry) ? "Positive" : "Negative";

      const title = document.createElement("h2");
      title.textContent = entry.prediction || entry.result?.prediction || "Screening Result";

      const confidence = document.createElement("p");
      confidence.className = "history-confidence";
      confidence.textContent = confidenceLabel(entry);

      const date = document.createElement("p");
      date.className = "history-date";
      date.textContent = formatDate(entry.createdAt);

      const actions = document.createElement("div");
      actions.className = "history-card-actions";

      const viewButton = document.createElement("button");
      viewButton.type = "button";
      viewButton.className = "btn-primary";
      viewButton.innerHTML =
        '<span class="material-icons" style="font-size: 18px">visibility</span>View Result';
      viewButton.addEventListener("click", () => viewEntry(entry));

      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.className = "btn-ghost";
      deleteButton.innerHTML =
        '<span class="material-icons" style="font-size: 18px">delete</span>Delete';
      deleteButton.addEventListener("click", () => deleteEntry(entry.id));

      actions.append(viewButton, deleteButton);
      body.append(badge, title, confidence, date, actions);
      card.append(imageWrap, body);
      list.appendChild(card);
    });
  }

  clearButton?.addEventListener("click", () => {
    writeHistory([]);
    render();
  });

  render();
})();
