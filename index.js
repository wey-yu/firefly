const ServicesChecker = require('firefly-server').ServicesChecker

//const Db = require('firefly-core-libs').MemDb
const Db = require('firefly-redis-connector').RedisDb
const discoveryServer = require('firefly-server').httpServer

let url = process.env.REDIS_URL || "redis://localhost:6379"

let db = new Db({url})
//let db = new Db()

db.initialize().then((dbCli) => {
  dbCli.on('error', (error) => {
    console.log("📦 Redis Error", error)
  })

  const httpPort = process.env.PORT || 8080;
  const informations = process.env.INFORMATIONS || "discoveryServerID: 0002"

  let checkCredentials = (credential) => {
    const serverCredentials = process.env.SERVER_CREDENTIALS || 'firefly';
    return new Promise((resolve, reject) => {
      credential===serverCredentials ? resolve("Hello you!") : reject("bad credentials")
    })
  }

  discoveryServer({dbCli, httpPort, checkCredentials})
    .then((server) => {
      // you can add routes to the server
      server.get(`/informations`, (req, res) => {
        res.send({informations})
      });     

      let servicesCheker = new ServicesChecker({id:"checker", delay: 5000, dbCli: dbCli})
      servicesCheker.start({task: "check"})

      // WIP 🚧
      servicesCheker.on('error', (discoveryError) => {
        discoveryError.case({
          BadKeyService:            (message) => console.log("⚠️ bad key of service ", message),
          ServiceUnreachable:       (message) => console.log("⚠️ unable to reach the service ", message),
          UnableToDeleteService:    (message) => console.log("⚠️ unable to delete the service ", message),
          SomethingBadWithService:  (message) => console.log("⚠️ 😡 Huston?", message)
        })
      })

      server.listen(httpPort);
      console.log(`😛 🌍 🐝 firefly is started - listening on ${httpPort}`);
    })

}).catch(error => {
  //console.log(`😡: ${error.message()}`)
})

