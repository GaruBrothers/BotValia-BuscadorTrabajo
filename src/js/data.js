export const defaultCV = {
  fullName: "Jaison Hernando Velasco",
  title: "Senior Fullstack Developer & Cloud Engineer",
  skills: "JavaScript, Node.js, Next.js, React, PostgreSQL, Docker, AWS, CI/CD, Git, REST APIs, GraphQL, TypeScript",
  body: `# Professional Summary
Highly skilled and results-driven Senior Fullstack Developer & Cloud Engineer with 6+ years of experience designing, building, and deploying scalable web applications and cloud architectures. Passionate about clean code, performance optimization, and developer productivity tools.

# Work Experience

## Senior Software Engineer | TechSolutions Inc.
*2022 - Present*
- Architected and built a microservices-based SaaS portal using Next.js, Node.js, and PostgreSQL, increasing system throughput by 40%.
- Containerized development and production systems using Docker, cutting deployment time from 45 minutes to 5 minutes.
- Designed CI/CD deployment pipelines on AWS using GitHub Actions and ECS, achieving 99.9% uptime.
- Mentored a team of 4 junior developers and established code review practices to ensure high-quality releases.

## Fullstack Developer | DevFactory Colombia
*2020 - 2022*
- Developed responsive web interfaces using React.js and Tailwind CSS, improving mobile conversion rates by 25%.
- Built RESTful API endpoints using Express.js and integrated third-party payment gateways (Stripe, MercadoPago).
- Optimised PostgreSQL database query performance, decreasing dashboard load times by 1.8 seconds.
- Participated in Agile sprint planning, daily standups, and retrospective meetings.

# Education & Certifications
- **Bachelor of Science in Systems Engineering** - Universidad Nacional (2019)
- **AWS Certified Solutions Architect – Associate** (2024)
- **Docker Certified Associate (DCA)** (2023)
`
};

export const defaultJobs = [
  {
    id: "demo-job-1",
    title: "Senior Fullstack Developer (Node.js & Next.js)",
    company: "Globant",
    url: "https://www.globant.com/careers",
    status: "Interested",
    description: `We are looking for a Senior Fullstack Developer to join our growing engineering team. In this role, you will help design and implement core features of our enterprise web platform.

Requirements:
- Strong experience with JavaScript, TypeScript, and modern frameworks like Next.js and React.
- Solid background in backend development with Node.js and Express.
- Experience with relational databases, specifically PostgreSQL (writing efficient queries and database design).
- Knowledge of containerization using Docker and cloud deployment on AWS services.
- Familiarity with CI/CD automation pipelines (GitHub Actions, GitLab, or similar).
- Experience working in Agile/Scrum teams.
- Good communication skills and ability to collaborate with cross-functional teams.

Nice to have:
- Experience with GraphQL APIs.
- Experience mentoring junior developers.`
  },
  {
    id: "demo-job-2",
    title: "Cloud & DevOps Automation Engineer",
    company: "MercadoLibre",
    url: "https://ideas.mercadolibre.com/jobs",
    status: "Applied",
    description: `MercadoLibre is looking for a Cloud DevOps Engineer to scale our automated infrastructure and deployment systems.

Key Responsibilities:
- Build and maintain infrastructure as code using Terraform.
- Oversee containerized applications running on Docker, Kubernetes, and AWS (ECS/EKS).
- Create, improve, and optimize CI/CD release pipelines to ensure reliable daily rollouts.
- Monitor application performance and cloud infrastructure costs.
- Script routine administrative operations using Bash or Python.

Required Qualifications:
- 3+ years of experience in DevOps or Cloud Administration.
- Deep expertise in AWS cloud ecosystem and containerization (Docker, ECS).
- Solid experience creating deployment automations (GitHub Actions, Jenkins).
- Basic development background (ability to read and debug Node.js or Python application code).
- SQL database management knowledge.`
  },
  {
    id: "demo-job-3",
    title: "Lead AI & Data Scientist",
    company: "Rappi",
    url: "https://rappi.com/careers",
    status: "Interested",
    description: `Rappi's core logic relies heavily on predictive algorithms. We are seeking a Lead Data Scientist to build neural networks and machine learning models for user recommendation engines.

Responsibilities:
- Train and deploy predictive deep learning models using Python, PyTorch, or TensorFlow.
- Design data preprocessing pipelines and feature stores.
- Analyze large datasets using SQL, Pandas, Spark, and big data warehouses.
- Build A/B test experiments to evaluate algorithm impact on customer conversion.

Qualifications:
- Masters or PhD in Computer Science, Statistics, Mathematics, or equivalent.
- 5+ years of experience building production-level AI models.
- Expert-level Python scripting and familiarity with deep learning frameworks.
- NoSQL & SQL expertise.
- Note: Experience with JavaScript, React, or cloud infra is a plus, but secondary to algorithm design.`
  }
];

/**
 * Mock Portal Search Database
 * Pre-seeded job listings simulating results from multiple portals.
 */
export const mockPortalJobs = {
  linkedin: [
    { title: 'Senior Full Stack Developer (Node.js/React)', company: 'Globant', location: 'Medellín, Colombia', snippet: 'We are looking for a Senior Full Stack Developer with strong Node.js and React skills.', matchScore: 92, postedDate: '2d ago', salary: 'USD $70,000 - $95,000' },
    { title: 'Cloud Solutions Architect - AWS', company: 'Oracle', location: 'Remote', snippet: 'Design and implement scalable cloud architectures using AWS services.', matchScore: 88, postedDate: '1d ago', salary: 'USD $90,000 - $130,000' },
    { title: 'DevOps Engineer - Containerization', company: 'MercadoLibre', location: 'Bogotá, Colombia', snippet: 'Manage CI/CD pipelines, Docker, and K8s for LATAM\'s largest e-commerce platform.', matchScore: 85, postedDate: '3d ago', salary: 'USD $50,000 - $75,000' },
    { title: 'Senior Backend Developer (Node.js)', company: 'Wizeline', location: 'Remote', snippet: 'Build high-performance backend services using Node.js, Express, and PostgreSQL.', matchScore: 90, postedDate: '5d ago', salary: 'USD $65,000 - $90,000' },
    { title: 'Fullstack Tech Lead', company: 'Rappi', location: 'Bogotá, Colombia', snippet: 'Lead a team building the next generation delivery logistics platform.', matchScore: 82, postedDate: '1d ago', salary: 'USD $80,000 - $110,000' }
  ],
  indeed: [
    { title: 'Senior React Developer', company: 'EPAM Systems', location: 'Remote', snippet: 'Develop complex UIs using React, TypeScript, and modern frontend tooling.', matchScore: 86, postedDate: '4d ago', salary: 'USD $60,000 - $85,000' },
    { title: 'Fullstack Engineer - JavaScript', company: 'BairesDev', location: 'Remote', snippet: 'Build web applications for Fortune 500 clients using Node and React.', matchScore: 84, postedDate: '2d ago', salary: 'USD $55,000 - $80,000' },
    { title: 'Lead Cloud Engineer', company: 'Tata Consulting', location: 'Bogotá, Colombia', snippet: 'Oversee cloud migration projects and infrastructure automation for enterprise clients.', matchScore: 76, postedDate: '6d ago', salary: 'USD $70,000 - $95,000' },
    { title: 'Software Architect - Fintech', company: 'Nubank', location: 'São Paulo, Brazil', snippet: 'Design scalable financial systems. Experience with distributed systems required.', matchScore: 72, postedDate: '3d ago', salary: 'USD $90,000 - $130,000' }
  ],
  torre: [
    { title: 'Senior Software Engineer - Platform', company: 'Kickstart AI', location: 'Remote / Anywhere', snippet: 'Build and scale the core platform serving millions of users worldwide.', matchScore: 89, postedDate: '1d ago', salary: 'USD $80,000 - $120,000' },
    { title: 'FullStack Developer for SaaS', company: 'RemoteFirst', location: 'Worldwide', snippet: 'Developing a next-gen SaaS platform using React, Node, and PostgreSQL.', matchScore: 87, postedDate: '2d ago', salary: 'USD $60,000 - $90,000' },
    { title: 'DevOps & Cloud Specialist', company: 'GlobalDev', location: 'Latin America', snippet: 'Automate infrastructure and deployment pipelines for multiple product teams.', matchScore: 80, postedDate: '4d ago', salary: 'USD $50,000 - $75,000' },
    { title: 'Technical Lead - Node.js', company: 'StarStudio', location: 'Remote / Anywhere', snippet: 'Lead backend architecture decisions and mentor a distributed engineering team.', matchScore: 83, postedDate: '3d ago', salary: 'USD $75,000 - $105,000' }
  ],
  computrabajo: [
    { title: 'Desarrollador Fullstack Senior', company: 'TecnoGlobal', location: 'Bogotá, Colombia', snippet: 'Empresa de tecnología busca Desarrollador Fullstack con experiencia en Node.js y React.', matchScore: 91, postedDate: '1d ago', salary: 'COP $6,000,000 - $9,000,000' },
    { title: 'Ingeniero DevOps Senior', company: 'Sistemas Plus', location: 'Medellín, Colombia', snippet: 'Administración de infraestructura cloud AWS, Docker y CI/CD.', matchScore: 83, postedDate: '3d ago', salary: 'COP $5,500,000 - $8,000,000' },
    { title: 'Arquitecto de Software', company: 'DigitalCol', location: 'Bogotá, Colombia', snippet: 'Diseño de arquitecturas escalables en la nube. Microservicios y contenedores.', matchScore: 78, postedDate: '5d ago', salary: 'COP $7,000,000 - $10,000,000' },
    { title: 'Líder Técnico Fullstack', company: 'Avantica', location: 'Remote - Colombia', snippet: 'Liderar equipo de desarrollo en proyectos internacionales. Stack: React, Node, AWS.', matchScore: 86, postedDate: '2d ago', salary: 'COP $6,500,000 - $9,500,000' }
  ]
};
