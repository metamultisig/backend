import { Contract } from 'ethers';
import { Provider } from 'ethers/providers';
import { bigNumberify, recoverAddress } from 'ethers/utils';
import { abi as multisigABI } from '@metamultisig/contract/build/contracts/MetaMultisig.json';
import filterAsync from 'node-filter-async';
import GraphQLJSON from 'graphql-type-json';

import {GraphQLBigNumber, GraphQLAddress} from './scalars';
import {Datastore, SigningRequest} from './datastore';

interface Context {
  provider: Provider;
}

async function filterSignatures(multisig: Contract, id: string, sigs: Array<string>) {
  return filterAsync(sigs, async (sig: string) => {
    const address = recoverAddress(id, sig);
    return !(await multisig.keyholders(address)).isZero();
  });
}

export default {
  BigNumber: GraphQLBigNumber,
  Address: GraphQLAddress,
  JSON: GraphQLJSON,
  Query: {
    multisig: (obj: Datastore, args: {address: string}) => {
      return {address: args.address, datastore: obj};
    }
  },
  Multisig: {
    signingRequests: (obj: {address: string, datastore: Datastore}) => {
      return obj.datastore.getSigningRequests(obj.address);
    },
    signingRequest: (obj: {address: string, datastore: Datastore}, args: {id: string}) => {
      return obj.datastore.getSigningRequest(obj.address, args.id);
    },
  },
  SigningRequest: {
    destination: (sr: SigningRequest) => {
      return sr.destination;
    },
    value: (sr: SigningRequest) => {
      return sr.value;
    },
    data: (sr: SigningRequest) => {
      return sr.data;
    },
    nonce: (sr: SigningRequest) => {
      return sr.nonce;
    },
    signatures: (sr: SigningRequest) => {
      return sr.signatures;
    },
  },
  Mutation: {
    submitSigningRequest: async (ds: Datastore, {address, request}: {address: string, request: SigningRequest}, context: Context) => {
      const multisig = new Contract(address, Array.from(multisigABI), context.provider);

      if(request.nonce < await multisig.nextNonce()) {
        return null;
      }

      request.value = request.value || bigNumberify(0);
      request.data = request.data || '0x';
      request.id = await multisig.getTransactionHash(request.destination, request.value, request.data, request.nonce);
      request.signatures = await filterSignatures(multisig, request.id, request.signatures);

      if(request.signatures.length < 1) {
        return null;
      }

      return ds.submitSigningRequest(address, request);
    },

    submitSignature: async (ds: Datastore, args: {address: string, id: string, signature: string}, context: Context) => {
      const request = ds.getSigningRequest(args.address, args.id);
      if(!request) {
        return null;
      }

      const multisig = new Contract(args.address, Array.from(multisigABI), context.provider);
      const keyholder = recoverAddress(args.id, args.signature);
      if((await multisig.keyholders(keyholder)).isZero()) {
        return null;
      }

      return ds.submitSignature(args.address, args.id, args.signature);
    }
  },
};