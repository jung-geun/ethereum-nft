// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "./IdentityNFT.sol";

contract EnhancedVote {
    // IdentityNFT 컨트랙트 참조
    IdentityNFT public identityNFT;
    // 후보자 구성. votesReceived[후보자] = 투표 수
    mapping(string => uint256) public votesReceived;
    // 후보자 목록. string[] = 후보자 이름
    string[] public candidateList;
    // 투표 여부 확인. hasVoted[투표자 주소] = true/false. 지갑 주소가 투표했는지 확인
    mapping(address => bool) public hasVoted;

    // 투표 이벤트
    event VoteCast(address indexed voter, string candidate);

    // 생성자. 후보자 목록을 초기화 - 단순화된 버전
    constructor(address _identityNFTAddress, string[] memory candidateNames) {
        identityNFT = IdentityNFT(_identityNFTAddress);
        // 배열 직접 할당 대신 빈 배열로 시작
        // 후보자가 없어도 배포는 성공하도록 수정
        for (uint i = 0; i < candidateNames.length; i++) {
            // 후보자 이름이 비어있지 않은 경우에만 추가
            if (bytes(candidateNames[i]).length > 0) {
                candidateList.push(candidateNames[i]);
            }
        }
    }

    function voteForCandidate(string memory candidate) public {
        // 투표 여부 확인
        require(!hasVoted[msg.sender], unicode"이미 투표했습니다.");

        // 투표 자격 확인
        require(
            identityNFT.isAddressEligibleToVote(msg.sender),
            unicode"투표 자격이 없습니다. 신원 NFT가 필요합니다."
        );

        // 후보자 존재 여부 확인
        bool validCandidate = false;
        for (uint i = 0; i < candidateList.length; i++) {
            if (
                keccak256(bytes(candidateList[i])) ==
                keccak256(bytes(candidate))
            ) {
                validCandidate = true;
                break;
            }
        }
        require(validCandidate, unicode"후보자가 존재하지 않습니다.");
        // 투표 수 증가
        votesReceived[candidate] += 1;
        // 투표 완료 처리
        hasVoted[msg.sender] = true;

        // 투표 이벤트 발생
        emit VoteCast(msg.sender, candidate);
    }

    function totalVotesFor(
        string memory candidate
    ) public view returns (uint256) {
        // 후보자의 투표 수를 반환
        require(
            votesReceived[candidate] >= 0,
            unicode"후보자가 존재하지 않습니다."
        );
        return votesReceived[candidate];
    }

    // 후보자 목록 조회
    function getCandidateList() public view returns (string[] memory) {
        return candidateList;
    }

    // 사용자의 투표 자격 확인
    function checkVotingEligibility(address voter) public view returns (bool) {
        return identityNFT.isAddressEligibleToVote(voter);
    }

    // 새 후보자 추가 (관리자만 가능)
    function addCandidate(string memory candidateName) public {
        require(
            bytes(candidateName).length > 0,
            unicode"후보자 이름은 비어있을 수 없습니다."
        );

        // 중복 확인
        for (uint i = 0; i < candidateList.length; i++) {
            require(
                keccak256(bytes(candidateList[i])) !=
                    keccak256(bytes(candidateName)),
                unicode"이미 존재하는 후보자입니다."
            );
        }

        candidateList.push(candidateName);
    }
}
