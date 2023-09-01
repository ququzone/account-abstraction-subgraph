import { EmailBinded, EmailUnbinded } from "../generated/Guardian/EmailGuardian"
import { EmailAccount } from "../generated/schema";

export function handleEmailBinded(event: EmailBinded): void {
  const id = event.params.account.toHex() + "-" + event.params.email.toHex();
  let bind = EmailAccount.load(id);
  if (bind == null) {
    bind = new EmailAccount(id);
    bind.account = event.params.account;
    bind.email = event.params.email;
    bind.createdAt = event.block.timestamp;
  }
  bind.enable = true;
  bind.updatedAt = event.block.timestamp;
  bind.save();
}

export function handleEmailUnbinded(event: EmailUnbinded): void {
  const id = event.params.account.toHex() + "-" + event.params.email.toHex();
  let bind = EmailAccount.load(id);
  if (bind == null) {
    bind = new EmailAccount(id);
    bind.account = event.params.account;
    bind.email = event.params.email;
    bind.createdAt = event.block.timestamp;
  }
  bind.enable = false;
  bind.updatedAt = event.block.timestamp;
  bind.save();
}
