# UpSkillify 🚀

UpSkillify is a modern, bilingual e-learning platform designed for tech enthusiasts. It provides a structured learning experience through guided modules, practical topics with interactive code snippets, and expert-crafted exams.

![Bilingual Support](https://img.shields.io/badge/Language-English%20%2F%20Spanish-blue)
![Tech Stack](https://img.shields.io/badge/Stack-Next.js%2015%20%7C%20Prisma%20%7C%20PostgreSQL-black)

## ✨ Key Features

- **🌍 Bilingual Content:** Seamlessly toggle between English and Spanish across the entire platform.
- **🛠️ Admin Dashboard:** Comprehensive course management system for administrators.
  - **Bulk Topic Editor:** Sync multiple lessons at once using a powerful JSON-based editor with live preview.
  - **Module Management:** Effortlessly create, reorder, and update course modules.
  - **Course Controls:** Draft/Publish toggle to manage content visibility.
- **📖 Enhanced Learning Experience:**
  - **Smart Navigation:** Automatic progression to the next topic upon completion.
  - **Progress Tracking:** Mark lessons as completed to keep track of your learning journey.
  - **Guided Flow:** Next-topic navigation is restricted until current content is mastered.
- **🎨 Modern UI/UX:**
  - Responsive design with Dark/Light mode support.
  - High-fidelity content previews with syntax highlighting for code blocks.
  - Custom Toast notification system for elegant user feedback.
- **🔐 Secure Authentication:** Robust user authentication and role-based access control (RBAC) via NextAuth.js.

## 🚀 Tech Stack

- **Framework:** [Next.js 15 (App Router)](https://nextjs.org/)
- **Database:** [PostgreSQL](https://www.postgresql.org/) (via [Neon](https://neon.tech/))
- **ORM:** [Prisma](https://www.prisma.io/)
- **Authentication:** [NextAuth.js](https://next-auth.js.org/)
- **Styling:** [Tailwind CSS 4](https://tailwindcss.com/)
- **Content Parsing:** React-Markdown with GFM and Syntax Highlighting.

## 🛠️ Getting Started

### Prerequisites

- Node.js 20+
- A PostgreSQL database (e.g., Neon.tech)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/upskillify.git
   cd upskillify
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Setup:**
   Create a `.env` file in the root directory and add the following:
   ```env
   DATABASE_URL="your-postgresql-url"
   NEXTAUTH_SECRET="your-secret-key"
   NEXTAUTH_URL="http://localhost:3000"
   
   # Admin Seed Credentials
   ADMIN_EMAIL="admin@upskillify.com"
   ADMIN_PASSWORD="your-secure-password"
   ```

4. **Database Setup:**
   ```bash
   npx prisma generate
   npx prisma db push
   npx prisma db seed
   ```

5. **Run the development server:**
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📂 Project Structure

- `src/app`: Next.js App Router pages and API routes.
- `src/components`: Reusable UI components (Admin, Courses, Layout, etc.).
- `src/context`: React Context providers (Language, Toast).
- `src/lib`: Server actions, authentication config, and Prisma client.
- `prisma`: Database schema and seed scripts.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is [MIT](LICENSE) licensed.
