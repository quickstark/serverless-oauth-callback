let Box = {
  baseurl: "https://account.box.com/api/oauth2/authorize",
  clientid: "gk356tfuqic9la95oj1mttxci43nx3zb",
  resptype: "code",
};

function authredirectBox() {
  window.location.href = `${Box.baseurl}?client_id=${Box.clientid}&response_type=${Box.resptype}`;
}

let Google = {
  baseurl: "https://accounts.google.com/o/oauth2/v2/auth",
  access_type: "offline", //require to receive refresh token from Google
  prompt: "consent", //required to force consent to generate refresh token
  clientid:
    "1025920631346-9ovp00unoe2vs5gm7qvalvpoh7hvkska.apps.googleusercontent.com",
  scope: "https://www.googleapis.com/auth/spreadsheets",
  redirect_uri: "https://quickstark.ngrok.io/redirect_google", //required
  response_type: "code",
};

function authredirectGoogle() {
  window.location.href = `${Google.baseurl}?access_type=${Google.access_type}&response_type=${Google.response_type}&client_id=${Google.clientid}&redirect_uri=${Google.redirect_uri}&scope=${Google.scope}&prompt=${Google.prompt}`;
}
