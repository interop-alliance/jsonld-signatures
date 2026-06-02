/*!
 * Copyright (c) 2010-2026 Digital Bazaar, Inc. All rights reserved.
 */

// Shared @interop ecosystem types. These live in `@interop/data-integrity-core`
// so that this package, `@interop/data-integrity-proof`,
// `@interop/ed25519-signature`, `@interop/vc`, and friends all agree on a
// single definition of a document loader, signer, verifier, key pair, etc.
import type {
  AbstractKeyPair,
  ISigner,
  IVerifier,
  IVerificationMethod,
  IProofDescription
} from '@interop/data-integrity-core';
import type {
  IDocumentLoader,
  IRemoteDocument
} from '@interop/data-integrity-core/loader';

// Re-export the shared types so consumers can keep importing them from this
// package if they prefer.
export type {
  AbstractKeyPair,
  ISigner,
  IVerifier,
  IVerificationMethod,
  IProofDescription,
  IDocumentLoader,
  IRemoteDocument
};

export interface ProofValidateResult {
  valid: boolean;
  error?: Error;
  controller?: object;
}

export interface ProofResult {
  proof: IProofDescription;
  verified: boolean;
  error?: Error;
  purposeResult?: ProofValidateResult;
}

export interface VerifyResult {
  verified: boolean;
  results: ProofResult[];
  error?: VerificationError;
}

// --- VerificationError ---

export class VerificationError extends Error {
  name: 'VerificationError';
  errors: Error[];
  constructor(errors: Error | Error[]);
}

// --- ProofPurpose hierarchy ---

export interface ProofPurposeOptions {
  term: string;
  date?: string | Date | number;
  maxTimestampDelta?: number;
}

export class ProofPurpose {
  term: string;
  date?: Date;
  maxTimestampDelta: number;

  constructor(options: ProofPurposeOptions);

  validate(
    proof: IProofDescription,
    options: {
      document?: object;
      suite?: LinkedDataProof;
      verificationMethod?: IVerificationMethod;
      documentLoader?: IDocumentLoader;
    }
  ): Promise<ProofValidateResult>;

  update(
    proof: IProofDescription,
    options: {
      document?: object;
      suite?: LinkedDataProof;
      documentLoader?: IDocumentLoader;
    }
  ): Promise<IProofDescription>;

  match(
    proof: IProofDescription,
    options: {
      document?: object;
      documentLoader?: IDocumentLoader;
    }
  ): Promise<boolean>;
}

export interface ControllerProofPurposeOptions extends ProofPurposeOptions {
  controller?: object;
}

export class ControllerProofPurpose extends ProofPurpose {
  controller?: object;
  constructor(options: ControllerProofPurposeOptions);
}

export class AssertionProofPurpose extends ControllerProofPurpose {
  constructor(options?: Partial<ControllerProofPurposeOptions>);
}

export interface AuthenticationProofPurposeOptions
  extends ControllerProofPurposeOptions {
  challenge: string;
  domain?: string;
}

export class AuthenticationProofPurpose extends ControllerProofPurpose {
  challenge: string;
  domain?: string;
  constructor(options: AuthenticationProofPurposeOptions);
}

// --- Suite hierarchy ---

export class LinkedDataProof {
  type: string;
  verificationMethod?: string;

  constructor(options: {type: string});

  createProof(options: {
    document: object;
    purpose: ProofPurpose;
    proofSet?: IProofDescription[];
    documentLoader: IDocumentLoader;
  }): Promise<IProofDescription>;

  verifyProof(options: {
    proof: IProofDescription;
    document: object;
    purpose: ProofPurpose;
    proofSet?: IProofDescription[];
    documentLoader: IDocumentLoader;
  }): Promise<{verified: boolean; error?: Error}>;

  derive(options: {
    document: object;
    purpose: ProofPurpose;
    proofSet?: IProofDescription[];
    documentLoader: IDocumentLoader;
  }): Promise<object>;

  matchProof(options: {
    proof: IProofDescription;
    document?: object;
    purpose?: ProofPurpose;
    documentLoader?: IDocumentLoader;
  }): Promise<boolean>;

  ensureSuiteContext(options: {document: object; addSuiteContext: boolean}): void;
}

export interface LinkedDataSignatureOptions {
  type: string;
  contextUrl?: string;
  LDKeyClass?: new (...args: any[]) => AbstractKeyPair;
  key?: AbstractKeyPair;
  signer?: ISigner;
  verifier?: IVerifier;
  proof?: IProofDescription;
  date?: string | Date | null;
  useNativeCanonize?: boolean;
  canonizeOptions?: object;
}

export class LinkedDataSignature extends LinkedDataProof {
  LDKeyClass?: new (...args: any[]) => AbstractKeyPair;
  contextUrl: string;
  proof?: IProofDescription;
  verificationMethod?: string;
  key?: AbstractKeyPair;
  signer?: ISigner;
  verifier?: IVerifier;
  date?: Date | null;
  canonizeOptions?: object;

  constructor(options: LinkedDataSignatureOptions);

  sign(options: {
    verifyData: Uint8Array;
    document: object;
    proof: IProofDescription;
    documentLoader: IDocumentLoader;
  }): Promise<IProofDescription>;

  verifySignature(options: {
    verifyData: Uint8Array;
    verificationMethod: IVerificationMethod;
    document: object;
    proof: IProofDescription;
    documentLoader: IDocumentLoader;
  }): Promise<boolean>;

  getVerificationMethod(options: {
    proof: IProofDescription;
    documentLoader: IDocumentLoader;
  }): Promise<IVerificationMethod>;
}

// --- Top-level API ---

export function sign(
  document: object,
  options: {
    suite: LinkedDataProof;
    purpose: ProofPurpose;
    documentLoader?: IDocumentLoader;
    addSuiteContext?: boolean;
  }
): Promise<object>;

export function verify(
  document: object,
  options: {
    suite: LinkedDataProof | LinkedDataProof[];
    purpose: ProofPurpose;
    documentLoader?: IDocumentLoader;
  }
): Promise<VerifyResult>;

export function derive(
  document: object,
  options: {
    suite: LinkedDataProof;
    purpose: ProofPurpose;
    documentLoader?: IDocumentLoader;
    addSuiteContext?: boolean;
  }
): Promise<object>;

// --- Document loader utilities ---

export const strictDocumentLoader: IDocumentLoader;
export function extendContextLoader(loader: IDocumentLoader): IDocumentLoader;

// --- Constants ---

export const SECURITY_CONTEXT_URL: string;
export const SECURITY_CONTEXT_V1_URL: string;
export const SECURITY_CONTEXT_V2_URL: string;
export const SECURITY_PROOF_URL: string;
export const SECURITY_SIGNATURE_URL: string;

// --- Namespaces ---

export const suites: {
  LinkedDataProof: typeof LinkedDataProof;
  LinkedDataSignature: typeof LinkedDataSignature;
};

export const purposes: {
  ProofPurpose: typeof ProofPurpose;
  ControllerProofPurpose: typeof ControllerProofPurpose;
  AssertionProofPurpose: typeof AssertionProofPurpose;
  AuthenticationProofPurpose: typeof AuthenticationProofPurpose;
};
