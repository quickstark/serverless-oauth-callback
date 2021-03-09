# Twilio Serverless Oauth Callback

Twilio Serverless Functions to demonstrate Tri-Legged Oauth callbacks/webhooks to Box and Google Sheets

**Important: Twilio Functions are limited to ~20 executions / second, so this is purely for demonstration and/or
relatively light use cases**

This uses the [Twilio CLI](https://www.twilio.com/docs/twilio-cli/quickstart) with the [Twilio Serverless Plugin](https://www.twilio.com/docs/twilio-cli/plugins)

## Installation

1.  Clone this repo

2.  Setup Provider Profiles

    - Setup Google OAuth 2 Profile and Sheets Access (see below)
    - Setup Box in a similar but much easier way (see below))

3.  Create .env file in root and provide keys for the following:
    SYNC_NAME="<Name for Twilio Sync Service and Sync Map>"
    BOX_CLIENT_ID="<copied from Box Developer Console>"
    BOX_CLIENT_SECRETE="<copied from Box Developer Console>"
    GOOGLE_CLIENT_ID="<copied from Google IAM Console>"
    GOOGLE_CLIENT_SECRET="<copied from Google IAM Console>"

4.  Update access.js in assets folder with Box and Google Client IDs (see Google instructions below)
    _Note: You can ignore Box if you only care about Google_

    - Or, you can add your own Provider by glancing through the code and modifying

5.  Update Provider object data

    - If using Google, update the Spreadhseet ID in callback_google.js (could move this to ENV as well.)
      - _[Finding Google Sheet ID](https://developers.google.com/sheets/api/guides/concepts)_
    - If using Box, update the File ID (its the # in the URL of any given Box document)

6.  Deploy the Serverless Function using Twilio CLI

    ```zsh
    twilio serverless:deploy
    ```

    _Following initial deploy, if you want to overwrite an existing project_

    ```zsh
    twilio serverless:deploy --override-existing-project
    ```

7.  Once deployed, visit your [Twilio Functions](https://www.twilio.com/console/functions/overview/services)

8.  Copy to URL to the index.html and paste into a fresh browser tab. You should see the Oauth Buttons

    - Click on either
    - If configured correctly (e.g. all the URLs and IDs were update from above steps), you should be redirected and and Authorize
    - _Google will throw a non-verified App error for development projects. You'll have to by pass this and accept._
    - Once you complete Auth, you will be returned to Twilio and a page showing the temporate Auth Code should display

9.  You should now be able to update a Phone Number Webhook by pointing to the appropriate Callback Function (callback_box or callback_google)

10. Alternatively, you can run this locally for testing. See [Developing with the Serverless Toolkit](https://www.twilio.com/docs/labs/serverless-toolkit/developing?code-sample=code-run-a-serverless-project-locally&code-language=twilio-cli&code-sdk-version=default)

## Basics for Google OAuth Client

_(Google changes their IAM console regularly, so keeping this relatively generic)_

    1. Visit Google IAM and create an OAuth 2.0 Client ID [Google IAM](https://console.developers.google.com/apis/credentials)
    2. Provide a redirect URI * (Example: https://serverless-oauth-callback-8527-dev.twil.io/redirect_google) *
        - You can get this URL the Twilio Function Editor [Twilio Functions](https://www.twilio.com/console/functions/overview/services)
    3. Copy the Client ID from this page (and add it to *.env and access.js)
    4. Copy the Client Secret from this page (and add it to *.env)
    5. *Important* You have to enable the Google Sheets API [Google Library](https://console.developers.google.com/apis/library?project=twilio-8cf4c)

## Basics for Box OAuth Client

    1. Visit [Box Developer Console](https://quickstark.app.box.com/developers/console)
    2. Create a "New App"
    3. Choose "Custom App"
    4. Select "User Authentication (OAuth 2.0)" on the Authentication Method modal
    5. Copy the Client ID (and add it to *.env and access.js)
    6. Copy the Client Secret (and add it toe *.env)
    7. Provide a valid Redirect URI * (Example: https://serverless-oauth-callback-8527-dev.twil.io/callback_box) *
    8. Check the box to provide "Write all files and folders stored in Box"
    9. Save your changes
