<p align="center">⚛︎</p>

<h1 align="center">P A R T I C L E S</h1>

<p align="center"><sub>SIMULATION PROTOCOL</sub></p>

![Status](https://img.shields.io/badge/status-active-22c55e)
![Platform](https://img.shields.io/badge/platform-web-0ea5e9)
![Node](https://img.shields.io/badge/node-%3E%3D18-3c873a)

Real-time particle strategy simulation/game with a web interface and a progressive campaign mode.

### Overview

PARTICLES lets you observe and play with two core factions:

- Photon (runners)
- Electron (chasers)

Each faction has distinct mechanics such as combat, healing, speed boosts, energy node interactions, and obstacle pressure.

### Project Origin

This project is based on the Java project **Particles** from:

- https://github.com/mpjmar/Particles-java.git

This repository extends that idea into a web-focused implementation with multiple gameplay modes and UI systems.

### Game Modes

- Simulation: autonomous mode for observing emergent behavior.
- Pulse Clash: player-vs-system mode where you choose a side and trigger active abilities.
- Core Ascension: staged campaign with survival objectives, transitions, and scaling difficulty.

### Highlights

- Grid-based simulation engine.
- Real-time HUD with match/resource feedback.
- Ability charges with energy node recovery.
- Reserve Lock system in Core Ascension mode.
- Per-level balancing (density, enemy life, spawn pace).
- Local persistence for selected settings and metrics.

### Tech Stack

- HTML5
- CSS3
- JavaScript (runtime core)
- TypeScript (source structure in `web/src`)

### Repository Structure

- `web/`: main web application.
- `web/index.html`: mode selection entry point.
- `web/simulation.html`: Simulation mode page.
- `web/game_selection.html`, `web/game.html`: Pulse Clash mode pages.
- `web/levels_selection.html`, `web/levels.html`: Core Ascension mode pages.
- `web/main.js`: base engine (simulation, render, loop).
- `web/game.js`: Pulse Clash mode logic.
- `web/levels.js`: Core Ascension campaign logic.
- `web/src/`: modular TypeScript source reference.
- `imgs/`: image assets.

### Local Setup

Recommended: Node.js 18+

1. Go to the web folder:

```bash
cd web
```

2. Install dependencies:

```bash
npm install
```

3. Start local server:

```bash
npm run dev
```

4. Open the URL shown by the command (typically `http://localhost:3000`).

### Available Scripts

From `web/`:

- `npm run dev`: run local static server.
- `npm run build`: compile TypeScript.
- `npm run watch`: compile TypeScript in watch mode.

### Deploy on GitHub Pages

This repository includes an automated workflow at `.github/workflows/deploy-pages.yml`.

1. Push your project to GitHub (default branch: `main`).
2. Open repository `Settings` > `Pages`.
3. In `Build and deployment`, set `Source` to `GitHub Actions`.
4. Push to `main` (or run the workflow manually from `Actions`).
5. When the workflow finishes, your site will be available at:

```text
https://<your-username>.github.io/<your-repo>/
```

### Core Ascension Controls

- HUD buttons `[-]` / `[+]`: adjust Reserve Lock.
- Left/Right arrow keys: adjust Reserve Lock from keyboard.
- Click on board: trigger your faction ability.

### Status

Active development focused on UX clarity, high-density stability, and faction balance.

## ----------------------------------------------------------------------------------------------------------------

### Resumen

PARTICLES es un simulador/juego de estrategia en tiempo real basado en sistemas de particulas, con interfaz web y campana por niveles.

Permite observar y jugar con dos facciones principales:

- Photon (runners)
- Electron (chasers)

Cada faccion tiene mecanicas propias: combate, curacion, mejoras de velocidad, nodos de energia y gestion de obstaculos.

### Origen del Proyecto

Este proyecto esta basado en el proyecto en Java **Particles** del repositorio:

- https://github.com/mpjmar/Particles-java.git

Este repositorio traslada y amplia esa base hacia una implementacion web con varios modos y sistemas de interfaz.

### Modos de Juego

- Simulation: modo autonomo para observar comportamiento emergente.
- Pulse Clash: modo jugador contra sistema, eligiendo faccion y activando habilidades.
- Core Ascension: campana por fases con objetivos de supervivencia, transiciones y dificultad progresiva.

### Caracteristicas

- Motor de simulacion con tablero por celdas.
- HUD en tiempo real para estado y recursos.
- Sistema de cargas de habilidad y recarga por nodos de energia.
- Sistema Reserve Lock en modo Core Ascension.
- Balance por nivel (densidad, vida enemiga, ritmo de aparicion).
- Persistencia local de ajustes y metricas.

### Tecnologias

- HTML5
- CSS3
- JavaScript (runtime principal)
- TypeScript (estructura fuente en `web/src`)

### Estructura del Repositorio

- `web/`: aplicacion web principal.
- `web/index.html`: entrada y seleccion de modo.
- `web/simulation.html`: pagina de simulacion.
- `web/game_selection.html`, `web/game.html`: paginas del modo Pulse Clash.
- `web/levels_selection.html`, `web/levels.html`: paginas del modo Core Ascension.
- `web/main.js`: motor base (simulacion, render, loop).
- `web/game.js`: logica de Pulse Clash.
- `web/levels.js`: logica de campana Core Ascension.
- `web/src/`: referencia modular en TypeScript.
- `imgs/`: recursos visuales.

### Ejecucion Local

Recomendado: Node.js 18+

1. Entra en la carpeta web:

```bash
cd web
```

2. Instala dependencias:

```bash
npm install
```

3. Levanta servidor local:

```bash
npm run dev
```

4. Abre en navegador la URL que muestre el comando (normalmente `http://localhost:3000`).

### Scripts Disponibles

Desde `web/`:

- `npm run dev`: sirve la aplicacion en local.
- `npm run build`: compila TypeScript.
- `npm run watch`: compila TypeScript en modo observacion.

### Despliegue en GitHub Pages

Este repositorio incluye un workflow automatico en `.github/workflows/deploy-pages.yml`.

1. Sube el proyecto a GitHub (rama por defecto: `main`).
2. Abre `Settings` > `Pages` del repositorio.
3. En `Build and deployment`, selecciona `Source: GitHub Actions`.
4. Haz push a `main` (o ejecuta el workflow manualmente desde `Actions`).
5. Cuando termine el workflow, la web quedara publicada en:

```text
https://<tu-usuario>.github.io/<tu-repo>/
```

### Controles en Core Ascension

- Botones HUD `[-]` / `[+]`: ajustar Reserve Lock.
- Flechas izquierda/derecha: ajustar Reserve Lock por teclado.
- Click en tablero: activar habilidad de faccion.

### Estado

Desarrollo activo con foco en claridad de UX, estabilidad en alta densidad y balance entre facciones.

