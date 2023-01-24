import { toHex, bsv } from "scryptlib";

// store all utxos related to the contract
export const ContractUtxos = {
  add: (rawTx: string, outputIndex = 0) => {
    const tx = new bsv.Transaction(rawTx);
    const utxos = ContractUtxos.get();
    const utxo = {
      utxo: {
        txId: tx.id,
        outputIndex: outputIndex,
        satoshis: tx.outputs[outputIndex].satoshis,
        script: tx.outputs[outputIndex].script.toHex(),
      },
      rawTx: rawTx,
    };
    utxos.push(utxo);
    ContractUtxos.set(utxos);

    return utxo;
  },
  get: () => {
    const utxosStr = localStorage[`utxos`];
    return utxosStr ? JSON.parse(utxosStr) : [];
  },
  set: (utxos: string) => {
    localStorage.setItem(`utxos`, JSON.stringify(utxos));
  },
  clear: () => {
    localStorage.setItem(`utxos`, JSON.stringify([]));
  },
  getlast: () => {
    const utxos = ContractUtxos.get();
    return utxos[utxos.length - 1];
  },

  getdeploy: () => {
    const utxos = ContractUtxos.get();
    return utxos[0];
  },
};

// store private key of players
export const PlayerPrivkey = {
  get: (player: string) => {
    return localStorage.getItem(player);
  },
  set: (player: string, key: string) => {
    localStorage.setItem(player, key);
  },
};

export const Player = {
  Alice: "alice",
  Bob: "bob",
};

export const CurrentPlayer = {
  get: () => {
    return localStorage[`player`] || Player.Alice;
  },
  set: (player: string) => {
    localStorage.setItem(`player`, player);
  },
};
