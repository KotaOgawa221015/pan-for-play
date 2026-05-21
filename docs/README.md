# Docs System Overview

This directory contains the VitePress documentation system for Pancolle.
The system manages documentation pages, generated index pages, and site configuration as separate concerns.

## Directory Responsibilities

- `docs/.vitepress/config.ts` defines VitePress site behavior, including dynamic sidebar generation from category directories.
- `docs/.vitepress/scripts/generate-docs-index.ts` generates category index pages and the docs top page from templates.
- `docs/.vitepress/templates/docs-category-index.j2` defines the category index page layout.
- `docs/.vitepress/templates/docs-home.j2` defines the top page hero actions from category metadata.
- `docs/{architecture,config,legal}` contain source article pages for each category.

## Generation Model

The category list in `generate-docs-index.ts` is the authoritative metadata source for generated index pages.
This metadata provides category directory names, category titles, descriptions, and top-page action text.

`docs/index.md` and each `docs/<category>/index.md` are generated artifacts.
Their content is rendered with Nunjucks templates and kept consistent by the generation script.

## Build Lifecycle Integration

`docs/package.json` binds index generation to VitePress lifecycle scripts.
`predev` and `prebuild` execute the generator before `dev` and `build`, so generated entry pages reflect current source files.
`docs:dev` serves the local development site at the root path.
`docs:preview` builds and serves the GitHub Pages site under `/pancolle/`.

## Operational Boundaries

Article files own page content.
Templates own generated page structure.
The generator owns metadata mapping and rendering.
VitePress config owns navigation and runtime presentation behavior.
