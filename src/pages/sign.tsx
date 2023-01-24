import { SensiletWallet, web3 } from "@/lib/sensilet";
import { bsv, getPreimage, Int } from "scryptlib";
import { useEffect, useState } from "react";

import { ContractUtxos } from "@/lib/sensilet/storage";

export default function Home() {
  const [states, updateStates] = useState<{
    contract: any;
    isConnected: boolean;
  }>({
    contract: null,
    isConnected: false,
  });

  const [counter, updateCounter] = useState(0);
  const [btc, setBtc] = useState(0);
  const [lastUTXO, setLastUTXO] = useState<string | null>(null);

  async function loadWallet() {
    // @ts-ignore
    const client = new SensiletWallet();

    return client;
  }

  async function loadContract() {
    let { contractClass: CounterClass } = await web3.loadContract(
      "/contracts/counter_debug_desc.json"
    );

    return new CounterClass(Int(0));
  }

  async function loadweb3() {
    // load wallet
    let wallet = await loadWallet();
    web3.setWallet(wallet);

    // check if wallet is conencted
    const isConnected = await web3.wallet.isConnected();

    if (!isConnected) {
      await wallet.requestAccount("", [""]);
    }
    const n = await wallet.getNetwork();
    web3.setWallet(new SensiletWallet(n));

    // console.log(await wallet.getPublicKey());

    // load contract data from json
    let contract = await loadContract();

    updateStates({
      contract,
      isConnected,
    });
  }

  async function startCounter() {
    if (web3.wallet && states.contract) {
      await ContractUtxos.clear();

      let rawTx: string;
      try {
        rawTx = await web3.deploy(states.contract, 1000);
      } catch (err) {
        console.log(err);
        return;
      }

      // console.log(rawTx);

      const utxo = await ContractUtxos.add(rawTx);
      updateCounter(0);
      setBtc(utxo.utxo.satoshis);
      setLastUTXO(utxo.utxo.txId);
    }
  }

  async function incrementCounter() {
    const contractUtxo = await ContractUtxos.getlast().utxo;

    await web3
      .call(contractUtxo, async (tx) => {
        console.log("tx", tx);
        // next counter value
        const curCounter = counter;
        // add bigint with 1

        const nextCounterState = {
          counter: Int(curCounter) + Int(1),
        };
        console.log("nextCounterState", nextCounterState);

        const newLockingScript =
          states.contract.getNewStateScript(nextCounterState);

        tx.setOutput(0, (tx) => {
          const amount = contractUtxo.satoshis - tx.getEstimateFee();

          return new bsv.Transaction.Output({
            script: newLockingScript,
            satoshis: amount,
          });
        });

        await tx.setInputScriptAsync(0, async (tx, output) => {
          const preimage = getPreimage(tx, output.script, output.satoshis);
          // const privateKey = bsv.PrivateKey.fromWIF(
          //   PlayerPrivkey.get(CurrentPlayer.get() as string) as string
          // );
          // const sig = signTx(tx, privateKey, output.script, output.satoshis);

          // const privateKey = bsv.PrivateKey.fromWIF(
          //   "cNY9yYHscPYysJzNY2ZFjUvhwaUqz51YN2jKYTFo8qpZtyJd2k97"
          // );
          // const sig = signTx(tx, privateKey, output.script, output.satoshis);
          // console.log("sig", sig);

          const sig2 = await web3.signSignature(
            tx.toString(),
            contractUtxo.script,
            contractUtxo.satoshis
          );
          console.log("sig2", sig2);

          // console.log("sig === sig2", sig === sig2);

          const amount = contractUtxo.satoshis - tx.getEstimateFee();

          if (amount < 1) {
            alert("Not enough funds.");
            throw new Error("Not enough funds.");
          }

          return states.contract.increment_num(preimage, amount).toScript();
        });
      })
      .then((rawTx) => {
        const utxo = ContractUtxos.add(rawTx);
        console.log(utxo);
        updateCounter(counter + 1);
        setBtc(utxo.utxo.satoshis);
        setLastUTXO(utxo.utxo.txId);
      })
      .catch((e) => {
        console.error("call contract fail", e);
      });
  }

  useEffect(() => {
    const timer = setTimeout(loadweb3, 100);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  return (
    <>
      <main className="container">
        <h1>Sensilet Test</h1>
        <a href="#" role="button" onClick={() => startCounter()}>
          Start Counter
        </a>
        <a href="#" role="button" onClick={() => incrementCounter()}>
          Increment Counter
        </a>
        <p>Last UTXO: {lastUTXO}</p>
        <p>Current Counter Value: {counter}</p>
        <p>Remaining Satoshi (or fuel): {btc}</p>
      </main>
    </>
  );
}
