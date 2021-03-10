const querystring = require("querystring");
const axios = require("axios");
const { write } = require("fs");

// Use Twilioi Runtime helper to grab the function path
const syncpath = Runtime.getFunctions().sync.path;

// Now can require() to bring the library into scope
const sync = require(syncpath);

/**
 * Function to process Authorization Code returned from OAuth Provider
 * This takes the Auth Code and exchanges it for Access & Refresh Tokens
 *
 * @param {string} provider Provider of the OAuth2 Service
 * @param {string} code Authorization code from the redirect
 * @returns {Object} SyncMapItem
 */
async function getInitialTokens(provider, code) {
  // Set query parms by provider
  let queryparams = getQueryForProvider(
    provider,
    "authorization_code",
    code,
    ""
  );

  // Exchange a temporary Access Code with a set of tokens
  // This must be done quickly because Access Codes expire in ~ 30 seconds
  const res = await axios.post(
    queryparams.authurl,
    querystring.stringify(queryparams.query)
  );
  console.log(res.data);

  // Write the returned tokens to Sync
  const syncmapitem = await writeTokens(
    provider,
    res.data,
    queryparams.query.grant_type
  );
  console.log(nicePrint`SyncMapItem ${syncmapitem}`);
  return syncmapitem;
}

/**
 * Function to get existing Tokens for a Provider
 * or request new tokens if existing are expired
 *
 * @param {string} provider Provider of the OAuth2 Service
 * @returns {Object} Access Token as {data: access_token}
 */
async function getTokensForProvider(provider) {
  try {
    let tokendata = await readTokens(provider);
    let tokens = tokendata.data;

    console.log(nicePrint`Provider Tokens ${tokens}`);

    // Set query parms by provider
    let queryparams = getQueryForProvider(
      provider,
      "refresh_token",
      "",
      tokens.refresh_token
    );

    let needrefresh = await needRefresh(tokens);
    console.log(`Token Refresh Needed? ${needrefresh}`);
    if (needrefresh) {
      // If expired, send refresh token in exchance for new access token
      const res = await axios.post(
        queryparams.authurl,
        querystring.stringify(queryparams.query)
      );

      // Send the tokens to Sync to update the JSON object
      const writetokens = await writeTokens(
        provider,
        res.data,
        queryparams.query.grant_type
      );
      if ("access_token" in writetokens.data) {
        return { data: res.data.access_token };
      }
    } else {
      // If still valid, just return current access token
      return { data: tokens.access_token };
    }
  } catch (err) {
    console.log(err);
    return Promise.reject(err);
  }
}

/**
 * Returns tokens for a given Provider
 *
 * @param {string} provider Provider of the OAuth2 Service
 * @returns {Object} SyncMapItem that was read
 */
async function readTokens(provider) {
  try {
    let syncservice = await sync.fetchSyncService(process.env.SYNC_NAME);
    let syncmap = await sync.fetchSyncMap(
      syncservice.sid,
      process.env.SYNC_NAME
    );
    let syncmapitem = await sync.fetchMapItem(
      syncservice.sid,
      syncmap.sid,
      provider
    );
    return syncmapitem;
  } catch (err) {
    console.log(err);
    return Promise.reject(err);
  }
}

/**
 * Create or update tokens to a SyncMap object
 * What gets written varies by provider as some (like Google)
 * only pass the refresh_token on the intial grant
 *
 * @param {string} provider Provider of the OAuth2 Service
 * @param {Object} res Axios response.data object
 * @param {string} grant_type Token grant type
 * @returns {Object} SyncMapItem that was written
 */
async function writeTokens(provider, res, grant_type) {
  // Timestamp
  const date = new Date();
  const timestamp = date.toISOString();

  let tokendata = await readTokens(provider);
  let currenttokens = tokendata.data;

  // Google only sends a refresh token on 1st consent so we
  // need to keep it around in order to get a new access token
  let refresh =
    provider == "google" && grant_type == "refresh_token"
      ? currenttokens.refresh_token
      : res.refresh_token;

  // Define the Tokens we need to write
  let newtokens = {
    ...currenttokens,
    access_token: res.access_token,
    refresh_token: refresh,
    expires_in: res.expires_in,
    timestamp: timestamp,
  };

  // Write tokens to SyncMap
  try {
    let syncservice = await sync.fetchSyncService(process.env.SYNC_NAME);
    let syncmap = await sync.fetchSyncMap(
      syncservice.sid,
      process.env.SYNC_NAME
    );
    let syncmapitem = await sync.createOrupdateMapItem(
      syncservice.sid,
      syncmap.sid,
      provider,
      newtokens
    );
    return syncmapitem;
  } catch (err) {
    console.log(err);
    return Promise.reject(err);
  }
}

/**
 * Function to compose the data we need to query for tokens
 *
 * @param {string} provider Provider of the OAuth2 Service
 * @param {string} grant_type Token grant type
 * @param {string} code Authorization Code
 * @param {string} refresh_token Refresh token
 * @returns {Object} Query with URL and query parameters
 */
function getQueryForProvider(provider, grant_type, code, refresh_token) {
  // Set query parms by provider
  let queryparams = {};

  switch (provider) {
    case "box":
      queryparams = {
        authurl: "https://api.box.com/oauth2/token",
        query:
          grant_type == "refresh_token"
            ? {
                grant_type,
                refresh_token,
                client_id: process.env.BOX_CLIENT_ID,
                client_secret: process.env.BOX_CLIENT_SECRET,
              }
            : {
                grant_type,
                code,
                client_id: process.env.BOX_CLIENT_ID,
                client_secret: process.env.BOX_CLIENT_SECRET,
              },
      };
      return queryparams;

    case "google":
      queryparams = {
        authurl: "https://oauth2.googleapis.com/token",
        query:
          grant_type == "refresh_token"
            ? {
                grant_type,
                refresh_token,
                client_id: process.env.GOOGLE_CLIENT_ID,
                client_secret: process.env.GOOGLE_CLIENT_SECRET,
              }
            : {
                grant_type,
                code,
                client_id: process.env.GOOGLE_CLIENT_ID,
                client_secret: process.env.GOOGLE_CLIENT_SECRET,
                redirect_uri: "https://quickstark.ngrok.io/redirect_google",
              },
      };
      return queryparams;
    default:
      return (queryparams = {});
  }
}

/**
 * Function to test if we need to refresh. If we're close,
 * let's return true so we can grab new tokens
 *
 * @param {Object} tokens Token object
 * @returns {Boolean}
 */
async function needRefresh(tokens) {
  // Set a current timestamp
  const date = new Date();
  const current = date.toISOString();
  console.log(`Current Time: ${current}`);

  // Parse both time stamps into dates
  let currentTime = Date.parse(current);
  let tokenTime = Date.parse(tokens.timestamp);

  // Find the differnece to see if we need to refresh
  let diff = Math.abs(currentTime - tokenTime);
  let seconds = Math.floor(diff / 1000);
  console.log(`Token Expiration Time Difference in Seconds ${seconds} / 3600`);
  return seconds < tokens.expires_in - 30 ? false : true;
}

function nicePrint(strings, ...values) {
  console.log(strings[0]);
  values.map((val) => console.log(val));
}

module.exports = {
  getInitialTokens,
  getTokensForProvider,
};
