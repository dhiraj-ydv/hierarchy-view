# Obsidian Hierarchy CLI

A command-line interface tool for the Obsidian Tree Hierarchy plugin.

## Installation

This CLI is included with the plugin. You can run it from this folder:

```bash
# Windows
hierarchy-cli.bat --help

# Or directly with node
node cli/index.js --help
```

## Usage

```bash
# List hierarchy
node cli/index.js tree
node cli/index.js list --flat

# Create notes/groups
node cli/index.js create "My Note"
node cli/index.js create "My Group" --type group

# Manage hierarchy
node cli/index.js move 5 1
node cli/index.js rename 5 "New Title"
node cli/index.js delete 5

# Search
node cli/index.js search "todo"

# Backup
node cli/index.js export backup.json
node cli/index.js backup create

# Settings
node cli/index.js settings show
node cli/index.js settings set noteExtension .html

# Run from vault directory (auto-detects vault)
cd /path/to/your/vault
node /path/to/plugin/cli/index.js list
```

## Options

- `-v, --vault <path>` - Path to Obsidian vault (auto-detected)
- `-d, --db <name>` - Database file name

For more commands, run:
```bash
node cli/index.js --help
```
