import { GraphQLScalarType, Kind } from 'graphql';
import { BigNumber, bigNumberify, getAddress } from 'ethers/utils';

// tslint:disable-next-line
export const GraphQLAddress = new GraphQLScalarType({
  name: 'Address',
  description: 'An account address',
  serialize: String,
  parseValue: input => (getAddress(input)),
  parseLiteral: ast => {
    if (ast.kind === Kind.STRING) {
      return getAddress(ast.value);
    }
  },
});

//tslint:disable-next-line
export const GraphQLBigNumber = new GraphQLScalarType({
  name: "BigNumber",
  description: "Big integer",
  parseValue: (value) => {
    return bigNumberify(value);
  },
  serialize: (value) => {
    return value.toString();
  },
  parseLiteral: (ast) => {
    if(ast.kind === Kind.STRING || ast.kind === Kind.INT) {
      return bigNumberify(ast.value);
    }
  }
});
