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
Browse the Automa marketplace where you can share and download workflows with others. [Go to the marketplace &#187;](https://www.automa.site/marketplace)

## Automa Chrome Extension Builder
Automa Chrome Extension Builder (Automa CEB for short) allows you to generate a standalone chrome extension based on Automa workflows. [Go to the documentation &#187;](https://docs.automa.site/extension-builder)


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

# Create a zip file from the build folder
yarn build:zip

# Compiles and hot-reloads for development for the firefox browser
yarn dev:firefox

# Compiles and minifies for production for the firefox browser
yarn build:firefox

# Lints and fixes files
yarn lint
```

### Install Locally
#### Chrome
1. Open chrome and navigate to extensions page using this URL: chrome://extensions.
2. Enable the "Developer mode".
3. Click "Load unpacked extension" button, browse the `automa/build` directory and select it.

![Install in chrome](https://res.cloudinary.com/chat-story/image/upload/v1665128418/automa/chrome_QWxClxFcio_d9pqp8.png)

### Firefox
1. Open firefox and navigate to `about:debugging#/runtime/this-firefox`.
2. Click the "Load Temporary Add-on" button.
3. Browse the `automa/build` directory and select the `manifest.json` file.

![Install in firefox](https://res.cloudinary.com/chat-story/image/upload/v1665128974/automa/firefox_30wkpfGM7N_lihajj.png)

## Contributors
Thanks to everyone who has submitted issues, made suggestions, and generally helped make this a better project.

## Examples after corrections in the current brach:

example script call external:

window.dispatchEvent(new CustomEvent('__automaExecuteWorkflow', {
    detail: { 
        publicId: 'testWork',// Use Workflow public ID
        data: { 
            variables: {
                name: 'John Doe',
                search: 'Hello world'
            }
        } 
    }
}));

Event Get Browser:
moz-extension://754b905a-b14c-44a3-9a3f-443c5d687421/execute.html#/2h-pQ_wB3Eu1uEoIR1RFt?name=value&search=teste

chrome-extension://infppggnoaenmfagbfknfkancpbljcca/execute.html#/0uN3j9AhAEBAL3lkV4JEP?name=John%20Doe&search=Hello%20world

chrome-extension://infppggnoaenmfagbfknfkancpbljcca/execute.html#/0uN3j9AhAEBAL3lkV4JEP?data={"id": "12345","nome": "Test Workflow","desc": "example workflow test."}

moz-extension://330bb592-fb5d-4c58-b452-f950bb6ec936/execute.html#/0Uo31709nrB2qaO8ye6t0?name=maria&search=teste

moz-extension://330bb592-fb5d-4c58-b452-f950bb6ec936/execute.html#/0Uo31709nrB2qaO8ye6t0?data={"id": "12345","nome": "Test Workflow","desc": "example workflow test."}

After execute project: yarn build:firefox  
http://localhost:3001/webhook.html?extension=moz-extension://15d65b92-a555-43d0-a348-8054f891bd29&workflow=20Whme8bZ6xDtWLVCjDC2&search=teste&name=maria

http://localhost:3001/webhook.html?extension=chrome-extension://fkpamfbcldbfodllcnnihjjkgjmekkfh&workflow=c7jL39YT_9zMPQbqbNk0-&search=teste&name=maria

After execute project to Go live Server vscode:

http://127.0.0.1:5500/src/webhook/index.html?extension=chrome-extension://fkpamfbcldbfodllcnnidddfegjmekkfh&workflow=kfg25KNnKddT1_Tf3jnq&produtos=test

http://127.0.0.1:5500/src/webhook/index.html?extension=moz-extension://fdfdfd-a555-43d0-a348-8054f891bd29&workflow=kfg25KNnKdd1_Tf3jnq&produtos=test

## License
Source code in this repository is variously licensed under the GNU Affero General Public License (AGPL), or the [Automa Commercial License](https://www.automa.site/license/commercial/).

See [LICENSE.txt](./LICENSE.txt) for details.
