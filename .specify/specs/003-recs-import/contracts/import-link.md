# Contract: the RECS-facing links

Owned by RECS (`docs/spec.md` §10.8 FR-10.8.2, DM-7, D-108 (2)). Reproduced here for tests;
if RECS changes it, RECS's text wins and this file follows.

## Inbound: RECS → Investor OS ("InvestorsMap" in RECS)

```
<origin>/import?ref=recs#c=<slug>&n=<name>&d=<payload>
```

- `ref=recs`: query string; recorded as signup source `recs` if the visitor registers this session.
- `c`: calculator slug, percent-encoded by RECS (slugs are `[a-z-]`, so in practice plain).
- `n`: deal name, `encodeURIComponent`-encoded by RECS; may contain `&`, `#`, `%`, quotes,
  emoji and non-Latin text once decoded (RECS D-112 (5)).
- `d`: base64url payload, at most 7,997 characters from RECS (D-112 (2)); we accept up to 8,000.
- Everything after `#` stays in the browser. `/import` reads it client-side, holds it in
  `sessionStorage`, and removes `?…#…` from the address bar.

Parsing (research R2): split on `&`, then the first `=`; decode `c` and `n`; take `d` raw.
Missing key, bad encoding or a failed rule → "nothing to import".

## Outbound: Investor OS → RECS ("Open in RECS")

```
<NEXT_PUBLIC_RECS_URL without trailing slash>/calculators/<c>#d=<d>
```

Opened in a new tab with `rel="noopener noreferrer"`. `d` inserted unchanged (it is URL-safe by
validation). Not rendered when `NEXT_PUBLIC_RECS_URL` is unset.

## Acceptance (RECS Appendix A row 8)

A deal sent from RECS, saved, then opened from the hub shows the identical summary strip in RECS.
