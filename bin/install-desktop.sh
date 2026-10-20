#!/usr/bin/env bash
# Point the desktop menu at this checkout. Does not copy the harness.
set -euo pipefail

root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
launcher="$root/bin/dsh-linux"
icon="$root/share/icons/dsh-linux.png"
template="$root/share/dsh-linux.desktop"
dest="${XDG_DATA_HOME:-$HOME/.local/share}/applications/dsh-linux.desktop"
hicolor="${XDG_DATA_HOME:-$HOME/.local/share}/icons/hicolor/512x512/apps"
bin_dir="${HOME}/.local/bin"

if [[ ! -x "$launcher" ]]; then
  echo "dsh-linux: missing launcher $launcher" >&2
  exit 1
fi
if [[ ! -f "$icon" ]]; then
  echo "dsh-linux: missing icon $icon" >&2
  exit 1
fi

mkdir -p "$(dirname "$dest")" "$hicolor" "$bin_dir"
cp -f "$icon" "$hicolor/dsh-linux.png"
ln -sfn "$launcher" "$bin_dir/dsh-linux"

awk -v exec_path="$launcher" -v icon_path="$icon" '
  /^Exec=/ { print "Exec=" exec_path; next }
  /^Icon=/ { print "Icon=" icon_path; next }
  { print }
' "$template" > "$dest"
chmod 644 "$dest"

if command -v update-desktop-database >/dev/null 2>&1; then
  update-desktop-database "$(dirname "$dest")" >/dev/null 2>&1 || true
fi
if command -v gtk-update-icon-cache >/dev/null 2>&1; then
  gtk-update-icon-cache -q -t "$(dirname "$(dirname "$hicolor")")" >/dev/null 2>&1 || true
fi

echo "dsh-linux: menu entry $dest"
