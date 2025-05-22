// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
// import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
// import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";

library SimpleCounters {
    struct Counter {
        uint256 _value;
    }

    function current(Counter storage counter) internal view returns (uint256) {
        return counter._value;
    }

    function increment(Counter storage counter) internal returns (uint256) {
        counter._value += 1;
        return counter._value;
    }
}

contract IdentityNFT is ERC721URIStorage, Ownable {
    // using Counters for Counters.Counter;
    using SimpleCounters for SimpleCounters.Counter;
    SimpleCounters.Counter private _tokenIds;

    // 신원 검증 상태
    mapping(uint256 => bool) private _verifiedIdentities;

    // 주소와 토큰 ID 매핑
    mapping(address => uint256) private _addressToTokenId;

    // 투표 자격 상태
    mapping(uint256 => bool) private _votingEligibility;

    // 신원 검증을 위한 추가 데이터
    struct IdentityData {
        string name;
        string nationalId; // 주민번호 해시값
        uint256 registrationDate;
    }

    mapping(uint256 => IdentityData) private _identityData;

    event IdentityVerified(uint256 indexed tokenId, address indexed owner);
    event VotingEligibilityChanged(uint256 indexed tokenId, bool eligible);

    constructor() ERC721("Identity Token", "IDT") Ownable(msg.sender) {}

    // 신원 NFT 발행 함수 - 누구나 자신의 신원을 생성할 수 있게 수정
    function mintIdentityToken(
        string memory name,
        string memory nationalId
    ) public returns (uint256) {
        // 자신만 발행 가능하도록 recipient를 msg.sender로 고정
        address recipient = msg.sender;

        // 이미 토큰을 가지고 있으면 발행 불가
        if (_addressToTokenId[recipient] != 0) {
            revert(unicode"이미 신원 토큰을 보유하고 있습니다");
        }

        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();

        _mint(recipient, newTokenId);
        _setTokenURI(newTokenId, "");

        _addressToTokenId[recipient] = newTokenId;

        // 신원 데이터 저장
        _identityData[newTokenId] = IdentityData({
            name: name,
            nationalId: nationalId,
            registrationDate: block.timestamp
        });

        return newTokenId;
    }

    // 관리자용 mint 함수 (필요한 경우) - 다른 주소에 대해 토큰을 발행할 수 있음
    function adminMintIdentityToken(
        address recipient,
        string memory tokenURI,
        string memory name,
        string memory nationalId
    ) public onlyOwner returns (uint256) {
        // 이미 토큰을 가지고 있으면 발행 불가
        if (_addressToTokenId[recipient] != 0) {
            revert(unicode"이미 신원 토큰을 보유하고 있습니다");
        }

        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();

        _mint(recipient, newTokenId);
        _setTokenURI(newTokenId, tokenURI);

        _addressToTokenId[recipient] = newTokenId;

        // 신원 데이터 저장
        _identityData[newTokenId] = IdentityData({
            name: name,
            nationalId: nationalId,
            registrationDate: block.timestamp
        });

        return newTokenId;
    }

    // 신원 검증 함수 (관리자만 호출 가능)
    function verifyIdentity(uint256 tokenId) public onlyOwner {
        require(
            _ownerOf(tokenId) != address(0),
            unicode"존재하지 않는 토큰입니다"
        );
        _verifiedIdentities[tokenId] = true;
        emit IdentityVerified(tokenId, ownerOf(tokenId));
    }

    // 투표 자격 설정 함수 (관리자만 호출 가능)
    function setVotingEligibility(
        uint256 tokenId,
        bool eligible
    ) public onlyOwner {
        require(
            _ownerOf(tokenId) != address(0),
            unicode"존재하지 않는 토큰입니다"
        );
        require(
            _verifiedIdentities[tokenId],
            unicode"검증되지 않은 신원입니다"
        );
        _votingEligibility[tokenId] = eligible;
        emit VotingEligibilityChanged(tokenId, eligible);
    }

    // 검증 상태 확인
    function isVerified(uint256 tokenId) public view returns (bool) {
        require(
            _ownerOf(tokenId) != address(0),
            unicode"존재하지 않는 토큰입니다"
        );
        return _verifiedIdentities[tokenId];
    }

    // 투표 자격 확인
    function isEligibleToVote(uint256 tokenId) public view returns (bool) {
        require(
            _ownerOf(tokenId) != address(0),
            unicode"존재하지 않는 토큰입니다"
        );
        return _verifiedIdentities[tokenId] && _votingEligibility[tokenId];
    }

    // 주소로 토큰 ID 조회
    function getTokenIdByAddress(address owner) public view returns (uint256) {
        return _addressToTokenId[owner];
    }

    // 특정 주소의 투표 자격 확인
    function isAddressEligibleToVote(address voter) public view returns (bool) {
        uint256 tokenId = _addressToTokenId[voter];
        if (tokenId == 0) return false;
        return isEligibleToVote(tokenId);
    }

    // 신원 정보 조회
    function getIdentityData(
        uint256 tokenId
    )
        public
        view
        returns (
            string memory name,
            string memory nationalId,
            uint256 registrationDate,
            bool verified,
            bool eligible
        )
    {
        require(
            _ownerOf(tokenId) != address(0),
            unicode"존재하지 않는 토큰입니다"
        );
        IdentityData memory data = _identityData[tokenId];

        return (
            data.name,
            data.nationalId,
            data.registrationDate,
            _verifiedIdentities[tokenId],
            _votingEligibility[tokenId]
        );
    }
}
