import { BigInt } from "@graphprotocol/graph-ts";
import { Account, AccountFactory, Blockchain, Paymaster } from "../generated/schema";
import { AccountDeployed } from "../generated/Core/EntryPoint";

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
