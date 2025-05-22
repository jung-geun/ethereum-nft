const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    console.log("배포자 주소:", deployer.address);

    try {
        // 1. IdentityNFT 배포
        const IdentityNFT = await hre.ethers.getContractFactory("IdentityNFT");
        const identityNFT = await IdentityNFT.deploy();

        console.log("IdentityNFT 배포 중...");

        // 컨트랙트 주소 가져오기 (버전 호환성)
        let identityNFTAddress;
        try {
            identityNFTAddress = await identityNFT.getAddress();
        } catch (e) {
            identityNFTAddress = identityNFT.address;
        }

        console.log("IdentityNFT 배포 주소:", identityNFTAddress);

        // 2. EnhancedVote 배포 (초기 후보자 목록 포함)
        const initialCandidates = ["홍길동", "김영희", "이철수"];
        const EnhancedVote = await hre.ethers.getContractFactory("EnhancedVote");
        const enhancedVote = await EnhancedVote.deploy(identityNFTAddress, initialCandidates);

        console.log("EnhancedVote 배포 중...");

        // 컨트랙트 주소 가져오기 (버전 호환성)
        let enhancedVoteAddress;
        try {
            enhancedVoteAddress = await enhancedVote.getAddress();
        } catch (e) {
            enhancedVoteAddress = enhancedVote.address;
        }

        console.log("EnhancedVote 배포 주소:", enhancedVoteAddress);

        console.log("배포 완료!");

        // 초기 설정 예시 (새로운 함수 시그니처 사용)
        console.log("첫 번째 계정에 신원 NFT 발행 중...");

        // 두 가지 방법 중 선택
        // 1. 새로운 방식: 일반 사용자로서 자신의 신원 발행
        const tx1 = await identityNFT.mintIdentityToken(
            // "ipfs://QmExample",
            "관리자",
            "000000"
        );
        console.log("사용자 발행 트랜잭션:", tx1.hash);

        // 2. 관리자 방식: 다른 주소에 신원 발행 (두 번째 계정에 발행)
        const accounts = await hre.ethers.getSigners();
        if (accounts.length > 1) {
            const tx2 = await identityNFT.adminMintIdentityToken(
                accounts[1].address,
                "ipfs://QmExample2",
                "사용자1",
                "111111"
            );
            console.log("관리자 발행 트랜잭션:", tx2.hash);
        }

        console.log("배포 및 초기 설정 완료!");

    } catch (error) {
        console.error("배포 중 오류 발생:", error);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("스크립트 실행 중 오류 발생:", error);
        process.exit(1);
    });