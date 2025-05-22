import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { getIdentityNFTContract, getSigner, connectWallet, getConnectedAccountTokenId, getContractOwner } from '../utils/contractUtils';

function IdentityNFTMint({ currentAccount, setCurrentAccount }) {
    const [name, setName] = useState('');
    const [nationalId, setNationalId] = useState('');
    const [mintingStatus, setMintingStatus] = useState('');
    const [isMinted, setIsMinted] = useState(false);
    const [tokenId, setTokenId] = useState(null);
    const [isOwner, setIsOwner] = useState(false);
    const [isVerified, setIsVerified] = useState(false);

    useEffect(() => {
        const checkMintStatus = async () => {
            if (currentAccount) {
                try {
                    const _tokenId = await getConnectedAccountTokenId();
                    if (_tokenId && _tokenId !== "0") { // Assuming tokenId 0 means no NFT
                        setIsMinted(true);
                        setTokenId(_tokenId.toString());
                    } else {
                        setIsMinted(false);
                        setTokenId(null);
                    }
                } catch (error) {
                    console.error("Error checking mint status:", error);
                    setIsMinted(false);
                    setTokenId(null);
                }
            }
        };

        const checkOwnerStatus = async () => {
            if (currentAccount) {
                try {
                    const ownerAddress = await getContractOwner();
                    setIsOwner(currentAccount.toLowerCase() === ownerAddress.toLowerCase());
                } catch (error) {
                    console.error("Error checking owner status:", error);
                    setIsOwner(false);
                }
            } else {
                setIsOwner(false);
            }
        };

        checkMintStatus();
        checkOwnerStatus();
    }, [currentAccount, isVerified]);

    const handleMint = async () => {
        if (!currentAccount) {
            alert("Please connect your wallet first.");
            return;
        }

        if (!name || !nationalId) {
            alert("Please fill in all fields.");
            return;
        }

        setMintingStatus("Minting Identity NFT...");
        try {
            const signer = await getSigner();
            const contract = await getIdentityNFTContract(signer);

            const tx = await contract.mintIdentityToken(name, nationalId);
            await tx.wait(); // Wait for the transaction to be mined

            setMintingStatus(`Minting successful! Transaction hash: ${tx.hash}`);
            setIsMinted(true);
            const _tokenId = await getConnectedAccountTokenId();
            setTokenId(_tokenId.toString());
        } catch (error) {
            console.error("Error minting NFT:", error);
            setMintingStatus(`Minting failed: ${error.message}`);
        }
    };

    const handleVerify = async () => {
        if (!currentAccount) {
            alert("Please connect your wallet first.");
            return;
        }

        try {
            const signer = await getSigner();
            const contract = await getIdentityNFTContract(signer);
            const _tokenId = await getConnectedAccountTokenId();
            const tx = await contract.verifyIdentity(_tokenId);
            await tx.wait();
            setMintingStatus("Identity Verified!");
            setIsVerified(true);
            handleSetVotingEligibility();
        } catch (error) {
            console.error("Error verifying identity:", error);
            setMintingStatus(`Verification failed: ${error.message}`);
        }
    }

    const handleSetVotingEligibility = async () => {
        if (!currentAccount) {
            alert("Please connect your wallet first.");
            return;
        }

        try {
            const signer = await getSigner();
            const contract = await getIdentityNFTContract(signer);
            const _tokenId = await getConnectedAccountTokenId();
            const tx = await contract.setVotingEligibility(_tokenId, true);
            await tx.wait();
            setMintingStatus("Voting Eligibility Set!");
        } catch (error) {
            console.error("Error setting voting eligibility:", error);
            setMintingStatus(`Setting voting eligibility failed: ${error.message}`);
        }
    }

    return (
        <div style={{ border: '1px solid #ccc', padding: '20px', margin: '20px', borderRadius: '8px' }}>
            <h2>사용자 신원 확인 NFT 발행</h2>
            {!currentAccount ? (
                <button onClick={async () => setCurrentAccount(await connectWallet())}>지갑 연결</button>
            ) : (
                <p>연결된 계정: {currentAccount}</p>
            )}

            {isMinted ? (
                <>
                    <p>이미 신원 NFT가 발행되었습니다. (Token ID: {tokenId})</p>
                    {isOwner && isMinted && !isVerified ? (
                        <button onClick={handleVerify}>신원 인증</button>
                    ) : null}
                </>
            ) : (
                <div>
                    <div>
                        <label>이름:</label>
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
                    </div>
                    <div>
                        <label>주민등록번호:</label>
                        <input type="text" value={nationalId} onChange={(e) => setNationalId(e.target.value)} />
                    </div>
                    <button onClick={handleMint}>신원 NFT 발행</button>
                </div>
            )}
            
            <p>{mintingStatus}</p>
        </div>
    );
}

export default IdentityNFTMint;
