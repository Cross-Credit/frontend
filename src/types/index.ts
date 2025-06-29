export interface Chain {
    name: string;
    id: number;
}

export interface Token {
    symbol: string;
    name: string;
}

export interface Portfolio {
    supplied: number;
    borrowed: number;
    netAPY: number;
}

export interface Transaction {
    type: "lend" | "borrow";
    token: string;
    amount: number;
    chain: string;
    date: string;
}

export interface Wallet {
    address: string;
}

export enum PositionType {
  Supplied = 0,
  Borrowed = 1,
} 