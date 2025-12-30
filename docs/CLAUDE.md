# Documentation-Specific Guidelines for Claude

**Parent Document:** [/CLAUDE.md](../CLAUDE.md)

This document contains specific guidelines for working with the documentation files in this directory. It supplements the root-level CLAUDE.md with documentation-specific requirements and constraints.

## File Encoding Requirements

**CRITICAL: All markdown files in this project MUST maintain UTF-8 encoding.**

### Background

The documentation files in `docs/` contain:
- Emojis (✅ ❌ ⚠️ 📚 🚧, etc.)
- Box-drawing characters for ASCII art diagrams (┌ ─ │ ├ └ ┐ ┘ ╔ ║, etc.)
- Special Unicode symbols (→ ← ↑ ↓ § • ≤ ≥, etc.)

These files were previously corrupted due to UTF-8 double-encoding (mojibake), which made all special characters unreadable. This was fixed on 2025-12-22 using a custom Python script.

### Rules for File Modifications

When modifying any markdown files in `docs/`, you MUST:

1. **Read files using UTF-8 encoding explicitly**
   - Always use `encoding='utf-8'` when reading/writing files
   - Never rely on system default encoding

2. **Preserve special characters**
   - Do NOT replace emojis with text equivalents
   - Do NOT replace box-drawing characters with ASCII alternatives
   - Do NOT convert special symbols to regular characters

3. **Verify encoding after edits**
   - After editing, verify the file still contains valid UTF-8
   - Check that special characters display correctly
   - If using the Edit tool, ensure it preserves UTF-8 encoding

4. **Use the correct tools**
   - ✅ Use the `Edit` tool for making changes to existing markdown files
   - ✅ Use the `Write` tool only for creating NEW files
   - ❌ NEVER use bash commands like `sed`, `awk`, or `echo >` to modify markdown files

### Examples of Characters to Preserve

**Status Indicators:**
- ✅ Complete/Required
- ❌ Not included/Phase 2+
- ⚠️ Warning/Partial
- 🚧 In Progress
- 📚 Documentation

**Box-Drawing (for ASCII diagrams):**
```
┌───────────────┐
│ Component     │
├───────────────┤
│ Details       │
└───────────────┘
```

**Arrows and Symbols:**
- → ← ↑ ↓ (directional arrows)
- ► ◄ ▼ (filled arrows)
- § (section symbol)
- • (bullet point)

### What Mojibake Looks Like (AVOID THIS!)

If you see these patterns, **STOP** - the file has encoding corruption:
- `âœ…` instead of ✅
- `ðŸ"š` instead of 📚
- `â"Œâ"€â"€â"` instead of ┌──
- `â†'` instead of →
- `Â§` instead of §

### Recovery Script

If encoding corruption occurs again, run:
```bash
python3 scripts/fix_encoding.py docs/
```

This script:
- Fixes UTF-8 double-encoding (mojibake)
- Preserves all special characters
- Processes all markdown files recursively
- Uses Windows-1252/Latin-1 fallback for mixed encodings

### Testing Encoding

To verify files maintain correct encoding:

```bash
# Check file encoding
file -i docs/**/*.md

# Should show: text/plain; charset=utf-8

# Check for mojibake patterns
grep -r "âœ…\|ðŸ"š\|â"‚\|Â§" docs/

# Should return: 0 matches
```

## Project Structure

```
auth-optics/
├── docs/                          # 📚 Documentation (UTF-8 critical!)
│   ├── reference/                 # Reference documentation (47 files)
│   └── specs/                     # Implementation specs (19 files)
├── packages/
│   ├── backend/                   # Node.js + Express backend
│   ├── frontend/                  # React + Vite frontend
│   ├── mock-resource-server/      # OAuth2 resource server
│   └── shared/                    # Shared TypeScript types
└── scripts/
    └── fix_encoding.py            # UTF-8 mojibake repair script
```

## Common Tasks

### Modifying Documentation Files

**✅ CORRECT:**
```python
# Using Read tool
<Read file_path="/home/toffer/auth-optics/docs/specs/example.md" />

# Using Edit tool
<Edit
  file_path="/home/toffer/auth-optics/docs/specs/example.md"
  old_string="existing text"
  new_string="new text"
/>
```

**❌ INCORRECT:**
```bash
# NEVER use bash text manipulation commands
sed -i 's/old/new/' docs/specs/example.md  # ❌ Wrong!
echo "text" >> docs/specs/example.md        # ❌ Wrong!
cat > docs/specs/example.md <<EOF           # ❌ Wrong!
```

### Creating New Documentation Files

When creating new markdown files:

1. Use proper UTF-8 encoded emojis and symbols from the start
2. Follow the existing documentation style
3. Use the Write tool with UTF-8 encoding
4. Verify special characters display correctly after creation

## Git Workflow

### Before Committing Documentation Changes

Always verify encoding before committing:

```bash
# Check for mojibake
grep -r "âœ…\|ðŸ"š\|â"‚\|Â§" docs/
# Should return: 0 matches

# Verify UTF-8 encoding
file -i docs/**/*.md | grep -v "charset=utf-8"
# Should return: nothing (all files are UTF-8)
```

### Commit Messages for Documentation

When modifying documentation, mention encoding in commit message:

```
docs: update specification XYZ

- Updated feature descriptions
- Added new examples
- Encoding verified (UTF-8, no mojibake)
```

## Environment Setup

**Editor Settings:**
- Encoding: UTF-8 (no BOM)
- Line endings: LF (not CRLF)
- Ensure editor doesn't auto-convert special characters

**VS Code settings:**
```json
{
  "files.encoding": "utf8",
  "files.eol": "\n"
}
```

**Vim settings:**
```vim
set encoding=utf-8
set fileencoding=utf-8
```

---

## Important Notes

1. **Never assume default encoding** - always specify UTF-8 explicitly
2. **The `scripts/fix_encoding.py` script exists** - use it if corruption occurs
3. **Verify after edits** - check that emojis and diagrams still render

---

**Last Updated:** 2025-12-22
**Encoding Fix Applied:** 2025-12-22 (66 files, 100% success)
