const { ApolloServer } = require('apollo-server');
const mongoose = require('mongoose');


const typeDefs = require('./graphql/typeDefs');
const resolvers = require('./graphql/resolvers');
const { MONGODB } = require('./config.js');



const server = new ApolloServer({
    typeDefs,
    resolvers
});


mongoose.connect(MONGODB, { useNewUrlParser: true })
    .then(() => {
        console.log('MONGODB connected...');
        return server.listen({ port: 5500 });
    })
    .then((res) => {
    console.log(`🚀  Server ready at ${res.url}`);
  });