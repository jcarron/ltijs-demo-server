require('dotenv').config()
const path = require('path')
const routes = require('./src/routes')
const fs = require('fs')
const lti = require('ltijs').Provider

//debug
//const indexDebug = require('debug')('provider:index');
//indexDebug('in index.js')

// Setup
lti.setup(process.env.LTI_KEY1,
  {
    url: 'mongodb://' + process.env.DB_HOST + '/' + process.env.DB_NAME,
    connection: { user: process.env.DB_USER, pass: process.env.DB_PASS }
  }, {
	https: true,
	ssl: {
  		cert: fs.readFileSync(path.resolve(__dirname, "../../ssl.cert"), 'utf8'),
  		ca: fs.readFileSync(path.resolve(__dirname, "../../ssl.ca"), 'utf8'),
  		key: fs.readFileSync(path.resolve(__dirname, "../../ssl.key"), 'utf8')
	},
    staticPath: path.join(__dirname, './public'), // Path to static files
	appRoute: '/bsi2', loginRoute: '/login', // Optionally, specify some of the reserved routes
    cookies: {
      secure: true, // Set secure to true if the testing platform is in a different domain and https is being used
      sameSite: 'None' // Set sameSite to 'None' if the testing platform is in a different domain and https is being used
    },
    devMode: false, // Set DevMode to true if the testing platform is in a different domain and https is not being used
	cors: true
  })

// When receiving successful LTI launch redirects to app
lti.onConnect(async (token, req, res) => {
//  indexDebug('index.js -> onConnect')
  return res.sendFile(path.join(__dirname, './public/index.html'))
})

// When receiving deep linking request redirects to deep screen
lti.onDeepLinking(async (token, req, res) => {
//  indexDebug('index.js -> onDeepLinking')
  return lti.redirect(res, '/deeplink', { newResource: false })
})

// Setting up routes
lti.app.use(routes)

// Setup function
const setup = async () => {
//  indexDebug('index.js -> setup')
  await lti.deploy({ port: process.env.PORT })

  /**
   * Register platform
   */
  await lti.registerPlatform({
    url: 'https://smcdsbtest.desire2learn.com',
    name: 'D2l Brightspace Testing Server',
    clientId: process.env.LTI_KEY1,
    authenticationEndpoint: 'https://smcdsbtest.desire2learn.com/d2l/lti/authenticate',
    accesstokenEndpoint: 'https://auth.brightspace.com/core/connect/token',
    authConfig: { method: 'JWK_SET', key: 'https://smcdsbtest.desire2learn.com/d2l/.well-known/jwks' }
  }) 
	
  await lti.registerPlatform({
    url: 'https://smcdsb.elearningontario.ca',
    name: 'D2l Brightspace Production Server',
    clientId: process.env.LTI_KEY2,
    authenticationEndpoint: 'https://smcdsb.elearningontario.ca/d2l/lti/authenticate',
    accesstokenEndpoint: 'https://auth.brightspace.com/core/connect/token',
    authConfig: { method: 'JWK_SET', key: 'https://smcdsb.elearningontario.ca/d2l/.well-known/jwks' }
  }) 
	
}
//indexDebug('in index.js - before setup')
setup()