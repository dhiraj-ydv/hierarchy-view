#!/bin/bash
# CLI for Obsidian Tree Hierarchy Plugin
# Usage: node cli/index.js [command]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

node cli/index.js "$@"
