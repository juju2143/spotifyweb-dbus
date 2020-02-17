# spotifyweb-dbus

It's a simple script that exposes anything you're currently playing on Spotify over DBUS as a MPRIS-compatible player using the Spotify Web API. Supports more fields than Spotify itself! You don't have to run Spotify on your computer, this won't play any audio itself, but it is useful if you're playing something over the network as Spotify won't report it. It will work with a free account, but you won't be able to control it, such as pausing.

## Installation

1. [Click here](https://developer.spotify.com/dashboard/applications) to create a new app and add `http://localhost:34257/callback` in the `Redirect URIs` field (or whatever you're about to configure it to in step 3).
2. Copy `config.example.json` to `config.json` and copy the Client ID and Client Secret you got from your app from step 1 in the appropriate fields.
3. Make sure the `redirectURL` field is a valid URL that will work in your web browser, as a web server will run on this URL only for step 6. It's a concern if you're running this on another computer over SSH, but otherwise the default value should work. Again, don't forget to add it in the `Redirect URIs` field in your app on the Spotify website.
4. Run `npm install`.
5. Run `npm link` to symlink it in your $PATH.
6. Run `spotifyweb-dbus` for the first time in your favourite terminal emulator (or `node index.js` if you haven't bothered with step 5, or you couldn't make it work) and copy the URL in your web browser. If everything works well, the access and refresh tokens will be saved in `config.json`.
7. Once step 6 is done, it won't bother you again, you can leave it unattended in the background, in some autostart file or as a systemd user service.
8. Your favourite MPRIS-compatible music applet should now detect it, have fun!

## FAQ

### What's a MPRIS-compatible music applet?

If you use something like GNOME or KDE, you should see it in the corner of your screen when you listen to music using your favourite music player, otherwise you can use something like playerctl on the command line.

### The play/pause/etc. button doesn't work

1. It's not implemented yet
2. Once it is, you'll need Spotify Premium

Actually, controllers should be aware they can't control Spotify and disable the function accordingly, so it's probably a bug, so feel free to file an issue.

### I found a bug.

File an issue!

### I love you!

Aw thanks <3

## What works

### Free

- Most metadata supported in the MPRIS/XESAM specifications that makes sense with Spotify, which is a lot more than whatever the Spotify app itself exposes over DBus
- Get position (again, not supported at all on the Spotify app)
- Get status (Playing/Paused/Stopped)

### Premium

- Nothing (I can't test without a premium account, pls buy me a premium thx)

## Todo

- [ ] Spotify Premium features (the pause button, seek, and the rest)
- [ ] Get loop/shuffle status
- [ ] Playlists and tracklists
- [ ] Rate limiting
- [ ] Completely automate configuration and make installation more straightforward
- [ ] Song BPM?
- [ ] Dynamically reload config.json with a signal (it kinda does it every hour when the token is refreshed)

## License

Made by [@juju2143](https://twitter.com/juju2143), licensed under LiLiQ-P

If you like my software, please buy me a beer or a Spotify account on [Patreon](https://patreon.com/juju2143) :)