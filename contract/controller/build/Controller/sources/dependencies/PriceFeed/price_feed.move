module price_feed::price_feed {
  // Libraries
  use aptos_framework::account::SignerCapability;
  use aptos_framework::aptos_coin::AptosCoin;
  use aptos_framework::coin;
  use aptos_framework::resource_account;
  use aptos_std::math64::pow;
  use aptos_std::table::{Self, Table};

  use std::error;
  use std::signer;

  use pyth::i64;
  use pyth::price;
  use pyth::price_identifier;
  use pyth::pyth;

  // Constants
  const ADMIN_ADDRESS: address = @admin;
  const APTOS_USD_PRICE_FEED_IDENTIFIER: vector<u8> = x"03ae4db29ed4ae33d323568895aa00337e658e348b37509f5372ae51f0af00d5";
  const SUFFIX_USD: u64 = 1000000; // USD Decimal 6

  // Errors
  const ENOT_AUTHORIZED: u64 = 0;
  const ENOT_EXISTED: u64 = 1;
  const EWRONG_TIMESTAMP: u64 = 2;

  // Structs
  struct ModuleData has key {
    signer_cap: SignerCapability,
    records: Table<u64, u64>,
    last_set_price: u64,
    last_set_timestamp: u64,
  }

  fun init_module(resource_signer: &signer) {
    let resource_signer_cap = resource_account::retrieve_resource_account_cap(resource_signer, @admin);
    
    move_to(resource_signer, ModuleData {
      signer_cap: resource_signer_cap,
      records: table::new(),
      last_set_price: 0,
      last_set_timestamp: 0,
    });
  }

  public fun get_price(timestamp: u64): u64 acquires ModuleData {
    let module_data = borrow_global_mut<ModuleData>(@price_feed);
    assert!(table::contains(&module_data.records, timestamp), ENOT_EXISTED);

    let result = table::borrow_mut(&mut module_data.records, timestamp);

    *result
  }

  public entry fun set_price(caller: &signer, pyth_update_data: vector<vector<u8>>, timestamp: u64) acquires ModuleData {
    let caller_address = signer::address_of(caller);
    assert!(caller_address == ADMIN_ADDRESS, error::permission_denied(ENOT_AUTHORIZED));

    let coins = coin::withdraw<AptosCoin>(caller, pyth::get_update_fee(&pyth_update_data));
    pyth::update_price_feeds(pyth_update_data, coins);
    
    let price = pyth::get_price(price_identifier::from_byte_vec(APTOS_USD_PRICE_FEED_IDENTIFIER));

    let price_positive = i64::get_magnitude_if_positive(&price::get_price(&price)); // This will fail if the price is negative
    let expo_magnitude = i64::get_magnitude_if_negative(&price::get_expo(&price)); // This will fail if the exponent is positive'
    let apt_price_in_usd = (price_positive * SUFFIX_USD) / pow(10, expo_magnitude);

    let module_data = borrow_global_mut<ModuleData>(@price_feed);
    if (!table::contains(&module_data.records, timestamp)) {
      table::add(&mut module_data.records, timestamp, apt_price_in_usd);
      module_data.last_set_price = apt_price_in_usd;
      module_data.last_set_timestamp = timestamp;
    }
  }
}