module collection::collection {
  use std::error;
  use std::signer;
  use std::string::{Self, String};

  use aptos_framework::account::{Self, SignerCapability};
  use aptos_framework::bcs;
  use aptos_framework::resource_account;

  use aptos_token::token::{Self, TokenDataId, TokenId};

  // Constants
  const ADMIN_ADDRESS: address = @admin;
  const COLLECTION_NAME: vector<u8> = b"Options Factory";
  const BURNABLE_BY_OWNER: vector<u8> = b"TOKEN_BURNABLE_BY_OWNER";

  // Errors
  const ENOT_AUTHORIZED: u64 = 0;

  // Structs
  struct ModuleData has key {
    signer_cap: SignerCapability,
    controller: address,
  }

  // Functions
  fun init_module(resource_signer: &signer) {
    let collection_name = string::utf8(COLLECTION_NAME);
    let collection_description = string::utf8(b"Options Factory NFT is a European Vanilla Option that is the basis of options trading in Aptos. NFTs can be classified into four types. The green color represents the Long Position, and the red color represents the Short Position. Also, you can distinguish Call Option and Put Option through the text below.");
    let collection_uri = string::utf8(b"https://aptos-options-issuance.s3.ap-northeast-2.amazonaws.com/favicon.png");
    let collection_maximum = 0;
    let mutate_setting = vector<bool>[true, true, false]; // description, uri, maximum

    token::create_collection(
      resource_signer,
      collection_name,
      collection_description,
      collection_uri,
      collection_maximum,
      mutate_setting,
    );
    
    let resource_signer_cap = resource_account::retrieve_resource_account_cap(resource_signer, @admin);
    let controller = @0x1;
    move_to(resource_signer, ModuleData {
      signer_cap: resource_signer_cap,
      controller: controller,
    });
  }

  public fun create_tokendata(
    caller: &signer,
    token_name: String,
    token_description: String,
    token_maximum: u64,
    token_uri: String,
    royalty_payee_address: address,
    royalty_points_denominator: u64,
    royalty_points_numerator: u64,
    call_put_bytes: vector<u8>,
    maturity_bytes: vector<u8>,
    strike_price_parsed_bytes: vector<u8>,
    long_short_bytes: vector<u8>,
  ) acquires ModuleData {
    let caller_address = signer::address_of(caller);
    let module_data = borrow_global_mut<ModuleData>(@collection);
    assert!(caller_address == module_data.controller, error::permission_denied(ENOT_AUTHORIZED));

    let resource_signer = account::create_signer_with_capability(&module_data.signer_cap);

    token::create_tokendata(
      &resource_signer,
      string::utf8(COLLECTION_NAME),
      token_name,
      token_description,
      token_maximum,
      token_uri,
      royalty_payee_address,
      royalty_points_denominator,
      royalty_points_numerator,
      token::create_token_mutability_config(
        &vector<bool>[ false, false, false, false, false ] // maximum, uri, royalty, description, properties,
      ),
      vector<String>[string::utf8(b"option_type"), string::utf8(b"maturity"), string::utf8(b"strike_price"), string::utf8(b"direction_type"), string::utf8(BURNABLE_BY_OWNER)],
      vector<vector<u8>>[call_put_bytes, maturity_bytes, strike_price_parsed_bytes, long_short_bytes, bcs::to_bytes<bool>(&true)],
      vector<String>[string::utf8(b"bool"), string::utf8(b"u64"), string::utf8(b"u64"), string::utf8(b"bool"), string::utf8(b"bool")],
    );
  }

  public fun mint_token(
    caller: &signer,
    token_data_id: TokenDataId,
    amount: u64,
  ): TokenId acquires ModuleData {
    let caller_address = signer::address_of(caller);
    let module_data = borrow_global_mut<ModuleData>(@collection);
    assert!(caller_address == module_data.controller, error::permission_denied(ENOT_AUTHORIZED));

    let resource_signer = account::create_signer_with_capability(&module_data.signer_cap);

    let token_id = token::mint_token(
      &resource_signer,
      token_data_id,
      amount,
    );

    token_id
  }
  
  public fun direct_transfer(
    caller: &signer,
    receiver: &signer,
    token_id: TokenId,
    amount: u64,
  ) acquires ModuleData {
    let caller_address = signer::address_of(caller);
    let module_data = borrow_global_mut<ModuleData>(@collection);
    assert!(caller_address == module_data.controller, error::permission_denied(ENOT_AUTHORIZED));

    let resource_signer = account::create_signer_with_capability(&module_data.signer_cap);

    token::direct_transfer(
      &resource_signer,
      receiver,
      token_id,
      amount,
    );
  }

  public fun get_controller(): address acquires ModuleData {
    let controller = borrow_global_mut<ModuleData>(@collection).controller;
    controller
  }

  public entry fun update_controller(caller: &signer, new_controller: address) acquires ModuleData {
    let caller_address = signer::address_of(caller);
    assert!(caller_address == ADMIN_ADDRESS, error::permission_denied(ENOT_AUTHORIZED));

    let module_data = borrow_global_mut<ModuleData>(@collection);
    module_data.controller = new_controller;
  }

  public entry fun mutate_collection_description(caller: &signer, new_description: String) acquires ModuleData {
    let caller_address = signer::address_of(caller);
    assert!(caller_address == ADMIN_ADDRESS, error::permission_denied(ENOT_AUTHORIZED));

    let module_data = borrow_global_mut<ModuleData>(@collection);
    let resource_signer = account::create_signer_with_capability(&module_data.signer_cap);

    token::mutate_collection_description(
      &resource_signer,
      string::utf8(COLLECTION_NAME),
      new_description,
    );
  }

  public entry fun mutate_collection_uri(caller: &signer, new_uri: String) acquires ModuleData {
    let caller_address = signer::address_of(caller);
    assert!(caller_address == ADMIN_ADDRESS, error::permission_denied(ENOT_AUTHORIZED));

    let module_data = borrow_global_mut<ModuleData>(@collection);
    let resource_signer = account::create_signer_with_capability(&module_data.signer_cap);

    token::mutate_collection_uri(
      &resource_signer,
      string::utf8(COLLECTION_NAME),
      new_uri,
    );
  }
}