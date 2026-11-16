## Development

When starting the dev server, use background mode:

```
bun dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Package Management

Always use `bun` for anything Node-related: installing dependencies, adding or removing packages, running scripts, and executing binaries (`bun add`, `bun remove`, `bun install`, `bun run`, `bunx`).

Never use `npm`, `pnpm`, or `yarn` — they produce lockfiles and `node_modules` layouts that conflict with this project's `bun.lock`.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)
