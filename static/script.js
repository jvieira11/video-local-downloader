let currentUrl = "";
let selectedFormat = null;

const urlInput  = document.getElementById("url-input");
const fetchBtn  = document.getElementById("fetch-btn");
const spinner   = document.getElementById("spinner");
const errorMsg  = document.getElementById("error-msg");
const videoInfo = document.getElementById("video-info");
const dlBtn     = document.getElementById("download-btn");
const progressW = document.getElementById("progress-wrap");
const progressL = document.getElementById("progress-label");

urlInput.addEventListener("keydown", e => { if (e.key === "Enter") fetchInfo(); });
urlInput.addEventListener("input", () => resetState());

function showError(msg) { errorMsg.textContent = msg; errorMsg.classList.add("show"); }
function hideError() { errorMsg.classList.remove("show"); }

function resetState() {
  hideError();
  videoInfo.classList.remove("show");
  selectedFormat = null;
  dlBtn.disabled = true;
  progressW.classList.remove("show");
}

async function fetchInfo() {
  const url = urlInput.value.trim();
  if (!url) { showError("Cole um link antes de buscar."); return; }

  resetState();
  fetchBtn.disabled = true;
  spinner.classList.add("show");

  try {
    const res = await fetch("/info", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url })
    });
    const data = await res.json();
    if (!res.ok) { showError(data.error || "Erro ao buscar vídeo."); return; }
    currentUrl = url;
    renderInfo(data);
  } catch (e) {
    showError("Erro de conexão. O servidor está rodando?");
  } finally {
    spinner.classList.remove("show");
    fetchBtn.disabled = false;
  }
}

function renderInfo(data) {
  document.getElementById("thumb").src = data.thumbnail || "";
  document.getElementById("video-title").textContent = data.title || "Sem título";
  document.getElementById("video-details").textContent =
    [data.uploader, data.duration].filter(Boolean).join(" · ");

  const grid = document.getElementById("video-formats");
  grid.innerHTML = "";

  if (!data.formats || data.formats.length === 0) {
    grid.innerHTML = '<span style="font-size:.82rem;color:var(--muted)">Nenhum formato encontrado.</span>';
  } else {
    data.formats.forEach(f => {
      const btn = document.createElement("button");
      btn.className = "fmt-btn";
      btn.textContent = f.label;
      btn.onclick = () => selectFormat(f.height, btn);
      grid.appendChild(btn);
    });
  }

  videoInfo.classList.add("show");
}

function selectFormat(fmt, btn) {
  document.querySelectorAll(".fmt-btn").forEach(b => b.classList.remove("selected"));
  btn.classList.add("selected");
  selectedFormat = fmt;
  dlBtn.disabled = false;
  progressW.classList.remove("show");
}

async function startDownload() {
  if (!selectedFormat || !currentUrl) return;

  dlBtn.disabled = true;
  progressW.classList.add("show");
  progressL.textContent = "Baixando… (pode demorar alguns segundos)";

  try {
    const res = await fetch("/download", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: currentUrl, format: String(selectedFormat) })
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      showError(data.error || "Falha no download.");
      progressW.classList.remove("show");
      dlBtn.disabled = false;
      return;
    }

    const contentDisposition = res.headers.get("Content-Disposition") || "";
    let filename = "download";
    const match = contentDisposition.match(/filename\*?=["']?(?:UTF-8'')?([^;"'\n]+)/i);
    if (match) filename = decodeURIComponent(match[1].replace(/['"]/g, ""));

    const blob = await res.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(a.href);

    progressL.textContent = "✅ Download concluído!";
  } catch (e) {
    showError("Erro durante o download.");
    progressW.classList.remove("show");
  } finally {
    dlBtn.disabled = false;
  }
}