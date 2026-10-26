import { createServer } from 'vite'

const server = await createServer({ appType: 'custom', logLevel: 'silent', server: { middlewareMode: true } })

try {
  const areas = await server.ssrLoadModule('/src/game/areas/areaRegistry.ts')
  const { QUESTION_BANK } = await server.ssrLoadModule('/src/game/questions/questionBank.ts')
  const { selectQuestionsForTopics } = await server.ssrLoadModule('/src/game/questions/questionSelection.ts')
  const { createQuestSession } = await server.ssrLoadModule('/src/game/quests/QuestManager.ts')
  const { createPlayerProgression, applyXPRewards } = await server.ssrLoadModule('/src/game/progression/PlayerProgression.ts')
  const { createSirahMastery, recordQuestionMastery } = await server.ssrLoadModule('/src/game/mastery/SirahMastery.ts')
  const { migrateSave } = await server.ssrLoadModule('/src/game/save/migration.ts')
  const { validateSavePayload } = await server.ssrLoadModule('/src/game/save/validation.ts')

  const topics = areas.ALL_AREA_CLUES.map((clue) => clue.questionTopicId)
  const questionRun = selectQuestionsForTopics(QUESTION_BANK, topics, [], () => 0.314159)
  const oldPositions = {
    [areas.KAMPUNG_ILMU_AREA_ID]: { x: 1510, y: 1110 },
    [areas.BAZAR_LAMA_AREA_ID]: { x: 1600, y: 1100 },
    [areas.PERPUSTAKAAN_HIKMAH_AREA_ID]: { x: 1650, y: 1160 },
  }
  const oldFog = {
    [areas.KAMPUNG_ILMU_AREA_ID]: [{ x: 1450, y: 1080, radius: 320 }],
    [areas.BAZAR_LAMA_AREA_ID]: [{ x: 1580, y: 1080, radius: 360 }],
    [areas.PERPUSTAKAAN_HIKMAH_AREA_ID]: [{ x: 1640, y: 1140, radius: 400 }],
  }
  const areaStates = Object.fromEntries(areas.AREA_DEFINITIONS.map((area) => [area.id, {
    playerPosition: oldPositions[area.id],
    clues: Object.fromEntries(area.clues.map((clue, index) => [clue.id, {
      state: index === 0 ? 'completed' : index === 1 ? 'discovered' : 'hidden',
      lastAnswerWasIncorrect: index === 1,
      incorrectAttemptOccurred: index === 1,
      hintUsed: false,
      eliminatedOptionIds: [],
    }])),
    fogDiscoveryPoints: oldFog[area.id],
  }]))
  const quests = createQuestSession()
  const firstQuestId = Object.keys(quests.quests)[0]
  quests.quests[firstQuestId] = { ...quests.quests[firstQuestId], status: 'ACTIVE' }
  quests.acceptedQuestIds = [firstQuestId]
  quests.trackedQuestId = firstQuestId
  const progression = applyXPRewards(createPlayerProgression(), [{ id: 'clue:clue-1', amount: 10 }])
  const mastery = recordQuestionMastery(createSirahMastery(), questionRun.assignments[0].question.id, 8)

  const v013Payload = {
    schemaVersion: 3,
    appVersion: '0.13.0',
    savedAt: '2026-10-26T00:00:00.000Z',
    playerProgression: progression,
    masteryState: mastery,
    runState: {
      mode: 'AREA_MAP',
      area: { questionRun, areaStates, quests, remainingHints: 0 },
      world: { currentLocationId: 'perpustakaan-hikmah', visitedLocationIds: ['kampung-ilmu', 'bazar-lama', 'perpustakaan-hikmah'], hasEnteredArea: true },
    },
  }

  const loaded = validateSavePayload(migrateSave(v013Payload))
  if (!loaded) throw new Error('Meaningful v0.13.0 fixture did not validate under v0.14.0')
  for (const area of areas.AREA_DEFINITIONS) {
    const state = loaded.runState.area.areaStates[area.id]
    if (JSON.stringify(state.playerPosition) !== JSON.stringify(oldPositions[area.id])) throw new Error(`${area.id} position changed`)
    if (JSON.stringify(state.fogDiscoveryPoints) !== JSON.stringify(oldFog[area.id])) throw new Error(`${area.id} fog changed`)
    if (state.clues[area.clues[0].id].state !== 'completed') throw new Error(`${area.id} clue completion changed`)
  }
  if (loaded.playerProgression.totalXP !== 10 || loaded.runState.area.remainingHints !== 0) throw new Error('Progression or Hint state changed')
  if (loaded.runState.area.quests.trackedQuestId !== firstQuestId) throw new Error('Tracked quest changed')
  if (loaded.masteryState.questionRecords[questionRun.assignments[0].question.id]?.bestScore !== 8) throw new Error('Mastery changed')

  const expanded = areas.AREA_DEFINITIONS[0].zones[0].accessPoint
  loaded.runState.area.areaStates[areas.KAMPUNG_ILMU_AREA_ID].fogDiscoveryPoints.push({ ...expanded, radius: 320 })
  loaded.appVersion = '0.14.0'
  loaded.savedAt = '2026-10-26T00:10:00.000Z'
  if (!validateSavePayload(loaded)) throw new Error('Re-saved expanded exploration did not validate')
  console.log('Verified v0.13.0 positions, fog, clues, quest tracking, XP, Hints, and Mastery; v0.14.0 re-save also validates.')
} finally {
  await server.close()
}
