# Agent Guidelines

This file provides guidance to coding agents when working with
code in this repository.

## Commands

```bash
# Run all tests (lint + node + browser via karma)
npm test

# Run only Node.js tests
npm run test-node

# Run a single test file
npx mocha --preserve-symlinks -t 10000 test/jsonld-signatures.spec.js

# Run linter
npm run lint

# Run browser tests
npm run test-karma

# Code coverage
npm run coverage
```

> **Note:** Most meaningful test coverage lives in the downstream suite repos (
> e.g. `ed25519-signature-2020`), not in this package's own test file. The local
> spec is a minimal smoke test.

## Architecture

This is a low-level JavaScript library (CJS, Node ≥ 18 + browser via webpack)
implementing [Linked Data Signatures](https://w3c.github.io/vc-data-model) for
JSON-LD documents. It is not meant for standalone use — consumers pair it with a
concrete cryptographic suite.

### Core flow

**Signing** (`jsigs.sign`):

1. Caller provides a `document`, a `suite` (e.g. `Ed25519Signature2020`), a
   `purpose`, and a `documentLoader`.
2. `jsonld-signatures.js` delegates to `ProofSet#add`.
3. `ProofSet` wraps the caller's `documentLoader` with `extendContextLoader` (
   prepends the locally bundled security contexts so they are never fetched from
   the network).
4. The `suite.createProof` lifecycle runs:
  - `suite.updateProof` → `purpose.update` → `suite.createVerifyData` →
    `suite.sign`.
5. The resulting proof is added to the document via `jsonld.addValue`.

**Verifying** (`jsigs.verify`):

1. `ProofSet#verify` extracts all `proof` values from the document.
2. Each proof is matched to a purpose and then to a suite (via `purpose.match`
   and `suite.matchProof`).
3. Matched proofs are cryptographically verified in parallel (
   `suite.verifyProof`), then the purpose validates each result (
   `purpose.validate`), which includes checking controller-document
   authorization.
4. Returns `{verified: boolean, results: Array, error?: VerificationError}`.

**Deriving** (`jsigs.derive`) follows the same pattern but calls `suite.derive`
to produce a new document with a derived proof (used by selective-disclosure
suites).

### Extensibility model

External consumers subclass the two base classes exported via `api.suites`:

- **`LinkedDataProof`** (`lib/suites/LinkedDataProof.js`) — minimal base;
  subclasses implement `createProof`, `verifyProof`, `derive`, and optionally
  `matchProof`.
- **`LinkedDataSignature`** (`lib/suites/LinkedDataSignature.js`) — extends
  `LinkedDataProof`; adds the full RDFC-1.0 canonicalization + SHA-256 hash
  pipeline (`createVerifyData`). Subclasses only need to implement `sign` and
  `verifySignature`.

External consumers subclass the purpose hierarchy exported via `api.purposes`:

- **`ProofPurpose`** — base; handles `proofPurpose` term matching and optional
  timestamp-delta check.
- **`ControllerProofPurpose`** — extends base; fetches and frames the controller
  document to confirm the verification method is authorized for the declared
  purpose. Includes a DID-document optimization that skips JSON-LD framing when
  the document is already in DID context v1.
- **`AssertionProofPurpose`** / **`AuthenticationProofPurpose`** — concrete
  subclasses of `ControllerProofPurpose` for the two most common purposes.

### Document loader design

`lib/documentLoader.js` exports two functions:

- `strictDocumentLoader` — default; only serves the two locally bundled security
  contexts (`https://w3id.org/security/v1` and `/v2`). Any other URL throws.
  This is intentional for security.
- `extendContextLoader(loader)` — wraps any loader so the local contexts take
  precedence; used internally whenever the caller supplies their own
  `documentLoader`.

The bundled contexts are in `lib/contexts.js`, sourced from
`@digitalbazaar/security-context`.

### Browser support

`package.json` `"browser"` field aliases `lib/sha256digest.js` →
`lib/sha256digest-browser.js` (uses `SubtleCrypto` instead of Node `crypto`).
The karma config runs tests in Chrome via webpack bundling.

### Key dependencies

| Package                           | Role                                                   |
|-----------------------------------|--------------------------------------------------------|
| `jsonld`                          | JSON-LD expansion, framing, RDF conversion             |
| `rdf-canonize`                    | RDFC-1.0 canonicalization                              |
| `@digitalbazaar/security-context` | Bundled security context documents                     |
| `serialize-error`                 | Makes errors JSON-serializable in verification reports |