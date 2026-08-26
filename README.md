# Sirah Quest

A future bilingual Bahasa Melayu / English educational exploration RPG with a
classic fantasy JRPG feel.

This repository contains the web application foundation and a small Phaser
movement prototype. Sirah content, backend services, authentication, database,
and mobile packaging have not been added yet.

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

## Play the movement prototype

The test map supports both desktop and touch-friendly controls:

- Move with WASD or the arrow keys.
- Click a map destination with a mouse.
- Tap a map destination on a phone or tablet.

Keyboard movement cancels an active click or tap destination. The prototype uses
placeholder shapes only; it does not contain final game art or content.

## Create a production build

```bash
npm run build
```

This checks the TypeScript code and creates an optimized production build in the
`dist` directory. It also copies every archived release into `dist/releases`, so
the latest app and all old releases can be deployed together.

To preview that build locally, run:

```bash
npm run preview
```

## Archive a release

Create an archive when a version is ready to preserve. Versions must use the
`vMAJOR.MINOR.PATCH` format. For example, to archive version `v0.0.1`, run:

```bash
npm run release -- v0.0.1
```

The command builds the current app with relative asset paths and saves the
complete result in `releases/v0.0.1`. Each archive contains its own JavaScript,
CSS, images, and other assets, so it does not depend on the latest build.

Archived releases are immutable: the command stops with an error if that version
already exists. To publish the latest app together with all archives, run
`npm run build`. After deployment, the latest version is available at `/` and
the example archive is available at `/releases/v0.0.1/`.

## Project structure

```text
src/
├── game/        Phaser bootstrap, scene, input, and movement controller
├── App.tsx      Starter screen
├── main.tsx     React entry point
└── styles.css   Responsive global styles
releases/         Self-contained, immutable release archives
scripts/          Release creation and production-copy scripts
```
