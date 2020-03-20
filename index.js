if (process.env.APPDYNAMICS_CONTROLLER_HOST_NAME)
  require("appdynamics").profile({
    controllerHostName: process.env.APPDYNAMICS_CONTROLLER_HOST_NAME,
    controllerPort: process.env.APPDYNAMICS_CONTROLLER_PORT,
    controllerSslEnabled: process.env.APPDYNAMICS_CONTROLLER_SSL_ENABLED,
    accountName: process.env.APPDYNAMICS_AGENT_ACCOUNT_NAME,
    accountAccessKey: process.env.APPDYNAMICS_AGENT_ACCOUNT_ACCESS_KEY,
    applicationName:  process.env.APP_NAME || 'firefly',
    tierName: process.env.APP_ID,
    nodeName: process.env.INSTANCE_ID // The controller will automatically append the node name with a unique number
  });

if (process.env.ELASTIC_APM_SERVER_URLS)
  require("elastic-apm-node").start()

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

      servicesCheker.on('error', (discoveryError) => {
        discoveryError.case({
          BadKeyService: (message) => console.log("⚠️ ===> ", message),
          ServiceUnreachable: (message) => console.log("⚠️ ===> ", message),
          UnableToDeleteService: (message) => console.log("⚠️ ===> ", message),
          SomethingBadWithService: (message) => console.log("⚠️ ===> ", message)
        })
      })

      server.listen(httpPort);
      console.log(`😛 🌍 🐝 firefly is started - listening on ${httpPort}`);
    })

}).catch(error => {
  //console.log(`😡: ${error.message()}`)
})

