/**
 * Job Portal Connectors Module for BotValia Buscador
 * Manages portal scraping/search simulation for LinkedIn, Indeed, Torre, Computrabajo.
 */

const PORTAL_CONFIG = {
  linkedin: {
    name: 'LinkedIn',
    icon: 'fa-brands fa-linkedin',
    color: '#0a66c2',
    baseUrl: 'https://www.linkedin.com/jobs/search/',
    buildQuery: (skills, title, location) => {
      const keywords = title || skills.split(',').slice(0, 3).join(' ');
      const params = new URLSearchParams();
      params.set('keywords', keywords);
      if (location) params.set('location', location);
      // Extract experience level from title
      const seniority = (title || '').toLowerCase().includes('senior') ? '4' : (title || '').toLowerCase().includes('junior') ? '2' : '3';
      params.set('f_E', seniority);
      params.set('f_TPR', 'r2592000'); // Past 30 days
      params.set('sortBy', 'DD'); // Most recent
      return `?${params.toString()}`;
    },
    extractSkills: (cv) => {
      const skills = (cv.skills || '').split(',').map(s => s.trim()).filter(Boolean);
      const title = (cv.title || '').toLowerCase();
      if (title.includes('fullstack') || title.includes('full stack')) skills.unshift('Full Stack');
      if (title.includes('frontend') || title.includes('front-end')) skills.unshift('Front End');
      if (title.includes('backend') || title.includes('back-end')) skills.unshift('Back End');
      if (title.includes('devops')) skills.unshift('DevOps');
      if (title.includes('data')) skills.unshift('Data');
      return [...new Set(skills)];
    },
    buildRichQuery: (cv, desiredRole) => {
      const extracted = PORTAL_CONFIG.linkedin.extractSkills(cv);
      const topSkills = extracted.slice(0, 5).join(' OR ');
      const roleQuery = desiredRole || cv.title || '';
      const location = 'Colombia';
      const params = new URLSearchParams();
      params.set('keywords', `${roleQuery} ${topSkills}`);
      params.set('location', location);
      params.set('f_TPR', 'r2592000');
      params.set('sortBy', 'DD');
      params.set('f_WT', '1,2,3'); // On-site, Remote, Hybrid
      return `?${params.toString()}`;
    }
  },
  indeed: {
    name: 'Indeed',
    icon: 'fa-solid fa-briefcase',
    color: '#2164f3',
    baseUrl: 'https://www.indeed.com/jobs',
    buildQuery: (skills, title, location) => {
      const q = title || skills.split(',').slice(0, 3).join(' ');
      return `?q=${encodeURIComponent(q)}&l=${encodeURIComponent(location || '')}`;
    },
    buildRichQuery: (cv, desiredRole, remoteOnly = false, salary = '') => {
      const skills = (cv.skills || '').split(',').map(s => s.trim()).filter(Boolean);
      const topKeywords = skills.slice(0, 4);
      const role = desiredRole || cv.title || '';
      const parts = [role, ...topKeywords].filter(Boolean);
      const q = parts.join(' ');
      const params = new URLSearchParams();
      params.set('q', q);
      params.set('l', 'Colombia');
      params.set('sort', 'date');
      if (remoteOnly) params.set('sc', '0kf%3Aattr(DSQF7)'); // Remote-only filter
      if (salary) params.set('salary', salary);
      params.set('fromage', '14');
      return `?${params.toString()}`;
    }
  },
  torre: {
    name: 'Torre.co',
    icon: 'fa-solid fa-meteor',
    color: '#8b5cf6',
    baseUrl: 'https://torre.co/jobs',
    buildQuery: (skills, title) => {
      const q = title || skills.split(',').slice(0, 3).join(' ');
      return `?search=${encodeURIComponent(q)}`;
    }
  },
  computrabajo: {
    name: 'Computrabajo',
    icon: 'fa-solid fa-globe',
    color: '#f59e0b',
    baseUrl: 'https://www.computrabajo.com/ofertas-de-trabajo/',
    buildQuery: (skills, title, location) => {
      const q = title || skills.split(',').slice(0, 3).join(' ');
      return `?q=${encodeURIComponent(q)}&l=${encodeURIComponent(location || 'colombia')}`;
    }
  }
};

export function getPortalConfig(portal) {
  return PORTAL_CONFIG[portal] || null;
}

export function buildPortalUrl(portal, cvSkills, jobTitle, location) {
  const config = PORTAL_CONFIG[portal];
  if (!config) return '#';
  return config.baseUrl + config.buildQuery(cvSkills, jobTitle, location);
}

export function getAllPortalKeys() {
  return Object.keys(PORTAL_CONFIG);
}

export function buildLinkedInRichQuery(cv, desiredRole) {
  return PORTAL_CONFIG.linkedin.buildRichQuery(cv, desiredRole);
}

export function buildIndeedRichQuery(cv, desiredRole, remoteOnly, salary) {
  return PORTAL_CONFIG.indeed.buildRichQuery(cv, desiredRole, remoteOnly, salary);
}

/**
 * Simulates a portal search returning mock results based on CV profile.
 * Each result mimics what a real portal would return.
 */
export function simulatePortalSearch(portal, cv, jobTitle, count = 4) {
  const config = PORTAL_CONFIG[portal];
  if (!config) return [];

  const skills = (cv.skills || '').split(',').map(s => s.trim()).filter(Boolean);
  const titleWords = (jobTitle || cv.title || '').split(' ');

  const companies = {
    linkedin: ['TechCorp', 'DataFlow Inc', 'CloudBase', 'NexGen Systems'],
    indeed: ['InnovateTech', 'Matrix Solutions', 'Pioneer Labs', 'Summit Software'],
    torre: ['Kickstart AI', 'RemoteFirst', 'GlobalDev', 'StarStudio'],
    computrabajo: ['TecnoGlobal', 'Sistemas Plus', 'DigitalCol', 'Avantica']
  };

  const locations = ['Remote', 'Bogotá, Colombia', 'Medellín, Colombia', 'São Paulo, Brazil', 'Mexico City, Mexico'];

  const portalCompanies = companies[portal] || companies.linkedin;

  const results = [];
  for (let i = 0; i < count; i++) {
    const role = titleWords.length > 1
      ? titleWords.slice(0, 2).join(' ') + ' ' + (['Developer', 'Engineer', 'Architect', 'Specialist'][i % 4])
      : skills[i % skills.length] + ' ' + (['Developer', 'Engineer'][i % 2]);

    const company = portalCompanies[i % portalCompanies.length];
    const location = locations[i % locations.length];

    // Calculate a pseudo-random but deterministic match score
    const scoreBase = (skills.length * 10 + (jobTitle ? jobTitle.length : 10) + i * 5) % 41 + 60;
    const matchScore = Math.min(98, scoreBase);

    results.push({
      id: `${portal}-result-${Date.now()}-${i}`,
      title: role,
      company: company,
      location: location,
      source: portal,
      url: config.baseUrl,
      matchScore: matchScore,
      snippet: `We are looking for a ${role} to join our team at ${company}. You will work with cutting-edge technologies in a collaborative environment.`,
      postedDate: `${Math.floor(Math.random() * 14) + 1}d ago`
    });
  }

  return results;
}
