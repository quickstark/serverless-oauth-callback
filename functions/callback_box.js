const axios = require("axios");

// Grab function path
const oauthpath = Runtime.getFunctions().oauth.path;

// // Next, simply use the standard require() to bring the library into scope
const auth = require(oauthpath);

exports.handler = function (context, event, callback) {
  //The event we're processing
  console.log("***** RAW Event *****");
  console.log(`Twilio Event: ${event.SmsMessageSid} &  ${event.Body}`);

  // IIFE Async to execute the Token Swap
  let boxcomment = (async () => {
    let token = await auth.getTokensForProvider("box");
    return await postBoxComment(token.data, event);
  })();

  // IIFE async still return a Promise
  boxcomment.then((res) => {
    callback(null, `Posted comment ${res.id} as "${res.message}" `);
  });
};

/**
 * Function to test OAuth for the Box service
 *
 * @param {string} token A valid Access Token for the provider
 * @param {Object} event Event passed from Twilio Function
 * @returns {Object} Returns a Box Comment
 */
async function postBoxComment(token, event) {
  const postURL = "https://api.box.com/2.0/comments/";
  const config = {
    headers: { Authorization: `Bearer ${token}` },
  };
  const bodyParameters = {
    message: event.Body,
    item: {
      type: "file",
      id: 783120462102,
    },
  };
  try {
    const response = await axios.post(postURL, bodyParameters, config);
    return response.data;
  } catch (err) {
    console.log(err.message);
  }
}
