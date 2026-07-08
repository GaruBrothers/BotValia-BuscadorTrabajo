/**
 * AI Service Module for BotValia Buscador
 * Handles client-side API integrations (Gemini, OpenAI) and provides a smart mock mode.
 */

// API config object structure:
// { provider: 'mock' | 'gemini' | 'openai', key: '...', model: '...' }

/**
 * Calculates compatibility match score between CV and Job Description.
 * Returns a JSON object: { score: number, summary: string, gaps: string[], strengths: string[], tips: string[] }
 */
export async function calculateMatch(cv, job, apiConfig) {
  const prompt = `You are an expert ATS (Applicant Tracking System) parser and recruiter.
Analyze the following candidate's CV and the Job Description to calculate a compatibility match.

CANDIDATE CV:
Name: ${cv.fullName}
Role: ${cv.title}
Skills: ${cv.skills}
Experience Detail:
${cv.body}

JOB DESCRIPTION:
Title: ${job.title}
Company: ${job.company}
Description:
${job.description}

You must respond ONLY with a JSON object. Do not include markdown code block syntax (like \`\`\`json) in your final response, just the raw JSON. The JSON structure must be:
{
  "score": 85, // Integer from 0 to 100
  "summary": "Short paragraph summarizing the overall fit of the candidate...",
  "gaps": ["Missing skill or experience item 1", "Missing skill or experience item 2"],
  "strengths": ["Candidate strength 1 showing fit", "Candidate strength 2 showing fit"],
  "tips": ["Actionable CV improvement tip 1", "Actionable CV improvement tip 2"]
}`;

  if (apiConfig.provider === 'mock') {
    return simulateMatch(cv, job);
  }

  try {
    const rawResponse = await makeAICall(prompt, apiConfig);
    const cleaned = cleanJsonResponse(rawResponse);
    return JSON.parse(cleaned);
  } catch (error) {
    console.error("AI Error:", error);
    throw new Error("Failed to communicate with AI provider. Check your API key. Error: " + error.message);
  }
}

/**
 * Generates tailored recommendations to optimize CV bullet points.
 */
export async function optimizeCV(cv, job, apiConfig) {
  const prompt = `You are a professional resume writer and career coach.
Compare the CV and the Job Description, and provide bullet-by-bullet concrete recommendations on what keywords to add, what descriptions to rephrase, and how the candidate should rewrite their CV to maximize ATS score.

CANDIDATE CV:
${cv.fullName} - ${cv.title}
Skills: ${cv.skills}
${cv.body}

JOB DESCRIPTION:
Title: ${job.title} at ${job.company}
${job.description}

Output your analysis in beautiful Markdown format:
Include:
1. **Keyword Optimization**: What specific keywords from the job description are missing in the candidate's CV and should be added.
2. **Rephrasing Suggestions**: Select 2 or 3 bullet points from the candidate's work experience and show a "Before" and "After" rewrite.
3. **General Strategy**: A quick checklist of changes.`;

  if (apiConfig.provider === 'mock') {
    return simulateCVOptimize(cv, job);
  }

  try {
    return await makeAICall(prompt, apiConfig);
  } catch (error) {
    console.error("AI Error:", error);
    throw new Error("AI call failed: " + error.message);
  }
}

/**
 * Generates a customized cover letter.
 */
export async function generateCoverLetter(cv, job, tone, apiConfig) {
  const prompt = `You are an expert career advisor. Write a customized cover letter for:
Candidate: ${cv.fullName} (${cv.title})
Applying for: ${job.title} at ${job.company}

TONE: ${tone}

Use the candidate's achievements and skills from their CV:
Skills: ${cv.skills}
Experience:
${cv.body}

And match it to the Job requirements:
${job.description}

Draft a complete, professional, and convincing cover letter. Do not include placeholders (like [Date] or [Insert Name]). Invent realistic details or omit them. Include salutation, body paragraphs matching the candidate's strengths, and a professional sign-off.`;

  if (apiConfig.provider === 'mock') {
    return simulateCoverLetter(cv, job, tone);
  }

  try {
    return await makeAICall(prompt, apiConfig);
  } catch (error) {
    console.error("AI Error:", error);
    throw new Error("AI call failed: " + error.message);
  }
}

/**
 * Generates interview coach questions and suggested answers.
 */
export async function generateInterviewPrep(cv, job, apiConfig) {
  const prompt = `You are an hiring manager conducting interviews for the role of ${job.title} at ${job.company}.
Based on the candidate's background and the job requirements, generate:
1. Three (3) technical questions that test the specific tech stack requested, showing how the candidate should answer based on their experience.
2. Two (2) behavioral/situational questions (STAR method) tailored to the requirements.

CANDIDATE CV:
${cv.fullName} - ${cv.title}
Experience: ${cv.body}

JOB DESCRIPTION:
${job.description}

Provide the output in clean, readable Markdown format with sections for Questions, Ideal Answers, and helpful Tips.`;

  if (apiConfig.provider === 'mock') {
    return simulateInterview(cv, job);
  }

  try {
    return await makeAICall(prompt, apiConfig);
  } catch (error) {
    console.error("AI Error:", error);
    throw new Error("AI call failed: " + error.message);
  }
}

/**
 * Generates optimized search keywords and queries based on CV content.
 * Extracts key skills, roles, and technologies for portal search.
 */
export async function generateSearchQuery(cv, apiConfig) {
  const prompt = `You are a job search optimization expert. Given the following CV information, generate an optimized set of search keywords and queries for job portals.

  CANDIDATE CV:
  Name: ${cv.fullName}
  Role: ${cv.title}
  Skills: ${cv.skills}
  Experience:
  ${cv.body}

  You must respond ONLY with a JSON object. Do not include markdown code block syntax. The JSON structure must be:
  {
    "primaryKeywords": ["keyword1", "keyword2", "keyword3"],
    "secondaryKeywords": ["keyword1", "keyword2", "keyword3"],
    "recommendedRoles": ["role1", "role2"],
    "searchQueries": ["full query 1", "full query 2", "full query 3"],
    "locations": ["Colombia", "Remote", "United States"],
    "excludedTerms": ["term1", "term2"]
  }`;

  if (apiConfig.provider === 'mock') {
    return simulateSearchQuery(cv);
  }

  try {
    const rawResponse = await makeAICall(prompt, apiConfig);
    const cleaned = cleanJsonResponse(rawResponse);
    return JSON.parse(cleaned);
  } catch (error) {
    console.error("AI Error:", error);
    throw new Error("Failed to generate search query. Error: " + error.message);
  }
}

/**
 * Generates a customized outreach/communication message based on template type.
 * Types: cold-linkedin, follow-up, resignation, counter-offer
 */
export async function generateMessage(cv, job, templateType, contactName, contactEmail, apiConfig) {
  const prompts = {
    'cold-linkedin': `You are an expert career coach. Write a professional, concise LinkedIn message (max 300 characters) from:
Candidate: ${cv.fullName} (${cv.title})
Skills: ${cv.skills}
To a recruiter${contactName ? ' named ' + contactName : ''}${contactEmail ? ' (email: ' + contactEmail + ')' : ''}
About the ${job ? 'role: ' + job.title + ' at ' + job.company : 'job opportunity'}
The message should: Introduce the candidate, mention relevant skills matching the role, express interest, and suggest a brief chat. Be warm but professional. Include a call to action.`,

    'follow-up': `You are a professional job seeker. Write a polite interview follow-up email from:
Candidate: ${cv.fullName} (${cv.title})
After interviewing for: ${job ? job.title + ' at ' + job.company : 'a position'}
To ${contactName || 'the hiring manager'}${contactEmail ? ' (' + contactEmail + ')' : ''}
The email should: Thank them for their time, reiterate interest in the role, highlight 1-2 relevant strengths, and ask about next steps politely.`,

    'resignation': `You are a professional employee. Write a respectful resignation letter for:
Employee: ${cv.fullName} (${cv.title})
Current company: ${job ? job.company : 'your current company'}
The letter should: State the resignation, express gratitude for opportunities, offer to help with transition, specify a professional notice period (2 weeks).`,

    'counter-offer': `You are a professional negotiating a job offer. Write a polite counter-offer email from:
Candidate: ${cv.fullName} (${cv.title})
Regarding offer from: ${job ? job.company : 'the company'}
To ${contactName || 'the recruiter'}${contactEmail ? ' (' + contactEmail + ')' : ''}
The email should: Thank them for the offer, express enthusiasm for the role, respectfully negotiate the salary or benefits (mention specific numbers or percentages if needed), and remain open to discussion.`
  };

  const prompt = prompts[templateType] || prompts['cold-linkedin'];

  if (apiConfig.provider === 'mock') {
    return simulateMessage(cv, job, templateType, contactName);
  }

  try {
    return await makeAICall(prompt, apiConfig);
  } catch (error) {
    console.error("AI Error:", error);
    throw new Error("Failed to generate message: " + error.message);
  }
}

function simulateMessage(cv, job, templateType, contactName) {
  const contact = contactName || 'Hiring Manager';
  const company = job ? job.company : 'your company';
  const role = job ? job.title : 'the position';
  const name = cv.fullName;

  const messages = {
    'cold-linkedin': `Hi ${contact},

I hope this message finds you well! My name is ${name}, a ${cv.title} with strong expertise in ${cv.skills.split(',').slice(0, 3).join(', ')}.

I came across the ${role} role at ${company} and was impressed by the company's innovative work. My background in fullstack development and cloud architecture aligns well with what you're looking for.

I'd love to connect and briefly discuss how my experience could add value to your team. Would you be open to a quick chat this week?

Best regards,
${name}`,

    'follow-up': `Subject: Follow-Up - ${role} Interview

Dear ${contact},

Thank you so much for the opportunity to interview for the ${role} position at ${company} earlier this week. I truly enjoyed learning more about the team and the exciting projects ahead.

After our conversation, I'm even more convinced that my experience in ${cv.skills.split(',').slice(0, 2).join(' and ')} would allow me to make an immediate impact.

I remain very enthusiastic about the opportunity and would appreciate any updates on the next steps. Please don't hesitate to reach out if you need any additional information.

Thank you again for your time and consideration.

Warm regards,
${name}
${cv.title}`,

    'resignation': `Subject: Resignation - ${name}

Dear Team,

Please accept this letter as formal notification that I am resigning from my position as ${cv.title} at ${company}. My last day will be two weeks from today.

I want to express my sincere gratitude for the opportunities I've had during my time here. I've learned immensely and am proud of what we've accomplished together.

I am committed to ensuring a smooth transition and will do everything possible to hand over my responsibilities effectively.

Thank you for your understanding and support.

Sincerely,
${name}`,

    'counter-offer': `Subject: Offer Discussion - ${role}

Dear ${contact},

Thank you so much for extending the offer for the ${role} position at ${company}. I'm truly excited about the opportunity to join the team and contribute to your ongoing success.

After careful consideration, I would like to discuss the compensation package. Based on my experience in ${cv.skills.split(',').slice(0, 2).join(' and ')}, my market research, and the value I believe I can bring, I was hoping we could explore a ${'\u00B4'}10-15% adjustment to the base salary.

I remain very enthusiastic about this role and am confident we can find a mutually agreeable solution. I'm happy to discuss this further at your convenience.

Thank you again for this opportunity.

Best regards,
${name}`
  };

  return messages[templateType] || messages['cold-linkedin'];
}

function simulateSearchQuery(cv) {
  const skills = (cv.skills || '').split(',').map(s => s.trim()).filter(Boolean);
  const title = cv.title || 'Software Developer';

  const primaryKeywords = skills.slice(0, 5);
  const secondaryKeywords = skills.slice(5, 10).length > 0
    ? skills.slice(5, 10)
    : ['Agile', 'Scrum', 'Teamwork', 'Problem Solving'];

  const roleBase = title.split(' ').slice(0, 2).join(' ');
  const recommendedRoles = [
    title,
    `${roleBase} ${skills[0] || ''}`,
    `${roleBase} ${skills[1] || 'Cloud'}`
  ];

  const searchQueries = [
    `${title} ${skills.slice(0, 3).join(' ')}`,
    `${skills.slice(0, 2).join(' ')} ${roleBase}`,
    `${title} remote`
  ];

  return {
    primaryKeywords,
    secondaryKeywords,
    recommendedRoles,
    searchQueries,
    locations: ['Colombia', 'Remote', 'United States', 'Mexico'],
    excludedTerms: ['Junior', 'Trainee', 'Intern']
  };
}

/* ==========================================================================
   NETWORK CALL ORCHESTRATOR
   ========================================================================== */
async function makeAICall(prompt, config) {
  if (config.provider === 'gemini') {
    return callGemini(prompt, config.key, config.model || 'gemini-1.5-flash');
  } else if (config.provider === 'openai') {
    return callOpenAI(prompt, config.key, config.model || 'gpt-4o-mini');
  }
  throw new Error("Unsupported AI Provider configured.");
}

async function callGemini(prompt, apiKey, model) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    })
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `HTTP ${response.status} from Gemini API`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Empty response from Gemini API.");
  return text;
}

async function callOpenAI(prompt, apiKey, model) {
  const url = 'https://api.openai.com/v1/chat/completions';
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `HTTP ${response.status} from OpenAI API`);
  }

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error("Empty response from OpenAI API.");
  return text;
}

function cleanJsonResponse(raw) {
  let cleaned = raw.trim();
  // Strip markdown formatting if AI added it
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.substring(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.substring(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.substring(0, cleaned.length - 3);
  }
  return cleaned.trim();
}

/* ==========================================================================
   SMART MOCK SIMULATION ENGINE (No API Key Required)
   ========================================================================== */
function calculateKeywordOverlapScore(cv, job) {
  const cvText = `${cv.fullName} ${cv.title} ${cv.skills} ${cv.body}`.toLowerCase();
  const jobText = `${job.title} ${job.company} ${job.description}`.toLowerCase();

  // Extract keywords
  const keywords = [
    'javascript', 'typescript', 'node.js', 'node', 'next.js', 'nextjs', 'react', 'reactjs',
    'postgresql', 'postgres', 'docker', 'aws', 'amazon', 'cloud', 'devops', 'ci/cd', 'github',
    'python', 'pytorch', 'tensorflow', 'data science', 'kubernetes', 'terraform', 'graphql',
    'rest', 'api', 'scrum', 'agile'
  ];

  let matches = 0;
  let totalInJob = 0;

  keywords.forEach(word => {
    const inJob = jobText.includes(word);
    if (inJob) {
      totalInJob++;
      if (cvText.includes(word)) {
        matches++;
      }
    }
  });

  if (totalInJob === 0) return 70; // Default
  return Math.round((matches / totalInJob) * 100);
}

function simulateMatch(cv, job) {
  // We customize mock output based on standard demo objects
  const score = calculateKeywordOverlapScore(cv, job);
  
  let summary = "";
  let strengths = [];
  let gaps = [];
  let tips = [];

  if (job.id === 'demo-job-1' || job.title.includes('Fullstack')) {
    summary = `Excellent alignment detected. The candidate (${cv.fullName}) matches almost all primary stack components: Node.js, Next.js, and relational databases. Your cloud and container experience aligns with Globant's target ecosystem.`;
    strengths = [
      "Deep experience in fullstack web architecture including Next.js/React and Node.js.",
      "Proven knowledge of containerization with Docker and deployment configurations on AWS.",
      "PostgreSQL query optimization skills explicitly mentioned in previous roles."
    ];
    gaps = [
      "Mentorship of junior developers is required, but details are thin in your experience list.",
      "GraphQL API design experience is briefly mentioned in skills list but not elaborated in project details."
    ];
    tips = [
      "Add a concrete bullet point to your tech-solutions role showing how you mentored the 4 developers.",
      "Add a projects section mentioning a GraphQL integration."
    ];
  } else if (job.id === 'demo-job-2' || job.title.includes('DevOps') || job.title.includes('Cloud')) {
    summary = `Good profile fit, particularly around AWS services and Docker container engines. However, the vacancy places high priority on Infrastructure-as-Code and Kubernetes clustering, which are currently missing or underrepresented in your CV.`;
    strengths = [
      "AWS Certified Solutions Architect (2024) indicates strong foundation in cloud setups.",
      "Solid understanding of Docker build files and server management.",
      "Familiarity with CI/CD automation pipelines using GitHub Actions."
    ];
    gaps = [
      "No direct mention of Infrastructure as Code (IaC) using Terraform.",
      "Missing active administration of Kubernetes clusters (EKS/GKE).",
      "No python/bash automation scripting samples visible in resume text."
    ];
    tips = [
      "Add 'Terraform' to your skills list if you have conceptual knowledge.",
      "Specify if your AWS setup used infrastructure automations."
    ];
  } else if (job.id === 'demo-job-3' || job.title.includes('Data') || job.title.includes('AI')) {
    summary = `Weak matching profile. The vacancy is highly focused on mathematics, deep learning algorithms, and Python data warehouses (PyTorch/TensorFlow). Your profile is concentrated on full-stack web application development and cloud hosting.`;
    strengths = [
      "Strong database knowledge in PostgreSQL, useful for pipeline integrations.",
      "Systems Engineering degree provides solid computer science theory."
    ];
    gaps = [
      "No experience in Machine Learning frameworks (TensorFlow, PyTorch).",
      "Missing Python data stacks (Pandas, NumPy, Scikit-learn).",
      "Lack of mathematical model building or A/B testing history."
    ];
    tips = [
      "If you are actively pivoting, create a dedicated data portfolio on GitHub.",
      "Consider tailoring this CV toward Fullstack Engineer positions at Rappi instead."
    ];
  } else {
    // Dynamic generation for custom entries
    summary = `Candidate CV exhibits a calculated compatibility of ${score}% with the ${job.title} role at ${job.company}.`;
    strengths = [
      `Aligns with key technical components mentioned in the job description.`,
      `Demonstrated work experience in software engineering systems.`
    ];
    gaps = [
      `Some advanced technologies in the job listing are not explicitly outlined in your CV skills.`,
      `Missing measurable impact metrics (quantifiable achievements) matching this job's scale.`
    ];
    tips = [
      `Integrate key terminology from the job listing into your summary.`,
      `Format your work achievements to match the responsibilities of this vacancy.`
    ];
  }

  return {
    score: score,
    summary: summary,
    strengths: strengths,
    gaps: gaps,
    tips: tips
  };
}

function simulateCVOptimize(cv, job) {
  const score = calculateKeywordOverlapScore(cv, job);
  return `### CV Optimization Guide for **${job.title}** at **${job.company}**

Based on our semantic comparison, your resume scores **${score}%** in ATS compatibility. Here are the key improvements required to rank higher:

#### 1. Keyword Optimization (Missing Terms)
Ensure these critical keywords are added to your **Skills** or **Experience** section:
- **${job.title.includes('Fullstack') ? 'TypeScript, GraphQL APIs, Developer Mentoring' : job.title.includes('DevOps') ? 'Terraform (IaC), Kubernetes, EKS/ECS, Bash Scripting' : 'Python, PyTorch, Deep Learning, A/B Testing'}**

#### 2. Bullet Point Rephrasing (Before & After)

* **Bullet 1: Containerization and Pipelines**
  * *Before*: "Containerized development and production systems using Docker, cutting deployment time."
  * *After*: "Containerized web services using **Docker** and automated multi-stage builds, reducing pipeline delivery lifecycle from 45 minutes to 5 minutes."

* **Bullet 2: Database Performance**
  * *Before*: "Optimised PostgreSQL database query performance."
  * *After*: "Optimized **PostgreSQL** query indexing and database transaction times, resolving query bottlenecks and reducing load latency by 1.8s."

#### 3. Strategic Action Checklist
- [ ] Align your professional headline to read: "**${job.title}**" or similar.
- [ ] Detail your accomplishments using the STAR model (Situation, Task, Action, Result).
- [ ] Clean up format styles, making sure headers are clear and system-readable.`;
}

function simulateCoverLetter(cv, job, tone) {
  const today = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
  return `Estimado Equipo de Selección de ${job.company},

Le escribo para expresar mi gran interés en la vacante de ${job.title} en ${job.company}. Como Ingeniero de Software con una sólida trayectoria en el desarrollo de arquitecturas escalables, considero que mi perfil técnico y mi enfoque proactivo se alinean perfectamente con las necesidades de su equipo.

En mi rol actual en TechSolutions Inc., he liderado el diseño de plataformas de software utilizando tecnologías afines a las que ustedes implementan. Por ejemplo, logré reducir los tiempos de despliegue en un 80% mediante la contenedorización con Docker y el diseño de automatizaciones en la nube, optimizando los ciclos de lanzamiento de características críticas. Asimismo, poseo un fuerte dominio de bases de datos como PostgreSQL y servicios en la nube en el entorno AWS.

Me atrae especialmente la oportunidad de incorporarme a ${job.company} debido a su liderazgo e innovación en la industria. Estoy convencido de que mi experiencia técnica (incluyendo ${cv.skills.split(',').slice(0,5).join(',')}) y mi capacidad para trabajar en equipos ágiles aportarán un valor significativo al cumplimiento de sus objetivos tecnológicos.

Agradezco de antemano su consideración y tiempo al revisar mi postulación. Quedo a su entera disposición para mantener una entrevista y conversar sobre cómo mi experiencia puede contribuir al éxito de su organización.

Atentamente,

${cv.fullName}
${cv.title}
garubrothers@gmail.com`;
}

function simulateInterview(cv, job) {
  return `### Interview Study Guide: **${job.title}** at **${job.company}**

Use this study sheet to prepare for the selection process.

---

#### 1. Technical Question: Database performance bottlenecks
* **Question**: In this role, we handle substantial transactions. How do you identify and resolve query latency in PostgreSQL?
* **Ideal Answer**: "I start by analyzing the query plan using \`EXPLAIN ANALYZE\` to check for sequential scans and bad join strategies. I then look at adding indexes on foreign keys, configuring composite indexes, or normalizing/denormalizing based on write vs. read patterns. At my last job, this approach cut dashboard load times by 1.8 seconds."
* **Pro-Tip**: Be specific about the database tools you use. Mentioning PostgreSQL-specific functions builds credibility.

#### 2. Technical Question: Cloud deployment orchestration
* **Question**: Can you explain how you structured your container deployment workflow on AWS?
* **Ideal Answer**: "We containerized the Node/React application using Docker, creating multi-stage builds to keep images small. Those images were pushed to AWS ECR. We configured GitHub Actions to trigger on release, building the code and updating ECS tasks with a rolling update strategy, avoiding any downtime."

#### 3. Behavioral Question: Dealing with shifting priorities
* **Question**: Tell me about a time when a project requirement changed midway. How did you adapt?
* **Ideal Answer**: "During a release cycle at DevFactory, a key payment gateway API changed. I collaborated with the product owner to scope down secondary features, shifted focus to re-integrating the payment endpoints, and delivered the critical system on time without sacrificing security."`;
}
