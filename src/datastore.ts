import {BigNumber} from 'ethers/utils';

export interface SigningRequest {
  id: string;
  destination: string;
  value: BigNumber;
  data: string;
  abi?: string;
  nonce: number;
  signatures: Array<string>;
  description?: string;
}

export interface Datastore {
  getSigningRequests: (address: string, minNonce: number) => Array<SigningRequest>;
  getSigningRequest: (address: string, id: string) => SigningRequest|null;
  submitSigningRequest: (address: string, request: SigningRequest) => SigningRequest;
  submitSignature: (address: string, id: string, signature: string) => SigningRequest|null;
}

function mergeSignatures(a: Array<string>, b: Array<string>) {
  return Array.from(new Set(a.concat(b)));
}

export class MemoryDatastore implements Datastore {
  data: {[address: string]: {[id: string]: SigningRequest}};

  constructor() {
    this.data = {};
  }

  getSigningRequests(address: string, minNonce: number) {
    return Object.values(this.data[address] || {})
      .filter((req) => (req.nonce >= minNonce));
  }

  getSigningRequest(address: string, id: string) {
    const requests = this.data[address];
    if(!requests) {
      return null;
    }
    return requests[id];
  }

  submitSigningRequest(address: string, request: SigningRequest) {
    let requests = this.data[address];
    if(requests === undefined) {
      requests = this.data[address] = {};
    }

    if(requests[request.id] === undefined) {
      requests[request.id] = request;
      return request;
    } else {
      const storedRequest = requests[request.id];
      storedRequest.signatures = mergeSignatures(storedRequest.signatures, request.signatures);
      return storedRequest;
    }
  }

  submitSignature(address: string, id: string, signature: string) {
    let requests = this.data[address];
    if(requests === undefined) {
      return null;
    }

    let request = requests[id];
    if(request === undefined) {
      return null;
    }

    request.signatures = mergeSignatures(request.signatures, [signature]);

    return request;
  }
};
