# Hierarchy View

`Hierarchy View` is an Obsidian desktop plugin that keeps a user-defined note hierarchy in a SQLite database while leaving the actual note content in normal Markdown files inside the vault.

The plugin is designed for users who want:

- a custom hierarchy independent from physical vault folders
- nested groups and nested notes
- manual ordering and drag-and-drop arrangement
- a tree UI inside Obsidian for browsing and organizing notes

## What the plugin stores

The plugin does **not** replace your Markdown files.

- Source of truth for note content: vault `.md` files
- Source of truth for hierarchy metadata: SQLite database file

The SQLite database stores:

- parent/child relationships
- manual sibling ordering
- note references by vault path
- custom group nodes created in the plugin

The note text itself stays in your Obsidian files.

## Database location

Primary working database:

`<vault>/.obsidian/plugins/hierarchy-view/tree-hierarchy.sqlite`

Example:

`C:\Users\DhirajDesktop11\Documents\OBSIDIAN-NOTES\.obsidian\plugins\hierarchy-view\tree-hierarchy.sqlite`

If you change the database filename in plugin settings, only the filename changes, not the folder.

Optional backup database:

- you can configure a second backup SQLite path in plugin settings
- the path can be absolute or vault-relative
- the plugin updates that backup automatically after database saves

Recovery state:

- the configured backup path is also written outside the plugin folder
- this allows reinstall recovery even if the plugin folder was removed
- recovery file path:
  `<vault>/.obsidian/hierarchy-view-recovery.json`

## Main capabilities

- Shows a tree of notes and groups inside Obsidian
- Supports root items, nested groups, and nested notes
- Supports note-under-note nesting, not only group-under-note or note-under-group
- Lets you create notes directly from the hierarchy UI
- Lets you add existing vault notes into the hierarchy
- Supports drag-and-drop reordering and reparenting
- Persists manual order in SQLite instead of sorting by title
- Shows vertical connector lines to make the hierarchy easier to scan

## How notes behave

The plugin tracks vault notes by path and displays them in the custom hierarchy.

- Existing notes can be organized without moving the actual file on disk
- Existing notes keep their vault-style path label, such as `folder/note.md`
- Creating or rearranging hierarchy items does not rewrite note content
- Moving a note in the plugin changes only hierarchy metadata, not the vault folder structure

## Launch and UI behavior

The plugin currently exposes two main entry points:

1. Left ribbon icon
   Opens the hierarchy in a popup-style Obsidian modal window.

2. Left sidebar tab
   The plugin also creates a left sidebar tab so it appears alongside built-in panes such as Files, Search, and Bookmarks.

Current behavior:

- left ribbon icon launches popup view
- sidebar tab opens in the left sidebar
- clicking a note in the tree opens that note in Obsidian

## Tree actions

Each node can expose actions depending on its type and state.

Common actions:

- `+G`: create child group
- `+N`: create child note
- `+E`: attach an existing note under that node
- `Move`: move the node to another parent

Note-specific behavior:

- notes can exist at root
- notes can have children
- notes can be moved back to root

## Drag and drop

The hierarchy supports drag-and-drop.

Drop behaviors:

- drop on a node header: make the dragged item a child of that node
- drop on an insert line before a node: place dragged item before that node
- drop on an insert line after a node: place dragged item after that node
- drop on the root drop zone: move dragged item to root

The plugin prevents invalid cycles, so a node cannot be moved into itself or one of its descendants.

## Ordering behavior

Ordering is manual and persisted in SQLite.

This means:

- root notes do not auto-jump by alphabetical sort
- nested items stay where you place them
- drag-and-drop order is preserved between sessions

## Popup behavior

The left-ribbon popup is intended as a near-fullscreen hierarchy window with a small inset from the Obsidian window edge.

Current popup behavior:

- opens almost fullscreen
- has a single `Close` button
- uses a blurred/tinted overlay behind the window

## Settings

The plugin currently exposes these settings:

### Database file name

Controls the SQLite filename inside:

`<vault>/.obsidian/plugins/hierarchy-view/`

### Backup database path

Optional second-copy path for reinstall recovery.

Behavior:

- if set, the plugin writes a backup copy after database saves
- if the primary plugin-folder database is missing on startup but the backup exists, the plugin restores the primary database from the backup automatically

### Backup actions

- `Back up now`: writes the current database to the configured backup path immediately
- `Restore now`: restores the primary plugin database from the configured backup path

### Notes root folder

Controls the vault folder used when the plugin creates a brand-new note.

Default:

- empty, which means vault root

Important:

- this affects newly created notes only
- it does not move existing notes already in the vault

## Installation for use

Copy these files into:

`<vault>/.obsidian/plugins/hierarchy-view/`

Required files:

- `manifest.json`
- `main.js`
- `styles.css`
- `sql-wasm.wasm`

Then in Obsidian:

1. Open `Settings`
2. Open `Community plugins`
3. Reload plugins if needed
4. Enable `Hierarchy View`

## Development

### Requirements

- Node.js
- npm
- Obsidian desktop

### Install dependencies

```bash
npm install
```

### Build once

```bash
npm run build
```

### Watch during development

```bash
npm run dev
```

## Project files

- `main.ts`: plugin logic
- `styles.css`: UI styling
- `manifest.json`: Obsidian plugin manifest
- `esbuild.config.mjs`: build configuration
- `sql-wasm.wasm`: SQLite WASM binary used by `sql.js`

## Data model

The SQLite database contains a `nodes` table.

Important columns:

- `id`: primary key
- `parent_id`: parent node id or `NULL`
- `type`: `group` or `note`
- `title`: display label shown in the tree
- `note_path`: vault path for note nodes
- `sort_order`: persisted manual ordering among siblings
- `created_at`: creation timestamp
- `updated_at`: update timestamp

## Current design assumptions

- the plugin is desktop-only
- the hierarchy is metadata only; vault note content stays in files
- the plugin is intended to coexist with normal Obsidian navigation, not replace it
- normal plugin version updates reuse the existing primary database in the plugin folder
- uninstall/reinstall recovery uses the optional backup database path when configured

## Limitations

Current implementation limitations may include:

- popup behavior depends on Obsidian modal rendering
- hierarchy labels for existing notes are path-based rather than custom aliases
- the hierarchy is separate from the actual folder structure in the vault

## Summary

Use this plugin when you want a custom manually ordered tree of notes inside Obsidian, backed by SQLite for hierarchy metadata, without changing the actual Markdown-file source of truth in the vault.
