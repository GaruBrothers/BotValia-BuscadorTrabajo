# BotValia Buscador de Trabajo (Job Matcher & Optimizer)

**BotValia** is a modern, privacy-first, and serverless open-source job search assistant powered by AI. It helps developers, professionals, and job seekers organize their job search, match their CVs with job listings, optimize their resumes, draft cover letters, and prepare for interviews using advanced AI models.

Built entirely on a **zero-backend, serverless architecture**, it performs API requests client-side using API keys stored securely in your browser's local storage. Your data (CVs, jobs, and api keys) never leaves your browser, ensuring absolute privacy.

---

## 🌟 Key Features

- **🔍 Smart Job Matcher**: Input any job description or portal link and compare it against your profile. Get a match score (0-100%) and instant alignment details.
- **📄 CV/Resume Gap Analysis**: Understand what technical skills, certifications, or experience elements are missing for a specific job offer.
- **✍️ Personalized Resume Tailor**: Receive line-by-line recommendations on how to refine your CV to pass automated Applicant Tracking Systems (ATS) and human recruiter reviews.
- **✉️ Cover Letter Generator**: Generate professional, personalized cover letters tailored to the specific job and your experience with a customizable tone.
- **🎙️ Interview Coach**: Generate custom behavioral and technical interview questions based on the job description, along with suggested high-impact answers.
- **🔒 Privacy First**: Zero servers. No database configurations. Secure client-side API integrations (Google Gemini API & OpenAI API) with settings saved in `localStorage`.
- **🚀 Demo Mode**: Test all features instantly with pre-loaded mock resumes and job vacancies with a single click—no API key required.

---

## 🛠️ Technology Stack

- **Core**: HTML5, Vanilla ES6+ Javascript.
- **Styles**: Custom Vanilla CSS with a responsive layout and modern glassmorphism design.
- **Bundler**: [Vite](https://vitejs.dev/) for extremely fast hot module replacement and optimized production builds.
- **AI Engine**: Client-side SDK / API endpoints for Google Gemini API and OpenAI API.

---

## 🚀 Getting Started

### Prerequisites

Make sure you have [Node.js](https://nodejs.org/) installed (v18.0.0 or higher recommended).

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/BotValia-Buscador.git
   cd BotValia-Buscador
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```
   The built project files will be generated in the `dist/` directory, ready to be hosted on GitHub Pages, Netlify, or Vercel.

---

## 📂 Project Architecture

```text
├── index.html          # Main application interface and view manager
├── package.json        # Node.js dependencies and build script configurations
├── LICENSE             # MIT License
├── README.md           # Documentation
└── src/
    ├── style.css       # Premium custom styling and typography setup
    └── js/
        ├── app.js      # App lifecycle, state manager, and user interaction
        ├── ai.js       # AI client integrations (Gemini, OpenAI, Mock)
        └── data.js     # Default onboarding states and mock datasets
```

---

## 🤝 Contributing

We welcome contributions of all kinds!
- Add support for new AI providers (Claude API, local Ollama models, etc.)
- Improve parsing engines and ATS scanners
- Submit bug reports and feature requests
- Refine translations and CSS themes

To contribute, please fork the repository, create a feature branch, and submit a pull request.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
