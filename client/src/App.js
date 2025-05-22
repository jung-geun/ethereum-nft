import React, { useState, useEffect } from 'react';
import './App.css';
import IdentityNFTMint from './components/IdentityNFTMint';
import EnhancedVote from './components/EnhancedVote';
import { connectWallet } from './utils/contractUtils'; // getCurrentAccount 제거

function App() {
    const [currentAccount, setCurrentAccount] = useState(null);

    useEffect(() => {
        // 페이지 로드 시 자동 지갑 연결 시도 제거
        // const loadAccount = async () => {
        //     const account = await getCurrentAccount();
        //     setCurrentAccount(account);
        // };
        // loadAccount();

        // Listen for account changes from MetaMask
        if (window.ethereum) {
            window.ethereum.on('accountsChanged', (accounts) => {
                setCurrentAccount(accounts[0] || null);
            });
        }
    }, []);

    const handleConnectWallet = async () => {
        const account = await connectWallet();
        setCurrentAccount(account);
    };

    return (
        <div className="App">
            <header className="App-header">
                <h1>신원 확인 NFT 및 투표 DApp</h1>
                {!currentAccount ? (
                    <button onClick={handleConnectWallet}>지갑 연결</button> // 함수 직접 호출
                ) : (
                    <p>연결된 계정: {currentAccount}</p>
                )}
            </header>
            <main>
                <IdentityNFTMint currentAccount={currentAccount} setCurrentAccount={setCurrentAccount} />
                <EnhancedVote currentAccount={currentAccount} />
            </main>
        </div>
    );
}

export default App;
