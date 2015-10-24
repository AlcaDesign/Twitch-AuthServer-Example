# Twitch Auth Server Example

A basic Express server example for logging in with Twitch.

# Instructions

1. Clone the respository: `git clone AlcaDesign/Twitch-AuthServer-Example`.
2. Create the file "config.json" based on the `/config/config.default.json`.
    1. Create or edit a [Twitch app](http://www.twitch.tv/kraken/oauth2/clients/new) that will redirect to `http://127.0.0.1:3000/auth/twitch/callback`.
    2. Insert the generated client ID and client secret into their respective fields.
    3. Change the scope as needed.
    4. Create a random key to put in `session.secret` (a phrase or just random bits if you'd prefer).
3. Run the `npm install` command in the reposityory folder to install the node dependencies.
4. Run the server: `node index.js`.
5. Open to this page in your browser: `http://127.0.0.1:3000/`.
6. Click "Login" and authorize your app with your credentials.
7. Once you're redirected, you should be back to the first page and your name should have appeared.
