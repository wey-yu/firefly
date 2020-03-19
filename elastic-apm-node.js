module.exports = {
    serviceName: process.env.STORE_APP_NAME,
    serviceNodeName : process.env.INSTANCE_ID,
    serviceVersion : process.env.COMMIT_ID,
    secretToken: process.env.ELASTIC_APM_SECRET_TOKEN || "",
    serverUrl: process.env.ELASTIC_APM_SERVER_URLS || "http://localhost:8200",
    active: process.env.NODE_ENV === 'production',
    logLevel : 'debug',
    logUncaughtExceptions : true, 
  }
