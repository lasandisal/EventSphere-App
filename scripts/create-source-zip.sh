#!/bin/bash

set -e

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PROJECT_NAME="$(basename "$PROJECT_ROOT")"
OUTPUT="$PROJECT_ROOT/${PROJECT_NAME}-Source.zip"

echo "========================================"
echo " EventSphere Source Package Generator"
echo "========================================"
echo
echo "Project: $PROJECT_NAME"
echo "Root:    $PROJECT_ROOT"
echo "Output:  $OUTPUT"
echo

if [ ! -f "$PROJECT_ROOT/.gitignore" ]; then
    echo "ERROR: .gitignore not found."
    exit 1
fi

rm -f "$OUTPUT"

echo "Creating source archive..."
echo "Respecting .gitignore..."
echo

cd "$PROJECT_ROOT"

# Build a temporary Git repository purely for Git's
# .gitignore matching behavior. This repository is
# deleted when the script finishes.
TEMP_DIR="$(mktemp -d)"

cleanup() {
    rm -rf "$TEMP_DIR"
}

trap cleanup EXIT

mkdir -p "$TEMP_DIR/project"

# Copy the project into the temporary workspace.
# .git itself is excluded if one ever exists.
rsync -a \
    --exclude='.git' \
    "$PROJECT_ROOT/" \
    "$TEMP_DIR/project/"

cd "$TEMP_DIR/project"

# Create a temporary local Git repository.
# Nothing is committed or sent anywhere.
git init -q

# Add everything. Git automatically applies .gitignore.
git add .

# Create a tree from the index without creating a commit.
TREE="$(git write-tree)"

# Create the ZIP from the exact tree Git considers includable.
git archive \
    --format=zip \
    --prefix="${PROJECT_NAME}/" \
    --output="$OUTPUT" \
    "$TREE"

echo "Source package created successfully."
echo
echo "Output:"
echo "  $OUTPUT"
echo

echo "Package contents:"
unzip -l "$OUTPUT"

echo
echo "Done."
