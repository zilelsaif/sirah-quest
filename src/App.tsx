import { GameCanvas } from './game/GameCanvas'

function App() {
  return (
    <main className="app-shell">
      <section className="starter-card" aria-labelledby="game-title">
        <p className="build-label">Development Build v0.4.0 by Zil-el-Saif</p>
        <h1 id="game-title">Sirah Quest</h1>
        <p className="tagline">Classic Fantasy Learning Adventure</p>
      </section>
      <section className="game-panel" aria-labelledby="prototype-title">
        <div className="game-panel__header">
          <h2 id="prototype-title">Question &amp; Clue Prototype</h2>
          <p>Explore with WASD, arrows, or tap. Answer questions at discovered clues.</p>
        </div>
        <GameCanvas />
      </section>
    </main>
  )
}

export default App
