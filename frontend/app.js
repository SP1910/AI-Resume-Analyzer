// Frontend Logic for Resume Analyzer
const API_BASE = window.location.origin;

// DOM Elements
const resumeInput = document.getElementById("resumeInput");
const resumeDropzone = document.getElementById("resumeDropzone");
const resumePill = document.getElementById("resumePill");
const resumeFileName = document.getElementById("resumeFileName");
const resumeFileSize = document.getElementById("resumeFileSize");
const resumeRemoveBtn = document.getElementById("resumeRemoveBtn");

const jdInput = document.getElementById("jdInput");
const jdDropzone = document.getElementById("jdDropzone");
const jdPill = document.getElementById("jdPill");
const jdFileName = document.getElementById("jdFileName");
const jdFileSize = document.getElementById("jdFileSize");
const jdRemoveBtn = document.getElementById("jdRemoveBtn");

const analyzeBtn = document.getElementById("analyzeBtn");
const resultsSection = document.getElementById("resultsSection");
const exportPdfBtn = document.getElementById("exportPdfBtn");
const apiStatusDot = document.getElementById("apiStatusDot");
const apiStatusText = document.getElementById("apiStatusText");
const toastContainer = document.getElementById("toastContainer");

// File state
let selectedResume = null;
let selectedJd = null;

// Helpers
function formatBytes(bytes) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function showToast(message, type = "info") {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${type === "error" ? "⚠️" : "✓"}</span><span>${message}</span>`;
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(100%)";
    toast.style.transition = "all 0.3s ease";
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Health Check
async function checkApiHealth() {
  try {
    const response = await fetch(`${API_BASE}/health`);
    if (response.ok) {
      apiStatusDot.classList.add("online");
      apiStatusText.textContent = "Backend Online";
    } else {
      throw new Error();
    }
  } catch (err) {
    apiStatusDot.classList.remove("online");
    apiStatusText.textContent = "Backend Offline";
  }
}

// File drop/selection setup
function setupDropzone(dropzone, input, onFileSelected) {
  dropzone.addEventListener("click", () => input.click());

  dropzone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropzone.classList.add("dragover");
  });

  ["dragleave", "dragend"].forEach((event) => {
    dropzone.addEventListener(event, () => {
      dropzone.classList.remove("dragover");
    });
  });

  dropzone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropzone.classList.remove("dragover");
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0], onFileSelected);
    }
  });

  input.addEventListener("change", (e) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0], onFileSelected);
    }
  });
}

function validateAndSetFile(file, setter) {
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    showToast("Only PDF files are supported.", "error");
    return;
  }
  const maxMb = 10;
  if (file.size > maxMb * 1024 * 1024) {
    showToast(`File exceeds maximum size of ${maxMb}MB.`, "error");
    return;
  }
  setter(file);
  updateAnalyzeButtonState();
}

function updateAnalyzeButtonState() {
  analyzeBtn.disabled = !(selectedResume && selectedJd);
}

// Resume handlers
setupDropzone(resumeDropzone, resumeInput, (file) => {
  selectedResume = file;
  resumeFileName.textContent = file.name;
  resumeFileSize.textContent = formatBytes(file.size);
  resumePill.classList.add("active");
  resumeDropzone.style.display = "none";
});

resumeRemoveBtn.addEventListener("click", () => {
  selectedResume = null;
  resumeInput.value = "";
  resumePill.classList.remove("active");
  resumeDropzone.style.display = "block";
  updateAnalyzeButtonState();
});

// JD handlers
setupDropzone(jdDropzone, jdInput, (file) => {
  selectedJd = file;
  jdFileName.textContent = file.name;
  jdFileSize.textContent = formatBytes(file.size);
  jdPill.classList.add("active");
  jdDropzone.style.display = "none";
});

jdRemoveBtn.addEventListener("click", () => {
  selectedJd = null;
  jdInput.value = "";
  jdPill.classList.remove("active");
  jdDropzone.style.display = "block";
  updateAnalyzeButtonState();
});

// Analyze Click Handler
analyzeBtn.addEventListener("click", async () => {
  if (!selectedResume || !selectedJd) return;

  const formData = new FormData();
  formData.append("resume", selectedResume);
  formData.append("jd", selectedJd);

  analyzeBtn.classList.add("loading");
  analyzeBtn.disabled = true;

  try {
    const response = await fetch(`${API_BASE}/api/v1/analyze`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      let errorMsg = "Analysis request failed.";
      try {
        const errorData = await response.json();
        if (errorData.detail) {
          errorMsg = Array.isArray(errorData.detail)
            ? errorData.detail.map((e) => e.msg).join(", ")
            : errorData.detail;
        }
      } catch (_) {}
      throw new Error(errorMsg);
    }

    const data = await response.json();
    renderResults(data);
    showToast("Analysis completed successfully!", "success");

    // Scroll smoothly to results
    resultsSection.scrollIntoView({ behavior: "smooth" });
  } catch (error) {
    showToast(error.message, "error");
  } finally {
    analyzeBtn.classList.remove("loading");
    analyzeBtn.disabled = false;
  }
});

// Render Results
function renderResults(data) {
  resultsSection.classList.add("active");

  // Animate Circle & Score
  const score = data.match_score || 0;
  const scoreValue = document.getElementById("scoreValue");
  const scoreCircleFill = document.getElementById("scoreCircleFill");
  const scoreStatusTitle = document.getElementById("scoreStatusTitle");
  const scoreStatusDesc = document.getElementById("scoreStatusDesc");

  scoreValue.textContent = score;

  // Circumference: 2 * Math.PI * 50 = 314.16
  const circumference = 314.16;
  const offset = circumference - (score / 100) * circumference;
  scoreCircleFill.style.strokeDashoffset = offset;

  // Determine color & narrative
  if (score >= 75) {
    scoreCircleFill.style.stroke = "#10b981"; // green
    scoreStatusTitle.textContent = "Strong Candidate Match";
    scoreStatusTitle.style.color = "#065f46";
    scoreStatusDesc.textContent = "The candidate demonstrates strong alignment with core role qualifications and technical proficiencies.";
  } else if (score >= 50) {
    scoreCircleFill.style.stroke = "#f59e0b"; // yellow/orange
    scoreStatusTitle.textContent = "Moderate Fit with Potential";
    scoreStatusTitle.style.color = "#92400e";
    scoreStatusDesc.textContent = "The candidate meets several requirements but displays notable unverified skills or domain gaps.";
  } else {
    scoreCircleFill.style.stroke = "#ef4444"; // red
    scoreStatusTitle.textContent = "Low Alignment / High Skill Gaps";
    scoreStatusTitle.style.color = "#991b1b";
    scoreStatusDesc.textContent = "Significant mismatch between demonstrated resume experience and job requirements.";
  }

  // Populate Lists
  renderTags("strengthsList", "strengthsCount", data.strengths || [], "tag-strength", "✓");
  renderTags("missingList", "missingCount", data.missing_skills || [], "tag-gap", "✗");
  renderList("experienceList", "expCount", data.relavent_experience || []);
  renderList("improveList", "improveCount", data.improvement_areas || []);
  renderList("recommendationsList", "recCount", data.recommendations || []);
  renderQuestions(data.interview_questions || []);
}

function renderTags(containerId, countId, items, tagClass, prefix) {
  const container = document.getElementById(containerId);
  const count = document.getElementById(countId);
  count.textContent = items.length;
  container.innerHTML = "";

  if (items.length === 0) {
    container.innerHTML = '<span style="color: var(--slate-400); font-size: 0.85rem;">None identified</span>';
    return;
  }

  items.forEach((item) => {
    const tag = document.createElement("span");
    tag.className = `tag ${tagClass}`;
    tag.textContent = `${prefix} ${item}`;
    container.appendChild(tag);
  });
}

function renderList(containerId, countId, items) {
  const container = document.getElementById(containerId);
  const count = document.getElementById(countId);
  count.textContent = items.length;
  container.innerHTML = "";

  if (items.length === 0) {
    container.innerHTML = '<li style="color: var(--slate-400);">None listed</li>';
    return;
  }

  items.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    container.appendChild(li);
  });
}

function renderQuestions(questions) {
  const container = document.getElementById("questionsContainer");
  const count = document.getElementById("questionsCount");
  count.textContent = questions.length;
  container.innerHTML = "";

  if (questions.length === 0) {
    container.innerHTML = '<p style="color: var(--slate-400); font-size: 0.9rem;">No questions generated.</p>';
    return;
  }

  questions.forEach((q, index) => {
    const item = document.createElement("div");
    item.className = "question-item";

    const text = document.createElement("div");
    text.className = "question-text";
    text.textContent = `${index + 1}. ${q}`;

    const copyBtn = document.createElement("button");
    copyBtn.className = "copy-btn";
    copyBtn.textContent = "📋 Copy";
    copyBtn.addEventListener("click", () => {
      navigator.clipboard.writeText(q);
      copyBtn.textContent = "Copied!";
      setTimeout(() => (copyBtn.textContent = "📋 Copy"), 2000);
    });

    item.appendChild(text);
    item.appendChild(copyBtn);
    container.appendChild(item);
  });
}

// Print / Export PDF
exportPdfBtn.addEventListener("click", () => {
  window.print();
});

// Initialize
checkApiHealth();
setInterval(checkApiHealth, 30000);
