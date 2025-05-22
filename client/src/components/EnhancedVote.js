import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { getEnhancedVoteContract, getIdentityNFTContract, getSigner } from '../utils/contractUtils';

function EnhancedVote({ currentAccount }) {
    const [candidates, setCandidates] = useState([]);
    const [selectedCandidate, setSelectedCandidate] = useState('');
    const [voteStatus, setVoteStatus] = useState('');
    const [hasVoted, setHasVoted] = useState(false);
    const [isEligible, setIsEligible] = useState(false);
    const [voteCounts, setVoteCounts] = useState({});

    useEffect(() => {
        const fetchVotingData = async () => {
            if (!currentAccount) return;

            try {
                const enhancedVoteContract = await getEnhancedVoteContract();
                const identityNFTContract = await getIdentityNFTContract();

                // 투표 자격 확인
                const eligible = await identityNFTContract.isAddressEligibleToVote(currentAccount);
                setIsEligible(eligible);

                // 투표 여부 확인
                const voted = await enhancedVoteContract.hasVoted(currentAccount);
                setHasVoted(voted);

                // 후보자 목록 가져오기
                const candidateList = await enhancedVoteContract.getCandidateList();
                setCandidates(candidateList);

                // 각 후보자의 득표수 가져오기
                const counts = {};
                for (const candidate of candidateList) {
                    const votes = await enhancedVoteContract.totalVotesFor(candidate);
                    counts[candidate] = votes.toString();
                }
                setVoteCounts(counts);

            } catch (error) {
                console.error("Error fetching voting data:", error);
                setVoteStatus(`Error: ${error.message}`);
            }
        };

        fetchVotingData();

        // Optional: Refresh data periodically or on event
        const interval = setInterval(fetchVotingData, 5000); // Refresh every 5 seconds
        return () => clearInterval(interval);
    }, [currentAccount]);

    const handleVote = async () => {
        if (!currentAccount) {
            alert("Please connect your wallet first.");
            return;
        }
        if (!selectedCandidate) {
            alert("Please select a candidate.");
            return;
        }
        if (!isEligible) {
            alert("You are not eligible to vote. Please mint and verify your Identity NFT.");
            return;
        }
        if (hasVoted) {
            alert("You have already voted.");
            return;
        }

        setVoteStatus(`Voting for ${selectedCandidate}...`);
        try {
            const signer = await getSigner();
            const contract = await getEnhancedVoteContract(signer);

            const tx = await contract.voteForCandidate(selectedCandidate);
            await tx.wait();

            setVoteStatus(`Vote successful for ${selectedCandidate}! Transaction hash: ${tx.hash}`);
            setHasVoted(true);
            // Refresh vote counts
            const updatedCounts = { ...voteCounts };
            updatedCounts[selectedCandidate] = (parseInt(updatedCounts[selectedCandidate] || 0) + 1).toString();
            setVoteCounts(updatedCounts);

        } catch (error) {
            console.error("Error casting vote:", error);
            setVoteStatus(`Voting failed: ${error.message}`);
        }
    };

    return (
        <div style={{ border: '1px solid #ccc', padding: '20px', margin: '20px', borderRadius: '8px' }}>
            <h2>투표</h2>
            {currentAccount ? (
                <>
                    <p>연결된 계정: {currentAccount}</p>
                    <p>투표 자격: {isEligible ? '있음' : '없음 (신원 NFT 발행 및 인증 필요)'}</p>
                    <p>투표 여부: {hasVoted ? '이미 투표함' : '아직 투표하지 않음'}</p>

                    {isEligible && !hasVoted ? (
                        <div>
                            <h3>후보자 목록:</h3>
                            <select onChange={(e) => setSelectedCandidate(e.target.value)} value={selectedCandidate}>
                                <option value="">후보자를 선택하세요</option>
                                {candidates.map((candidate, index) => (
                                    <option key={index} value={candidate}>{candidate}</option>
                                ))}
                            </select>
                            <button onClick={handleVote}>투표하기</button>
                        </div>
                    ) : (
                        <p>{isEligible ? "이미 투표하셨습니다." : "투표 자격이 없습니다."}</p>
                    )}

                    <h3>현재 득표수:</h3>
                    <ul>
                        {candidates.map((candidate, index) => (
                            <li key={index}>{candidate}: {voteCounts[candidate] || 0} 표</li>
                        ))}
                    </ul>
                </>
            ) : (
                <p>지갑을 연결하여 투표 정보를 확인하세요.</p>
            )}
            <p>{voteStatus}</p>
        </div>
    );
}

export default EnhancedVote;
