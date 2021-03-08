// Grab function path using Twilio Runtime
const oauthpath = Runtime.getFunctions().oauth.path;

// // Use the standard require() to bring the library into scope
const auth = require(oauthpath);

exports.handler = function (context, event, callback) {
  //The event we're processing (in this case, OAuth Redirect)
  console.log("***** Context *****");
  console.log(context);

  // Setup a HTML page to display when we return from getting Auth Code
  let dynamicHtml = event.code
    ? `<p>Box Auth Code: ${event.code}!</p>`
    : `<p>No Code Received</p>`;

  // Basic HTML template
  const html = `
  <html>
    <link
      rel="stylesheet"
      href="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/css/bootstrap.min.css"
      integrity="sha384-Gn5384xqQ1aoWXA+058RXPxPg6fy4IWvTNh0E263XmFcJlSAwiGgFAW/dAiS6JXm"
      crossorigin="anonymous"
    />
    <body style="text-align: center">
      <h1>Box Auth Code</h1>
      ${dynamicHtml}
    </body>
  </html>`;

  // Twilio has it's own Response Obj
  let res = new Twilio.Response();
  // res.appendHeader("Location", redirectpath);
  res.appendHeader("Content-Type", "text/html");
  res.setBody(html);
  res.setStatusCode(200);

  // This will process the initial Access Code
  let token = {};
  (async () => {
    token = await auth.getInitialTokens("box", event.code);
    console.log(token);
  })();

  // Callback to conclude this function
  callback(null, res);
};
