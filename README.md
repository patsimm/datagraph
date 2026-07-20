# datagraph

A browser-based, node-graph editor for building audio signal chains. Wire up
oscillators, filters, controls and visualizers on a pan/zoom canvas and hear the
result live via the Web Audio API. MIDI input (notes, gates, CC) is supported,
and graphs can be saved, loaded and shared as a link.

**Live app:** [datagraph.patsimm.com](https://datagraph.patsimm.com)

The audio engine lives in a separate package:
[`datagraph-core`](https://github.com/patsimm/datagraph-core).

## Development

Requires the Node version in `.nvmrc`.

```bash
npm install
npm run dev      # start the dev server
npm run build    # production build
npm run preview  # preview the production build
```

## Tech

React 19, TypeScript and Vite. Audio runs in an `AudioWorklet` powered by
[`@patsimm/datagraph-core`](https://www.npmjs.com/package/@patsimm/datagraph-core);
MIDI uses the Web MIDI API.
