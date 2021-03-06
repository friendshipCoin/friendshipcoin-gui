[![FriendshipCoin](https://friendshipcoin.com/assets/img/icon/logo.png)](https://github.com/friendshipCoin/friendshipcoin-website)
<br/><br/>
[![FriendshipCoinWebsite](https://img.shields.io/badge/Website-friendshipcoin.com-eaa809.svg)](https://friendshipcoin.com/)
[![ContributorsWelcome](https://img.shields.io/badge/contributors-welcome-brightgreen.svg)](https://github.com/friendshipCoin/friendshipcoin-website)
[![LICENSE](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Discord](https://img.shields.io/badge/chat-on_discord-7289da.svg)](https://discord.gg/UXR9We)

# FriendshipCoin GUI Wallet
Cross Platform Desktop FSC Wallet built with Electron.  This is alpha software so use at your own risk.  Make sure you back up your FriendshipCoin wallet before running this.

If you have any questions or need assistance please join our [discord](https://discord.gg/UXR9We) and someone will help you.

### Pre-built Downloads
* _Windows_ - https://friendshipcoin.com/download/FriendshipCoinWin64.zip

* _Mac_ - https://friendshipcoin.com/download/FriendshipCoinOSX.dmg


## Prerequisites

You need the following prerequisites to be able to build and develop the project on your local machine.

### Mac / Linux
_NodeJS_: Use NVM to install and manage your NodeJS installation - https://github.com/creationix/nvm
```
curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.11/install.sh | bash
```
or Wget
```
wget -qO- https://raw.githubusercontent.com/creationix/nvm/v0.33.11/install.sh | bash
```
The script clones the nvm repository to ~/.nvm and adds the source line to your profile (~/.bash_profile, ~/.zshrc, ~/.profile, or ~/.bashrc).

```
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" # This loads nvm
```

### Windows
_NodeJS:_
```
Download the windows installer here:
https://nodejs.org/en/download/
```

_Yarn_  (npm alternative)
```
npm install -g yarn
```
The application may work fine with `npm` but `yarn` is recommended.  

### Install Vue-Cli
```
npm install -g vue-cli 
```

### Get the Source
```
git clone https://github.com/friendshipCoin/friendshipcoin-gui.git
```
_CD into the newly created directory_

```
cd friendshipcoin-gui
```
_Install Dependencies_
```
yarn
```

### Get the FriendshipCoin Daemon Binary
*IMPORTANT* - This GUI Wallet is basically a wrapper around the FriendshipCoin RPC so you need the daemon binary in order for this to function.  Go to [FriendshipCoin-Core](https://github.com/friendshipCoin/friendshipcoin-core/releases) and get the release for whichever platform you are running.

Copy the binary into the `static` folder of the project.  If that binary is not in the `static` folder the project will not run correctly.

### Run the application

_Run in development mode_
```
yarn run dev
```

_To Build_

```
yarn run build
```

## Built With
* [Node.js](https://nodejs.org)

* [Electron-vue](https://github.com/SimulatedGREG/electron-vue)

* [Vue.js](https://vuejs.org/)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details
