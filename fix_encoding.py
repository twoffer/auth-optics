#!/usr/bin/env python3
"""
Fix UTF-8 double-encoding (mojibake) in markdown files.

This script fixes files where UTF-8 characters were misinterpreted as Latin-1/Windows-1252
and then re-encoded as UTF-8, causing emojis and special characters to display
as corrupted text (e.g., "âœ…" instead of "✅").
"""

import sys
from pathlib import Path


def fix_double_encoding(file_path):
    """
    Fix UTF-8 double-encoding (mojibake) using a robust byte-level approach.

    The strategy:
    1. Read file as UTF-8 to get the current (mojibake) text
    2. Encode using a mixed cp1252/latin-1 approach to reverse the mojibake
    3. Decode the resulting bytes as UTF-8 to get the correct text

    Handles mixed encodings by falling back from cp1252 to latin-1 character-by-character.
    """
    try:
        # Read file as UTF-8 to get the mojibake text
        with open(file_path, 'r', encoding='utf-8') as f:
            mojibake_text = f.read()

        # Encode character-by-character, using cp1252 where possible, latin-1 as fallback
        # This handles files where some bytes are in cp1252 range and others are in latin-1
        reversed_bytes = bytearray()
        for char in mojibake_text:
            try:
                # Try cp1252 first (most common for Windows-generated mojibake)
                reversed_bytes.extend(char.encode('cp1252'))
            except UnicodeEncodeError:
                try:
                    # Fall back to latin-1 (covers all bytes 0x00-0xFF)
                    reversed_bytes.extend(char.encode('latin-1'))
                except UnicodeEncodeError:
                    # This should never happen since latin-1 covers U+0000-U+00FF
                    # But if it does, keep the character as-is by encoding to UTF-8
                    reversed_bytes.extend(char.encode('utf-8'))

        # Now try to decode the reversed bytes as UTF-8
        try:
            fixed_text = bytes(reversed_bytes).decode('utf-8')

            # Write the fixed content back
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(fixed_text)

            return True

        except UnicodeDecodeError as e:
            # The reversed bytes aren't valid UTF-8, so this file probably doesn't have mojibake
            # Leave it unchanged
            print(f"Info: {file_path} doesn't appear to have mojibake (no valid UTF-8 after reversal)", file=sys.stderr)
            return True

    except Exception as e:
        print(f"Error processing {file_path}: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        return False


def main():
    if len(sys.argv) < 2:
        print("Usage: python3 fix_encoding.py <file_or_directory> [file_or_directory...]")
        print("\nExamples:")
        print("  python3 fix_encoding.py docs/specs/file.md")
        print("  python3 fix_encoding.py docs/")
        sys.exit(1)

    files_to_process = []

    # Collect all markdown files from arguments
    for arg in sys.argv[1:]:
        path = Path(arg)

        if path.is_file():
            if path.suffix == '.md':
                files_to_process.append(path)
            else:
                print(f"Skipping non-markdown file: {path}")
        elif path.is_dir():
            # Find all .md files recursively
            md_files = list(path.rglob('*.md'))
            files_to_process.extend(md_files)
        else:
            print(f"Path not found: {path}", file=sys.stderr)

    if not files_to_process:
        print("No markdown files found to process.")
        sys.exit(1)

    print(f"Processing {len(files_to_process)} markdown file(s)...")

    success_count = 0
    fail_count = 0

    for file_path in files_to_process:
        if fix_double_encoding(file_path):
            print(f"✓ Fixed: {file_path}")
            success_count += 1
        else:
            print(f"✗ Failed: {file_path}")
            fail_count += 1

    print(f"\nResults: {success_count} succeeded, {fail_count} failed")

    if fail_count > 0:
        sys.exit(1)


if __name__ == '__main__':
    main()
