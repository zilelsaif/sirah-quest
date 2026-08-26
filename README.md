# Sirah Quest

A future bilingual Bahasa Melayu / English educational exploration RPG with a
classic fantasy JRPG feel.

This repository currently contains only the web application foundation. The game
engine, game content, backend services, authentication, database, and mobile
packaging have not been added yet.

## Requirements

- [Node.js](https://nodejs.org/) (a current LTS version is recommended)
- npm (included with Node.js)

## Install dependencies

Open a terminal in the project directory and run:

```bash
npm install
```

You only need to repeat this after dependencies change or after downloading a
fresh copy of the project.

## Run the development server

```bash
npm run dev
```

Vite will print a local address, usually `http://localhost:5173`. Open it in a
browser. The server automatically refreshes the page when source files change.

## Create a production build

```bash
npm run build
```

This checks the TypeScript code and creates an optimized production build in the
`dist` directory.

To preview that build locally, run:

```bash
npm run preview
```

## Project structure

```text
src/
├── game/        Reserved for the future game runtime and Phaser integration
├── App.tsx      Starter screen
├── main.tsx     React entry point
└── styles.css   Responsive global styles
```
