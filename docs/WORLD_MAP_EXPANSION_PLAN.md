# Sirah Quest — World Map Expansion Plan

Project version: v0.15.0  
Status: Development artwork and architecture for local QA

## Purpose

The World Map remains a node-based travel screen. Version v0.15.0 replaces the
previous landmark-heavy illustration with a wider fictional region that can
support future locations without changing current travel permissions or Area
Map gameplay.

## New Geography

The four existing locations form a compact cluster in the western-central
region. The rest of the map contains a northern mountain range, western coast,
central river and bridges, southern forest and wetlands, eastern sandstone
plain, ruins, foothills and a southeastern coast. These are fictional
environmental regions and do not assert historical geography.

| Existing location | Stable ID | Normalized X/Y | State |
| --- | --- | ---: | --- |
| Kampung Ilmu | `kampung-ilmu` | 0.25 / 0.45 | Playable |
| Bazar Lama | `bazar-lama` | 0.33 / 0.52 | Playable |
| Perpustakaan Hikmah | `perpustakaan-hikmah` | 0.34 / 0.35 | Playable |
| Bukit Pengintai | `bukit-pengintai` | 0.42 / 0.41 | Locked |

Coordinates use the top-left of the artwork as `(0, 0)` and the bottom-right as
`(1, 1)`. HTML nodes, route lines and the travel marker all use this same
coordinate system, so resizing and zooming do not require pixel offsets.

## Reserved Placement Capacity

The following entries are spatial design reservations only. They are not in
the playable Location Registry, are not rendered as interactive nodes, and do
not imply quests, rewards or unlock rules.

| Reserved design ID | Region | Category | X/Y |
| --- | --- | --- | ---: |
| `reserved-northwest-coast` | Pesisir Barat Laut | Coast | 0.12 / 0.20 |
| `reserved-northern-lake` | Tasik Utara | River | 0.40 / 0.20 |
| `reserved-northern-ruins` | Dataran Utara | Ruins | 0.55 / 0.18 |
| `reserved-eastern-highland` | Tanah Tinggi Timur | Highland | 0.82 / 0.20 |
| `reserved-eastern-desert` | Gurun Timur | Desert | 0.78 / 0.42 |
| `reserved-river-crossing` | Lintasan Sungai | River | 0.57 / 0.48 |
| `reserved-deep-forest` | Hutan Selatan | Forest | 0.38 / 0.70 |
| `reserved-southern-wetland` | Tanah Paya Selatan | River | 0.27 / 0.82 |
| `reserved-southern-arch` | Gerbang Batu | Ruins | 0.65 / 0.79 |
| `reserved-southeast-coast` | Pesisir Tenggara | Coast | 0.87 / 0.76 |
| `reserved-central-grove` | Lembah Tengah | Forest | 0.50 / 0.61 |
| `reserved-far-east-pass` | Laluan Timur Jauh | Highland | 0.93 / 0.55 |

## Route Topology

Gameplay connections remain unchanged:

- Kampung Ilmu ↔ Bazar Lama
- Bazar Lama ↔ Perpustakaan Hikmah
- Bazar Lama ↔ Bukit Pengintai

Route lines are derived from `connections` in `locationData.ts`; the new
artwork does not create gameplay routes. Bukit Pengintai remains locked.

## Artwork Source and Export

- Runtime asset: `src/assets/world-map-v015.webp`
- Source render: `src/assets/source/world-map-v015-source.png`
- Source render: 1672×941 PNG
- Runtime export: 2048×1152 WebP, quality 82
- Generation method: OpenAI built-in image generation, followed by a local
  deterministic resize/WebP export with Sharp.

The prompt requested an original hand-painted fantasy regional map with no
text, labels, logos, characters, copyrighted game imagery or sacred/historical
reconstruction. Future edits should start from the retained source PNG or a
new reviewed source asset, then repeat the 2048×1152 WebP export.

## Mobile Navigation

The map has two bounded presentation modes:

- **Rantau**: 64rem minimum canvas, intended for geographical overview.
- **Lokasi**: 80rem minimum canvas, intended for closer landmark inspection.

The viewport uses bounded native scrolling with pointer/touch drag support.
A seven-pixel movement threshold separates taps from drags, and a completed
drag suppresses the following click. Opening the World Map or changing map
scale centers the current location once; manual exploration is not repeatedly
overridden.

## Future Character Travel

The current abstract travel marker and 700ms timing remain unchanged. A later
milestone may replace the marker with a character presentation, but it must
continue following normalized route endpoints without changing travel rules.

