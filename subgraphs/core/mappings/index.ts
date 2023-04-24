import { BigInt, log } from "@graphprotocol/graph-ts";
import { Account, AccountFactory, Blockchain, Bundler, Paymaster, UserOperation } from "../generated/schema";
import { AccountDeployed, UserOperationEvent } from "../generated/Core/EntryPoint";

export function handleAccountDeployed(event: AccountDeployed): void {
  let blockchain = Blockchain.load("ETH");
  if (blockchain == null) {
    blockchain = new Blockchain("ETH");
    blockchain.totalAccount = BigInt.zero();
    blockchain.totalOperations = BigInt.zero();
  }
  blockchain.totalAccount = blockchain.totalAccount.plus(BigInt.fromI32(1));
  blockchain.save();

  let paymaster = Paymaster.load(event.params.paymaster.toHex());
  if (paymaster == null) {
    paymaster = new Paymaster(event.params.paymaster.toHex());
    paymaster.totalOperations = BigInt.zero();
    paymaster.createdAt = event.block.timestamp;
    paymaster.updatedAt = event.block.timestamp;
    paymaster.save();
  }
  let factory = AccountFactory.load(event.params.factory.toHex());
  if (factory == null) {
    factory = new AccountFactory(event.params.factory.toHex());
    factory.totalAccount = BigInt.zero();
  }
  factory.totalAccount = factory.totalAccount.plus(BigInt.fromI32(1));
  factory.save();

  let account = Account.load(event.params.sender.toHex());
  if (account == null) {
    account = new Account(event.params.sender.toHex());

    account.factory = factory.id;
    account.paymaster = paymaster.id;
    account.totalOperations = BigInt.zero();

    account.block = event.block.number;
    account.createdAt = event.block.timestamp;
  }
  account.factory = factory.id;
  account.updatedAt = event.block.timestamp;
  account.save();
}

export function handleUserOperation(event: UserOperationEvent): void {
  let blockchain = Blockchain.load("ETH");
  if (blockchain == null) {
    blockchain = new Blockchain("ETH");
    blockchain.totalAccount = BigInt.zero();
    blockchain.totalOperations = BigInt.zero();
  }
  blockchain.totalOperations = blockchain.totalOperations.plus(BigInt.fromI32(1));
  blockchain.save();

  let paymaster = Paymaster.load(event.params.paymaster.toHex());
  if (paymaster == null) {
    paymaster = new Paymaster(event.params.paymaster.toHex());
    paymaster.totalOperations = BigInt.zero();
    paymaster.createdAt = event.block.timestamp;
  }
  paymaster.totalOperations = paymaster.totalOperations.plus(BigInt.fromI32(1));
  paymaster.updatedAt = event.block.timestamp;
  paymaster.save();

  let bundler = Bundler.load(event.transaction.from.toHex());
  if (bundler == null) {
    bundler = new Bundler(event.transaction.from.toHex());
    bundler.totalOperations = BigInt.zero();
    bundler.createdAt = event.block.timestamp;
  }
  bundler.totalOperations = bundler.totalOperations.plus(BigInt.fromI32(1));
  bundler.updatedAt = event.block.timestamp;
  bundler.save();

  let account = Account.load(event.params.sender.toHex());
  if (account == null) {
    log.info("Tried to save UserOperation to a non-existing account --- {} - {} - {}", [
      event.transaction.hash.toHex(),
      event.params.userOpHash.toHex(),
      event.params.sender.toHex(),
    ]);
    account = new Account(event.params.sender.toHex());

    account.paymaster = paymaster.id;
    account.totalOperations = BigInt.zero();

    account.block = event.block.number;
    account.createdAt = event.block.timestamp;
  }
  account.totalOperations = account.totalOperations.plus(BigInt.fromI32(1));
  account.updatedAt = event.block.timestamp;
  account.save();

  let userOp = UserOperation.load(event.params.userOpHash.toHex());
  if (userOp == null) {
    userOp = new UserOperation(event.params.userOpHash.toHex());

    userOp.bundler = bundler.id;
    userOp.paymaster = paymaster.id;
    userOp.sender = account.id;
    userOp.nonce = event.params.nonce;
    userOp.success = event.params.success;
    userOp.actualGasCost = event.params.actualGasCost;
    userOp.actualGasUsed = event.params.actualGasUsed;

    userOp.block = event.block.number;
    userOp.txHash = event.transaction.hash;
    userOp.createdAt = event.block.timestamp;
    userOp.save();
  } else {
    log.error("Tried to save UserOperation with existing hash --- {} - {} - {}", [
      event.transaction.hash.toHex(),
      event.params.userOpHash.toHex(),
      event.params.sender.toHex(),
    ]);
  }
}
