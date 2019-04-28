import { ApolloServer } from 'apollo-server';
import { getDefaultProvider } from 'ethers';

import resolvers from './resolvers';
import typeDefs from './schemas';
import { MemoryDatastore } from './datastore';

const datastore = new MemoryDatastore();

const provider = getDefaultProvider('ropsten');

const server = new ApolloServer({
  resolvers,
  typeDefs,
  rootValue: datastore,
  context: () => ({provider: provider}),
});

server.listen()
  .then(({ url }) => console.log(`Server ready at ${url}. `));

if(module.hot) {
  module.hot.accept();
  module.hot.dispose(() => server.stop());
}
