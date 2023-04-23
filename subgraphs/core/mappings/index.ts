import { BigInt, log } from "@graphprotocol/graph-ts";
import { Account, AccountFactory, Blockchain, Paymaster, UserOperation } from "../generated/schema";
import { AccountDeployed, UserOperationEvent } from "../generated/Core/EntryPoint";

export function handleAccountDeployed(event: AccountDeployed): void {
  let blockchain = Blockchain.load("ETH");
  if (blockchain == null) {
    blockchain = new Blockchain("ETH");
    blockchain.totalAccount = BigInt.zero();
    blockchain.totalTransactions = BigInt.zero();
    blockchain.save();
  }
  blockchain.totalAccount = blockchain.totalAccount.plus(BigInt.fromI32(1));
  blockchain.save();

  let paymaster = Paymaster.load(event.params.paymaster.toHex());
  if (paymaster == null) {
    paymaster = new Paymaster(event.params.paymaster.toHex());
    paymaster.save();
  }
  let factory = AccountFactory.load(event.params.factory.toHex());
  if (factory == null) {
    factory = new AccountFactory(event.params.factory.toHex());
    factory.totalAccount = BigInt.zero();
    paymaster.save();
  }
  factory.totalAccount = factory.totalAccount.plus(BigInt.fromI32(1));
  factory.save();

  let account = Account.load(event.params.sender.toHex());
  if (account == null) {
    account = new Account(event.params.sender.toHex());

    account.factory = factory.id;
    account.paymaster = paymaster.id;
    account.totalTransactions = BigInt.zero();

    account.block = event.block.number;
    account.createdAt = event.block.timestamp;
    account.updatedAt = event.block.timestamp;
    account.save();
  }
}

export function handleUserOperation(event: UserOperationEvent): void {
  let blockchain = Blockchain.load("ETH");
  if (blockchain == null) {
    blockchain = new Blockchain("ETH");
    blockchain.totalAccount = BigInt.zero();
    blockchain.totalTransactions = BigInt.zero();
    blockchain.save();
  }
  blockchain.totalTransactions = blockchain.totalTransactions.plus(BigInt.fromI32(1));
  blockchain.save();

  let paymaster = Paymaster.load(event.params.paymaster.toHex());
  if (paymaster == null) {
    paymaster = new Paymaster(event.params.paymaster.toHex());
    paymaster.save();
  }
  const account = Account.load(event.params.sender.toHex());
  if (account == null) {
    log.error("Tried to save UserOperation to a non-existing account --- {} - {}", [
      event.params.sender.toHex(),
      event.params.userOpHash.toString(),
    ]);
    return;
  }
  account.totalTransactions = account.totalTransactions.plus(BigInt.fromI32(1));
  account.updatedAt = event.block.timestamp;
  account.save();

  let userOp = UserOperation.load(event.params.userOpHash.toHex());
  if (userOp == null) {
    userOp = new UserOperation(event.params.userOpHash.toHex());

    userOp.bundler = event.transaction.from;
    userOp.paymaster = paymaster.id;
    userOp.sender = account.id;
    userOp.nonce = event.params.nonce;
    userOp.success = event.params.success;
    userOp.actualGasCost = event.params.actualGasCost;
    userOp.actualGasUsed = event.params.actualGasUsed;

    userOp.txHash = event.transaction.hash;
    userOp.createdAt = event.block.timestamp;
    userOp.save();
  } else {
    log.error("Tried to save UserOperation with existing hash --- {} - {}", [
      event.params.sender.toHex(),
      event.params.userOpHash.toString(),
    ]);
  }
}
