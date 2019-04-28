import {BigNumber} from 'ethers/utils';

export interface SigningRequest {
  id: string;
  destination: string;
  value?: BigNumber;
  data?: string;
  nonce: number;
  signatures: Array<string>;
}

export interface Datastore {
  getSigningRequests: (address: string) => Array<SigningRequest>;
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

  getSigningRequests(address: string) {
    return Object.values(this.data[address]);
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
