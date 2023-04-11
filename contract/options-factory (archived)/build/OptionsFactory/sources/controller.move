module options_factory::controller {
  use std::signer;
  use std::error;
  use std::string;
  use std::string::String;
  use std::vector;
  
  use aptos_framework::coin;
  use aptos_framework::managed_coin;
  use aptos_framework::aptos_coin::AptosCoin;
  use aptos_framework::bcs;
  use aptos_framework::account::SignerCapability;
  use aptos_framework::resource_account;
  use aptos_framework::account;
  use aptos_framework::timestamp;
  use aptos_std::table::{Self, Table};

  use aptos_token::token;
  use aptos_token::property_map;
  
  use aux::fake_coin::{FakeCoin, USDC};

  use options_factory::date;

  //
  // Constants
  //

  const COLLECTION_NAME: vector<u8> = b"Options Factory";
  const COLLECTION_DESCRIPTION: vector<u8> = b"Options Factory NFT is a European Vanilla Option that is the basis of options trading in Aptos. NFTs can be classified into four types. The green color represents the Long Position, and the red color represents the Short Position. Also, you can distinguish Call Option and Put Option through the text below.";
  const COLLECTION_MAXIMUM: u64 = 0;
  const COLLECTION_URI: vector<u8> = b"https://aptos-options-issuance.s3.ap-northeast-2.amazonaws.com/favicon.png";
  const CALL_PLUS_TOKEN_URI: vector<u8> = b"https://aptos-options-issuance.s3.ap-northeast-2.amazonaws.com/CL-token.png";
  const CALL_MINUS_TOKEN_URI: vector<u8> = b"https://aptos-options-issuance.s3.ap-northeast-2.amazonaws.com/CS-token.png";
  const PUT_PLUS_TOKEN_URI: vector<u8> = b"https://aptos-options-issuance.s3.ap-northeast-2.amazonaws.com/PL-token.png";
  const PUT_MINUS_TOKEN_URI: vector<u8> = b"https://aptos-options-issuance.s3.ap-northeast-2.amazonaws.com/PS-token.png";
  
  const BURNABLE_BY_OWNER: vector<u8> = b"TOKEN_BURNABLE_BY_OWNER";
  const SUFFIX_APTOS: u64 = 100000000; // AptosCoin Decimal 8
  const SUFFIX_USDC: u64 = 1000000 / 100; // USDC Decimal 6, but as the price parameter express up to two decimal places by default

  //
  // Errors
  //

  const ENOT_ENOUGH_BALANCE: u64 = 0;
  const ENOT_ENOUGH_OPTIONS_BALANCE: u64 = 1;
  const ENOT_EXISTED_TOKEN: u64 = 2;
  const ENOT_MATURED: u64 = 3;
  const EALREADY_MATURED: u64 = 4;
  const EWRONG_MATURITY: u64 = 5;
  const EWRONG_TOKEN_PAIRS: u64 = 6;
  const ENOT_AUTHORIZED: u64 = 7;

  //
  // Structs
  //

  struct ModuleData has key {
    signer_cap: SignerCapability,
    last_price: u64,
    total_call_volume: u64,
    total_put_volume: u64,
    volume_data_by_maturity: Table<u64, VolumeDataByMaturity>,
    volume_data_by_strike_price: Table<u64, VolumeDataByStrikePrice>,
  }

  struct VolumeDataByMaturity has copy, store {
    call_volume: u64,
    put_volume: u64,
  }

  struct VolumeDataByStrikePrice has copy, store {
    call_volume: u64,
    put_volume: u64,
  }

  //
  // Events
  //


  fun init_module(resource_signer: &signer) {

    coin::register<AptosCoin>(resource_signer);
    managed_coin::register<FakeCoin<USDC>>(resource_signer);

    let mutate_setting = vector<bool>[ false, false, false];
    token::create_collection(resource_signer, string::utf8(COLLECTION_NAME), string::utf8(COLLECTION_DESCRIPTION), string::utf8(COLLECTION_URI), COLLECTION_MAXIMUM, mutate_setting);

    let resource_signer_cap = resource_account::retrieve_resource_account_cap(resource_signer, @admin);
    move_to(resource_signer, ModuleData {
      signer_cap: resource_signer_cap,
      last_price: 0,
      total_call_volume: 0,
      total_put_volume: 0,
      volume_data_by_maturity: table::new(),
      volume_data_by_strike_price: table::new(),
    });
  }

  public entry fun issue_options(
    receiver: &signer,
    maturity: u64, // milliseconds
    strike_price: u64, // 1250 = 12.50
    is_call: bool,
    balance: u64, // 10
    last_price_at_maturity: u64, // ONLY FOR DEMO
  ) acquires ModuleData {
    let receiver_addr = signer::address_of(receiver);
    let module_data = borrow_global_mut<ModuleData>(@options_factory);
    let resource_signer = account::create_signer_with_capability(&module_data.signer_cap);
    let resource_addr = signer::address_of(&resource_signer);

    assert!(maturity > (timestamp::now_microseconds() / 1000), EWRONG_MATURITY);

    if (is_call) {
      assert!(coin::balance<AptosCoin>(receiver_addr) >= balance * SUFFIX_APTOS, ENOT_ENOUGH_BALANCE); // AptosCoin decimal 8
      coin::transfer<AptosCoin>(receiver, resource_addr, balance * SUFFIX_APTOS);
    } else {
      assert!(coin::balance<FakeCoin<USDC>>(receiver_addr) >= balance * strike_price * SUFFIX_USDC, ENOT_ENOUGH_BALANCE); // USDC decimal 6
      coin::transfer<FakeCoin<USDC>>(receiver, resource_addr, balance * strike_price * SUFFIX_USDC);
    };

    let plus_token_name = get_token_name(maturity, strike_price, is_call, true);
    let minus_token_name = get_token_name(maturity, strike_price, is_call, false);

    let isPlusExisted = token::check_tokendata_exists(resource_addr, string::utf8(COLLECTION_NAME), plus_token_name);
    let isMinusExisted = token::check_tokendata_exists(resource_addr, string::utf8(COLLECTION_NAME), minus_token_name);

    if (!isPlusExisted && !isMinusExisted) {
      let plus_token_uri;
      let minus_token_uri;

      if (is_call) {
        plus_token_uri = string::utf8(CALL_PLUS_TOKEN_URI);
        minus_token_uri = string::utf8(CALL_MINUS_TOKEN_URI);
      } else {
        plus_token_uri = string::utf8(PUT_PLUS_TOKEN_URI);
        minus_token_uri = string::utf8(PUT_MINUS_TOKEN_URI);
      };

      let maturity_bytes = bcs::to_bytes<u64>(&maturity);
      let strike_price_bytes = bcs::to_bytes<u64>(&strike_price);
      let last_price_at_maturity_bytes = bcs::to_bytes<u64>(&last_price_at_maturity);
    
      let call_put_bytes = if (is_call) { bcs::to_bytes<bool>(&true) } else { bcs::to_bytes<bool>(&false) };
      let long_bytes = bcs::to_bytes<bool>(&true);
      let short_bytes = bcs::to_bytes<bool>(&false);

      token::create_tokendata(
        &resource_signer,
        string::utf8(COLLECTION_NAME),
        plus_token_name,
        string::utf8(b""),
        0,
        plus_token_uri,
        resource_addr,
        1,
        0,
        token::create_token_mutability_config(
          &vector<bool>[ false, false, false, false, false ]
        ),
        vector<String>[string::utf8(b"option_type"), string::utf8(b"maturity"), string::utf8(b"strike_price"), string::utf8(b"direction_type"), string::utf8(b"last_price_at_maturity"), string::utf8(BURNABLE_BY_OWNER)],
        vector<vector<u8>>[call_put_bytes, maturity_bytes, strike_price_bytes, long_bytes, last_price_at_maturity_bytes, bcs::to_bytes<bool>(&true)],
        vector<String>[string::utf8(b"bool"), string::utf8(b"u64"), string::utf8(b"u64"), string::utf8(b"bool"), string::utf8(b"u64"), string::utf8(b"bool")],
      );

      token::create_tokendata(
        &resource_signer,
        string::utf8(COLLECTION_NAME),
        minus_token_name,
        string::utf8(b""),
        0, 
        minus_token_uri,
        resource_addr,
        1,
        0,
        token::create_token_mutability_config(
          &vector<bool>[ false, false, false, false, false ]
        ),
        vector<String>[string::utf8(b"option_type"), string::utf8(b"maturity"), string::utf8(b"strike_price"), string::utf8(b"direction_type"), string::utf8(b"last_price_at_maturity"), string::utf8(BURNABLE_BY_OWNER)],
        vector<vector<u8>>[call_put_bytes, maturity_bytes, strike_price_bytes, short_bytes, last_price_at_maturity_bytes, bcs::to_bytes<bool>(&true)],
        vector<String>[string::utf8(b"bool"), string::utf8(b"u64"), string::utf8(b"u64"), string::utf8(b"bool"), string::utf8(b"u64"), string::utf8(b"bool")],
      );
    };

    let plus_token_data_id = token::create_token_data_id(resource_addr, string::utf8(COLLECTION_NAME), plus_token_name);
    let minus_token_data_id = token::create_token_data_id(resource_addr, string::utf8(COLLECTION_NAME), minus_token_name);

    let plus_token_id = token::mint_token(&resource_signer, plus_token_data_id, balance);
    let minus_token_id = token::mint_token(&resource_signer, minus_token_data_id, balance);

    let maturity_to_date = maturity / 1000 / 86400;

    if (is_call) {
      module_data.total_call_volume = module_data.total_call_volume + balance;
      
      if (!table::contains(&module_data.volume_data_by_maturity, maturity_to_date)) { table::add(&mut module_data.volume_data_by_maturity, maturity_to_date, VolumeDataByMaturity { call_volume: 0, put_volume: 0 }); };
      let volume_data_by_maturity = table::borrow_mut(&mut module_data.volume_data_by_maturity, maturity_to_date);
      volume_data_by_maturity.call_volume = volume_data_by_maturity.call_volume + balance;

      if (!table::contains(&module_data.volume_data_by_strike_price, strike_price)) { table::add(&mut module_data.volume_data_by_strike_price, strike_price, VolumeDataByStrikePrice { call_volume: 0, put_volume: 0 }); };
      let volume_data_by_strike_price = table::borrow_mut(&mut module_data.volume_data_by_strike_price, strike_price);
      volume_data_by_strike_price.call_volume = volume_data_by_strike_price.call_volume + balance;
    } else {
      module_data.total_put_volume = module_data.total_put_volume + balance;

      if (!table::contains(&module_data.volume_data_by_maturity, maturity_to_date)) { table::add(&mut module_data.volume_data_by_maturity, maturity_to_date, VolumeDataByMaturity { call_volume: 0, put_volume: 0 }); };
      let volume_data_by_maturity = table::borrow_mut(&mut module_data.volume_data_by_maturity, maturity_to_date);
      volume_data_by_maturity.put_volume = volume_data_by_maturity.put_volume + balance;

      if (!table::contains(&module_data.volume_data_by_strike_price, strike_price)) { table::add(&mut module_data.volume_data_by_strike_price, strike_price, VolumeDataByStrikePrice { call_volume: 0, put_volume: 0 }); };
      let volume_data_by_strike_price = table::borrow_mut(&mut module_data.volume_data_by_strike_price, strike_price);
      volume_data_by_strike_price.put_volume = volume_data_by_strike_price.put_volume + balance;
    };

    token::direct_transfer(&resource_signer, receiver, plus_token_id, balance);
    token::direct_transfer(&resource_signer, receiver, minus_token_id, balance);
  }

  public entry fun settle_options(receiver: &signer, token_name: String, balance: u64) acquires ModuleData {
    let receiver_addr = signer::address_of(receiver);
    let module_data = borrow_global_mut<ModuleData>(@options_factory);
    let resource_signer = account::create_signer_with_capability(&module_data.signer_cap);
    let resource_addr = signer::address_of(&resource_signer);
    assert!(token::check_tokendata_exists(resource_addr, string::utf8(COLLECTION_NAME), token_name), ENOT_EXISTED_TOKEN);

    let token_data_id = token::create_token_data_id(resource_addr, string::utf8(COLLECTION_NAME), token_name);
    let token_id = token::create_token_id(token_data_id, 0);
    let token_balance = token::balance_of(receiver_addr, token_id);
    assert!(token_balance >= balance, ENOT_ENOUGH_OPTIONS_BALANCE);

    // 0. Get token's properties
    let property = token::get_property_map(receiver_addr, token_id);
    let is_call = property_map::read_bool(&property, &string::utf8(b"option_type")) == true;
    let maturity = property_map::read_u64(&property, &string::utf8(b"maturity"));
    let strike_price = property_map::read_u64(&property, &string::utf8(b"strike_price"));
    let is_long = property_map::read_bool(&property, &string::utf8(b"direction_type")) == true;

    // 1. Check token's expiry
    assert!(maturity <= (timestamp::now_microseconds() / 1000), ENOT_MATURED);

    // 2. Get last price
    // let last_price = get_last_price();
    let last_price = property_map::read_u64(&property, &string::utf8(b"last_price_at_maturity"));

    // 3. Burn Option tokens
    token::burn(receiver, resource_addr, string::utf8(COLLECTION_NAME), token_name, 0, balance);

    if (is_call) {
      module_data.total_call_volume = module_data.total_call_volume - balance;
    } else {
      module_data.total_put_volume = module_data.total_put_volume - balance;
    };

    if (is_call) {
      if (strike_price <= last_price) { // ITM, ATM for Call Options
        if (is_long) {
          coin::transfer<FakeCoin<USDC>>(receiver, resource_addr, balance * strike_price * SUFFIX_USDC);
          coin::transfer<AptosCoin>(&resource_signer, receiver_addr, balance * SUFFIX_APTOS);
        } else {
          coin::transfer<FakeCoin<USDC>>(&resource_signer, receiver_addr,  balance * strike_price * SUFFIX_USDC);
        };
      } else { // OTM for Call Options
        if (is_long) {
          // DO NOTHING
        } else {
          coin::transfer<AptosCoin>(&resource_signer, receiver_addr, balance * SUFFIX_APTOS); 
        }
      };
    } else {
      if (strike_price >= last_price) { // ITM, ATM for Put Options
        if (is_long) {
          coin::transfer<FakeCoin<USDC>>(&resource_signer, receiver_addr, balance * (strike_price-last_price) * SUFFIX_USDC);
        } else {
          coin::transfer<FakeCoin<USDC>>(&resource_signer, receiver_addr, balance * last_price * SUFFIX_USDC);
        };
      } else { // OTM for Put Options
        if (is_long) {
          // DO NOTHING
        } else {
          coin::transfer<FakeCoin<USDC>>(&resource_signer, receiver_addr, balance * strike_price * SUFFIX_USDC);
        };
      };
    };
  }

  public entry fun close_options(receiver: &signer, plus_token_name: String, minus_token_name: String, balance: u64) acquires ModuleData {
    let receiver_addr = signer::address_of(receiver);
    let module_data = borrow_global_mut<ModuleData>(@options_factory);
    let resource_signer = account::create_signer_with_capability(&module_data.signer_cap);
    let resource_addr = signer::address_of(&resource_signer);
    assert!(token::check_tokendata_exists(resource_addr, string::utf8(COLLECTION_NAME), plus_token_name), ENOT_EXISTED_TOKEN);
    assert!(token::check_tokendata_exists(resource_addr, string::utf8(COLLECTION_NAME), minus_token_name), ENOT_EXISTED_TOKEN);

    let plus_token_data_id = token::create_token_data_id(resource_addr, string::utf8(COLLECTION_NAME), plus_token_name);
    let plus_token_id = token::create_token_id(plus_token_data_id, 0);
    let plus_token_balance = token::balance_of(receiver_addr, plus_token_id);
    let minus_token_data_id = token::create_token_data_id(resource_addr, string::utf8(COLLECTION_NAME), minus_token_name);
    let minus_token_id = token::create_token_id(minus_token_data_id, 0);
    let minus_token_balance = token::balance_of(receiver_addr, minus_token_id);
    assert!(plus_token_balance >= balance, ENOT_ENOUGH_OPTIONS_BALANCE);
    assert!(minus_token_balance >= balance, ENOT_ENOUGH_OPTIONS_BALANCE);

    let plus_token_property = token::get_property_map(receiver_addr, plus_token_id);
    let plus_is_call = property_map::read_bool(&plus_token_property, &string::utf8(b"option_type")) == true;
    let plus_maturity = property_map::read_u64(&plus_token_property, &string::utf8(b"maturity"));
    let plus_strike_price = property_map::read_u64(&plus_token_property, &string::utf8(b"strike_price"));
    let plus_is_long = property_map::read_bool(&plus_token_property, &string::utf8(b"direction_type")) == true;

    let minus_token_property = token::get_property_map(receiver_addr, minus_token_id);
    let minus_is_call = property_map::read_bool(&minus_token_property, &string::utf8(b"option_type")) == true;
    let minus_maturity = property_map::read_u64(&minus_token_property, &string::utf8(b"maturity"));
    let minus_strike_price = property_map::read_u64(&minus_token_property, &string::utf8(b"strike_price"));
    let minus_is_long = property_map::read_bool(&minus_token_property, &string::utf8(b"direction_type")) == true;
    assert!(plus_is_call == minus_is_call && plus_maturity == minus_maturity && plus_strike_price == minus_strike_price && plus_is_long == !minus_is_long, EWRONG_TOKEN_PAIRS);
    assert!(plus_maturity > (timestamp::now_microseconds() / 1000), EALREADY_MATURED);

    token::burn(receiver, resource_addr, string::utf8(COLLECTION_NAME), plus_token_name, 0, balance);
    token::burn(receiver, resource_addr, string::utf8(COLLECTION_NAME), minus_token_name, 0, balance);

    if (plus_is_call) {
      assert!(coin::balance<AptosCoin>(resource_addr) >= balance * SUFFIX_APTOS, ENOT_ENOUGH_BALANCE);
      coin::transfer<AptosCoin>(&resource_signer, receiver_addr, balance * SUFFIX_APTOS);
    } else {
      assert!(coin::balance<FakeCoin<USDC>>(resource_addr) >= balance * plus_strike_price * SUFFIX_USDC, ENOT_ENOUGH_BALANCE);
      coin::transfer<FakeCoin<USDC>>(&resource_signer, receiver_addr, balance * plus_strike_price * SUFFIX_USDC); 
    };
  }

  #[view]
  public fun get_payout(receiver_addr:address, token_name: String, balance: u64): u64 {  
    let token_data_id = token::create_token_data_id(@options_factory, string::utf8(COLLECTION_NAME), token_name);
    let token_id = token::create_token_id(token_data_id, 0);

    // 0. Get token's properties
    let property = token::get_property_map(receiver_addr, token_id);
    let is_call = property_map::read_bool(&property, &string::utf8(b"option_type")) == true;
    let strike_price = property_map::read_u64(&property, &string::utf8(b"strike_price"));
    let is_long = property_map::read_bool(&property, &string::utf8(b"direction_type")) == true;

    // 1. Get last price
    // let last_price = get_last_price();
    let last_price = property_map::read_u64(&property, &string::utf8(b"last_price_at_maturity"));

    let payout;
    if (is_call) {
      if (strike_price <= last_price) { // ITM, ATM for Call Options
        if (is_long) {
          payout = balance * SUFFIX_APTOS;
        } else {
          payout = balance * strike_price * SUFFIX_USDC;
        };
      } else { // OTM for Call Options
        if (is_long) {
          payout = 0;
        } else {
          payout = balance * SUFFIX_APTOS
        }
      };
    } else {
      if (strike_price >= last_price) { // ITM, ATM for Put Options
        if (is_long) {
          payout = balance * (strike_price-last_price) * SUFFIX_USDC;
        } else {
          payout = balance * last_price * SUFFIX_USDC;
        };
      } else { // OTM for Put Options
        if (is_long) {
          payout = 0;
        } else {
          payout = balance * strike_price * SUFFIX_USDC;
        };
      };
    };

    payout
  }

  #[view]
  public fun get_volume_data_by_maturity(keys: vector<u64>): vector<vector<u64>> acquires ModuleData {
    let key_len = vector::length(&keys);
    let result = vector::empty<vector<u64>>();

    let i=0;
    while (i < key_len) {
      let data = vector::empty<u64>();
      let key = vector::borrow(&keys, i);
      let maturity_to_date = *key / 1000 / 86400;

      let module_data = borrow_global_mut<ModuleData>(@options_factory);
      let value;
      if (table::contains(&mut module_data.volume_data_by_maturity, maturity_to_date)) {
        value = table::borrow_mut(&mut module_data.volume_data_by_maturity, maturity_to_date);
        vector::push_back(&mut data, value.call_volume);
        vector::push_back(&mut data, value.put_volume);
      } else {
        vector::push_back(&mut data, 0);
        vector::push_back(&mut data, 0);
      };

      vector::push_back(&mut result, data);
      i = i + 1;
    };
    result
  }

  #[view]
  public fun get_volume_data_by_strike_price(keys: vector<u64>): vector<vector<u64>> acquires ModuleData {
    let key_len = vector::length(&keys);
    let result = vector::empty<vector<u64>>();

    let i=0;
    while (i < key_len) {
      let data = vector::empty<u64>();
      let key = vector::borrow(&keys, i);

      let module_data = borrow_global_mut<ModuleData>(@options_factory);
      let value;
      if (table::contains(&mut module_data.volume_data_by_strike_price, *key)) {
        value = table::borrow_mut(&mut module_data.volume_data_by_strike_price, *key);
        vector::push_back(&mut data, value.call_volume);
        vector::push_back(&mut data, value.put_volume);
      } else {
        vector::push_back(&mut data, 0);
        vector::push_back(&mut data, 0);
      };
      
      vector::push_back(&mut result, data);
      i = i + 1;
    };
    result
  }

  public fun get_last_price(): u64 acquires ModuleData {
    let last_price = borrow_global_mut<ModuleData>(@options_factory).last_price;
    last_price
  }

  public fun get_token_name(
    maturity: u64,
    strike_price: u64,
    is_call: bool,
    is_plus: bool,
  ): String {
    let option_type = if (is_call) { string::utf8(b"CALL") } else { string::utf8(b"PUT") };
    let direction_type = if (is_plus) { string::utf8(b"LONG") } else { string::utf8(b"SHORT") };
    let token_name = string::utf8(b"");
    
    let maturity_in_seconds = maturity / 1000;
    let (year, month, day, hour, minute, second) = date::timestamp_to_date_time(maturity_in_seconds);
    
    let month_parsed;
    if (month == 1) {
      month_parsed = string::utf8(b"JAN");
    } else if (month == 2) {
      month_parsed = string::utf8(b"FEB");
    } else if (month == 3) {
      month_parsed = string::utf8(b"MAR");
    } else if (month == 4) {
      month_parsed = string::utf8(b"APR");
    } else if (month == 5) {
      month_parsed = string::utf8(b"MAY");
    } else if (month == 6) {
      month_parsed = string::utf8(b"JUN");
    } else if (month == 7) {
      month_parsed = string::utf8(b"JUL");
    } else if (month == 8) {
      month_parsed = string::utf8(b"AUG");
    } else if (month == 9) {
      month_parsed = string::utf8(b"SEP");
    } else if (month == 10) {
      month_parsed = string::utf8(b"OCT");
    } else if (month == 11) {
      month_parsed = string::utf8(b"NOV");
    } else {
      month_parsed = string::utf8(b"DEC");
    };

    let strike_price_integer = to_string(strike_price / 100);
    let strike_price_decimal = to_string(strike_price % 100);

    // APT_03FEB23_08UTC0_3.50_CALL_LONG
    string::append(&mut token_name, string::utf8(b"APT"));

    string::append(&mut token_name, string::utf8(b"_"));
    string::append(&mut token_name, to_string(day));
    string::append(&mut token_name, month_parsed);
    string::append(&mut token_name, to_string(year));

    string::append(&mut token_name, string::utf8(b"_"));
    string::append(&mut token_name, to_string_for_date(hour));
    string::append(&mut token_name, string::utf8(b":"));
    string::append(&mut token_name, to_string_for_date(minute));
    string::append(&mut token_name, string::utf8(b":"));
    string::append(&mut token_name, to_string(second));
    string::append(&mut token_name, string::utf8(b"UTC0"));

    string::append(&mut token_name, string::utf8(b"_"));
    string::append(&mut token_name, strike_price_integer);
    string::append(&mut token_name, string::utf8(b"."));
    string::append(&mut token_name, strike_price_decimal);

    string::append(&mut token_name, string::utf8(b"_"));
    string::append(&mut token_name, option_type);

    string::append(&mut token_name, string::utf8(b"_"));
    string::append(&mut token_name, direction_type);

    token_name
  }

  public fun to_string_for_date(value: u64): String {
    let data = to_string(value);

    let result = string::utf8(b"");
    if (string::length(&data) == 1) {
      string::append(&mut result, string::utf8(b"0"));
      string::append(&mut result, data);
    } else {
      string::append(&mut result, data);
    };
      
    result
  }

  public fun to_string(value: u64): String {
      if (value == 0) {
          return string::utf8(b"0")
      };
      let buffer = vector::empty<u8>();
      while (value != 0) {
          vector::push_back(&mut buffer, ((48 + value % 10) as u8));
          value = value / 10;
      };
      vector::reverse(&mut buffer);
      string::utf8(buffer)
  }

  public entry fun set_last_price(caller: &signer, new_price: u64) acquires ModuleData {
    let caller_address = signer::address_of(caller);
    assert!(caller_address == @admin, error::permission_denied(ENOT_AUTHORIZED));

    let module_data = borrow_global_mut<ModuleData>(@options_factory);
    module_data.last_price = new_price;
  }
}