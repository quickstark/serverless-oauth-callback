const axios = require("axios");

// Grab function path
const oauthpath = Runtime.getFunctions().oauth.path;

// // Next, simply use the standard require() to bring the library into scope
const auth = require(oauthpath);

exports.handler = function (context, event, callback) {
  //The event we're processing
  console.log("***** RAW Event *****");
  console.log(event);

  // IIFE Async to execute the Token Swap
  let googlerow = (async () => {
    let token = await auth.getTokensForProvider("google");
    return await postRowtoSheets(token.data, event);
  })();

  // IIFE async still return a Promise
  googlerow.then((res) => {
    callback(null, `Posted ${res.tableRange} to Google" `);
  });
};

async function postRowtoSheets(token, event) {
  let values = [Object.values(event)];

  const Google = {
    baseurl: "https://sheets.googleapis.com/v4/spreadsheets",
    spreadsheetID: "1M_tiyChH8J-J7dxVSJgPXgX2rPDP-YxyN7GTVZV58_k",
    range: "Sheet1",
    valueInputOption: "USER_ENTERED",
  };
  postURL = `${Google.baseurl}/${Google.spreadsheetID}/values/${Google.range}:append?valueInputOption=${Google.valueInputOption}`;
  const config = {
    headers: { Authorization: `Bearer ${token}` },
  };
  const bodyParameters = {
    values: values,
  };
  const response = await axios.post(postURL, bodyParameters, config);
  console.log(response.data);

  return response.data;
}
