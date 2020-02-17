#!/usr/bin/env node
const Player = require('mpris-service');
const SpotifyWebApi = require('spotify-web-api-node');
const http = require('http');
const url = require('url');
const fs = require('fs');
var config = require('./config.json');

var spotify = new SpotifyWebApi({
    clientId: config.clientId,
    clientSecret: config.clientSecret,
    redirectUri: config.redirectURL
});

var scopes = ['user-read-currently-playing', 'user-read-playback-state', 'user-modify-playback-state'];

function refreshToken(err, expired, notExpired)
{
    if(Date.now() >= config.expires)
    {
        spotify.refreshAccessToken().then((data) => {
            console.log('The access token has been refreshed!');

            config = require('./config.json');
            config.accessToken = data.body['access_token'];
            config.expires = parseInt(data.body['expires_in'])*1000+Date.now();
            fs.writeFileSync("./config.json", JSON.stringify(config, null, 4));
            spotify.setAccessToken(config.accessToken);
            if(expired) expired();
        }, err);
    }
    else
    {
        if(notExpired) notExpired();
        else if(expired) expired();
    }
}

if(config.accessToken && config.refreshToken && config.expires)
{
    spotify.setAccessToken(config.accessToken);
    spotify.setRefreshToken(config.refreshToken);
    refreshToken((err) =>{
        console.log('Could not refresh access token:', err);
    }, main);
}
else
{
    var redirectUri = new URL(config.redirectURL);
    var server = http.createServer((request, response) => {
        var url = new URL(request.url, redirectUri.origin);
        if(url.pathname == redirectUri.pathname)
        {
            code = url.searchParams.get('code');
            state = url.searchParams.get('state');
            if(state == config.state && code)
            {
                spotify.authorizationCodeGrant(code).then((data) => {
                    response.end('Thanks, you can start using your app now :)');

                    config = require('./config.json');
                    config.expires = parseInt(data.body['expires_in'])*1000+Date.now();
                    config.accessToken = data.body['access_token'];
                    config.refreshToken = data.body['refresh_token'];
                    fs.writeFileSync("./config.json", JSON.stringify(config, null, 4));

                    spotify.setAccessToken(config.accessToken);
                    spotify.setRefreshToken(config.refreshToken);

                    server.close();
                    main();
                },
                (err) => {
                    console.log('Something went wrong:', err);
                    response.writeHead(500);
                    response.end('Something went wrong');
                });
            }
            else
            {
                response.writeHead(401);
                response.end('Authentication required');
            }
        }
        else
        {
            response.writeHead(404);
            response.end('Not found');
        }
    });

    server.listen(parseInt(redirectUri.port)||80, (err) => {
        if (err) {
            return console.log('Something went wrong:', err)
        }

        var authorizeURL = spotify.createAuthorizeURL(scopes, config.state);
    
        console.log('Please point your browser to this URL to continue:')
        console.log(authorizeURL);
    })
}

function main()
{
    console.log("Launching the app...");
    var player = Player({
        name: 'spotifyweb',
        identity: 'Spotify Web API',
        supportedUriSchemes: ['http', 'https'],
        supportedMimeTypes: [],
        supportedInterfaces: ['player']
    });
    
    update();

    function update() {
        setTimeout(update, config.interval);

        refreshToken((err) =>{
            console.log('Could not refresh access token:', err);
        });

        spotify.getMyCurrentPlaybackState({})
        .then((data) => {
            var time = Date.now();

            item = data.body.item||{};

            if(data.body.item)
            {
                var duration = item['duration_ms'] || 0
                player.metadata = {
                    'mpris:trackid': player.objectPath('track/'+(item.id||0)),
                    'mpris:length': duration*1000, // In microseconds
                    'mpris:artUrl': item.album?item.album.images[0].url:'',
                    'xesam:title': item.name || "",
                    'xesam:album': item.album?item.album.name:"",
                    'xesam:albumArtist': item.album?(item.album.artists||[]).map((artist)=>artist.name||""):[],
                    'xesam:artist': (item.artists||[]).map((artist)=>artist.name||""),
                    'xesam:contentCreated': item.album?(item.album['release_date']||""):"",
                    'xesam:discNumber': item['disc_number']||0,
                    'xesam:trackNumber': item['track_number']||0,
                    'xesam:url': item['external_urls']?(item['external_urls'].spotify||""):"",
                };
                player.playbackStatus = data.body['is_playing']?'Playing':'Paused';
                player.getPosition = () => {
                    var progress = data.body['progress_ms'];
                    if(data.body['is_playing']) var offset = Date.now()-time;
                    else var offset = 0;
                    if(progress+offset>duration) player.playbackStatus = 'Paused';
                    return ((progress+offset>duration)?duration:(progress+offset))*1000;
                }
                player.volume = data.body.device?data.body.device['volume_percent']:100;
                player.seeked(player.getPosition());
                player.canControl = false; // TODO: check if user has Premium
            }
            else
            {
                player.metadata = {}
                player.playbackStatus = 'Stopped';
                player.getPosition = () => 0;
            }
        })
        .catch((err) => {
            console.log('Something went wrong: ', err);
        });
    }

    // TODO: Implement these once I ever buy Premium again
    // Note that those events shouldn't be defined if the user has a free account
    // So let's wait until the thing that checks if the user has Premium has been implemented
    /*player.on('play', () => {
        spotify.play()
        .catch((err) => {
            console.log('Something went wrong: ', err);
        });
    });

    player.on('pause', () => {
        spotify.pause()
        .catch((err) => {
            console.log('Something went wrong: ', err);
        });
    });*/

    player.on('quit', () => {
        process.exit();
    });
}