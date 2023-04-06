import "./App.css";

import { useEffect, useState } from "react";
import * as web3 from "@solana/web3.js";

function App() {
  const [provider, setProvider] = useState(null);
  const [walletKey, setWalletKey] = useState(null);
  const [account, setAccount] = useState(null);
  const [newKeypair, setNewKeypair] = useState({});
  const [generateBtnEnable, setGenerateBtnEnable] = useState(false);
  const [transferBtnEnable, setTransferBtnEnable] = useState(false);

  const generateKeypair = async () => {
    try {
      setGenerateBtnEnable(true);
      const newKeypair = web3.Keypair.generate();
      const publicKey = newKeypair.publicKey;
      // Connect to the Devnet and make a wallet from privateKey
      const connection = new web3.Connection(
        web3.clusterApiUrl("devnet"),
        "confirmed"
      );

      // Request airdrop of 2 SOL to the wallet
      console.log("Airdropping some SOL to new keypair wallet!");
      const fromAirDropSignature = await connection.requestAirdrop(
        publicKey,
        3 * web3.LAMPORTS_PER_SOL
      );
      await connection.confirmTransaction(fromAirDropSignature);
      const balance = await connection.getBalance(
        new web3.PublicKey(publicKey)
      );
      setNewKeypair(newKeypair);
      setAccount(publicKey.toString());
      console.log(`${publicKey}:  ${balance / web3.LAMPORTS_PER_SOL} SOL`);
      alert(
        `Airdropped the ${balance / web3.LAMPORTS_PER_SOL} SOL successfully`
      );
      setGenerateBtnEnable(false);
    } catch (error) {
      setGenerateBtnEnable(false);
      console.error(error);
    }
  };

  const getProvider = () => {
    if ("solana" in window) {
      const provider = window.solana;
      if (provider.isPhantom) {
        return provider;
      }
    }
  };

  useEffect(() => {
    const provider = getProvider();

    // if the phantom provider exists, set this as the provider
    if (provider) setProvider(provider);
    else setProvider(undefined);
  }, []);

  const connectWallet = async () => {
    const provider = getProvider();
    if (provider) {
      try {
        const response = await provider.connect();
        const pubKey = await provider.publicKey;
        console.log(pubKey);
        setProvider(provider);
        setWalletKey(response.publicKey.toString());
      } catch (err) {
        console.log(err.message);
      }
    }
  };

  async function transferSOL() {
    setTransferBtnEnable(true);
    //Changes are only here, in the beginning
    const phantomProvider = provider;
    if (!phantomProvider) {
      console.log("No provider found", phantomProvider);
    }
    const pubKey = await phantomProvider.publicKey;
    console.log("Public Key: ", pubKey);

    // Establishing connection
    const connection = new web3.Connection(
      web3.clusterApiUrl("devnet"),
      "confirmed"
    );
    const senderWallet = new web3.PublicKey(account);
    const senderBalance = await connection.getBalance(senderWallet);
    if (senderBalance < 2 * web3.LAMPORTS_PER_SOL) {
      alert("Insufficient Balance");
      setTransferBtnEnable(false);
      return;
    }

    console.log("Sign the Transaction");
    let transaction = new web3.Transaction().add(
      web3.SystemProgram.transfer({
        fromPubkey: senderWallet,
        toPubkey: pubKey,
        lamports: 2 * web3.LAMPORTS_PER_SOL
      })
    );
    transaction.feePayer = senderWallet;

    let blockhashObj = await connection.getRecentBlockhash();
    transaction.recentBlockhash = blockhashObj.blockhash;

    console.log("provider", phantomProvider);

    try {
      console.log("Transaction triggered");
      const signature = await web3.sendAndConfirmTransaction(
        connection,
        transaction,
        [newKeypair]
      );
      // Alert the user that the transfer was successful
      alert(`Transfer successful with signature: ${signature}`);
      console.log("Signature: ", signature);
    } catch (err) {
      console.log("err", err);
    }
    setTransferBtnEnable(false);
  }

  return (
    <div className="App">
      <header className="App-header">
        <div>
          {!walletKey && provider && (
            <button onClick={connectWallet}>Connect Wallet</button>
          )}
          {provider && walletKey && <p>Connected account {walletKey}</p>}

          {!provider && (
            <p>
              No provider found. Install{" "}
              <a href="https://phantom.app/">Phantom Browser extension</a>
            </p>
          )}
        </div>
        <div>
          {!account && (
            <button onClick={generateKeypair} disabled={generateBtnEnable}>
              Create a new Solana account
            </button>
          )}
          {account && <div>New Account: {account}</div>}
        </div>
        <div>
          <button onClick={transferSOL} disabled={transferBtnEnable}>
            Transfer to wallet
          </button>
        </div>
      </header>
    </div>
  );
}

export default App;
