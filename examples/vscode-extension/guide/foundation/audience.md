# Audience model — Live Recolor (VS Code extension)

> The guide's north star: **match explanation depth to the reader's level on *that specific topic*.**
> Over-explaining an Expert topic is as harmful as under-explaining a New one. Every step is written against
> this matrix + the granularity setting below.

## Per-topic expertise → explanation-depth policy

| Topic | Level | Depth policy applied in the guide |
|-------|-------|-----------------------------------|
| TypeScript / JavaScript (the language) | **Intermediate** | One-line reminder + doc link on anything non-obvious; skip fundamentals. No `async`/`interface`/generics tutorials. |
| VS Code Extension API (activation, `contributes` manifest, commands, extension-host lifecycle) | **New** | Define on first use + official doc link + a short "New concept" deep-dive callout + extra failure notes. |
| Webview View API (sidebar view, `postMessage`/`onDidReceiveMessage`, `acquireVsCodeApi`, CSP) | **New** | Same — full definitions, deep dives, failure notes. |
| Configuration API (`getConfiguration`, `update`, `ConfigurationTarget`) | **New** | Same — the load-bearing mechanism; explained thoroughly where it lands. |
| Color theory / palette math (HSL, deriving a palette from a seed, WCAG contrast) | **Beginner** | Define the color model + each formula rule on first use + a brief *why*; doc link. No color-science deep dives. |
| Node.js / npm / packaging (`npx`, `@vscode/vsce`) | **Intermediate** | One-line reminder + link; assume the reader can run npm and read a `package.json`. |

## Depth-policy legend
- **Expert** → name it; no definition, no deep dive, no doc link (except a specific gotcha).
- **Intermediate** → one-line reminder + doc link; skip fundamentals.
- **Beginner** → define on first use + doc link + a brief *why*.
- **New** → define + doc link + a short concept deep-dive callout + extra failure-mode notes.

## Granularity
**Highly granular / tutorial.** The smallest atomic steps, every sub-action spelled out, nothing assumed.

This composes with the matrix: **many small steps, but explanation depth is per topic.** A step wiring the
`contributes` manifest (VS Code API = New) gets a full definition + deep dive; a step writing a TS `interface`
(language = Intermediate) gets a one-liner, even though both are broken into fine sub-steps.
