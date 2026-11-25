#!/usr/bin/env bash
# Review only: prepare the pinned decoder. Never deploy or push.
set -euo pipefail
cd "$(dirname "$0")/.."
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
registry=https://registry.npmjs.org/
npm view ogv@1.9.0 dist.integrity --registry "$registry" > "$tmp/integrity"
npm pack ogv@1.9.0 --registry "$registry" --pack-destination "$tmp" --ignore-scripts --json > "$tmp/pack.json"
node - "$tmp" <<'NODE'
const fs=require('fs'),crypto=require('crypto'),path=require('path');
const dir=process.argv[2];
const expected=fs.readFileSync(path.join(dir,'integrity'),'utf8').trim();
const actual='sha512-'+crypto.createHash('sha512').update(fs.readFileSync(path.join(dir,'ogv-1.9.0.tgz'))).digest('base64');
if(!expected.startsWith('sha512-')||actual!==expected)throw Error('npm tarball integrity mismatch');
NODE
tar -xzf "$tmp/ogv-1.9.0.tgz" -C "$tmp"
node -e 'const p=require(process.argv[1]);if(p.name!=="ogv"||p.version!=="1.9.0")process.exit(1)' "$tmp/package/package.json"
for f in ogv.js ogv-worker-audio.js ogv-demuxer-webm-wasm.js ogv-demuxer-webm-wasm.wasm ogv-demuxer-ogg-wasm.js ogv-demuxer-ogg-wasm.wasm ogv-decoder-audio-opus-wasm.js ogv-decoder-audio-opus-wasm.wasm COPYING COPYING-opus.txt COPYING-ogg.txt LICENSE-nestegg.txt; do
  test -s "$tmp/package/dist/$f" || { echo "Falta $f" >&2; exit 1; }
done
dest=vendor/ogv-1.9.0
if [ -e "$dest" ]; then echo 'Decoder directory already exists; refusing to overwrite' >&2; exit 1; fi
mkdir -p "$dest"
cp -R "$tmp/package/dist/." "$dest/"
cp "$tmp/integrity" "$dest/NPM-INTEGRITY.txt"
(cd "$dest" && find . -type f ! -name SHA256SUMS -print0 | sort -z | xargs -0 sha256sum > SHA256SUMS && sha256sum -c SHA256SUMS)
echo "Review license, provenance and real iOS/Android playback. Commit only reviewed files; never publish from this script."
