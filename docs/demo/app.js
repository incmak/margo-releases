(() => {
  const palette = [
    { id: "sky", name: "Sky", paper: "#BEDDFA", gutter: "#ADD1F2", dash: "#2280D6", ink: "#13293A" },
    { id: "mint", name: "Mint", paper: "#B4E8D0", gutter: "#A5DDC3", dash: "#0E9B6E", ink: "#0F2E23" },
    { id: "rose", name: "Rose", paper: "#FAC4D1", gutter: "#EDB5C3", dash: "#DC4570", ink: "#40161F" },
    { id: "lemon", name: "Lemon", paper: "#FCE795", gutter: "#F0D987", dash: "#E0AD08", ink: "#3A3008" },
    { id: "lilac", name: "Lilac", paper: "#D9C7FA", gutter: "#CDB9F0", dash: "#7C4DEE", ink: "#2A1B44" }
  ];

  const initialNotes = [
    {
      id: "launch-day",
      title: "Launch day",
      body: "Send the beta link to Daniel\nVerify the checksum\nWrite the release note",
      color: "sky"
    },
    {
      id: "groceries",
      title: "Groceries",
      body: "- apples\n- 4 bananas\n- dry fruits\n- peanuts",
      color: "mint"
    },
    {
      id: "call-emma",
      title: "Call Emma",
      body: "Ask about the icon export\nConfirm Friday at 3:30",
      color: "rose"
    },
    {
      id: "draft",
      title: "Draft",
      body: "Margo keeps a few useful thoughts at the edge of your Mac.",
      color: "lemon"
    }
  ];

  const ui = {
    root: document.getElementById("prototype"),
    restRail: document.getElementById("rest-rail"),
    restDashes: document.getElementById("rest-dashes"),
    fan: document.getElementById("fan"),
    fanDeck: document.getElementById("fan-deck"),
    add: document.getElementById("add-note"),
    editor: document.getElementById("editor"),
    gutterLabel: document.getElementById("gutter-label"),
    title: document.getElementById("note-title"),
    body: document.getElementById("note-body"),
    save: document.getElementById("save-state"),
    swatches: document.getElementById("swatches"),
    remove: document.getElementById("delete-note"),
    close: document.getElementById("close-note"),
    reset: document.getElementById("reset-prototype"),
    stateButtons: [...document.querySelectorAll("[data-preview-state]")]
  };

  let notes = structuredClone(initialNotes);
  let selectedId = "groceries";
  let collapseTimer = 0;
  let saveTimer = 0;

  function selectedNote() {
    return notes.find(note => note.id === selectedId) || null;
  }

  function colorFor(id) {
    return palette.find(color => color.id === id) || palette[0];
  }

  function displayTitle(note) {
    const title = note?.title.trim();
    return title || "Untitled";
  }

  function applyPaper(note) {
    const color = colorFor(note.color);
    ui.editor.style.setProperty("--paper", color.paper);
    ui.editor.style.setProperty("--gutter", color.gutter);
    ui.editor.style.setProperty("--dash", color.dash);
    ui.editor.style.setProperty("--ink", color.ink);
  }

  function renderRest() {
    ui.restDashes.replaceChildren();
    notes.forEach(note => {
      const dash = document.createElement("span");
      dash.style.setProperty("--dash", colorFor(note.color).dash);
      ui.restDashes.append(dash);
    });
    ui.restRail.setAttribute("aria-label", notes.length ? `Show ${notes.length} Margo notes` : "Show Margo");
  }

  function makeTab(note, index) {
    const color = colorFor(note.color);
    const tab = document.createElement("button");
    const label = document.createElement("span");
    tab.type = "button";
    tab.className = "note-tab";
    tab.dataset.noteId = note.id;
    tab.style.setProperty("--paper", color.paper);
    tab.style.setProperty("--ink", color.ink);
    tab.style.setProperty("--dash", color.dash);
    tab.style.setProperty("--tab-index", index);
    tab.setAttribute("aria-label", `Open note, ${displayTitle(note)}`);
    label.textContent = displayTitle(note);
    tab.append(label);
    tab.addEventListener("click", () => selectNote(note.id, true));
    return tab;
  }

  function renderFan() {
    const availableHeight = Math.max(330, Math.min(500, window.innerHeight - 110));
    const pitch = notes.length > 1
      ? Math.min(106, Math.max(58, (availableHeight - 158) / (notes.length - 1)))
      : 106;
    ui.fan.style.setProperty("--tab-pitch", `${pitch}px`);
    ui.fan.style.setProperty("--tab-lap", `${118 - pitch}px`);
    ui.fanDeck.replaceChildren();
    notes.forEach((note, index) => ui.fanDeck.append(makeTab(note, index)));
    ui.add.disabled = notes.length >= 5;
    ui.add.title = ui.add.disabled ? "Margo holds up to five notes" : "New note";
  }

  function renderSwatches(note) {
    ui.swatches.replaceChildren();
    palette.forEach(color => {
      const swatch = document.createElement("button");
      swatch.type = "button";
      swatch.className = "swatch";
      swatch.style.setProperty("--swatch", color.dash);
      swatch.setAttribute("aria-label", `Set ${color.name.toLowerCase()} color`);
      swatch.setAttribute("aria-pressed", String(note.color === color.id));
      swatch.addEventListener("click", () => {
        note.color = color.id;
        applyPaper(note);
        renderRest();
        renderFan();
        renderSwatches(note);
        showSavingState();
      });
      ui.swatches.append(swatch);
    });
  }

  function renderEditor({ focus = false, focusTitle = false } = {}) {
    const note = selectedNote();
    if (!note) {
      setState("fan");
      return;
    }

    applyPaper(note);
    ui.title.value = note.title;
    ui.body.value = note.body;
    ui.gutterLabel.textContent = displayTitle(note);
    ui.editor.setAttribute("aria-label", `Open note, ${displayTitle(note)}`);
    renderSwatches(note);

    if (focus) {
      requestAnimationFrame(() => {
        const target = focusTitle ? ui.title : ui.body;
        target.focus();
        target.setSelectionRange(target.value.length, target.value.length);
      });
    }
  }

  function render(options = {}) {
    renderRest();
    renderFan();
    if (selectedNote()) renderEditor(options);
  }

  function updateStateControls() {
    const state = ui.root.dataset.state;
    ui.stateButtons.forEach(button => {
      button.setAttribute("aria-pressed", String(button.dataset.previewState === state));
    });
    ui.restRail.setAttribute("aria-hidden", String(state !== "rest"));
    ui.fan.setAttribute("aria-hidden", String(state !== "fan"));
    ui.editor.setAttribute("aria-hidden", String(state !== "open"));
  }

  function setState(state, { focus = false, focusTitle = false } = {}) {
    const allowed = ["rest", "fan", "open"];
    const nextState = allowed.includes(state) ? state : "rest";
    clearTimeout(collapseTimer);

    if (nextState === "open" && !selectedNote()) {
      ui.root.dataset.state = "fan";
    } else {
      ui.root.dataset.state = nextState;
    }

    updateStateControls();
    if (ui.root.dataset.state === "open") renderEditor({ focus, focusTitle });
  }

  function selectNote(id, focus = false) {
    if (!notes.some(note => note.id === id)) return;
    selectedId = id;
    renderEditor({ focus });
    setState("open", { focus });
  }

  function addNote() {
    if (notes.length >= 5) return;
    const color = palette[notes.length % palette.length];
    const note = {
      id: `new-note-${Date.now()}`,
      title: "",
      body: "",
      color: color.id
    };
    notes.push(note);
    selectedId = note.id;
    render({ focus: true, focusTitle: true });
    setState("open", { focus: true, focusTitle: true });
    ui.save.textContent = "New note";
  }

  function deleteNote() {
    const index = notes.findIndex(note => note.id === selectedId);
    if (index < 0) return;
    notes.splice(index, 1);
    const next = notes[Math.min(index, notes.length - 1)] || null;
    selectedId = next?.id || null;
    renderRest();
    renderFan();
    setState("fan");
  }

  function showSavingState() {
    ui.save.textContent = "Saving";
    clearTimeout(saveTimer);
    saveTimer = window.setTimeout(() => {
      ui.save.textContent = "Saved just now";
    }, 460);
  }

  function updateTitle() {
    const note = selectedNote();
    if (!note) return;
    note.title = ui.title.value;
    ui.gutterLabel.textContent = displayTitle(note);
    ui.editor.setAttribute("aria-label", `Open note, ${displayTitle(note)}`);
    renderFan();
    showSavingState();
  }

  function updateBody() {
    const note = selectedNote();
    if (!note) return;
    note.body = ui.body.value;
    showSavingState();
  }

  function reset() {
    notes = structuredClone(initialNotes);
    selectedId = "groceries";
    ui.save.textContent = "Saved just now";
    render();
    setState("open");
  }

  ui.restRail.addEventListener("pointerenter", () => setState("fan"));
  ui.restRail.addEventListener("click", () => setState("fan"));
  ui.fan.addEventListener("pointerenter", () => clearTimeout(collapseTimer));
  ui.fan.addEventListener("pointerleave", () => {
    collapseTimer = window.setTimeout(() => {
      if (ui.root.dataset.state === "fan") setState("rest");
    }, 420);
  });
  ui.add.addEventListener("click", addNote);
  ui.remove.addEventListener("click", deleteNote);
  ui.close.addEventListener("click", () => setState("fan"));
  ui.title.addEventListener("input", updateTitle);
  ui.body.addEventListener("input", updateBody);
  ui.reset.addEventListener("click", reset);
  window.addEventListener("resize", renderFan);

  ui.stateButtons.forEach(button => {
    button.addEventListener("click", () => setState(button.dataset.previewState));
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      if (ui.root.dataset.state === "open") setState("fan");
      else if (ui.root.dataset.state === "fan") setState("rest");
      return;
    }

    const isTyping = event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement;
    if (isTyping || event.metaKey || event.ctrlKey || event.altKey) return;
    const stateByKey = { "1": "rest", "2": "fan", "3": "open" };
    if (stateByKey[event.key]) setState(stateByKey[event.key]);
  });

  window.MargoPrototype = {
    setState,
    selectNote,
    reset,
    getSnapshot: () => ({
      state: ui.root.dataset.state,
      selectedId,
      notes: structuredClone(notes)
    })
  };

  render();
  const requestedState = new URLSearchParams(window.location.search).get("state");
  setState(["rest", "fan", "open"].includes(requestedState) ? requestedState : "open");
})();
