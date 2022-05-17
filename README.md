<img src="src/assets/images/icon-128.png" width="64"/>

# Automa
<p>
  <img alt="Automa latest version" src="https://img.shields.io/github/package-json/v/kholid060/automa" />
  <a href="https://twitter.com/AutomaApp">
    <img alt="Follow Us on Twitter" src="https://img.shields.io/twitter/follow/AutomaApp?style=social" />
  </a>
  <a href="https://discord.gg/C6khwwTE84">
    <img alt="Chat with us on Discord" src="https://img.shields.io/discord/942211415517835354?label=join%20discord&logo=Discord&logoColor=white" />
  </a>
</p>

An extension for automating your browser by connecting blocks. <br />
Auto-fill forms, do a repetitive task, take a screenshot, or scrape website data — the choice is yours. You can even schedule when the automation will execute!

## Downloads
<table cellspacing="0" cellpadding="0">
  <tr>
    <td valign="center">
      <a align="center" href="https://chrome.google.com/webstore/detail/automa/infppggnoaenmfagbfknfkancpbljcca">
        <img src="https://user-images.githubusercontent.com/22908993/166417152-f870bfbd-1770-4c28-b69d-a7303aebc9a6.png" alt="Chrome web store" />
        <p align="center">Chrome Web Store</p>
      </a>
    </td>
    <td valign="center">
      <a href="https://addons.mozilla.org/en-US/firefox/addon/automa/">
        <img src="https://user-images.githubusercontent.com/22908993/166417727-3481fef4-00e5-4cf0-bb03-27fb880d993c.png" alt="Firefox add-ons" />
        <p align="center">Firefox Add-ons</p>
      </a>
    </td>
  </tr>
</table>

## Marketplace
Browse the Automa marketplace where you can share and download workflows with others. [Go to the marketplace &#187;](https://automa.vercel.app/workflows)

## Project setup
Before running the `yarn dev` or `yarn build` script, you need to create the `getPassKey.js` file in the `src/utils` directory.  Inside the file write

```js
export default function() {
  return 'anything-you-want';
}
```

```bash
# Install dependencies
yarn install

# Compiles and hot-reloads for development for the chrome browser
yarn dev

# Compiles and minifies for production for the chrome browser
yarn build

# Create a zip file from the build folder for the chrome browser
yarn build:zip

# Compiles and hot-reloads for development for the firefox browser
yarn dev:firefox

# Compiles and minifies for production for the firefox browser
yarn build:firefox

# Lints and fixes files
yarn lint
```

## Contributors
Thanks to everyone who has submitted issues, made suggestions, and generally helped make this a better project.

<a href="https://github.com/kholid060/automa/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=kholid060/automa" />
</a>
