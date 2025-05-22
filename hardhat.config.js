require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-ethers");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28",
  networks: {
    ganache: {
      url: "http://127.0.0.1:7545",
      chainId: 1337,
      accounts: [
        "0x59c01f6e2e08171fbd00cf1f4c84bb6749da05a288033ff7296f3e39e9b323a0",
        "0xe37f6c662015dba11d1afa5b51ee70be080bb987c74d7ce9f4ba6a2926634998"
      ]
    }
  }
};
