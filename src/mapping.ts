import { BigInt } from "@graphprotocol/graph-ts"
import {
  Contract,
  FactoryAdded,
  FactoryRemoved,
  MinterAdded,
  MinterRemoved,
  OwnershipTransferred,
  SRC20Registered,
  SRC20Removed,
  SRC20StakeDecreased,
  SRC20StakeIncreased,
  SRC20SupplyDecreased,
  SRC20SupplyIncreased,
  SRC20SupplyMinted
} from "../generated/Contract/Contract"
import { ExampleEntity } from "../generated/schema"

export function handleFactoryAdded(event: FactoryAdded): void {
  // Entities can be loaded from the store using a string ID; this ID
  // needs to be unique across all entities of the same type
  let entity = ExampleEntity.load(event.transaction.from.toHex())

  // Entities only exist after they have been saved to the store;
  // `null` checks allow to create entities on demand
  if (entity == null) {
    entity = new ExampleEntity(event.transaction.from.toHex())

    // Entity fields can be set using simple assignments
    entity.count = BigInt.fromI32(0)
  }

  // BigInt and BigDecimal math are supported
  entity.count = entity.count + BigInt.fromI32(1)

  // Entity fields can be set based on event parameters
  entity.account = event.params.account

  // Entities can be written to the store with `.save()`
  entity.save()

  // Note: If a handler doesn't require existing field values, it is faster
  // _not_ to load the entity from the store. Instead, create it fresh with
  // `new Entity(...)`, set the fields that should be updated and save the
  // entity back to the store. Fields that were not set or unset remain
  // unchanged, allowing for partial updates to be applied.

  // It is also possible to access smart contracts from mappings. For
  // example, the contract that has emitted the event can be connected to
  // with:
  //
  // let contract = Contract.bind(event.address)
  //
  // The following functions can then be called on this contract to access
  // state variables and other data:
  //
  // - contract.addFactory(...)
  // - contract.addMinter(...)
  // - contract.calcTokens(...)
  // - contract.contains(...)
  // - contract.decreaseSupply(...)
  // - contract.getMinter(...)
  // - contract.getSrc20toSwmRatio(...)
  // - contract.getStake(...)
  // - contract.getTokenOwner(...)
  // - contract.increaseSupply(...)
  // - contract.isOwner(...)
  // - contract.mintSupply(...)
  // - contract.owner(...)
  // - contract.put(...)
  // - contract.remove(...)
  // - contract.removeFactory(...)
  // - contract.removeMinter(...)
  // - contract.renounceManagement(...)
  // - contract.swmNeeded(...)
  // - contract.transferManagement(...)
}

export function handleFactoryRemoved(event: FactoryRemoved): void {}

export function handleMinterAdded(event: MinterAdded): void {}

export function handleMinterRemoved(event: MinterRemoved): void {}

export function handleOwnershipTransferred(event: OwnershipTransferred): void {}

export function handleSRC20Registered(event: SRC20Registered): void {}

export function handleSRC20Removed(event: SRC20Removed): void {}

export function handleSRC20StakeDecreased(event: SRC20StakeDecreased): void {}

export function handleSRC20StakeIncreased(event: SRC20StakeIncreased): void {}

export function handleSRC20SupplyDecreased(event: SRC20SupplyDecreased): void {}

export function handleSRC20SupplyIncreased(event: SRC20SupplyIncreased): void {}

export function handleSRC20SupplyMinted(event: SRC20SupplyMinted): void {}
