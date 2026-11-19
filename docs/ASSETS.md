# Assets and dependencies

Updated: 2026-11-19.

The playable pod, mothership, stages and gates are project-authored geometry in `src/art.ts` and `src/ascent-scenery.ts`. The pod and warm mechanical palette were modeled from a user-provided visual reference. The reference image is not bundled. The deck, near-cloud sprites and enamel wear use Canvas. The wide cloud-sea plate in `public/scenery/cloud-sea.webp` was generated with OpenAI ImageGen as an original environment asset and compressed to WebP. A camera-relative sky shader composites the panorama and higher-altitude color. The pod, gates, track and mothership remain rendered geometry, with local shaders for exhaust and a generated reflection map. The game uses system fonts and a project-authored favicon.

Ascent's 32-bar stereo score is composed and synthesized in `scripts/compose.mjs`. Run `node scripts/compose.mjs` with FFmpeg to regenerate `public/audio/ascent.ogg`. The player uses the bundled file and synthesizes boost, gate, warning, descent and arrival cues locally. The release bundles no third-party recordings, samples, web fonts or supplied reference images.

Runtime dependency: Three.js (MIT). Development dependencies include TypeScript (Apache-2.0), Vite (MIT), Vitest (MIT), Prettier (MIT) and Three.js type definitions (MIT); exact versions and transitive packages are pinned in package-lock.json. Preserve third-party notices. They are not relicensed by the project MIT file.
