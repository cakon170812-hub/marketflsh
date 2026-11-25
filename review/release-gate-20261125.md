# Correction 09 — Release gate, 2026-11-25

Reviewed head: 97ae2dacffcb2553bb90f6f53a7f13beb49369fa
Reviewed main: 9db2235e6527e4bac498248e010b512e55b8f96e
Decision: NO RELEASE. This is a review, not approval to merge or deploy.

## Observations
- PR #3 was a draft, mergeable, 24 commits ahead and zero behind main at inspection.
- Syntax compilation succeeded for script.js, domino-table-chat.js and domino-table-styles.js.
- Connector did not return index.html content (zero bytes); full HTML/inline script validation is outstanding.
- No pull-request workflow runs were returned for the inspected commit.
- Android manifest records 0.12Z.36. No new release version selected or bundle built.
- Production SQL has history_24h, 5 MiB send_voice limit and pass sync metadata.
- Production voice_history RPC absent; seat_points_bot pass funding not yet installed.
- Bot cycle heartbeat current; one playing hand and no playing turns overdue by more than two minutes in snapshot.
- Four deadlock reports in preceding hour, all table 397. Root cause and lock order need investigation.
- The previous reconciliation covered 20,228 table diamond pass events without duplicate event keys, missing moves, recipient, amount or commission discrepancies.

## Mandatory release blockers
1. Reproduce and fix table 397 deadlocks; check concurrency, bot and human joins, table close/settlement; do not forcibly alter live balances or terminate games.
2. Validate bot pass funding SQL and voice-history SQL on isolated representative staging, including permissions, refunds and idempotency. Install only after approval and recheck production.
3. Obtain pinned decoder assets, validate provenance, license, package file names, checksums and offline WebView behavior; include actual files in the reviewed commit.
4. Full HTML, all inline JS and native bridge build; confirm visual resources, no duplicate pass animations, and no app version mismatch.
5. Real Android/iPhone and desktop voice interoperability tests: original quality, playback progress, replay, timestamps, permissions and long notes. Test all enabled game modes, seating, closing, reconnection and settlement.
6. Choose approved version after verifying manifest and HTML. Build and validate an unpublished candidate; confirm exact approved SHA and bundle checksum.
7. Obtain explicit publication approval. Keep main and existing OTA manifest unchanged until then.

Do not rerun already-installed baseline SQL indiscriminately. Do not treat successful parsing, historical ledger reconciliation or a mergeable PR as release certification.
