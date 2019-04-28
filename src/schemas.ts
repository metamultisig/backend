import { gql } from 'apollo-server';

export default gql`
  scalar Address
  scalar BigNumber
  scalar JSON

  input NewSigningRequest {
    destination: Address!
    value: BigNumber
    data: String
    abi: JSON
    nonce: Int!
    signatures: [String!]!
    description: String!
  }

  type SigningRequest {
    id: ID!
    destination: Address!
    value: BigNumber!
    data: String!
    abi: JSON
    nonce: Int!
    signatures: [String!]!
    description: String!
  }

  type Multisig {
    id: ID!
    signingRequest(id: ID!): SigningRequest
    signingRequests: [SigningRequest!]!
  }

  type Query {
    multisig(address: Address): Multisig
  }

  type Mutation {
    submitSigningRequest(address: String!, request: NewSigningRequest!): SigningRequest
    submitSignature(request: ID!, signature: String!): SigningRequest
  }
`;
