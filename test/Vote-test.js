const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("신원 NFT 투표 시스템", function () {
  let identityNFT, enhancedVote;
  let owner, voter1, voter2, voter3;

  const initialCandidates = ["홍길동", "김영희", "이철수"];

  beforeEach(async function () {
    // 컨트랙트 배포
    [owner, voter1, voter2, voter3] = await ethers.getSigners();

    // IdentityNFT 배포
    const IdentityNFTFactory = await ethers.getContractFactory("IdentityNFT");
    identityNFT = await IdentityNFTFactory.deploy();

    // 배포 확인
    console.log("IdentityNFT 배포 완료:", identityNFT.address || await identityNFT.getAddress());

    // EnhancedVote 배포
    const EnhancedVoteFactory = await ethers.getContractFactory("EnhancedVote");

    // Hardhat 버전 호환성을 위한 분기
    let identityNFTAddress;
    try {
      // 신버전
      identityNFTAddress = await identityNFT.getAddress();
    } catch (e) {
      // 구버전
      identityNFTAddress = identityNFT.address;
    }

    enhancedVote = await EnhancedVoteFactory.deploy(identityNFTAddress, initialCandidates);
    console.log("EnhancedVote 배포 완료:", enhancedVote.address || await enhancedVote.getAddress());
  });

  it("신원 NFT 발행 및 검증 테스트", async function () {
    try {
      // voter1에게 신원 NFT 발행
      const tx = await identityNFT.mintIdentityToken(
        "김유권자",
        "12345678"
      );
      await tx.wait(); // 트랜잭션이 완료될 때까지 대기

      const tokenId = await identityNFT.getTokenIdByAddress(owner.address);
      expect(tokenId).to.equal(1);

      // 신원 검증
      await identityNFT.verifyIdentity(tokenId);
      expect(await identityNFT.isVerified(tokenId)).to.equal(true);

      // 투표 자격 부여
      await identityNFT.setVotingEligibility(tokenId, true);
      expect(await identityNFT.isEligibleToVote(tokenId)).to.equal(true);
    } catch (error) {
      console.error("에러 발생:", error);
      throw error;
    }
  });

  it("투표 테스트", async function () {
    // voter1에게 신원 NFT 발행 및 검증
    const tx = await identityNFT.connect(voter1).mintIdentityToken(
      "김유권자",
      "12345678"
    );
    await tx.wait();

    const voter1TokenId = await identityNFT.getTokenIdByAddress(voter1.address);
    await identityNFT.verifyIdentity(voter1TokenId);
    await identityNFT.setVotingEligibility(voter1TokenId, true);

    // 투표 전 상태 확인
    expect(await enhancedVote.totalVotesFor("홍길동")).to.equal(0);

    // voter1이 투표
    await enhancedVote.connect(voter1).voteForCandidate("홍길동");

    // 투표 후 상태 확인
    expect(await enhancedVote.totalVotesFor("홍길동")).to.equal(1);
    expect(await enhancedVote.hasVoted(voter1.address)).to.equal(true);
  });

  it("신원 NFT 없이 투표 시도 시 실패", async function () {
    // voter2는 신원 NFT가 없음
    await expect(
      enhancedVote.connect(voter2).voteForCandidate("홍길동")
    ).to.be.revertedWith("투표 자격이 없습니다. 신원 NFT가 필요합니다.");
  });

  it("중복 투표 시도 시 실패", async function () {
    // voter1에게 신원 NFT 발행 및 검증
    const tx = await identityNFT.connect(voter1).mintIdentityToken(
      "김유권자",
      "12345678"
    );
    await tx.wait();

    const voter1TokenId = await identityNFT.getTokenIdByAddress(voter1.address);
    await identityNFT.verifyIdentity(voter1TokenId);
    await identityNFT.setVotingEligibility(voter1TokenId, true);

    // 첫 번째 투표
    await enhancedVote.connect(voter1).voteForCandidate("홍길동");

    // 두 번째 투표 시도 (실패해야 함)
    await expect(
      enhancedVote.connect(voter1).voteForCandidate("김영희")
    ).to.be.revertedWith("이미 투표했습니다.");
  });
});
