# Correction 11 — bot funding audit (2026-11-25)
Read-only production snapshot; no deployment or ledger mutations.
- 2401 fund moves, zero continuity mismatches, zero negative fund balances, current balance matches final ledger balance.
- 272 movements labeled DOMINO_PUNTOS_BOT (includes debits and credits; not a count of completed payouts).
- 189 charged point participations identifiable by current bot registry; zero missing matching FC or diamond reserves when required.
- No duplicate match/user pairs in points payouts; does not prove all transfers are idempotent.
- General seat_points_bot still inserts table_balance=0. Separate prize reserves are handled by triggers; initial pass-wallet funding is missing.
- Both deployed function hashes match the guards in review/bot-pass-funding.sql. Candidate not installed.
- Snapshot of active bot seats: 3, one negative table balance; investigate against permitted table rules and pass movements, not the fund ledger. Earlier snapshot had two active point bots requiring pass reserves; neither had zero current table balance. Snapshots can change.
- Staging required: simultaneous seat/settlement, insufficient funds, configured entry and pass reserve, cancellation/refund of pass reserve, negative residual, human priority, bot limits, duplicate retries and fund/ledger reconciliation. Audit lock ordering jointly with correction 10. Do not top up active bots or publish.
