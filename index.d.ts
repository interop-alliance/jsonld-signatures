/*!
 * Copyright (c) 2010-2024 Digital Bazaar, Inc. All rights reserved.
 */

// Compatible with the documentLoader shape used by security-document-loader.
export interface RemoteDocument {
  contextUrl?: string | null;
  documentUrl?: string;
  document: any;
  tag?: string;
}

export type DocumentLoader = (url: string) => Promise<RemoteDocument>;

export interface Signer {
  id: string;
  sign(options: {data: Uint8Array}): Promise<Uint8Array>;
}

export interface Verifier {
  id: string;
  verify(options: {data: Uint8Array; signature: Uint8Array}): Promise<boolean>;
}

export interface ProofValidateResult {
  valid: boolean;
  error?: Error;
  controller?: object;
}

export interface ProofResult {
  proof: object;
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
    proof: object,
    options: {
      document?: object;
      suite?: LinkedDataProof;
      verificationMethod?: object;
      documentLoader?: DocumentLoader;
    }
  ): Promise<ProofValidateResult>;

  update(
    proof: object,
    options: {
      document?: object;
      suite?: LinkedDataProof;
      documentLoader?: DocumentLoader;
    }
  ): Promise<object>;

  match(
    proof: object,
    options: {
      document?: object;
      documentLoader?: DocumentLoader;
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

  constructor(options: {type: string});

  createProof(options: {
    document: object;
    purpose: ProofPurpose;
    proofSet?: object[];
    documentLoader: DocumentLoader;
  }): Promise<object>;

  verifyProof(options: {
    proof: object;
    document: object;
    purpose: ProofPurpose;
    proofSet?: object[];
    documentLoader: DocumentLoader;
  }): Promise<{verified: boolean; error?: Error}>;

  derive(options: {
    document: object;
    purpose: ProofPurpose;
    proofSet?: object[];
    documentLoader: DocumentLoader;
  }): Promise<object>;

  matchProof(options: {
    proof: object;
    document?: object;
    purpose?: ProofPurpose;
    documentLoader?: DocumentLoader;
  }): Promise<boolean>;

  ensureSuiteContext(options: {document: object; addSuiteContext: boolean}): void;
}

export interface LDKeyPair {
  id: string;
  signer?(): Signer;
  verifier?(): Verifier;
}

export interface LinkedDataSignatureOptions {
  type: string;
  contextUrl?: string;
  LDKeyClass?: new (...args: any[]) => LDKeyPair;
  key?: LDKeyPair;
  signer?: Signer;
  verifier?: Verifier;
  proof?: object;
  date?: string | Date;
  useNativeCanonize?: boolean;
  canonizeOptions?: object;
}

export class LinkedDataSignature extends LinkedDataProof {
  LDKeyClass?: new (...args: any[]) => LDKeyPair;
  contextUrl: string;
  proof?: object;
  verificationMethod?: string;
  key?: LDKeyPair;
  signer?: Signer;
  verifier?: Verifier;
  date?: Date;
  canonizeOptions?: object;

  constructor(options: LinkedDataSignatureOptions);

  sign(options: {
    verifyData: Uint8Array;
    document: object;
    proof: object;
    documentLoader: DocumentLoader;
  }): Promise<object>;

  verifySignature(options: {
    verifyData: Uint8Array;
    verificationMethod: object;
    document: object;
    proof: object;
    documentLoader: DocumentLoader;
  }): Promise<boolean>;

  getVerificationMethod(options: {
    proof: object;
    documentLoader: DocumentLoader;
  }): Promise<object>;
}

// --- Top-level API ---

export function sign(
  document: object,
  options: {
    suite: LinkedDataProof;
    purpose: ProofPurpose;
    documentLoader?: DocumentLoader;
    addSuiteContext?: boolean;
  }
): Promise<object>;

export function verify(
  document: object,
  options: {
    suite: LinkedDataProof | LinkedDataProof[];
    purpose: ProofPurpose;
    documentLoader?: DocumentLoader;
  }
): Promise<VerifyResult>;

export function derive(
  document: object,
  options: {
    suite: LinkedDataProof;
    purpose: ProofPurpose;
    documentLoader?: DocumentLoader;
    addSuiteContext?: boolean;
  }
): Promise<object>;

// --- Document loader utilities ---

export const strictDocumentLoader: DocumentLoader;
export function extendContextLoader(loader: DocumentLoader): DocumentLoader;

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
