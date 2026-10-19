# Sirah Quest World Structure

Sirah Quest has two deliberately separate map modes. This separation is locked
and introduced as a working foundation in v0.5.0.

## Area Map

An Area Map is a playable location for free exploration. It owns local movement,
camera behavior, fog of war, clues, and quest interactions. Area gameplay should
not need to know how the illustrated world map is rendered.

## World Map

The World Map uses a large illustrated WebP image with selectable travel
nodes, following a node-based navigation concept similar to classic tactical
JRPG world maps. It will choose destinations and open Area Maps; it will not use
free player movement or Area Map fog.

React owns the World Map and shared session state. Phaser is created only while
an Area Map is active, then cleanly destroyed when returning to the World Map.
World travel is node-based; free movement and fog remain exclusive to Area Maps.

## Future data boundaries

Location data should remain modular. A location record can later contain a
stable ID, bilingual name, world-node position, illustrated-map metadata, Area
Map entry information, availability rules, and links to relevant quests.

The design must support multiple concurrent quests and returning to previously
visited areas. Quest state therefore belongs outside an individual Area Map, and
travel availability should be evaluated separately from local clue state.
Returning to an Area Map during the same browser session preserves its question
assignments, shuffled choices, clue progress and player position. Future save-game
work can persist this same boundary without coupling world navigation to Phaser.

