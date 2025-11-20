# React + Vite + TanStack Start Template

A modern, production-ready template built with React 19, Vite, and TanStack Start. This project features a comprehensive tech stack including Tailwind CSS v4, i18next for internationalization, and a robust UI component library.

## Features

- **⚡️ Vite**: Blazing fast build tool and development server.
- **🚀 TanStack Start**: Full-stack React framework powered by TanStack Router.
- **🛣️ TanStack Router**: Type-safe, file-based routing for React.
- **🎨 Tailwind CSS v4**: Utility-first CSS framework for rapid UI development.
- **🧩 Radix UI**: Unstyled, accessible UI primitives (via shadcn/ui).
- **🌍 i18next**: Complete internationalization support (English & German included).
- **🐻 Zustand**: Small, fast and scalable bearbones state-management solution.
- **motion**: Production-ready motion library for React.
- **🌓 Dark Mode**: Built-in dark mode support with `next-themes`.

## Getting Started

### Prerequisites

- Node.js (Latest LTS recommended)
- pnpm (recommended) or npm/yarn

### Installation

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd <project-directory>
   ```

2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Start the development server:

   ```bash
   pnpm dev
   ```

4. Open [http://localhost:5173](http://localhost:5173) in your browser.

## Project Structure

```
src/
├── components/        # Reusable UI components
│   ├── ui/           # Radix UI primitives
│   └── ...
├── hooks/            # Custom React hooks
├── languages/        # i18n translation files
├── lib/              # Utilities and libraries configuration
├── pages/            # Page components
├── routes/           # TanStack Router file-based routes
├── main.tsx          # Application entry point
└── ...
```

## Scripts

- `pnpm dev`: Start the development server
- `pnpm build`: Build the application for production
- `pnpm serve`: Preview the production build
- `pnpm test`: Run tests with Vitest
- `pnpm lint`: Lint the codebase with ESLint
- `pnpm format`: Format code with Prettier
- `pnpm check`: Run Prettier check and ESLint fix

## Tech Stack

- [React](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [TanStack Start](https://tanstack.com/start)
- [TanStack Router](https://tanstack.com/router)
- [Tailwind CSS](https://tailwindcss.com/)
- [Radix UI](https://www.radix-ui.com/)
- [i18next](https://www.i18next.com/)
- [Zustand](https://github.com/pmndrs/zustand)
- [Framer Motion](https://www.framer.com/motion/)
