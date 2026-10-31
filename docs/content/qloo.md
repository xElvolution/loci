# How loci uses Qloo

Base URL `https://hackathon.api.qloo.com`, header `X-Api-Key` from `process.env.QLOO_API_KEY` (server only). All calls go through `src/lib/server/qloo-http.ts`: max 4 concurrent requests, retry with backoff on 429/5xx, and a private Postgres cache (`qloo_cache`, 24 h).

## Calls

| Purpose | Endpoint | Key parameters |
| --- | --- | --- |
| Favorite search | `GET /search` | `query`, `types` (artist, tv_show, movie, book, podcast, videogame) |
| City search | `GET /search` | `types=urn:entity:locality,urn:entity:destination`; regions demoted |
| Soundtrack, screen, reading | `POST /v2/insights` (GET fallback) | `filter.type`, weighted `signal.interests.entities` `[{id, weight}]`, `feature.explainability`, `filter.popularity.min=0.4`, `filter.exclude.entities` (the favorites), `filter.content_rating` when family-rated is ticked |
| Meals near home | `GET /v2/insights` | `filter.type=urn:entity:place`, `filter.tags` (restaurant plus ticked dietary/service tags), `operator.filter.tags=intersection`, `filter.location` point, `filter.location.radius` (5 km neighborhood, 15 km city), one widening step |
| Cuisines | `GET /v2/insights` | `filter.type=urn:tag`, `filter.tag.types=urn:tag:cuisine:qloo` |
| Gentle outings | `GET /v2/insights` | one call each for park, garden, museum, library, cafe; optional step-free and quiet tags; 3 km neighborhood, 15 km city |

Explainability results become "Because of X" on each pick. Local rules then drop bars and pubs when "Skip bars" is ticked.

## Safe-use rules enforced in code

- No PII, specialty, plan, check-in or warning sign is ever part of a Qloo request (`src/lib/care/comfort.ts` only receives favorites, city and filters).
- Filters are ticked by people. The specialty never selects a filter.
- Taste output is never read by the rule engine or dashboard.
- Results are labeled "aggregate taste affinity". The trace panel on `/app/comfort` lists every call, its parameters (favorite IDs elided), result counts and timings.
- Responses are never committed; the e2e suite uses a local mock where every name starts with "Fixture".
