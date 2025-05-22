const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    console.log("배포자 주소:", deployer.address);

    // 1. IdentityNFT 배포
    const IdentityNFT = await hre.ethers.getContractFactory("IdentityNFT");
    const identityNFT = await IdentityNFT.deploy();
    await identityNFT.deployed();
    console.log("IdentityNFT 배포 주소:", identityNFT.address);

    // 2. EnhancedVote 배포 (초기 후보자 목록 포함)
    const initialCandidates = ["홍길동", "김영희", "이철수"];
    const EnhancedVote = await hre.ethers.getContractFactory("EnhancedVote");
    const enhancedVote = await EnhancedVote.deploy(identityNFT.address, initialCandidates);
    await enhancedVote.deployed();
    console.log("EnhancedVote 배포 주소:", enhancedVote.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });