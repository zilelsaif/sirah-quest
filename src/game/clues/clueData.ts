import type { ClueDefinition } from './types'

export const CLUE_DISCOVERY_RADIUS = 150

export const CLUE_DATA: ClueDefinition[] = [
  {
    id: 'clue-1',
    title: 'Clue 1',
    text: 'An old note is hidden here.',
    x: 430,
    y: 400,
    interactionRadius: 78,
    state: 'hidden',
  },
  {
    id: 'clue-2',
    title: 'Clue 2',
    text: 'A small marker rests at this location.',
    x: 820,
    y: 430,
    interactionRadius: 78,
    state: 'hidden',
  },
  {
    id: 'clue-3',
    title: 'Clue 3',
    text: 'A weathered object waits to be examined.',
    x: 1100,
    y: 740,
    interactionRadius: 78,
    state: 'hidden',
  },
]

