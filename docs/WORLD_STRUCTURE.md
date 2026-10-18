# Sirah Quest World Structure

Sirah Quest has two deliberately separate map modes. This separation is locked
for future development even though only the Area Map prototype exists today.

## Area Map

An Area Map is a playable location for free exploration. It owns local movement,
camera behavior, fog of war, clues, and quest interactions. Area gameplay should
not need to know how the illustrated world map is rendered.

## World Map

The World Map will use a large illustrated WebP image with selectable travel
nodes, following a node-based navigation concept similar to classic tactical
JRPG world maps. It will choose destinations and open Area Maps; it will not use
free player movement or Area Map fog.

The World Map is not implemented in v0.4.0.

## Future data boundaries

Location data should remain modular. A location record can later contain a
stable ID, bilingual name, world-node position, illustrated-map metadata, Area
Map entry information, availability rules, and links to relevant quests.

The design must support multiple concurrent quests and returning to previously
visited areas. Quest state therefore belongs outside an individual Area Map, and
travel availability should be evaluated separately from local clue state. These
capabilities are documented here only and are not implemented in this version.

