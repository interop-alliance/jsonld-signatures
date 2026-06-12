/*!
 * Copyright (c) 2026 Interop Alliance. All rights reserved.
 */
const chai = require('chai');
chai.should();
const {expect} = chai;

const jsigs = require('../lib/jsonld-signatures');

/**
 * Guards the named-export detectability of the CJS entry point: a dynamic
 * `import()` of a CJS module resolves to the same ESM namespace that
 * `import {verify} from ...` sees, so these assertions fail if the entry
 * regresses to a shape (spreads, post-hoc `api.x = ...` mutation) that
 * node's cjs-module-lexer cannot statically analyze.
 */
describe('ESM named exports', () => {
  const expectedExports = [
    'SECURITY_CONTEXT_URL',
    'SECURITY_CONTEXT_V1_URL',
    'SECURITY_CONTEXT_V2_URL',
    'SECURITY_PROOF_URL',
    'SECURITY_SIGNATURE_URL',
    'derive',
    'sign',
    'verify',
    'suites',
    'purposes',
    'extendContextLoader',
    'strictDocumentLoader',
    'VerificationError'
  ];

  it('exposes every API member as a detectable named export', async () => {
    const namespace = await import('../lib/jsonld-signatures.js');
    for(const name of expectedExports) {
      expect(namespace, `named export "${name}"`).to.have.property(name);
      expect(namespace[name]).to.equal(jsigs[name]);
    }
  });

  it('keeps the default export identical to module.exports', async () => {
    const namespace = await import('../lib/jsonld-signatures.js');
    expect(namespace.default).to.equal(jsigs);
  });

  it('exports the same members from CJS require()', () => {
    expect(Object.keys(jsigs).sort()).to.deep.equal(
      [...expectedExports].sort());
  });
});
