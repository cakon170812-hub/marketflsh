#!/usr/bin/env bash
# Review only: install the pinned browser decoder locally. Never deploy or push.
set -euo pipefail
cd "$(dirname "$0")/.."
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
npm pack ogv@1.9.0 --pack-destination "$tmp" --ignore-scripts
tar -xzf "$tmp/ogv-1.9.0.tgz" -C "$tmp"
node -e 'const p=require(process.argv[1]);if(p.name!=="ogv"||p.version!=="1.9.0")process.exit(1)' "$tmp/package/package.json"
for f in ogv.js ogv-worker-audio.js ogv-demuxer-webm-wasm.js ogv-demuxer-webm-wasm.wasm ogv-demuxer-ogg-wasm.js ogv-demuxer-ogg-wasm.wasm ogv-decoder-audio-opus-wasm.js ogv-decoder-audio-opus-wasm.wasm; do
  test -s "$tmp/package/dist/$f" || { echo "Falta $f" >&2; exit 1; }
done
dest=vendor/ogv-1.9.0
mkdir -p "$dest"
cp -R "$tmp/package/dist/." "$dest/"
cp "$tmp/package/COPYING" "$dest/"
(cd "$dest" && find . -type f ! -name SHA256SUMS -print0 | sort -z | xargs -0 sha256sum > SHA256SUMS && sha256sum -c SHA256SUMS)
echo "Revisar licencia, integridad del paquete y probar iOS/Android. Los archivos deben quedar versionados antes de publicar."
