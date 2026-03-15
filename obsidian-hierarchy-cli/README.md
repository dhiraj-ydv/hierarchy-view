# Obsidian Hierarchy CLI

A command-line interface tool for the Obsidian Tree Hierarchy plugin. Designed for CLI users and AI agents to manage note hierarchies.

## Installation

```bash
cd obsidian-hierarchy-cli
npm install
npm run build
npm link
```

## Usage

### Global Options

- `-v, --vault <path>` - Path to Obsidian vault (auto-detected if not specified)
- `-d, --db <name>` - Database file name (default: tree-hierarchy.sqlite)

### Commands

#### List Hierarchy

```bash
# List as tree
hierarchy tree

# List as flat list
hierarchy list --flat

# Show file paths
hierarchy list --paths
```

#### Create Node

```bash
# Create a note (default)
hierarchy create "My Note"

# Create a group
hierarchy create "My Group" --type group

# Create as child of parent
hierarchy create "Child Note" --parent 1
```

#### Delete Node

```bash
hierarchy delete 5
hierarchy delete 5 --force  # Also delete the file
```

#### Move Node

```bash
# Move to parent
hierarchy move 5 1

# Move to root
hierarchy move 5 null

# Move with index
hierarchy move 5 1 --index 0
```

#### Rename Node

```bash
hierarchy rename 5 "New Title"
```

#### Search

```bash
hierarchy search "query"
```

#### Node Info

```bash
hierarchy info 5
```

#### Export/Import

```bash
# Export to file
hierarchy export hierarchy.json

# Export to stdout
hierarchy export --stdout

# Import (replaces existing)
hierarchy import hierarchy.json

# Merge import
hierarchy import hierarchy.json --merge
```

#### Settings

```bash
# Show settings
hierarchy settings show

# Update setting
hierarchy settings set noteExtension .html
hierarchy settings set noteRootFolder Notes
```

#### Backup

```bash
# Create backup
hierarchy backup create
hierarchy backup create ./backups

# Restore from backup
hierarchy backup restore ./backups/hierarchy-backup-2024-01-01.json
```

#### Sync

```bash
# Sync hierarchy with vault files
hierarchy sync
```

#### Initialize

```bash
# Initialize CLI config in vault
hierarchy init
```

## Examples for AI Agents

### Create a new note hierarchy

```bash
# Create root notes
hierarchy create "Projects" --type group
hierarchy create "Archive" --type group

# Get IDs
hierarchy list --flat

# Create child notes
hierarchy create "Project A" --parent 1
hierarchy create "Project B" --parent 1
```

### Export and backup

```bash
# Export current hierarchy
hierarchy export backup.json

# Create timestamped backup
hierarchy backup create
```

### Search and organize

```bash
# Find all notes with "todo"
hierarchy search todo

# Move found notes to a group
hierarchy move 10 1
```

## Configuration

The CLI automatically detects the vault path if you're running from within an Obsidian vault directory. You can also specify explicitly:

```bash
hierarchy -v /path/to/vault list
```

## License

MIT
