import { defaultCV, defaultJobs } from './data.js';
import { calculateMatch, optimizeCV, generateCoverLetter, generateInterviewPrep, generateMessage, enhanceCVFields } from './ai.js';
import { buildPortalUrl, simulatePortalSearch, getAllPortalKeys, getPortalConfig } from './connectors.js';

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

  // Check if first visit (onboarding)
  if (!localStorage.getItem('botvalia_onboarded')) {
    setTimeout(() => {
      const modal = document.getElementById('onboarding-modal');
      if (modal) modal.classList.remove('hidden');
    }, 500);
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
  document.getElementById('btn-export-resume')?.addEventListener('click', handleExportResume);

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
  document.getElementById('btn-export-cover-txt')?.addEventListener('click', () => exportAsTxt('cover-letter-output', 'cover-letter'));
  document.getElementById('btn-export-cover-pdf')?.addEventListener('click', () => printElement('cover-letter-output', 'Cover Letter'));
  document.getElementById('btn-export-cv-txt')?.addEventListener('click', () => exportAsTxt('cv-tailor-output', 'cv-tailor-recommendations', true));
  document.getElementById('btn-export-cv-pdf')?.addEventListener('click', () => printElement('cv-tailor-output', 'CV Tailoring Recommendations'));
  document.getElementById('btn-export-interview-txt')?.addEventListener('click', () => exportAsTxt('interview-output', 'interview-guide', true));
  document.getElementById('btn-export-interview-pdf')?.addEventListener('click', () => printElement('interview-output', 'Interview Guide'));
  document.getElementById('btn-generate-template').addEventListener('click', handleTemplateGenerate);
  document.getElementById('btn-copy-template').addEventListener('click', handleCopyTemplate);
  // Character count on template output
  document.getElementById('template-output')?.addEventListener('input', updateCharCount);

  // Sync tools select switch
  document.getElementById('tools-select-job').addEventListener('change', (e) => {
    const jobId = e.target.value;
    if (jobId) {
      state.selectedJobId = jobId;
      updateToolsSelectedJobDetails();
    }
  });

  // Scan Portals Button
  document.getElementById('btn-scan-portals').addEventListener('click', handleScanPortals);

  // Calendar navigation
  document.getElementById('btn-prev-month')?.addEventListener('click', () => {
    calendarMonth--;
    if (calendarMonth < 0) { calendarMonth = 11; calendarYear--; }
    renderCalendar();
  });
  document.getElementById('btn-next-month')?.addEventListener('click', () => {
    calendarMonth++;
    if (calendarMonth > 11) { calendarMonth = 0; calendarYear++; }
    renderCalendar();
  });

  // Onboarding modal
  const dismissOnboarding = () => {
    document.getElementById('onboarding-modal')?.classList.add('hidden');
    localStorage.setItem('botvalia_onboarded', 'true');
  };
  document.getElementById('btn-close-onboarding')?.addEventListener('click', dismissOnboarding);
  document.getElementById('btn-dismiss-onboarding')?.addEventListener('click', dismissOnboarding);

  // Data Management
  document.getElementById('btn-export-data')?.addEventListener('click', handleExportData);
  document.getElementById('btn-import-data')?.addEventListener('click', () => document.getElementById('import-file-input').click());
  document.getElementById('import-file-input')?.addEventListener('change', handleImportData);
  document.getElementById('btn-reset-app')?.addEventListener('click', handleResetApp);

  // Modal close
  document.getElementById('btn-close-modal')?.addEventListener('click', () => {
    document.getElementById('calendar-event-modal').classList.add('hidden');
  });

  // Source filter for Job Tracker
  document.getElementById('filter-source')?.addEventListener('change', () => renderJobsTab());

  // Clear Results Button
  document.getElementById('btn-clear-results').addEventListener('click', () => {
    document.getElementById('connector-results-panel').classList.add('hidden');
    document.getElementById('search-results-grid').innerHTML = '';
    document.getElementById('btn-clear-results').classList.add('hidden');
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
  const summary = document.getElementById('cv-summary')?.value.trim() || '';
  const experience = document.getElementById('cv-experience')?.value.trim() || '';
  const education = document.getElementById('cv-education')?.value.trim() || '';
  const bodyParts = [];
  if (summary) bodyParts.push('# Professional Summary\n' + summary);
  if (experience) bodyParts.push('# Work Experience\n' + experience);
  if (education) bodyParts.push('# Education & Certifications\n' + education);
  const combinedBody = bodyParts.join('\n\n');
  const cvBodyField = document.getElementById('cv-body');
  if (cvBodyField) cvBodyField.value = combinedBody;

  const cvData = {
    fullName: document.getElementById('cv-full-name').value.trim(),
    title: document.getElementById('cv-title').value.trim(),
    skills: document.getElementById('cv-skills').value.trim(),
    body: combinedBody
  };

  state.cv = cvData;
  localStorage.setItem('botvalia_cv', JSON.stringify(cvData));
  
  renderCVDetails();
  renderDashboard();
  showToast("CV profile updated successfully.");
}

function handleExportResume() {
  if (!state.cv) { showToast('No CV data to export.'); return; }
  const md = `# ${state.cv.fullName}\n## ${state.cv.title}\n\n**Skills**: ${state.cv.skills}\n\n${state.cv.body}`;
  const blob = new Blob([md], { type: 'text/markdown' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${state.cv.fullName.replace(/\s+/g, '_')}_Resume.md`;
  a.click();
  URL.revokeObjectURL(a.href);
  showToast('Resume exported as Markdown.');
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
      const extracted = extractCVFields(text);
      if (extracted.fullName) document.getElementById('cv-full-name').value = extracted.fullName;
      if (extracted.title) document.getElementById('cv-title').value = extracted.title;
      if (extracted.skills) document.getElementById('cv-skills').value = extracted.skills;
      // Auto-split into sectioned fields
      const summaryMatch = text.match(/(?:^|\n)(?:#\s*)?(?:Professional\s+)?Summary\s*(?:\n)([\s\S]*?)(?=\n#|$)/i);
      const experienceMatch = text.match(/(?:^|\n)(?:#\s*)?(?:Work\s+)?Experience\s*(?:\n)([\s\S]*?)(?=\n#|$)/i);
      const educationMatch = text.match(/(?:^|\n)(?:#\s*)?(?:Education|Certifications)[^]*?(?:\n)([\s\S]*?)(?=\n#|$)/i);
      if (summaryMatch) document.getElementById('cv-summary').value = summaryMatch[1].trim();
      if (experienceMatch) document.getElementById('cv-experience').value = experienceMatch[1].trim();
      if (educationMatch) document.getElementById('cv-education').value = educationMatch[1].trim();
      // Try AI-enhanced extraction asynchronously
      if (state.apiConfig && state.apiConfig.provider !== 'mock') {
        enhanceCVFields(text, extracted, state.apiConfig).then(aiExtracted => {
          if (aiExtracted.fullName) document.getElementById('cv-full-name').value = aiExtracted.fullName;
          if (aiExtracted.title) document.getElementById('cv-title').value = aiExtracted.title;
          if (aiExtracted.skills) document.getElementById('cv-skills').value = aiExtracted.skills;
          showToast('AI-enhanced CV fields applied.');
        }).catch(() => {});
      }
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

/**
 * Client-side heuristic CV field extractor.
 * Parses raw CV text to guess the candidate's name, title, and skills.
 */
function extractCVFields(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const result = { fullName: '', title: '', skills: '' };

  // 1. Name: first non-empty line that doesn't look like a section header
  for (const line of lines) {
    const isHeader = /^#|^[A-Z\s]{3,}:|^(skills|experience|education|summary|profile|work)/i.test(line);
    const isShort = line.length < 3;
    const hasBullet = /^[-*•]/.test(line);
    const hasEmail = /@/.test(line);
    const hasUrl = /http|linkedin|github/i.test(line);
    if (!isHeader && !isShort && !hasBullet && !hasEmail && !hasUrl && line.split(' ').length >= 2 && line.split(' ').length <= 6) {
      result.fullName = line;
      break;
    }
  }

  // 2. Title: look for a line containing common title keywords
  const titleKeywords = ['senior', 'junior', 'lead', 'head', 'chief', 'manager', 'engineer', 'developer', 'architect', 'analyst', 'specialist', 'consultant', 'director', 'fullstack', 'full stack', 'frontend', 'backend', 'devops', 'data', 'cloud', 'software', 'web', 'ai', 'ml'];
  for (const line of lines) {
    const lower = line.toLowerCase();
    const matchCount = titleKeywords.filter(k => lower.includes(k)).length;
    if (matchCount >= 2 && line.split(' ').length >= 3 && line.split(' ').length <= 15) {
      const isHeader = /^#/.test(line);
      if (!isHeader) {
        result.title = line.replace(/^[-*•]\s*/, '').replace(/[|].*$/, '').trim();
        break;
      }
    }
  }

  // 3. Skills: find a "Skills" section or extract known tech terms
  const techKeywords = ['javascript', 'typescript', 'node.js', 'nodejs', 'react', 'react.js', 'vue', 'angular', 'python', 'java', 'c#', 'c++', 'go', 'rust', 'docker', 'kubernetes', 'k8s', 'aws', 'azure', 'gcp', 'postgresql', 'postgres', 'mysql', 'mongodb', 'redis', 'graphql', 'rest', 'api', 'git', 'ci/cd', 'terraform', 'jenkins', 'linux', 'html', 'css', 'sass', 'tailwind', 'bootstrap', 'redux', 'next.js', 'nextjs', 'express', 'django', 'flask', 'spring', 'dotnet', 'firebase', 'vercel', 'heroku', 'nginx', 'webpack', 'vite', 'jest', 'mocha', 'cypress'];
  const foundSkills = [];

  // First look for a "Skills" section line
  const skillsSectionIndex = lines.findIndex(l => /^skills|^technologies|^tech stack|^core competencies/i.test(l));
  if (skillsSectionIndex >= 0) {
    for (let i = skillsSectionIndex + 1; i < Math.min(skillsSectionIndex + 10, lines.length); i++) {
      const line = lines[i];
      if (/^#|^[A-Z][a-z]+:/.test(line)) break;
      const terms = line.split(/[,|•·;\n]+/).map(s => s.trim()).filter(Boolean);
      terms.forEach(t => {
        if (techKeywords.some(k => t.toLowerCase().includes(k))) {
          foundSkills.push(t);
        }
      });
    }
  }

  // If no skills section found, scan the entire text
  if (foundSkills.length === 0) {
    const textLower = text.toLowerCase();
    techKeywords.forEach(kw => {
      if (textLower.includes(kw) && !foundSkills.some(f => f.toLowerCase() === kw)) {
        foundSkills.push(kw.charAt(0).toUpperCase() + kw.slice(1));
      }
    });
  }

  if (foundSkills.length > 0) {
    result.skills = [...new Set(foundSkills)].slice(0, 20).join(', ');
  }

  return result;
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

// ==========================================================================
// PORTAL SCANNING
// ==========================================================================
async function handleScanPortals() {
  const activePortals = [];
  document.querySelectorAll('.connector-toggle:checked').forEach(cb => {
    activePortals.push(cb.getAttribute('data-portal'));
  });

  if (activePortals.length === 0) {
    showToast('Please enable at least one portal connector before scanning.');
    return;
  }

  if (!state.cv) {
    showToast('Please set up your CV profile first before scanning portals.');
    return;
  }

  const btn = document.getElementById('btn-scan-portals');
  const progressContainer = document.getElementById('scan-progress-container');
  const progressFill = document.getElementById('scan-progress-fill');
  const scanStatus = document.getElementById('scan-status-text');
  const scanPercent = document.getElementById('scan-percent');
  const scanLog = document.getElementById('scan-log');
  const resultsPanel = document.getElementById('connector-results-panel');
  const resultsGrid = document.getElementById('search-results-grid');
  const resultsCount = document.getElementById('results-count');

  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Scanning...';
  progressContainer.classList.add('visible');
  scanLog.innerHTML = '';
  resultsPanel.classList.add('hidden');
  document.getElementById('btn-clear-results').classList.add('hidden');
  resultsGrid.innerHTML = '';

  const allResults = [];
  const desiredRole = document.querySelector('.connector-query[data-portal="linkedin"]')?.value || '';
  const salaryFilter = document.getElementById('filter-salary')?.value || '';
  const locationFilter = document.getElementById('filter-location')?.value || '';
  const workTypeFilter = document.getElementById('filter-work-type')?.value || '';

  for (let i = 0; i < activePortals.length; i++) {
    const portal = activePortals[i];
    const percent = Math.round(((i + 1) / activePortals.length) * 100);
    const config = getPortalConfig(portal);
    const logEntry = document.createElement('div');
    logEntry.className = 'log-entry';

    const progressSteps = [
      { label: `Connecting to ${config?.name || portal}...`, delay: 200 },
      { label: `Building search query from CV...`, delay: 250 },
      { label: `Fetching results from ${config?.name || portal}...`, delay: 300 },
      { label: `Filtering matches by skills...`, delay: 200 }
    ];

    for (const step of progressSteps) {
      scanStatus.innerText = step.label;
      const stepEntry = document.createElement('div');
      stepEntry.className = 'log-entry';
      stepEntry.innerHTML = `<span class="log-time">[${new Date().toLocaleTimeString()}]</span> <span class="log-info">⟳ ${step.label}</span>`;
      scanLog.appendChild(stepEntry);
      scanLog.scrollTop = scanLog.scrollHeight;
      progressFill.style.width = `${percent}%`;
      await new Promise(r => setTimeout(r, step.delay));
    }

    try {
      let results = simulatePortalSearch(portal, state.cv, desiredRole, 3, { salary: salaryFilter, location: locationFilter, workType: workTypeFilter });
      const matchedCount = results.filter(r => r.matchScore >= 70).length;
      results.forEach(r => {
        r.source = portal;
        allResults.push(r);
      });

      const okEntry = document.createElement('div');
      okEntry.className = 'log-entry';
      okEntry.innerHTML = `<span class="log-time">[${new Date().toLocaleTimeString()}]</span> <span class="log-ok">✓ ${config?.name || portal}: ${results.length} found, ${matchedCount} high-match (≥70%)</span>`;
      scanLog.appendChild(okEntry);
    } catch (err) {
      const errEntry = document.createElement('div');
      errEntry.className = 'log-entry';
      errEntry.innerHTML = `<span class="log-time">[${new Date().toLocaleTimeString()}]</span> <span class="log-error">✗ ${config?.name || portal}: Error - ${err.message}</span>`;
      scanLog.appendChild(errEntry);
    }
    scanLog.scrollTop = scanLog.scrollHeight;
  }

  const summaryEntry = document.createElement('div');
  summaryEntry.className = 'log-entry';
  summaryEntry.innerHTML = `<span class="log-time">[${new Date().toLocaleTimeString()}]</span> <span class="log-ok">✓ Scan complete — ${allResults.length} total jobs from ${activePortals.length} portal(s)</span>`;
  scanLog.appendChild(summaryEntry);
  scanLog.scrollTop = scanLog.scrollHeight;

  scanStatus.innerText = 'Scan complete!';
  scanPercent.innerText = '100%';
  progressFill.style.width = '100%';

  // Render results
  if (allResults.length > 0) {
    const highMatch = allResults.filter(r => r.matchScore >= 70).length;
    resultsCount.innerText = `${allResults.length} jobs (${highMatch} high-match)`;
    resultsGrid.innerHTML = allResults.sort((a, b) => b.matchScore - a.matchScore).map(job => {
      const sourceClass = `source-${job.source}`;
      const sourceNames = { linkedin: 'LinkedIn', indeed: 'Indeed', torre: 'Torre.co', computrabajo: 'Computrabajo' };
      const matchLevel = job.matchScore >= 80 ? 'badge-success' : job.matchScore >= 60 ? 'badge-warning' : 'badge-secondary';
      return `
        <div class="search-result-card">
          <span class="source-badge ${sourceClass}">${sourceNames[job.source] || job.source}</span>
          <h4>${job.title}</h4>
          <span class="company-name">${job.company} · ${job.location}</span>
          <span class="match-indicator"><span class="badge ${matchLevel}">${job.matchScore}% Match</span></span>
          <p class="text-xs text-muted">${job.snippet}</p>
          <div class="result-actions">
            <button class="btn btn-primary btn-xs btn-import-result" data-title="${job.title}" data-company="${job.company}" data-source="${job.source}">
              <i class="fa-solid fa-plus"></i> Import
            </button>
          </div>
        </div>
      `;
    }).join('');

    // Bind import buttons
    resultsGrid.querySelectorAll('.btn-import-result').forEach(btn => {
      btn.addEventListener('click', () => {
        const title = btn.getAttribute('data-title');
        const company = btn.getAttribute('data-company');
        const source = btn.getAttribute('data-source');
        const card = btn.closest('.search-result-card');
        const snippet = card?.querySelector('.text-xs')?.innerText || '';
        const jobData = {
          id: 'job-' + Date.now(),
          title: title,
          company: company,
          url: '',
          status: 'Interested',
          source: source,
          description: `Position: ${title}\nCompany: ${company}\nSource: ${source}\n\n${snippet}`
        };
        state.jobs.push(jobData);
        localStorage.setItem('botvalia_jobs', JSON.stringify(state.jobs));
        renderJobsTab();
        renderDashboard();
        renderKanbanBoard();
        renderCalendar();
        showToast(`"${title}" imported to Job Tracker.`);
      });
    });

    resultsPanel.classList.remove('hidden');
    document.getElementById('btn-clear-results').classList.remove('hidden');
  }

  btn.disabled = false;
  btn.innerHTML = '<i class="fa-solid fa-play"></i> Scan Active Portals';
}

function handleJobSubmit(e) {
  e.preventDefault();
  const jobId = document.getElementById('job-id').value;
  const interviewDate = document.getElementById('job-interview-date').value;
  const interviewTime = document.getElementById('job-interview-time').value;
  const interviewNotes = document.getElementById('job-interview-notes').value.trim();
  const jobData = {
    id: jobId || 'job-' + Date.now(),
    title: document.getElementById('job-title').value.trim(),
    company: document.getElementById('job-company').value.trim(),
    url: document.getElementById('job-url').value.trim(),
    status: document.getElementById('job-status').value,
    description: document.getElementById('job-description').value.trim(),
    interviewDate: interviewDate || null,
    interviewTime: interviewTime || null,
    interviewNotes: interviewNotes || null
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
  renderKanbanBoard();
  renderCalendar();
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
  document.getElementById('job-interview-date').value = job.interviewDate || '';
  document.getElementById('job-interview-time').value = job.interviewTime || '';
  document.getElementById('job-interview-notes').value = job.interviewNotes || '';

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
    renderKanbanBoard();
    renderCalendar();
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

// ==========================================================================
// DATA MANAGEMENT (Backup, Restore, Reset)
// ==========================================================================
function handleExportData() {
  const data = {
    cv: state.cv,
    jobs: state.jobs,
    config: state.apiConfig,
    exportedAt: new Date().toISOString()
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `botvalia-backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Data exported successfully!');
}

function handleImportData(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const data = JSON.parse(event.target.result);
      if (data.cv) { state.cv = data.cv; localStorage.setItem('botvalia_cv', JSON.stringify(data.cv)); }
      if (data.jobs) { state.jobs = data.jobs; localStorage.setItem('botvalia_jobs', JSON.stringify(data.jobs)); }
      if (data.config) { state.apiConfig = data.config; localStorage.setItem('botvalia_config', JSON.stringify(data.config)); }
      renderAll();
      showToast('Data imported successfully!');
    } catch (err) {
      showToast('Invalid backup file: ' + err.message);
    }
  };
  reader.readAsText(file);
  e.target.value = '';
}

function handleResetApp() {
  if (confirm('Are you sure you want to reset ALL data? This will clear your CV, jobs, and settings permanently.')) {
    if (confirm('This cannot be undone. Proceed?')) {
      localStorage.removeItem('botvalia_cv');
      localStorage.removeItem('botvalia_jobs');
      localStorage.removeItem('botvalia_config');
      state.cv = null;
      state.jobs = [];
      state.apiConfig = { provider: 'mock', key: '', model: '' };
      state.selectedJobId = null;
      renderAll();
      showToast('All data has been reset.');
    }
  }
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
    document.getElementById('cv-tailor-actions')?.classList.remove('hidden');
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
    document.getElementById('interview-actions')?.classList.remove('hidden');
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

// ==========================================================================
// MESSAGE TEMPLATES
// ==========================================================================
async function handleTemplateGenerate() {
  const templateType = document.getElementById('template-type').value;
  const contactName = document.getElementById('template-contact-name').value.trim();
  const contactEmail = document.getElementById('template-contact-email').value.trim();
  const placeholder = document.getElementById('template-placeholder');
  const loading = document.getElementById('template-loading');
  const wrapper = document.getElementById('template-wrapper');
  const output = document.getElementById('template-output');
  const btn = document.getElementById('btn-generate-template');

  const job = getSelectedToolJob();
  if (!job) {
    if (!confirm('No job selected. Generate a general message without job context?')) return;
  }

  btn.disabled = true;
  placeholder.classList.add('hidden');
  loading.classList.remove('hidden');
  wrapper.classList.add('hidden');

  try {
    const text = await generateMessage(state.cv, job, templateType, contactName, contactEmail, state.apiConfig);
    output.value = text;
    wrapper.classList.remove('hidden');
    updateCharCount();
  } catch (err) {
    alert(err.message);
    placeholder.classList.remove('hidden');
  } finally {
    loading.classList.add('hidden');
    btn.disabled = false;
  }
}

function handleCopyTemplate() {
  const copyText = document.getElementById('template-output');
  copyText.select();
  copyText.setSelectionRange(0, 99999);
  navigator.clipboard.writeText(copyText.value);
  showToast("Message copied to clipboard!");
}

function updateCharCount() {
  const output = document.getElementById('template-output');
  const count = output?.value?.length || 0;
  const charCount = document.getElementById('char-count');
  const warning = document.getElementById('char-warning');
  if (charCount) charCount.innerText = `${count} characters`;
  if (warning) {
    if (count > 300) {
      warning.innerText = '⚠ LinkedIn limit: 300 chars';
    } else if (count > 0) {
      warning.innerText = '';
    }
  }
}

// ==========================================================================
// EXPORT HELPERS (TXT / PDF)
// ==========================================================================
function exportAsTxt(elementId, filename, isHtml = false) {
  const el = document.getElementById(elementId);
  if (!el) return;
  let text = isHtml ? el.innerText || el.textContent : el.value || el.innerText;
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.txt`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('File downloaded as TXT');
}

function printElement(elementId, title) {
  const el = document.getElementById(elementId);
  if (!el) return;
  const content = el.innerHTML || `<pre>${el.value || el.innerText}</pre>`;
  const win = window.open('', '_blank');
  win.document.write(`<!DOCTYPE html><html><head><title>${title}</title><style>
    body { font-family: Inter, sans-serif; padding: 2rem; color: #000; }
    pre { white-space: pre-wrap; font-size: 12pt; line-height: 1.6; }
    .markdown-preview { font-size: 12pt; line-height: 1.6; }
  </style></head><body>${content}</body></html>`);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); }, 500);
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
  renderKanbanBoard();
  renderCalendar();
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
  const summaryField = document.getElementById('cv-summary');
  const experienceField = document.getElementById('cv-experience');
  const educationField = document.getElementById('cv-education');
  
  const summaryBox = document.getElementById('dash-cv-preview');
  const statCvStatus = document.getElementById('stat-cv-status');

  if (state.cv) {
    fullName.value = state.cv.fullName || '';
    title.value = state.cv.title || '';
    skills.value = state.cv.skills || '';
    body.value = state.cv.body || '';

    // Parse body into sections
    const bodyText = state.cv.body || '';
    const summaryMatch = bodyText.match(/# Professional Summary\s*\n([\s\S]*?)(?=\n# |$)/);
    const experienceMatch = bodyText.match(/# Work Experience\s*\n([\s\S]*?)(?=\n# |$)/);
    const educationMatch = bodyText.match(/# (?:Education|Certifications)[& ]*Certifications?\s*\n([\s\S]*?)(?=\n# |$)/);
    
    if (summaryField) summaryField.value = (summaryMatch ? summaryMatch[1].trim() : '');
    if (experienceField) experienceField.value = (experienceMatch ? experienceMatch[1].trim() : bodyText);
    if (educationField) educationField.value = (educationMatch ? educationMatch[1].trim() : '');

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
    if (summaryField) summaryField.value = '';
    if (experienceField) experienceField.value = '';
    if (educationField) educationField.value = '';

    statCvStatus.innerText = "Not Set";
    statCvStatus.className = 'stat-value text-muted';
    summaryBox.innerHTML = '<p class="text-muted">No resume uploaded. Go to the "My CV Profile" tab to add your professional profile details.</p>';
  }
  renderCVPreview();
}

function renderCVPreview() {
  const container = document.getElementById('cv-preview-body');
  if (!container) return;

  if (!state.cv || !state.cv.body) {
    container.innerHTML = `
      <div class="resume-preview placeholder-preview">
        <div class="resume-header">
          <h2 class="resume-name">${state.cv?.fullName || 'Your Name'}</h2>
          <p class="resume-title">${state.cv?.title || 'Professional Headline'}</p>
        </div>
        <div class="resume-section">
          <h4>Skills</h4>
          <p class="text-muted">${state.cv?.skills || '—'}</p>
        </div>
        <div class="resume-section">
          <h4>Experience & Education</h4>
          <p class="text-muted">Upload or paste your CV to see a live preview here.</p>
        </div>
      </div>`;
    return;
  }

  const bodyHtml = state.cv.body
    .replace(/^### (.+)$/gm, '<h5>$1</h5>')
    .replace(/^## (.+)$/gm, '<h4>$1</h4>')
    .replace(/^# (.+)$/gm, '<h3>$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>');

  const skillTags = (state.cv.skills || '').split(',').map(s => `<span class="badge badge-secondary resume-skill-tag">${s.trim()}</span>`).join('');

  container.innerHTML = `
    <div class="resume-preview">
      <div class="resume-header">
        <h2 class="resume-name">${state.cv.fullName || 'Your Name'}</h2>
        <p class="resume-title">${state.cv.title || 'Professional Headline'}</p>
      </div>
      <div class="resume-section">
        <h4>Skills</h4>
        <div class="skills-mini-list">${skillTags || '<span class="text-muted">—</span>'}</div>
      </div>
      <div class="resume-section">
        <h4>Experience & Education</h4>
        <p>${bodyHtml}</p>
      </div>
    </div>`;
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
  const filterSource = document.getElementById('filter-source')?.value || '';
  const filteredJobs = filterSource ? state.jobs.filter(j => j.source === filterSource) : state.jobs;

  if (filteredJobs.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fa-solid fa-briefcase"></i>
        <p>${state.jobs.length === 0 ? 'No jobs added yet. Use the form on the left or load the demo data to populate this dashboard.' : 'No jobs match the selected source filter.'}</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filteredJobs.map(job => {
    let scoreBadge = '';
    if (job.matchScore !== undefined) {
      const levelClass = job.matchScore > 80 ? 'badge-success' : job.matchScore > 50 ? 'badge-warning' : 'badge-danger';
      scoreBadge = `<span class="badge ${levelClass}">${job.matchScore}% Match</span>`;
    }

    const statusLevel = job.status === 'Offer' ? 'badge-success' : job.status === 'Rejected' ? 'badge-danger' : job.status === 'Interviewing' ? 'badge-primary' : 'badge-secondary';

    const sourceNames = { linkedin: 'LinkedIn', indeed: 'Indeed', torre: 'Torre.co', computrabajo: 'Computrabajo' };
    const sourceBadge = job.source && sourceNames[job.source]
      ? `<span class="source-badge source-${job.source}" style="font-size:0.65rem">${sourceNames[job.source]}</span>`
      : '';
    const appliedBadge = job.appliedDate
      ? `<span style="font-size:0.65rem;color:var(--text-muted)">📅 ${job.appliedDate}</span>`
      : '';

    return `
      <div class="job-card" data-id="${job.id}">
        <div class="job-info">
          <h4>${job.title}</h4>
          <div class="job-meta">
            <strong>${job.company}</strong>
            ${sourceBadge}
            <span class="badge ${statusLevel}">${job.status}</span>
            ${appliedBadge}
            ${scoreBadge}
          </div>
        </div>
        <div class="job-actions">
          <button class="btn btn-secondary btn-xs btn-edit-job" data-id="${job.id}">
            <i class="fa-solid fa-pen"></i>
          </button>
          <button class="btn btn-secondary btn-xs btn-draft-outreach" data-id="${job.id}" title="Draft outreach message">
            <i class="fa-solid fa-message"></i>
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

  container.querySelectorAll('.btn-draft-outreach').forEach(btn => {
    btn.addEventListener('click', () => {
      const jobId = btn.getAttribute('data-id');
      state.selectedJobId = jobId;
      syncToolsSelectedJob();
      triggerTabNavigation('tools');
      switchToolPanel('message-templates');
      // Pre-select cold-linkedin template
      document.getElementById('template-type').value = 'cold-linkedin';
    });
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

    const srcNames = { linkedin: 'LinkedIn', indeed: 'Indeed', torre: 'Torre.co', computrabajo: 'Computrabajo' };
    const dashSrcBadge = job.source && srcNames[job.source]
      ? `<span class="source-badge source-${job.source}" style="font-size:0.65rem">${srcNames[job.source]}</span>`
      : '';

    return `
      <tr>
        <td><strong>${job.title}</strong></td>
        <td>${job.company} ${dashSrcBadge}</td>
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

  // Render match trends chart
  renderMatchTrendsChart();

  // Render skill demand chart
  renderSkillDemandChart();
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

function renderMatchTrendsChart() {
  const container = document.getElementById('match-trends-chart');
  if (!container) return;
  const scoredJobs = state.jobs.filter(j => j.matchScore !== undefined).sort((a, b) => b.matchScore - a.matchScore);
  if (scoredJobs.length === 0) {
    container.innerHTML = `<div class="empty-state" style="border:none;padding:1rem"><p class="text-xs text-muted">Analyze jobs to see match trends</p></div>`;
    return;
  }
  const maxScore = 100;
  const barColors = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444'];
  container.innerHTML = scoredJobs.slice(0, 8).map((job, i) => {
    const height = Math.max(8, (job.matchScore / maxScore) * 100);
    const color = job.matchScore > 80 ? '#10b981' : job.matchScore > 60 ? '#3b82f6' : '#f59e0b';
    return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%;gap:0.25rem" title="${job.title}: ${job.matchScore}%">
      <span style="font-size:0.55rem;color:var(--text-muted);writing-mode:vertical-lr;text-orientation:mixed;transform:rotate(180deg);overflow:hidden;text-overflow:ellipsis;max-height:40px">${job.title.split(' ').slice(0, 2).join(' ')}</span>
      <div style="width:100%;max-width:40px;height:${height}%;border-radius:4px 4px 0 0;background:${color};opacity:0.7;transition:height 0.3s ease" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.7'"></div>
      <span style="font-size:0.6rem;font-weight:700;color:var(--text-secondary)">${job.matchScore}%</span>
    </div>`;
  }).join('');
}

function renderSkillDemandChart() {
  const container = document.getElementById('skill-demand-chart');
  if (!container) return;
  const allText = state.jobs.map(j => (j.title + ' ' + j.description).toLowerCase()).join(' ');
  if (!allText.trim()) {
    container.innerHTML = `<div class="empty-state" style="border:none;padding:1rem"><p class="text-xs text-muted">Add job descriptions to see skill demand analysis</p></div>`;
    return;
  }
  const techKeywords = ['javascript', 'typescript', 'node.js', 'react', 'python', 'docker', 'aws', 'postgresql', 'kubernetes', 'graphql', 'next.js', 'terraform', 'ci/cd', 'git', 'mongodb', 'express', 'css', 'html', 'redux', 'jest'];
  const counts = {};
  techKeywords.forEach(kw => {
    const regex = new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const count = (allText.match(regex) || []).length;
    if (count > 0) counts[kw] = count;
  });
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10);
  if (sorted.length === 0) {
    container.innerHTML = `<div class="empty-state" style="border:none;padding:1rem"><p class="text-xs text-muted">No tech skills detected in job descriptions</p></div>`;
    return;
  }
  const maxCount = sorted[0][1];
  container.innerHTML = sorted.map(([skill, count]) => {
    const pct = (count / maxCount) * 100;
    return `<div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.4rem">
      <span style="font-size:0.7rem;min-width:80px;text-align:right;color:var(--text-secondary);text-transform:capitalize">${skill}</span>
      <div style="flex:1;height:16px;background:rgba(255,255,255,0.04);border-radius:3px;overflow:hidden">
        <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,#3b82f6,#8b5cf6);border-radius:3px;transition:width 0.5s ease"></div>
      </div>
      <span style="font-size:0.65rem;min-width:20px;color:var(--text-muted);font-weight:600">${count}</span>
    </div>`;
  }).join('');
}

// ==========================================================================
// KANBAN BOARD RENDER & DRAG-DROP
// ==========================================================================
function renderKanbanBoard() {
  const statuses = ['Interested', 'Applied', 'Interviewing', 'Offer', 'Rejected'];

  statuses.forEach(status => {
    const container = document.getElementById(`kanban-${status}`);
    const countEl = document.getElementById(`count-${status}`);
    const jobsInStatus = state.jobs.filter(j => j.status === status);

    countEl.innerText = jobsInStatus.length;

    if (jobsInStatus.length === 0) {
      container.innerHTML = `<div class="kanban-empty">Drop jobs here</div>`;
      return;
    }

    const allStatuses = ['Interested', 'Applied', 'Interviewing', 'Offer', 'Rejected'];
    const otherStatuses = allStatuses.filter(s => s !== status);

    container.innerHTML = jobsInStatus.map(job => {
      const scoreHtml = job.matchScore !== undefined
        ? `<span class="kanban-score"><span class="badge ${job.matchScore > 80 ? 'badge-success' : job.matchScore > 50 ? 'badge-warning' : 'badge-danger'}" style="font-size:0.65rem">${job.matchScore}%</span></span>`
        : '';
      const dateBadge = job.appliedDate
        ? `<span style="font-size:0.6rem;color:var(--text-muted)">📅 ${job.appliedDate}</span>`
        : '';
      const salaryInfo = job.salary ? `<span style="font-size:0.6rem;color:var(--color-success)">💰 ${job.salary}</span>` : '';
      const logoPlaceholder = `<span class="kanban-logo" style="display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:4px;background:rgba(255,255,255,0.05);font-size:0.55rem;font-weight:700;color:var(--text-muted);flex-shrink:0">${job.company.charAt(0).toUpperCase()}</span>`;
      const statusBtns = otherStatuses.slice(0, 3).map(s => `
        <button class="btn btn-xs btn-secondary kanban-mobile-btn" data-id="${job.id}" data-newstatus="${s}" style="font-size:0.6rem;padding:0.15rem 0.3rem" title="Move to ${s}">${s[0]}</button>
      `).join('');
      return `
        <div class="kanban-card" draggable="true" data-id="${job.id}" data-status="${status}">
          <div style="display:flex;align-items:flex-start;gap:0.5rem">
            ${logoPlaceholder}
            <div style="flex:1;min-width:0">
              <h5 style="margin:0;font-size:0.85rem">${job.title}</h5>
              <div class="kanban-company" style="font-size:0.75rem;color:var(--text-secondary)">${job.company}</div>
            </div>
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:0.25rem;margin-top:0.35rem">
            ${dateBadge}
            ${salaryInfo}
          </div>
          ${scoreHtml}
          <div class="kanban-mobile-actions" style="display:flex;gap:0.25rem;margin-top:0.35rem">
            ${statusBtns}
          </div>
        </div>
      `;
    }).join('');
  });

  // Bind drag events
  document.querySelectorAll('.kanban-card').forEach(card => {
    card.addEventListener('dragstart', handleDragStart);
    card.addEventListener('dragend', handleDragEnd);
  });

  // Bind mobile status buttons
  document.querySelectorAll('.kanban-mobile-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const jobId = btn.getAttribute('data-id');
      const newStatus = btn.getAttribute('data-newstatus');
      const job = state.jobs.find(j => j.id === jobId);
      if (!job || job.status === newStatus) return;
      if (newStatus === 'Applied' && !job.appliedDate) {
        job.appliedDate = new Date().toISOString().split('T')[0];
      }
      job.status = newStatus;
      localStorage.setItem('botvalia_jobs', JSON.stringify(state.jobs));
      renderKanbanBoard();
      renderJobsTab();
      renderDashboard();
      showToast(`"${job.title}" moved to ${newStatus}`);
    });
  });

  document.querySelectorAll('.kanban-cards').forEach(col => {
    col.addEventListener('dragover', handleDragOver);
    col.addEventListener('dragenter', handleDragEnter);
    col.addEventListener('dragleave', handleDragLeave);
    col.addEventListener('drop', handleDrop);
  });
}

let draggedJobId = null;

function handleDragStart(e) {
  draggedJobId = e.target.getAttribute('data-id');
  e.target.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', draggedJobId);
}

function handleDragEnd(e) {
  e.target.classList.remove('dragging');
  document.querySelectorAll('.kanban-column').forEach(col => col.classList.remove('drag-over'));
  draggedJobId = null;
}

function handleDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
}

function handleDragEnter(e) {
  e.preventDefault();
  const column = e.target.closest('.kanban-column');
  if (column) column.classList.add('drag-over');
}

function handleDragLeave(e) {
  const column = e.target.closest('.kanban-column');
  if (column) column.classList.remove('drag-over');
}

function handleDrop(e) {
  e.preventDefault();
  const column = e.target.closest('.kanban-column');
  if (!column) return;
  column.classList.remove('drag-over');

  const newStatus = column.getAttribute('data-status');
  const jobId = e.dataTransfer.getData('text/plain') || draggedJobId;
  if (!jobId || !newStatus) return;

  const job = state.jobs.find(j => j.id === jobId);
  if (!job || job.status === newStatus) return;

  // Track application date when moved to Applied
  if (newStatus === 'Applied' && !job.appliedDate) {
    job.appliedDate = new Date().toISOString().split('T')[0];
  }
  job.status = newStatus;
  localStorage.setItem('botvalia_jobs', JSON.stringify(state.jobs));
  renderKanbanBoard();
  renderJobsTab();
  renderDashboard();
  showToast(`"${job.title}" moved to ${newStatus}`);
}

// Also track in the drag-drop handler and import
function trackAppliedDate(job) {
  if (job.status === 'Applied' && !job.appliedDate) {
    job.appliedDate = new Date().toISOString().split('T')[0];
  }
}

// ==========================================================================
// INTERVIEW CALENDAR
// ==========================================================================
let calendarMonth = new Date().getMonth();
let calendarYear = new Date().getFullYear();

function renderCalendar() {
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  document.getElementById('calendar-month-label').innerText = `${monthNames[calendarMonth]} ${calendarYear}`;

  const firstDay = new Date(calendarYear, calendarMonth, 1).getDay();
  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(calendarYear, calendarMonth, 0).getDate();
  const today = new Date();

  const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  let html = dayHeaders.map(d => `<div class="calendar-header-cell">${d}</div>`).join('');

  // Build interview map
  const interviewMap = {};
  state.jobs.forEach(job => {
    if (job.interviewDate) {
      const dateKey = job.interviewDate;
      if (!interviewMap[dateKey]) interviewMap[dateKey] = [];
      interviewMap[dateKey].push(job);
    }
  });

  // Previous month days
  const prevMonth = calendarMonth === 0 ? 11 : calendarMonth - 1;
  const prevYear = calendarMonth === 0 ? calendarYear - 1 : calendarYear;
  for (let i = firstDay - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    html += `<div class="calendar-cell other-month"><div class="day-number">${day}</div></div>`;
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const isToday = today.getFullYear() === calendarYear && today.getMonth() === calendarMonth && today.getDate() === day;
    const events = interviewMap[dateStr] || [];

    html += `<div class="calendar-cell ${isToday ? 'today' : ''}" data-date="${dateStr}">
      <div class="day-number">${day}</div>
      ${events.slice(0, 3).map(job => `<div class="calendar-event" data-job-id="${job.id}">${job.interviewTime || ''} ${job.company}</div>`).join('')}
      ${events.length > 3 ? `<div class="calendar-event" style="background:transparent;border:none;color:var(--text-muted)">+${events.length - 3} more</div>` : ''}
    </div>`;
  }

  // Next month days to fill grid
  const totalCells = firstDay + daysInMonth;
  const remaining = (7 - (totalCells % 7)) % 7;
  for (let day = 1; day <= remaining; day++) {
    html += `<div class="calendar-cell other-month"><div class="day-number">${day}</div></div>`;
  }

  document.getElementById('calendar-grid').innerHTML = html;

  // Bind event clicks
  document.querySelectorAll('.calendar-event').forEach(el => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      const jobId = el.getAttribute('data-job-id');
      const job = state.jobs.find(j => j.id === jobId);
      if (!job) return;
      document.getElementById('modal-event-title').innerText = `Interview: ${job.title}`;
      document.getElementById('modal-event-body').innerHTML = `
        <p><strong>Company:</strong> ${job.company}</p>
        <p><strong>Date:</strong> ${job.interviewDate || 'Not set'}</p>
        <p><strong>Time:</strong> ${job.interviewTime || 'Not specified'}</p>
        <p><strong>Notes:</strong> ${job.interviewNotes || 'None'}</p>
        <div class="form-actions mt-4">
          <button class="btn btn-primary btn-sm" onclick="document.getElementById('job-id').value='${job.id}';document.getElementById('nav-jobs').click()">
            <i class="fa-solid fa-pen"></i> Edit in Job Tracker
          </button>
        </div>
      `;
      document.getElementById('calendar-event-modal').classList.remove('hidden');
    });
  });

  // Highlight dates with interviews
  document.querySelectorAll('.calendar-cell').forEach(cell => {
    if (cell.querySelector('.calendar-event')) {
      cell.style.borderColor = 'rgba(37, 99, 235, 0.3)';
    }
  });

  // Count interviews
  const totalInterviews = Object.values(interviewMap).flat().length;
  document.getElementById('calendar-interview-count').innerText = `${totalInterviews} interview${totalInterviews !== 1 ? 's' : ''} scheduled`;

  // Render upcoming list
  renderUpcomingInterviews(interviewMap);

  // Countdown
  renderCountdownWidget();
}

function renderUpcomingInterviews(interviewMap) {
  const container = document.getElementById('calendar-upcoming-list');
  const today = new Date().toISOString().split('T')[0];
  const upcoming = [];

  Object.entries(interviewMap).forEach(([date, jobs]) => {
    if (date >= today) {
      jobs.forEach(job => upcoming.push({ ...job, date }));
    }
  });

  upcoming.sort((a, b) => a.date.localeCompare(b.date) || (a.interviewTime || '').localeCompare(b.interviewTime || ''));

  if (upcoming.length === 0) {
    container.innerHTML = `<div class="empty-state"><i class="fa-solid fa-calendar-check"></i><p>No upcoming interviews scheduled.</p></div>`;
    return;
  }

  container.innerHTML = upcoming.slice(0, 10).map(job => {
    const d = new Date(job.date + 'T' + (job.interviewTime || '00:00'));
    const day = d.getDate();
    const month = d.toLocaleString('default', { month: 'short' });
    return `
      <div class="upcoming-item">
        <div class="upcoming-date">
          <span class="day">${day}</span>
          <span class="month">${month}</span>
        </div>
        <div class="upcoming-info">
          <h5>${job.title}</h5>
          <span>${job.company} ${job.interviewTime ? '· ' + job.interviewTime : ''}</span>
        </div>
      </div>
    `;
  }).join('');
}

function renderCountdownWidget() {
  const container = document.getElementById('calendar-upcoming-card');
  let countdownEl = document.getElementById('countdown-widget');
  if (!countdownEl) {
    countdownEl = document.createElement('div');
    countdownEl.id = 'countdown-widget';
    countdownEl.className = 'card mb-4';
    container.parentNode.insertBefore(countdownEl, container);
  }

  const now = new Date();
  const upcomingJobs = state.jobs.filter(j => j.interviewDate);
  let nextJob = null;
  let nextDate = null;

  upcomingJobs.forEach(job => {
    const d = new Date(job.interviewDate + 'T' + (job.interviewTime || '09:00'));
    if (d > now) {
      if (!nextDate || d < nextDate) {
        nextDate = d;
        nextJob = job;
      }
    }
  });

  if (!nextJob) {
    countdownEl.innerHTML = `
      <div class="card-body text-center" style="color:var(--text-muted);font-size:0.85rem">
        <i class="fa-solid fa-clock"></i> No upcoming interviews
      </div>
    `;
    return;
  }

  const diff = nextDate - now;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  countdownEl.innerHTML = `
    <div class="card-body">
      <div style="display:flex;align-items:center;justify-content:space-between">
        <div>
          <span style="font-size:0.75rem;color:var(--text-muted)">Next Interview</span>
          <h4 style="margin:0.25rem 0">${nextJob.title}</h4>
          <span style="font-size:0.8rem;color:var(--text-secondary)">${nextJob.company} · ${nextJob.interviewDate} ${nextJob.interviewTime || ''}</span>
        </div>
        <div style="text-align:center">
          <div style="font-size:2rem;font-weight:800;color:var(--color-primary)">${days}d ${hours}h ${mins}m</div>
          <span style="font-size:0.7rem;color:var(--text-muted)">remaining</span>
        </div>
      </div>
    </div>
  `;

  // Update every minute
  setTimeout(renderCountdownWidget, 60000);
}

// Modal close
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.add('hidden');
  }
});

// Expose for inline onclick
window.renderCalendar = renderCalendar;
window.closeModal = () => document.getElementById('calendar-event-modal').classList.add('hidden');

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
  document.getElementById('cv-tailor-actions')?.classList.add('hidden');

  document.getElementById('cover-letter-placeholder').classList.remove('hidden');
  document.getElementById('cover-letter-wrapper').classList.add('hidden');
  document.getElementById('cover-letter-loading').classList.add('hidden');

  document.getElementById('interview-placeholder').classList.remove('hidden');
  document.getElementById('interview-output').classList.add('hidden');
  document.getElementById('interview-loading').classList.add('hidden');
  document.getElementById('interview-actions')?.classList.add('hidden');
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
