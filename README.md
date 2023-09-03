<h1 align="center">
    <img src="static/img/discorgento-logo.png" alt="Discorgento logo" width="128" height="128" title="Discorgento"/> 
  <br>
  discorgento.com
  <br>
</h1>

## Automated deploy

Everything uploaded to main will be published on the production server

main = production


# Website

This website is built using [Docusaurus 2](https://docusaurus.io/), a modern static website generator.

### Installation

```
$ yarn
```

### Local Development

```
$ yarn start
```

This command starts a local development server and opens up a browser window. Most changes are reflected live without having to restart the server.

### Build

```
$ yarn build
```

This command generates static content into the `build` directory and can be served using any static contents hosting service.

### Deployment

Using SSH:

```
$ USE_SSH=true yarn deploy
```

Not using SSH:

```
$ GIT_USER=<Your GitHub username> yarn deploy
```

If you are using GitHub pages for hosting, this command is a convenient way to build the website and push to the `gh-pages` branch.


## Follow us

<div class="bottom-bar">
        <a href="https://discord.io/Discorgento" target="_blank" title="Discord">
            <img src="./imgs/social/discord-icon.png" width="40" height="40" />
        </a>
        <a href="https://github.com/discorgento" target="_blank" title="Github">
            <img
                src="./imgs/social/github-logo.png" width="40" height="40"/>
        </a>
        <a href="https://www.instagram.com/discorgento/" target="_blank" title="Instagram">
            <img
                src="./imgs/social/instagram-icon.png" width="40" height="40"/>
        </a>
        <a href="https://open.spotify.com/show/5h3gKepBezY4Iz5LM79nUn" target="_blank" title="Spotify">
            <img
                src="./imgs/social/spotify-icon.png" width="40" height="40"/>
        </a>
        <a href="https://www.youtube.com/channel/UChJitnyFtNOoCe6cu-rHcow" target="_blank" title="Youtube">
            <img
                src="./imgs/social/youtube-icon.png" width="40" height="40"/>
        </a>
        <a href="https://twitter.com/discorgento" target="_blank" title="Twitter">
            <img
                src="./imgs/social/twitter-logo.png" width="40" height="40"/>
        </a>
    </div>


<a href="https://github.com/discorgento/discorgento.com/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=discorgento/discorgento.com" />
</a>