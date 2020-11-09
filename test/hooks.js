exports.mochaHooks = {
  before() {
   process.on('unhandledRejection', (err, p) => {
  console.error('unhandledRejection', err.stack, p)
}) 
    // do something before every test
  }
};
