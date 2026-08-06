<div align="center">
  <h1>🚀 GitLance</h1>
  <p><strong>Build. Collaborate. Ship.</strong></p>
  <p>An AI-powered freelance platform that connects developers and clients through GitHub-integrated projects with real-time collaboration, transparent progress tracking, and smart project management.</p>
  
  <a href="#-features">Features</a> •
  <a href="#%EF%B8%8F-tech-stack">Tech Stack</a> •
  <a href="#-getting-started">Getting Started</a> •
  <a href="#-project-structure">Project Structure</a> •
  <a href="#-license">License</a>
</div>

---

## ✨ Features

### 🔗 GitHub Integration
Sync your repositories directly with GitLance to track commits, pull requests, and progress effortlessly. Our platform syncs automatically with your commits and pull requests.

### 👥 Smart Team Formation
Discover developers or clients, send proposals, and build project teams with transparency.

### 💬 Real-Time Collaboration
Built-in chat, file sharing, and task boards to keep everyone aligned with 99.9% uptime.

### 🛠️ Project Management Tools
Manage issues, assign tasks, and monitor repository activity in one place.

### 👤 Developer Profiles
Showcase your GitHub projects, skills, and collaboration history.

### 🔒 Repo Privacy Control
Only approved team members can access project repositories securely with bank-level security.

---

## 🛠️ Tech Stack

| Category | Technologies |
|----------|-------------|
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router) |
| **Language** | [TypeScript](https://www.typescriptlang.org/) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) |
| **UI Components** | [shadcn/ui](https://ui.shadcn.com/), [Radix UI](https://www.radix-ui.com/) |
| **Animations** | [Motion](https://motion.dev/) (Framer Motion) |
| **Backend/Auth** | [Supabase](https://supabase.com/) |
| **GitHub API** | [Octokit](https://github.com/octokit/octokit.js) |
| **Form Handling** | [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) |
| **State Management** | [Zustand](https://zustand-demo.pmnd.rs/) |

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/) or [pnpm](https://pnpm.io/)
- A [Supabase](https://supabase.com/) account
- A [Google AI Studio](https://makersuite.google.com/) API key (for AI features)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Faizan-26/gitlance.git
   cd gitlance
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory with the following variables:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
   GEMINI_API_KEY=your_gemini_api_key
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open [http://localhost:3000](http://localhost:3000)** in your browser

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

---

## 📁 Project Structure

```
gitlance/
├── app/                          # Next.js App Router
│   ├── (marketing)/              # Public marketing pages
│   │   ├── layout.tsx
│   │   └── page.tsx              # Landing page
│   ├── (dashboard)/              # Protected dashboard pages
│   │   ├── (project)/            # Project-related pages
│   │   │   ├── explore/
│   │   │   ├── project/
│   │   │   ├── proposal/
│   │   │   └── workspace/
│   │   ├── profile/
│   │   ├── search/
│   │   ├── workspaces/
│   │   └── layout.tsx
│   ├── auth/                     # Authentication pages
│   │   ├── sign-in/
│   │   ├── signup/
│   │   ├── confirm-email/
│   │   ├── forgot-password/
│   │   └── reset-password/
│   ├── onboarding/               # User onboarding flow
│   ├── settings/                 # User settings
│   └── api/                      # API routes
│
├── components/
│   ├── ui/                       # shadcn/ui components
│   ├── blocks/                   # Custom landing sections
│   ├── landing/                  # Landing page components
│   ├── onboarding/               # Onboarding components
│   ├── project/                  # Project-related components
│   └── search/                   # Search components
│
├── lib/                          # Utility functions
├── hooks/                        # Custom React hooks
├── types/                        # TypeScript type definitions
├── config/                       # Configuration files
├── constants/                    # App constants
└── public/                       # Static assets
```

---

## 📄 License

This project is part of a Final Year Project (FYP). All rights reserved.

---

<div align="center">
  <p>Made with ❤️ by the GitLance Team</p>
</div>
