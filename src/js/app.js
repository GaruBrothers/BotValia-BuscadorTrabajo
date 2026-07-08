import { defaultCV, defaultJobs } from './data.js';
import { calculateMatch, optimizeCV, generateCoverLetter, generateInterviewPrep } from './ai.js';

// Application State
let state = {
  cv: null,
  jobs: [],
  apiConfig: {
    provider: 'mock',
    key: '',
    model: ''
  },
  selectedJobId: null,
  statusChart: null
};

// ==========================================================================
// INITIALIZATION
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  initLocalStorage();
  setupNavigation();
  setupEventListeners();
  renderAll();
});

function initLocalStorage() {
  const storedCv = localStorage.getItem('botvalia_cv');
  const storedJobs = localStorage.getItem('botvalia_jobs');
  const storedConfig = localStorage.getItem('botvalia_config');

  if (storedCv) state.cv = JSON.parse(storedCv);
  if (storedJobs) state.jobs = JSON.parse(storedJobs);
  if (storedConfig) state.apiConfig = JSON.parse(storedConfig);

  // Default API setup if empty
  if (!state.apiConfig || !state.apiConfig.provider) {
    state.apiConfig = { provider: 'mock', key: '', model: '' };
  }
}

// ==========================================================================
// NAVIGATION (SPA TABS)
// ==========================================================================
function setupNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  const tabPanels = document.querySelectorAll('.tab-panel');

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const targetTab = item.getAttribute('data-tab');
      
      // Update sidebar active status
      navItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');

      // Update panel visibility
      tabPanels.forEach(panel => {
        if (panel.id === `tab-${targetTab}`) {
          panel.classList.add('active');
        } else {
          panel.classList.remove('active');
        }
      });

      // Special action upon loading certain tabs
      if (targetTab === 'tools') {
        syncToolsTab();
      }
    });
  });

  // Shortcut hooks
  document.getElementById('btn-add-job-shortcut').addEventListener('click', () => {
    triggerTabNavigation('jobs');
  });

  document.getElementById('btn-edit-cv-shortcut').addEventListener('click', () => {
    triggerTabNavigation('cv');
  });
}

function triggerTabNavigation(tabName) {
  const navItem = document.querySelector(`.nav-item[data-tab="${tabName}"]`);
  if (navItem) navItem.click();
}

// ==========================================================================
// EVENT LISTENERS
// ==========================================================================
function setupEventListeners() {
  // Demo Mode
  document.getElementById('btn-demo-mode').addEventListener('click', loadDemoData);

  // CV Form
  document.getElementById('form-cv').addEventListener('submit', handleCVSubmit);
  document.getElementById('btn-clear-cv').addEventListener('click', handleCVClear);

  // Job Form
  document.getElementById('form-job').addEventListener('submit', handleJobSubmit);
  document.getElementById('btn-cancel-job-edit').addEventListener('click', resetJobForm);

  // Match Action
  document.getElementById('btn-run-match').addEventListener('click', handleCalculateMatch);

  // Subtab navigation within Match Results
  const matchResultPills = document.querySelectorAll('.match-details-tabs .pill');
  matchResultPills.forEach(pill => {
    pill.addEventListener('click', () => {
      matchResultPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');

      const targetSubtab = pill.getAttribute('data-subtab');
      const subpanels = document.querySelectorAll('.pill-panels .subtab-panel');
      subpanels.forEach(panel => {
        if (panel.id === `subtab-${targetSubtab}`) {
          panel.classList.add('active');
        } else {
          panel.classList.remove('active');
        }
      });
    });
  });

  // Settings Form
  document.getElementById('form-settings').addEventListener('submit', handleSettingsSubmit);
  
  // Settings Form API provider radios - toggle fields visibility
  const providerRadios = document.querySelectorAll('input[name="ai-provider"]');
  providerRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      updateSettingsFieldsVisibility(radio.value);
    });
  });

  // Quick Action Buttons inside Match Results
  document.getElementById('btn-quick-cv').addEventListener('click', () => {
    syncToolsSelectedJob();
    triggerTabNavigation('tools');
    switchToolPanel('cv-improve');
  });

  document.getElementById('btn-quick-letter').addEventListener('click', () => {
    syncToolsSelectedJob();
    triggerTabNavigation('tools');
    switchToolPanel('cover-letter');
  });

  document.getElementById('btn-quick-coach').addEventListener('click', () => {
    syncToolsSelectedJob();
    triggerTabNavigation('tools');
    switchToolPanel('interview-prep');
  });

  // Tools Tab Switchers
  const toolTabBtns = document.querySelectorAll('.tool-tab-btn');
  toolTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      toolTabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const targetTool = btn.getAttribute('data-tool');
      switchToolPanel(targetTool);
    });
  });

  // Tool Action triggers
  document.getElementById('btn-generate-cv-tailor').addEventListener('click', handleCVTailorGenerate);
  document.getElementById('btn-generate-cover-letter').addEventListener('click', handleCoverLetterGenerate);
  document.getElementById('btn-generate-interview').addEventListener('click', handleInterviewPrepGenerate);
  document.getElementById('btn-copy-cover-letter').addEventListener('click', handleCopyCoverLetter);

  // Sync tools select switch
  document.getElementById('tools-select-job').addEventListener('change', (e) => {
    const jobId = e.target.value;
    if (jobId) {
      state.selectedJobId = jobId;
      updateToolsSelectedJobDetails();
    }
  });

  // Connector Toggle Switches
  document.querySelectorAll('.connector-toggle').forEach(toggle => {
    toggle.addEventListener('change', (e) => {
      const portal = e.target.getAttribute('data-portal');
      const card = e.target.closest('.connector-card');
      const statusEl = document.getElementById(`status-${portal}`);
      if (e.target.checked) {
        card.classList.add('active');
        statusEl.innerHTML = '<i class="fa-solid fa-circle text-green"></i> Active';
      } else {
        card.classList.remove('active');
        statusEl.innerHTML = '<i class="fa-solid fa-circle"></i> Disabled';
      }
    });
  });

  // File Upload for CV
  setupFileUpload();
}

// ==========================================================================
// FORM SUBMISSIONS & DATA TRANSITIONS
// ==========================================================================

function loadDemoData() {
  state.cv = defaultCV;
  state.jobs = [...defaultJobs];
  
  localStorage.setItem('botvalia_cv', JSON.stringify(state.cv));
  localStorage.setItem('botvalia_jobs', JSON.stringify(state.jobs));
  
  renderAll();
  showToast("Demo datasets successfully loaded!");
}

function handleCVSubmit(e) {
  e.preventDefault();
  const cvData = {
    fullName: document.getElementById('cv-full-name').value.trim(),
    title: document.getElementById('cv-title').value.trim(),
    skills: document.getElementById('cv-skills').value.trim(),
    body: document.getElementById('cv-body').value.trim()
  };

  state.cv = cvData;
  localStorage.setItem('botvalia_cv', JSON.stringify(cvData));
  
  renderCVDetails();
  renderDashboard();
  showToast("CV profile updated successfully.");
}

function handleCVClear() {
  if (confirm("Are you sure you want to clear your local CV profile?")) {
    state.cv = null;
    localStorage.removeItem('botvalia_cv');
    document.getElementById('form-cv').reset();
    document.getElementById('upload-zone').classList.remove('has-file');
    renderCVDetails();
    renderDashboard();
    showToast("CV profile cleared.");
  }
}

// ==========================================================================
// FILE UPLOAD (CV Parsing)
// ==========================================================================
function setupFileUpload() {
  const uploadZone = document.getElementById('upload-zone');
  const fileInput = document.getElementById('cv-file-input');

  uploadZone.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleFileSelect(e.target.files[0]);
    }
    fileInput.value = '';
  });

  uploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadZone.classList.add('drag-over');
  });

  uploadZone.addEventListener('dragleave', () => {
    uploadZone.classList.remove('drag-over');
  });

  uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadZone.classList.remove('drag-over');
    if (e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  });
}

async function handleFileSelect(file) {
  const ext = file.name.split('.').pop().toLowerCase();
  const progress = document.getElementById('upload-progress');
  const status = document.getElementById('upload-status');
  const uploadZone = document.getElementById('upload-zone');

  progress.classList.remove('hidden');
  status.innerText = `Parsing ${file.name}...`;

  try {
    let text = '';
    if (ext === 'txt') {
      text = await parseTxtFile(file);
    } else if (ext === 'pdf') {
      text = await parsePdfFile(file);
    } else {
      showToast('Unsupported file type. Please upload a .txt or .pdf file.');
      progress.classList.add('hidden');
      return;
    }

    if (text) {
      document.getElementById('cv-body').value = text;
      uploadZone.classList.add('has-file');
      showToast(`CV content extracted from ${file.name}`);
    }
  } catch (err) {
    showToast('Error parsing file: ' + err.message);
  } finally {
    progress.classList.add('hidden');
  }
}

function parseTxtFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

async function parsePdfFile(file) {
  if (typeof pdfjsLib === 'undefined') {
    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js');
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  }

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items.map(item => item.str).join(' ');
    fullText += pageText + '\n\n';
  }

  return fullText.trim();
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(script);
  });
}

function handleJobSubmit(e) {
  e.preventDefault();
  const jobId = document.getElementById('job-id').value;
  const jobData = {
    id: jobId || 'job-' + Date.now(),
    title: document.getElementById('job-title').value.trim(),
    company: document.getElementById('job-company').value.trim(),
    url: document.getElementById('job-url').value.trim(),
    status: document.getElementById('job-status').value,
    description: document.getElementById('job-description').value.trim()
  };

  if (jobId) {
    // Edit existing
    state.jobs = state.jobs.map(j => j.id === jobId ? jobData : j);
    showToast("Job vacancy modified.");
  } else {
    // Add new
    state.jobs.push(jobData);
    showToast("New job added successfully.");
  }

  localStorage.setItem('botvalia_jobs', JSON.stringify(state.jobs));
  resetJobForm();
  renderJobsTab();
  renderDashboard();
}

function resetJobForm() {
  document.getElementById('form-job').reset();
  document.getElementById('job-id').value = '';
  document.getElementById('job-form-title').innerHTML = '<i class="fa-solid fa-circle-plus"></i> Add Job Offer';
  document.getElementById('btn-save-job').innerHTML = '<i class="fa-solid fa-plus-circle"></i> Add Job to Tracker';
  document.getElementById('btn-cancel-job-edit').classList.add('hidden');
}

function handleJobEdit(jobId) {
  const job = state.jobs.find(j => j.id === jobId);
  if (!job) return;

  document.getElementById('job-id').value = job.id;
  document.getElementById('job-title').value = job.title;
  document.getElementById('job-company').value = job.company;
  document.getElementById('job-url').value = job.url || '';
  document.getElementById('job-status').value = job.status;
  document.getElementById('job-description').value = job.description;

  document.getElementById('job-form-title').innerHTML = '<i class="fa-solid fa-edit"></i> Edit Job Offer';
  document.getElementById('btn-save-job').innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Save Changes';
  document.getElementById('btn-cancel-job-edit').classList.remove('hidden');

  // Scroll to job form
  document.getElementById('form-job').scrollIntoView({ behavior: 'smooth' });
}

function handleJobDelete(jobId) {
  if (confirm("Remove this job posting from your list?")) {
    state.jobs = state.jobs.filter(j => j.id !== jobId);
    localStorage.setItem('botvalia_jobs', JSON.stringify(state.jobs));
    renderJobsTab();
    renderDashboard();
    showToast("Job removed.");
  }
}

function handleSettingsSubmit(e) {
  e.preventDefault();
  
  const provider = document.querySelector('input[name="ai-provider"]:checked').value;
  const config = {
    provider: provider,
    key: provider === 'gemini' ? document.getElementById('setting-gemini-key').value : document.getElementById('setting-openai-key').value,
    model: provider === 'gemini' ? document.getElementById('setting-gemini-model').value : document.getElementById('setting-openai-model').value
  };

  state.apiConfig = config;
  localStorage.setItem('botvalia_config', JSON.stringify(config));
  
  updateAPIIndicator();
  showToast("AI configuration saved.");
}

function updateSettingsFieldsVisibility(provider) {
  // If provider is mock, disable fields, otherwise enable appropriate inputs
  const geminiFields = document.querySelector('.settings-option:nth-of-type(2) .settings-fields');
  const openaiFields = document.querySelector('.settings-option:nth-of-type(3) .settings-fields');

  if (provider === 'gemini') {
    geminiFields.style.opacity = '1';
    geminiFields.style.pointerEvents = 'auto';
    openaiFields.style.opacity = '0.5';
    openaiFields.style.pointerEvents = 'none';
  } else if (provider === 'openai') {
    openaiFields.style.opacity = '1';
    openaiFields.style.pointerEvents = 'auto';
    geminiFields.style.opacity = '0.5';
    geminiFields.style.pointerEvents = 'none';
  } else {
    // mock
    geminiFields.style.opacity = '0.5';
    geminiFields.style.pointerEvents = 'none';
    openaiFields.style.opacity = '0.5';
    openaiFields.style.pointerEvents = 'none';
  }
}

// ==========================================================================
// CORE AI RUNNERS
// ==========================================================================

async function handleCalculateMatch() {
  const jobId = document.getElementById('match-select-job').value;
  if (!jobId) {
    alert("Please select a job vacancy to analyze.");
    return;
  }
  if (!state.cv) {
    alert("You must define a CV profile first. Go to 'My CV Profile'.");
    return;
  }

  const job = state.jobs.find(j => j.id === jobId);
  state.selectedJobId = jobId;

  const btn = document.getElementById('btn-run-match');
  const prevHtml = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Analyzing...';

  const resultsPanel = document.getElementById('match-results-panel');
  resultsPanel.classList.add('hidden');

  try {
    const analysis = await calculateMatch(state.cv, job, state.apiConfig);
    
    // Save match calculations locally
    job.matchScore = analysis.score;
    job.matchDetails = analysis;
    localStorage.setItem('botvalia_jobs', JSON.stringify(state.jobs));
    
    // Render Results
    renderMatchResults(analysis);
    renderDashboard();
    
    resultsPanel.classList.remove('hidden');
    resultsPanel.scrollIntoView({ behavior: 'smooth' });
    showToast("Match calculation complete!");
  } catch (error) {
    alert("AI Analysis Error: " + error.message);
  } finally {
    btn.disabled = false;
    btn.innerHTML = prevHtml;
  }
}

function renderMatchResults(analysis) {
  // Score details
  const scoreBadge = document.getElementById('match-score-badge');
  const fill = document.getElementById('match-progress-fill');
  const summaryText = document.getElementById('match-summary-text');
  
  scoreBadge.innerText = `${analysis.score}%`;
  fill.style.width = `${analysis.score}%`;
  summaryText.innerText = analysis.summary || "";

  // Lists formatting
  const gapsList = document.getElementById('match-gaps-list');
  const strengthsList = document.getElementById('match-strengths-list');
  const tipsList = document.getElementById('match-tips-list');

  gapsList.innerHTML = (analysis.gaps || []).map(g => `<li>${g}</li>`).join('');
  strengthsList.innerHTML = (analysis.strengths || []).map(s => `<li>${s}</li>`).join('');
  tipsList.innerHTML = (analysis.tips || []).map(t => `<li>${t}</li>`).join('');
}

// --------------------------------------------------------------------------
// Sub-tools trigger handlers
// --------------------------------------------------------------------------
async function handleCVTailorGenerate() {
  const job = getSelectedToolJob();
  if (!job) return;

  const placeholder = document.getElementById('cv-tailor-placeholder');
  const loading = document.getElementById('cv-tailor-loading');
  const output = document.getElementById('cv-tailor-output');
  const btn = document.getElementById('btn-generate-cv-tailor');

  btn.disabled = true;
  placeholder.classList.add('hidden');
  loading.classList.remove('hidden');
  output.classList.add('hidden');

  try {
    const text = await optimizeCV(state.cv, job, state.apiConfig);
    output.innerHTML = parseMarkdown(text);
    output.classList.remove('hidden');
  } catch (err) {
    alert(err.message);
    placeholder.classList.remove('hidden');
  } finally {
    loading.classList.add('hidden');
    btn.disabled = false;
  }
}

async function handleCoverLetterGenerate() {
  const job = getSelectedToolJob();
  if (!job) return;

  const placeholder = document.getElementById('cover-letter-placeholder');
  const loading = document.getElementById('cover-letter-loading');
  const wrapper = document.getElementById('cover-letter-wrapper');
  const outputText = document.getElementById('cover-letter-output');
  const btn = document.getElementById('btn-generate-cover-letter');
  const tone = document.getElementById('cover-letter-tone').value;

  btn.disabled = true;
  placeholder.classList.add('hidden');
  loading.classList.remove('hidden');
  wrapper.classList.add('hidden');

  try {
    const text = await generateCoverLetter(state.cv, job, tone, state.apiConfig);
    outputText.value = text;
    wrapper.classList.remove('hidden');
  } catch (err) {
    alert(err.message);
    placeholder.classList.remove('hidden');
  } finally {
    loading.classList.add('hidden');
    btn.disabled = false;
  }
}

async function handleInterviewPrepGenerate() {
  const job = getSelectedToolJob();
  if (!job) return;

  const placeholder = document.getElementById('interview-placeholder');
  const loading = document.getElementById('interview-loading');
  const output = document.getElementById('interview-output');
  const btn = document.getElementById('btn-generate-interview');

  btn.disabled = true;
  placeholder.classList.add('hidden');
  loading.classList.remove('hidden');
  output.classList.add('hidden');

  try {
    const text = await generateInterviewPrep(state.cv, job, state.apiConfig);
    output.innerHTML = parseMarkdown(text);
    output.classList.remove('hidden');
  } catch (err) {
    alert(err.message);
    placeholder.classList.remove('hidden');
  } finally {
    loading.classList.add('hidden');
    btn.disabled = false;
  }
}

function handleCopyCoverLetter() {
  const copyText = document.getElementById('cover-letter-output');
  copyText.select();
  copyText.setSelectionRange(0, 99999); // Mobile
  navigator.clipboard.writeText(copyText.value);
  showToast("Cover letter copied to clipboard!");
}

function getSelectedToolJob() {
  if (!state.selectedJobId) {
    alert("Please select a job first.");
    return null;
  }
  const job = state.jobs.find(j => j.id === state.selectedJobId);
  if (!job) {
    alert("Selected job not found.");
  }
  return job;
}

// ==========================================================================
// RENDERERS & DATA BINDING
// ==========================================================================

function renderAll() {
  updateAPIIndicator();
  renderCVDetails();
  renderJobsTab();
  renderSettingsForm();
  renderDashboard();
}

function updateAPIIndicator() {
  const indicator = document.getElementById('api-status-indicator');
  const config = state.apiConfig;

  if (config.provider === 'mock') {
    indicator.className = 'api-status status-warning';
    indicator.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Mock AI Mode Active';
  } else {
    indicator.className = 'api-status status-success';
    indicator.innerHTML = `<i class="fa-solid fa-circle-check"></i> Connected: ${config.provider.toUpperCase()} (${config.model})`;
  }
}

function renderCVDetails() {
  const fullName = document.getElementById('cv-full-name');
  const title = document.getElementById('cv-title');
  const skills = document.getElementById('cv-skills');
  const body = document.getElementById('cv-body');
  
  const summaryBox = document.getElementById('dash-cv-preview');
  const statCvStatus = document.getElementById('stat-cv-status');

  if (state.cv) {
    fullName.value = state.cv.fullName || '';
    title.value = state.cv.title || '';
    skills.value = state.cv.skills || '';
    body.value = state.cv.body || '';

    statCvStatus.innerText = "Configured";
    statCvStatus.className = 'stat-value text-green';

    summaryBox.innerHTML = `
      <h4>${state.cv.fullName}</h4>
      <p class="role-badge">${state.cv.title}</p>
      <div class="skills-mini-list">
        ${state.cv.skills.split(',').slice(0, 6).map(s => `<span class="badge badge-secondary">${s.trim()}</span>`).join(' ')}
        ${state.cv.skills.split(',').length > 6 ? '<span class="text-muted text-xs">+more</span>' : ''}
      </div>
    `;
  } else {
    fullName.value = '';
    title.value = '';
    skills.value = '';
    body.value = '';

    statCvStatus.innerText = "Not Set";
    statCvStatus.className = 'stat-value text-muted';
    summaryBox.innerHTML = '<p class="text-muted">No resume uploaded. Go to the "My CV Profile" tab to add your professional profile details.</p>';
  }
}

function renderJobsTab() {
  const container = document.getElementById('jobs-list-container');
  const selectMatch = document.getElementById('match-select-job');
  const selectTools = document.getElementById('tools-select-job');

  // Build vacancies dropdowns
  const optionsHtml = ['<option value="">-- Choose a job --</option>']
    .concat(state.jobs.map(j => `<option value="${j.id}">${j.title} (${j.company})</option>`))
    .join('');

  selectMatch.innerHTML = optionsHtml;
  selectTools.innerHTML = ['<option value="">-- Switch job --</option>']
    .concat(state.jobs.map(j => `<option value="${j.id}">${j.title} (${j.company})</option>`))
    .join('');

  // Set values if selected
  if (state.selectedJobId) {
    selectMatch.value = state.selectedJobId;
    selectTools.value = state.selectedJobId;
  }

  // Draw list cards
  if (state.jobs.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fa-solid fa-briefcase"></i>
        <p>No jobs added yet. Use the form on the left or load the demo data to populate this dashboard.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = state.jobs.map(job => {
    let scoreBadge = '';
    if (job.matchScore !== undefined) {
      const levelClass = job.matchScore > 80 ? 'badge-success' : job.matchScore > 50 ? 'badge-warning' : 'badge-danger';
      scoreBadge = `<span class="badge ${levelClass}">${job.matchScore}% Match</span>`;
    }

    const statusLevel = job.status === 'Offer' ? 'badge-success' : job.status === 'Rejected' ? 'badge-danger' : job.status === 'Interviewing' ? 'badge-primary' : 'badge-secondary';

    return `
      <div class="job-card" data-id="${job.id}">
        <div class="job-info">
          <h4>${job.title}</h4>
          <div class="job-meta">
            <strong>${job.company}</strong>
            <span class="badge ${statusLevel}">${job.status}</span>
            ${scoreBadge}
          </div>
        </div>
        <div class="job-actions">
          <button class="btn btn-secondary btn-xs btn-edit-job" data-id="${job.id}">
            <i class="fa-solid fa-pen"></i>
          </button>
          <button class="btn btn-danger-outline btn-xs btn-delete-job" data-id="${job.id}">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </div>
    `;
  }).join('');

  // Bind actions manually since cards are dynamically rendered
  container.querySelectorAll('.btn-edit-job').forEach(btn => {
    btn.addEventListener('click', () => handleJobEdit(btn.getAttribute('data-id')));
  });

  container.querySelectorAll('.btn-delete-job').forEach(btn => {
    btn.addEventListener('click', () => handleJobDelete(btn.getAttribute('data-id')));
  });
}

function renderSettingsForm() {
  const config = state.apiConfig;
  
  // Set Radio Checked
  const radio = document.querySelector(`input[name="ai-provider"][value="${config.provider}"]`);
  if (radio) radio.checked = true;

  // Set Inputs
  if (config.provider === 'gemini') {
    document.getElementById('setting-gemini-key').value = config.key || '';
    document.getElementById('setting-gemini-model').value = config.model || 'gemini-1.5-flash';
    document.getElementById('setting-openai-key').value = '';
  } else if (config.provider === 'openai') {
    document.getElementById('setting-openai-key').value = config.key || '';
    document.getElementById('setting-openai-model').value = config.model || 'gpt-4o-mini';
    document.getElementById('setting-gemini-key').value = '';
  } else {
    // mock
    document.getElementById('setting-gemini-key').value = '';
    document.getElementById('setting-openai-key').value = '';
  }

  updateSettingsFieldsVisibility(config.provider);
}

function renderDashboard() {
  // Update numbers
  document.getElementById('stat-total-jobs').innerText = state.jobs.length;

  const scoredJobs = state.jobs.filter(j => j.matchScore !== undefined);
  if (scoredJobs.length > 0) {
    const maxScore = Math.max(...scoredJobs.map(j => j.matchScore));
    document.getElementById('stat-avg-match').innerText = `${maxScore}%`;
  } else {
    document.getElementById('stat-avg-match').innerText = '0%';
  }

  const tableBody = document.querySelector('#dashboard-jobs-table tbody');

  if (state.jobs.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="5" class="table-empty">
          <i class="fa-regular fa-folder-open"></i>
          <p>No jobs added yet. Use the Job Tracker to add job postings, or click <strong>Load Demo Data</strong> above to explore.</p>
        </td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = state.jobs.map(job => {
    let scoreDisplay = '<span class="text-muted">Not Analyzed</span>';
    if (job.matchScore !== undefined) {
      const level = job.matchScore > 80 ? 'badge-success' : job.matchScore > 50 ? 'badge-warning' : 'badge-danger';
      scoreDisplay = `<span class="badge ${level}">${job.matchScore}% Match</span>`;
    }

    const statusLevel = job.status === 'Offer' ? 'badge-success' : job.status === 'Rejected' ? 'badge-danger' : job.status === 'Interviewing' ? 'badge-primary' : 'badge-secondary';

    return `
      <tr>
        <td><strong>${job.title}</strong></td>
        <td>${job.company}</td>
        <td><span class="badge ${statusLevel}">${job.status}</span></td>
        <td>${scoreDisplay}</td>
        <td>
          <button class="btn btn-secondary btn-xs btn-dash-analyze" data-id="${job.id}">
            <i class="fa-solid fa-gauge-high"></i> Analyze
          </button>
        </td>
      </tr>
    `;
  }).join('');

  tableBody.querySelectorAll('.btn-dash-analyze').forEach(btn => {
    btn.addEventListener('click', () => {
      const jobId = btn.getAttribute('data-id');
      state.selectedJobId = jobId;
      document.getElementById('match-select-job').value = jobId;
      triggerTabNavigation('match');
      
      // If already analyzed, trigger rendering results, otherwise prompt action
      const job = state.jobs.find(j => j.id === jobId);
      if (job && job.matchDetails) {
        renderMatchResults(job.matchDetails);
        document.getElementById('match-results-panel').classList.remove('hidden');
      } else {
        document.getElementById('match-results-panel').classList.add('hidden');
      }
    });
  });

  // Render/Update status charts
  updateStatusChart();
}

function updateStatusChart() {
  const ctx = document.getElementById('status-chart');
  if (!ctx) return;

  const counts = {
    Interested: 0,
    Applied: 0,
    Interviewing: 0,
    Offer: 0,
    Rejected: 0
  };

  state.jobs.forEach(job => {
    if (counts[job.status] !== undefined) {
      counts[job.status]++;
    }
  });

  const dataValues = [
    counts.Interested,
    counts.Applied,
    counts.Interviewing,
    counts.Offer,
    counts.Rejected
  ];

  if (state.statusChart) {
    state.statusChart.data.datasets[0].data = dataValues;
    state.statusChart.update();
  } else {
    if (typeof Chart === 'undefined') {
      console.warn("Chart.js is not loaded yet.");
      return;
    }

    state.statusChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Interested', 'Applied', 'Interviewing', 'Offer', 'Rejected'],
        datasets: [{
          data: dataValues,
          backgroundColor: [
            'rgba(156, 163, 175, 0.25)',
            'rgba(59, 130, 246, 0.25)',
            'rgba(139, 92, 246, 0.25)',
            'rgba(16, 185, 129, 0.25)',
            'rgba(239, 68, 68, 0.25)'
          ],
          borderColor: [
            'rgba(156, 163, 175, 0.8)',
            'rgba(59, 130, 246, 0.8)',
            'rgba(139, 92, 246, 0.8)',
            'rgba(16, 185, 129, 0.8)',
            'rgba(239, 68, 68, 0.8)'
          ],
          borderWidth: 1.5
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#9ca3af',
              font: {
                family: 'Inter',
                size: 11
              },
              boxWidth: 12,
              padding: 10
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return ` ${context.label}: ${context.raw} vacancies`;
              }
            }
          }
        }
      }
    });
  }
}

// Syncing functions across tabs
function syncToolsTab() {
  const selector = document.getElementById('tools-select-job');
  selector.value = state.selectedJobId || '';
  updateToolsSelectedJobDetails();
}

function syncToolsSelectedJob() {
  // Sets selection in tools select
  const selectTools = document.getElementById('tools-select-job');
  if (selectTools) selectTools.value = state.selectedJobId || '';
}

function updateToolsSelectedJobDetails() {
  const jobTitle = document.getElementById('tool-selected-job-title');
  const jobCompany = document.getElementById('tool-selected-job-company');

  if (state.selectedJobId) {
    const job = state.jobs.find(j => j.id === state.selectedJobId);
    if (job) {
      jobTitle.innerText = job.title;
      jobCompany.innerText = `Preparing optimization materials for: ${job.company}`;
      
      // Reset panel contents to trigger fresh generations or clear past entries
      resetToolPanels();
      return;
    }
  }

  jobTitle.innerText = "No job selected";
  jobCompany.innerText = "Please select a vacancy in the Match Center or from the dropdown.";
  resetToolPanels();
}

function resetToolPanels() {
  document.getElementById('cv-tailor-placeholder').classList.remove('hidden');
  document.getElementById('cv-tailor-output').classList.add('hidden');
  document.getElementById('cv-tailor-loading').classList.add('hidden');

  document.getElementById('cover-letter-placeholder').classList.remove('hidden');
  document.getElementById('cover-letter-wrapper').classList.add('hidden');
  document.getElementById('cover-letter-loading').classList.add('hidden');

  document.getElementById('interview-placeholder').classList.remove('hidden');
  document.getElementById('interview-output').classList.add('hidden');
  document.getElementById('interview-loading').classList.add('hidden');
}

function switchToolPanel(toolName) {
  // Hide all panels
  document.querySelectorAll('.tool-panel').forEach(p => p.classList.remove('active'));
  // Show active panel
  document.getElementById(`tool-panel-${toolName}`).classList.add('active');

  // Sync sidebar active button state
  document.querySelectorAll('.tool-tab-btn').forEach(btn => {
    if (btn.getAttribute('data-tool') === toolName) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

// ==========================================================================
// TOAST NOTIFICATIONS
// ==========================================================================
function showToast(message) {
  const toast = document.getElementById('toast');
  const msgSpan = document.getElementById('toast-message');

  msgSpan.innerText = message;
  toast.classList.remove('hidden');

  // Clear previous timeouts if click-spamming
  if (window.toastTimeout) clearTimeout(window.toastTimeout);

  window.toastTimeout = setTimeout(() => {
    toast.classList.add('hidden');
  }, 3000);
}

// ==========================================================================
// HELPER METHODS (MARKDOWN PARSER)
// ==========================================================================
function parseMarkdown(md) {
  if (!md) return '';
  
  // Safe HTML escaped replacement
  let html = md
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Headers (###, ####, etc.)
  html = html.replace(/^#### (.*?)$/gm, '<h5>$1</h5>');
  html = html.replace(/^### (.*?)$/gm, '<h4>$1</h4>');
  html = html.replace(/^## (.*?)$/gm, '<h3>$1</h3>');
  
  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Unordered list items
  // First clean leading list marker
  html = html.replace(/^\s*-\s+\[ \]\s+(.*?)$/gm, '<li><input type="checkbox" disabled> $1</li>');
  html = html.replace(/^\s*-\s+\[x\]\s+(.*?)$/gm, '<li><input type="checkbox" checked disabled> $1</li>');
  html = html.replace(/^\s*[-*]\s+(.*?)$/gm, '<li>$1</li>');
  
  // Wrap sequential <li> tags in <ul>
  // Simple regex for groups
  html = html.replace(/(<li>.*?<\/li>)+/gs, (match) => `<ul>${match}</ul>`);

  // Paragraphs (line breaks)
  // Split double returns into <p>
  html = html.split(/\n\n+/).map(p => {
    if (p.trim().startsWith('<h') || p.trim().startsWith('<ul')) return p;
    return `<p>${p.replace(/\n/g, '<br>')}</p>`;
  }).join('');

  return html;
}
