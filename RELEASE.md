# Release Plan

## Alpha checklist

1. Ensure all workspace builds pass.
2. Run workspace tests.
3. Validate CLI commands (`init`, `scan`, `migrate --dry-run`).
4. Update CHANGELOG with release notes.
5. Push to `alpha` branch to trigger publish workflow.

## Stable checklist

1. Re-run full validation from `docs/agent-pack/08_VALIDASI.md`.
2. Freeze API changes.
3. Publish stable tags.
4. Publish announcement and migration notes.
