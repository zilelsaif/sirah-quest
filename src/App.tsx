import { GameCanvas } from './game/GameCanvas'

function App() {
  return (
    <main className="app-shell">
      <section className="starter-card" aria-labelledby="game-title">
        <p className="build-label">Development Build v0.3.0 by Zil-el-Saif</p>
        <h1 id="game-title">Sirah Quest</h1>
        <p className="tagline">Classic Fantasy Learning Adventure</p>
      </section>
      <section className="game-panel" aria-labelledby="prototype-title">
        <div className="game-panel__header">
          <h2 id="prototype-title">Clue Interaction Prototype</h2>
          <p>Move with WASD, arrows, or tap. Press E near a discovered clue.</p>
        </div>
        <GameCanvas />
      </section>
    </main>
  )
}

export default App
