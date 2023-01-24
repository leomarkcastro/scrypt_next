import { buildContractClass, ScryptType, bsv } from "scryptlib";
import { UTXO, wallet, SignType } from "./wallet";
import axios from "axios";
import { AbstractContract } from "scryptlib/dist/contract";
const WEB3_VERSION = "0.0.2";

export class web3 {
  static wallet: wallet;

  static setWallet(wallet: wallet) {
    web3.wallet = wallet;
  }

  static version() {
    return WEB3_VERSION;
  }

  static loadContract(url: string): Promise<{
    contractClass: typeof AbstractContract;
    // types: Record<string, typeof ScryptType>;
  }> {
    return axios
      .get(url, {
        timeout: 10000,
      })
      .then((res) => {
        const contractClass = buildContractClass(res.data);
        return {
          contractClass: contractClass,
          // types: buildTypeClasses(contractClass),
        };
      });
  }

  static async getChangeAddress(): Promise<string> {
    return web3.wallet.getRawChangeAddress();
  }

  static async sendRawTx(rawTx: string): Promise<string> {
    return web3.wallet.sendRawTransaction(rawTx);
  }

  static async deploy(
    contract: AbstractContract,
    amountInContract: number
  ): Promise<string> {
    const wallet = web3.wallet;

    const changeAddress = await web3.wallet.getRawChangeAddress();

    return wallet
      .listUnspent(amountInContract, {
        purpose: "tic-tac-toe",
      })
      .then((utxos: UTXO[]) => {
        if (utxos.length === 0) {
          throw new Error("no utxo available");
        }
        const tx = new bsv.Transaction();
        tx.from([utxos[0]])
          .addOutput(
            new bsv.Transaction.Output({
              script: contract.lockingScript,
              satoshis: amountInContract,
            })
          )
          .change(changeAddress);

        return wallet.signRawTransaction(
          tx.toString(),
          utxos[0].script,
          utxos[0].satoshis,
          0,
          SignType.ALL
        );
      })
      .then(async (rawTx: string) => {
        await web3.sendRawTx(rawTx);
        return rawTx;
      });
  }

  static async call(
    contractUtxo: UTXO,
    cbBuildTx: (tx: bsv.Transaction) => void
  ): Promise<string> {
    const wallet = web3.wallet;
    const tx = new bsv.Transaction();
    tx.addInput(
      new bsv.Transaction.Input({
        prevTxId: contractUtxo.txId,
        outputIndex: contractUtxo.outputIndex,
        script: new bsv.Script(), // placeholder
        output: new bsv.Transaction.Output({
          script: contractUtxo.script,
          satoshis: contractUtxo.satoshis,
        }),
      })
    );

    cbBuildTx(tx);

    const rawTx = tx.toString();
    await web3.sendRawTx(rawTx);
    return rawTx;
  }
}
