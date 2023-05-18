module controller::controller {
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
  
  use wrapped_coin::coin::T;
  use collection::collection;
  use controller::date;
  use price_feed::price_feed;

  // Constants
  const ADMIN_ADDRESS: address = @admin;
  const COLLECTION_ADDRESS: address = @collection;
  const COLLECTION_NAME: vector<u8> = b"Options Factory";
  const SUFFIX_APTOS: u64 = 100000000; // AptosCoin Decimal 8
  const SUFFIX_PRICE_PARSING: u64 = 10000; // 

  // Errors
  const ENOT_AUTHORIZED: u64 = 0;
  const ENOT_ENOUGH_BALANCE: u64 = 1;
  const ENOT_ENOUGH_OPTIONS_BALANCE: u64 = 2;
  const ENOT_EXISTED_TOKEN: u64 = 3;
  const ENOT_MATURED: u64 = 4;
  const ENOT_EXISTED_STAKED_TOKEN_DATA: u64 = 5;
 
  const EALREADY_MATURED: u64 = 20;
  const EALREADY_SETTLED: u64 = 21;
 
  const EWRONG_MATURITY: u64 = 30;
  const EWRONG_PRICE_RANGE: u64 = 31;
  const EWRONG_TOKEN_PAIRS: u64 = 32;
 
  const EIS_DISABLED: u64 = 40;

  // Structs
  struct ModuleData has key {
    signer_cap: SignerCapability,
    last_price: u64,
    total_call_volume: u64,
    total_put_volume: u64,
    volume_data_by_maturity: Table<u64, VolumeData>,
    volume_data_by_strike_price: Table<u64, VolumeData>,
    call_plus_token_uri: vector<u8>,
    call_minus_token_uri: vector<u8>,
    put_plus_token_uri: vector<u8>,
    put_minus_token_uri: vector<u8>,
    paused: bool,
  }

  struct VolumeData has copy, store {
    call_volume: u64,
    put_volume: u64,
  }

  struct StakeData has key {
    current_call_plus_amount: u64,
    current_call_minus_amount: u64,
    current_put_plus_amount: u64,
    current_put_minus_amount: u64,
    total_staked_usdc_amount: u64,
    stake_data_by_maturity: Table<u64, StakeDataByMaturity>,
  }

  struct StakeDataByMaturity has store {
    strike_prices: vector<u64>,
    staked_token_and_user_data_by_strike_price: Table<u64, StakedTokenAndUserData>,
    is_settled: bool,
  }

  struct StakedTokenAndUserData has store {
    token_amount_to_be_settled: u64,
    users: vector<vector<address>>,
    call_plus_amount_by_user: Table<address, u64>,
    call_minus_amount_by_user: Table<address, u64>,
    put_plus_amount_by_user: Table<address, u64>,
    put_minus_amount_by_user: Table<address, u64>,
    usdc_amount_by_user: Table<address, u64>,
  }

  // Functions
  fun init_module(resource_signer: &signer) {
    coin::register<AptosCoin>(resource_signer);
    managed_coin::register<T>(resource_signer);
    token::opt_in_direct_transfer(resource_signer, true);

    let resource_signer_cap = resource_account::retrieve_resource_account_cap(resource_signer, ADMIN_ADDRESS);

    move_to(resource_signer, ModuleData {
      signer_cap: resource_signer_cap,
      last_price: 0,
      total_call_volume: 0,
      total_put_volume: 0,
      volume_data_by_maturity: table::new(),
      volume_data_by_strike_price: table::new(),
      call_plus_token_uri: b"https://aptos-options-issuance.s3.ap-northeast-2.amazonaws.com/CL-token.png",
      call_minus_token_uri: b"https://aptos-options-issuance.s3.ap-northeast-2.amazonaws.com/CS-token.png",
      put_plus_token_uri: b"https://aptos-options-issuance.s3.ap-northeast-2.amazonaws.com/PL-token.png",
      put_minus_token_uri: b"https://aptos-options-issuance.s3.ap-northeast-2.amazonaws.com/PS-token.png",
      paused: false,
    });

    move_to(resource_signer, StakeData {
      current_call_plus_amount: 0,
      current_call_minus_amount: 0,
      current_put_plus_amount: 0,
      current_put_minus_amount: 0,
      total_staked_usdc_amount: 0,
      stake_data_by_maturity: table::new(),
    });
  }


  public entry fun issue_options(
    receiver: &signer,
    maturity: u64, // seconds
    strike_price: u64, // (AS-IS) 12.50 USD => 1250, (TO-BE) 12.50 USD => 12500000
    is_call: bool,
    amount: u64,
  ) acquires ModuleData {
    // Validate maturity and strike price
    assert!(maturity > (timestamp::now_microseconds() / (1000000)), EWRONG_MATURITY);
    assert!(strike_price >= 500000, EWRONG_PRICE_RANGE);

    // Validate maturity in detail
    let (_, _, _, hour, minute, second) = date::timestamp_to_date_time(maturity);
    let day_of_week = date::get_day_of_week(maturity);
    assert!((hour == 8) && (minute == 0) && (second == 0), EWRONG_MATURITY);
    assert!(day_of_week == 5, EWRONG_MATURITY);

    let receiver_addr = signer::address_of(receiver);
    let module_data = borrow_global_mut<ModuleData>(@controller);
    let resource_signer = account::create_signer_with_capability(&module_data.signer_cap);

    assert!(module_data.paused == false, EIS_DISABLED);

    // If call, user transfer APT to this contract
    // If put, user transfer USDC to this contract
    if (is_call) {
      assert!(coin::balance<AptosCoin>(receiver_addr) >= amount * SUFFIX_APTOS, ENOT_ENOUGH_BALANCE);
      coin::transfer<AptosCoin>(receiver, @controller, amount * SUFFIX_APTOS);
    } else {
      assert!(coin::balance<T>(receiver_addr) >= amount * strike_price, ENOT_ENOUGH_BALANCE);
      coin::transfer<T>(receiver, @controller, amount * strike_price);
    };

    // Parsing strike price to human-readable
    let strike_price_parsed = strike_price / SUFFIX_PRICE_PARSING; // 12.50 USD => 12500000 => 1250

    // Get token name
    let plus_token_name = get_token_name(maturity, strike_price_parsed, is_call, true);
    let minus_token_name = get_token_name(maturity, strike_price_parsed, is_call, false);

    // Check whether the same token names exist
    let isPlusExisted = token::check_tokendata_exists(COLLECTION_ADDRESS, string::utf8(COLLECTION_NAME), plus_token_name);
    let isMinusExisted = token::check_tokendata_exists(COLLECTION_ADDRESS, string::utf8(COLLECTION_NAME), minus_token_name);

    // If the same token names do not exist, create new token data
    if (!isPlusExisted && !isMinusExisted) {
      let plus_token_uri;
      let minus_token_uri;

      if (is_call) {
        plus_token_uri = string::utf8(module_data.call_plus_token_uri);
        minus_token_uri = string::utf8(module_data.call_minus_token_uri);
      } else {
        plus_token_uri = string::utf8(module_data.put_plus_token_uri);
        minus_token_uri = string::utf8(module_data.put_minus_token_uri);
      };

      let maturity_bytes = bcs::to_bytes<u64>(&maturity);
      let strike_price_parsed_bytes = bcs::to_bytes<u64>(&strike_price_parsed);
      let call_put_bytes = if (is_call) { bcs::to_bytes<bool>(&true) } else { bcs::to_bytes<bool>(&false) };
      let long_bytes = bcs::to_bytes<bool>(&true);
      let short_bytes = bcs::to_bytes<bool>(&false);

      // Create plus token
      collection::create_tokendata(
        &resource_signer,
        plus_token_name,
        string::utf8(b""),
        0,
        plus_token_uri,
        @controller,
        1,
        0,
        call_put_bytes,
        maturity_bytes,
        strike_price_parsed_bytes,
        long_bytes,
      );

      // Create minus token
      collection::create_tokendata(
        &resource_signer,
        minus_token_name,
        string::utf8(b""),
        0, 
        minus_token_uri,
        @controller,
        1,
        0,
        call_put_bytes,
        maturity_bytes,
        strike_price_parsed_bytes,
        short_bytes,
      );
    };

    // Mint plus and minus token
    let plus_token_data_id = token::create_token_data_id(COLLECTION_ADDRESS, string::utf8(COLLECTION_NAME), plus_token_name);
    let minus_token_data_id = token::create_token_data_id(COLLECTION_ADDRESS, string::utf8(COLLECTION_NAME), minus_token_name);
    let plus_token_id = collection::mint_token(&resource_signer, plus_token_data_id, amount);
    let minus_token_id = collection::mint_token(&resource_signer, minus_token_data_id, amount);

    // Transfer minted token to receiver
    collection::direct_transfer(&resource_signer, receiver, plus_token_id, amount);
    collection::direct_transfer(&resource_signer, receiver, minus_token_id, amount);

    // Update volume data
    if (is_call) {
      module_data.total_call_volume = module_data.total_call_volume + amount;
      
      if (!table::contains(&module_data.volume_data_by_maturity, maturity)) { table::add(&mut module_data.volume_data_by_maturity, maturity, VolumeData { call_volume: 0, put_volume: 0 }); };
      let volume_data_by_maturity = table::borrow_mut(&mut module_data.volume_data_by_maturity, maturity);
      volume_data_by_maturity.call_volume = volume_data_by_maturity.call_volume + amount;

      if (!table::contains(&module_data.volume_data_by_strike_price, strike_price)) { table::add(&mut module_data.volume_data_by_strike_price, strike_price, VolumeData { call_volume: 0, put_volume: 0 }); };
      let volume_data_by_strike_price = table::borrow_mut(&mut module_data.volume_data_by_strike_price, strike_price);
      volume_data_by_strike_price.call_volume = volume_data_by_strike_price.call_volume + amount;
    } else {
      module_data.total_put_volume = module_data.total_put_volume + amount;

      if (!table::contains(&module_data.volume_data_by_maturity, maturity)) { table::add(&mut module_data.volume_data_by_maturity, maturity, VolumeData { call_volume: 0, put_volume: 0 }); };
      let volume_data_by_maturity = table::borrow_mut(&mut module_data.volume_data_by_maturity, maturity);
      volume_data_by_maturity.put_volume = volume_data_by_maturity.put_volume + amount;

      if (!table::contains(&module_data.volume_data_by_strike_price, strike_price)) { table::add(&mut module_data.volume_data_by_strike_price, strike_price, VolumeData { call_volume: 0, put_volume: 0 }); };
      let volume_data_by_strike_price = table::borrow_mut(&mut module_data.volume_data_by_strike_price, strike_price);
      volume_data_by_strike_price.put_volume = volume_data_by_strike_price.put_volume + amount;
    };
  }

  public entry fun settle_options(
    receiver: &signer,
    token_name: String,
    amount: u64
  ) acquires ModuleData {

    // Validate token
    assert!(token::check_tokendata_exists(COLLECTION_ADDRESS, string::utf8(COLLECTION_NAME), token_name), ENOT_EXISTED_TOKEN);

    let receiver_addr = signer::address_of(receiver);
    let module_data = borrow_global_mut<ModuleData>(@controller);
    let resource_signer = account::create_signer_with_capability(&module_data.signer_cap);
    
    // Validate token balance
    let token_data_id = token::create_token_data_id(COLLECTION_ADDRESS, string::utf8(COLLECTION_NAME), token_name);
    let token_id = token::create_token_id(token_data_id, 0);
    let token_balance = token::balance_of(receiver_addr, token_id);
    assert!(token_balance >= amount, ENOT_ENOUGH_OPTIONS_BALANCE);

    // Get token properties
    let property = token::get_property_map(receiver_addr, token_id);
    let is_call = property_map::read_bool(&property, &string::utf8(b"option_type")) == true;
    let maturity = property_map::read_u64(&property, &string::utf8(b"maturity"));
    let strike_price = property_map::read_u64(&property, &string::utf8(b"strike_price")) * SUFFIX_PRICE_PARSING;
    let is_plus = property_map::read_bool(&property, &string::utf8(b"direction_type")) == true;

    // Validate option expiry
    assert!(maturity <= (timestamp::now_microseconds() / (1000000)), ENOT_MATURED);

    // Get last price
    // let last_price = module_data.last_price;
    let price_at_maturity = price_feed::get_price(maturity);


    // Burn option tokens
    token::burn(receiver, COLLECTION_ADDRESS, string::utf8(COLLECTION_NAME), token_name, 0, amount);

    if (is_call) {
      module_data.total_call_volume = module_data.total_call_volume - amount;
    } else {
      module_data.total_put_volume = module_data.total_put_volume - amount;
    };

    if (is_call) {
      if (strike_price <= price_at_maturity) { // ITM, ATM for Call Options
        if (is_plus) {
          coin::transfer<T>(receiver, @controller, amount * strike_price);
          coin::transfer<AptosCoin>(&resource_signer, receiver_addr, amount * SUFFIX_APTOS);
        } else {
          coin::transfer<T>(&resource_signer, receiver_addr,  amount * strike_price); 
        };
      } else { // OTM for Call Options
        if (is_plus) {
          // DO NOTHING
        } else {
          coin::transfer<AptosCoin>(&resource_signer, receiver_addr, amount * SUFFIX_APTOS); 
        }
      };
    } else {
      if (strike_price >= price_at_maturity) { // ITM, ATM for Put Options
        if (is_plus) {
          coin::transfer<T>(&resource_signer, receiver_addr, amount * (strike_price - price_at_maturity));
        } else {
          coin::transfer<T>(&resource_signer, receiver_addr, amount * price_at_maturity);
        };
      } else { // OTM for Put Options
        if (is_plus) {
          // DO NOTHING
        } else {
          coin::transfer<T>(&resource_signer, receiver_addr, amount * strike_price);
        };
      };
    };
  }

  public entry fun close_options(
    receiver: &signer,
    plus_token_name: String,
    minus_token_name: String,
    amount: u64
  ) acquires ModuleData {
    let receiver_addr = signer::address_of(receiver);
    let module_data = borrow_global_mut<ModuleData>(@controller);
    let resource_signer = account::create_signer_with_capability(&module_data.signer_cap);
    assert!(token::check_tokendata_exists(COLLECTION_ADDRESS, string::utf8(COLLECTION_NAME), plus_token_name), ENOT_EXISTED_TOKEN);
    assert!(token::check_tokendata_exists(COLLECTION_ADDRESS, string::utf8(COLLECTION_NAME), minus_token_name), ENOT_EXISTED_TOKEN);

    let plus_token_data_id = token::create_token_data_id(COLLECTION_ADDRESS, string::utf8(COLLECTION_NAME), plus_token_name);
    let plus_token_id = token::create_token_id(plus_token_data_id, 0);
    let plus_token_balance = token::balance_of(receiver_addr, plus_token_id);
    let minus_token_data_id = token::create_token_data_id(COLLECTION_ADDRESS, string::utf8(COLLECTION_NAME), minus_token_name);
    let minus_token_id = token::create_token_id(minus_token_data_id, 0);
    let minus_token_balance = token::balance_of(receiver_addr, minus_token_id);
    assert!(plus_token_balance >= amount, ENOT_ENOUGH_OPTIONS_BALANCE);
    assert!(minus_token_balance >= amount, ENOT_ENOUGH_OPTIONS_BALANCE);

    let plus_token_property = token::get_property_map(receiver_addr, plus_token_id);
    let plus_is_call = property_map::read_bool(&plus_token_property, &string::utf8(b"option_type")) == true;
    let plus_maturity = property_map::read_u64(&plus_token_property, &string::utf8(b"maturity"));
    let plus_strike_price = property_map::read_u64(&plus_token_property, &string::utf8(b"strike_price")) * SUFFIX_PRICE_PARSING;
    let plus_is_long = property_map::read_bool(&plus_token_property, &string::utf8(b"direction_type")) == true;
    let minus_token_property = token::get_property_map(receiver_addr, minus_token_id);
    let minus_is_call = property_map::read_bool(&minus_token_property, &string::utf8(b"option_type")) == true;
    let minus_maturity = property_map::read_u64(&minus_token_property, &string::utf8(b"maturity"));
    let minus_strike_price = property_map::read_u64(&minus_token_property, &string::utf8(b"strike_price")) * SUFFIX_PRICE_PARSING;
    let minus_is_long = property_map::read_bool(&minus_token_property, &string::utf8(b"direction_type")) == true;
    assert!(plus_is_call == minus_is_call && plus_maturity == minus_maturity && plus_strike_price == minus_strike_price && plus_is_long == !minus_is_long, EWRONG_TOKEN_PAIRS);
    assert!(plus_maturity > (timestamp::now_microseconds() / (1000000)), EALREADY_MATURED);

    token::burn(receiver, COLLECTION_ADDRESS, string::utf8(COLLECTION_NAME), plus_token_name, 0, amount);
    token::burn(receiver, COLLECTION_ADDRESS, string::utf8(COLLECTION_NAME), minus_token_name, 0, amount);

    if (plus_is_call) {
      assert!(coin::balance<AptosCoin>(@controller) >= amount * SUFFIX_APTOS, ENOT_ENOUGH_BALANCE);
      coin::transfer<AptosCoin>(&resource_signer, receiver_addr, amount * SUFFIX_APTOS);
    } else {
      assert!(coin::balance<T>(@controller) >= amount * plus_strike_price, ENOT_ENOUGH_BALANCE);
      coin::transfer<T>(&resource_signer, receiver_addr, amount * plus_strike_price);
    };
  }

  public entry fun stake_options_with_funds(
    signer: &signer,
    token_name: String,
    amount: u64
  ) acquires StakeData {
    // Validate token
    assert!(token::check_tokendata_exists(COLLECTION_ADDRESS, string::utf8(COLLECTION_NAME), token_name), ENOT_EXISTED_TOKEN);

    let signer_addr = signer::address_of(signer);
    let stake_data = borrow_global_mut<StakeData>(@controller);

    // Validate token balance
    let token_data_id = token::create_token_data_id(COLLECTION_ADDRESS, string::utf8(COLLECTION_NAME), token_name);
    let token_id = token::create_token_id(token_data_id, 0);
    let token_balance = token::balance_of(signer_addr, token_id);
    assert!(token_balance >= amount, ENOT_ENOUGH_OPTIONS_BALANCE);

    // Get token properties
    let property = token::get_property_map(signer_addr, token_id);
    let is_call = property_map::read_bool(&property, &string::utf8(b"option_type")) == true;
    let maturity = property_map::read_u64(&property, &string::utf8(b"maturity"));
    let strike_price = property_map::read_u64(&property, &string::utf8(b"strike_price")) * SUFFIX_PRICE_PARSING;
    let is_plus = property_map::read_bool(&property, &string::utf8(b"direction_type")) == true;

    // Initialize StakeDataByMaturity if not exist
    if (!table::contains(&stake_data.stake_data_by_maturity, maturity)) {
      table::add(
        &mut stake_data.stake_data_by_maturity,
        maturity,
        StakeDataByMaturity {
          strike_prices: vector::empty<u64>(),
          staked_token_and_user_data_by_strike_price: table::new(),
          is_settled: false,
        }
      );
    };

    let stake_data_by_maturity = table::borrow_mut(&mut stake_data.stake_data_by_maturity, maturity);

    // Initialize StakedTokenAndUserData if not exist
    if (!table::contains(&stake_data_by_maturity.staked_token_and_user_data_by_strike_price, strike_price)) {
      vector::push_back(&mut stake_data_by_maturity.strike_prices, strike_price);

      table::add(
        &mut stake_data_by_maturity.staked_token_and_user_data_by_strike_price,
        strike_price,
        StakedTokenAndUserData {
          token_amount_to_be_settled: 0,
          users: vector::empty<vector<address>>(),
          call_plus_amount_by_user: table::new(),
          call_minus_amount_by_user: table::new(),
          put_plus_amount_by_user: table::new(),
          put_minus_amount_by_user: table::new(),
          usdc_amount_by_user: table::new(),
        }
      );
    };

    let staked_token_and_user_data_by_strike_price = table::borrow_mut(&mut stake_data_by_maturity.staked_token_and_user_data_by_strike_price, strike_price);

    // Initialize users in StakedTokenAndUserData if not exist
    if (vector::length(&staked_token_and_user_data_by_strike_price.users) == 0) {
      let i=0;
      while (i < 5) {
        let init = vector::empty<address>();
        vector::push_back(&mut staked_token_and_user_data_by_strike_price.users, init);
        i = i + 1;
      };
    };

    // Receive tokens from stakers
    token::transfer(signer, token_id, @controller, amount);

    // Receive funds from stakers when necessary and update StakeData
    if (is_call) {
      if (is_plus) {
        // 1) Process for Receiving USDC
        coin::transfer<T>(signer, @controller, amount * strike_price);

        // Update StakeData 
        stake_data.total_staked_usdc_amount = stake_data.total_staked_usdc_amount + amount * strike_price;

        // Initialize users, USDCAmount in StakedTokenAndUserData if not exist
        let usersInUSDC = vector::borrow_mut(&mut staked_token_and_user_data_by_strike_price.users, 4);
        
        if (!vector::contains(usersInUSDC, &signer_addr)) {
          vector::push_back(usersInUSDC, signer_addr);
        };

        if (!table::contains(&staked_token_and_user_data_by_strike_price.usdc_amount_by_user, signer_addr)) {
          table::add(&mut staked_token_and_user_data_by_strike_price.usdc_amount_by_user, signer_addr, 0);
        };

        let usdc_amount_by_user = table::borrow_mut(&mut staked_token_and_user_data_by_strike_price.usdc_amount_by_user, signer_addr);

        // Update StakedTokenAndUserData
        *usdc_amount_by_user = *usdc_amount_by_user + amount * strike_price;

        // 2) Process for Receiving CallPlus
        // Update StakeData 
        stake_data.current_call_plus_amount = stake_data.current_call_plus_amount + amount;

        // Initialize users, CallPlusAmountByUser in StakedTokenAndUserData if not exist
        let users = vector::borrow_mut(&mut staked_token_and_user_data_by_strike_price.users, 0);
        
        if (!vector::contains(users, &signer_addr)) {
          vector::push_back(users, signer_addr);
        };

        if (!table::contains(&staked_token_and_user_data_by_strike_price.call_plus_amount_by_user, signer_addr)) {
          table::add(&mut staked_token_and_user_data_by_strike_price.call_plus_amount_by_user, signer_addr, 0);
        };

        let call_plus_amount_by_user = table::borrow_mut(&mut staked_token_and_user_data_by_strike_price.call_plus_amount_by_user, signer_addr);

        // Update StakedTokenAndUserData
        staked_token_and_user_data_by_strike_price.token_amount_to_be_settled = staked_token_and_user_data_by_strike_price.token_amount_to_be_settled + amount;
        *call_plus_amount_by_user = *call_plus_amount_by_user + amount;
      } else {
        // Update StakeData 
        stake_data.current_call_minus_amount = stake_data.current_call_minus_amount + amount;

        // Initialize users, CallMinusAmountByUser in StakedTokenAndUserData if not exist
        let users = vector::borrow_mut(&mut staked_token_and_user_data_by_strike_price.users, 1);
        
        if (!vector::contains(users, &signer_addr)) {
          vector::push_back(users, signer_addr);
        };

        if (!table::contains(&staked_token_and_user_data_by_strike_price.call_minus_amount_by_user, signer_addr)) {
          table::add(&mut staked_token_and_user_data_by_strike_price.call_minus_amount_by_user, signer_addr, 0);
        };

        let call_minus_amount_by_user = table::borrow_mut(&mut staked_token_and_user_data_by_strike_price.call_minus_amount_by_user, signer_addr);

        // Update StakedTokenAndUserData
        staked_token_and_user_data_by_strike_price.token_amount_to_be_settled = staked_token_and_user_data_by_strike_price.token_amount_to_be_settled + amount;
        *call_minus_amount_by_user = *call_minus_amount_by_user + amount;
      };
    } else {
      if (is_plus) {
        // Update StakeData 
        stake_data.current_put_plus_amount = stake_data.current_put_plus_amount + amount;

        // Initialize users, PutPlusAmountByUser in StakedTokenAndUserData if not exist
        let users = vector::borrow_mut(&mut staked_token_and_user_data_by_strike_price.users, 2);
        
        if (!vector::contains(users, &signer_addr)) {
          vector::push_back(users, signer_addr);
        };

        if (!table::contains(&staked_token_and_user_data_by_strike_price.put_plus_amount_by_user, signer_addr)) {
          table::add(&mut staked_token_and_user_data_by_strike_price.put_plus_amount_by_user, signer_addr, 0);
        };

        let put_plus_amount_by_user = table::borrow_mut(&mut staked_token_and_user_data_by_strike_price.put_plus_amount_by_user, signer_addr);

        // Update StakedTokenAndUserData
        staked_token_and_user_data_by_strike_price.token_amount_to_be_settled = staked_token_and_user_data_by_strike_price.token_amount_to_be_settled + amount;
        *put_plus_amount_by_user = *put_plus_amount_by_user + amount;
      } else {
        // Update StakeData 
        stake_data.current_put_minus_amount = stake_data.current_put_minus_amount + amount;

        // Initialize users, PutMinusAmountByUser in StakedTokenAndUserData if not exist
        let users = vector::borrow_mut(&mut staked_token_and_user_data_by_strike_price.users, 3);
        
        if (!vector::contains(users, &signer_addr)) {
          vector::push_back(users, signer_addr);
        };

        if (!table::contains(&staked_token_and_user_data_by_strike_price.put_minus_amount_by_user, signer_addr)) {
          table::add(&mut staked_token_and_user_data_by_strike_price.put_minus_amount_by_user, signer_addr, 0);
        };

        let put_minus_amount_by_user = table::borrow_mut(&mut staked_token_and_user_data_by_strike_price.put_minus_amount_by_user, signer_addr);

        // Update StakedTokenAndUserData
        staked_token_and_user_data_by_strike_price.token_amount_to_be_settled = staked_token_and_user_data_by_strike_price.token_amount_to_be_settled + amount;
        *put_minus_amount_by_user = *put_minus_amount_by_user + amount;
      };
    };
  }

  public entry fun settle_staked_options(
    maturity: u64, // seconds
  ) acquires ModuleData, StakeData {
    // Validate maturity
    assert!(maturity < (timestamp::now_microseconds() / (1000000)), ENOT_MATURED);
    let (_, _, _, hour, minute, second) = date::timestamp_to_date_time(maturity);
    let day_of_week = date::get_day_of_week(maturity);
    assert!((hour == 8) && (minute == 0) && (second == 0), EWRONG_MATURITY);
    assert!(day_of_week == 5, EWRONG_MATURITY);

    // Validate StakeData
    let stake_data = borrow_global_mut<StakeData>(@controller);
    assert!(table::contains(&stake_data.stake_data_by_maturity, maturity), ENOT_EXISTED_STAKED_TOKEN_DATA);

    // Validate StakeDataByMaturity
    let stake_data_by_maturity = table::borrow_mut(&mut stake_data.stake_data_by_maturity, maturity);
    assert!(stake_data_by_maturity.is_settled == false, EALREADY_SETTLED);
    let strike_price_len = vector::length(&stake_data_by_maturity.strike_prices);
    assert!(strike_price_len > 0, ENOT_EXISTED_STAKED_TOKEN_DATA);

    let module_data = borrow_global_mut<ModuleData>(@controller);
    let resource_signer = account::create_signer_with_capability(&module_data.signer_cap);

    let price_at_maturity = price_feed::get_price(maturity);
    
    let i=0;
    while (i < strike_price_len) {
      let strike_price = vector::borrow(&stake_data_by_maturity.strike_prices, i);
      let strike_price_parsed = *strike_price / SUFFIX_APTOS;
      let staked_token_and_user_data_by_strike_price = table::borrow_mut(&mut stake_data_by_maturity.staked_token_and_user_data_by_strike_price, *strike_price);
      assert!(staked_token_and_user_data_by_strike_price.token_amount_to_be_settled > 0, ENOT_EXISTED_STAKED_TOKEN_DATA);

      let j=0;
      while (j < 4) {
        let users = vector::borrow(&staked_token_and_user_data_by_strike_price.users, j);
        let users_len = vector::length(users);

        if (users_len == 0) {
          j = j + 1;
          continue
        };

        let k=0;
        while (k < users_len) {
          let user = vector::borrow(users, k);

          if (j == 0) {
            let token_name = get_token_name(maturity, strike_price_parsed, true, true);
            let amount = table::borrow(&staked_token_and_user_data_by_strike_price.call_plus_amount_by_user, *user);

            token::burn(&resource_signer, COLLECTION_ADDRESS, string::utf8(COLLECTION_NAME), token_name, 0, *amount);

            if (*strike_price <= price_at_maturity) { // ITM
              coin::transfer<AptosCoin>(&resource_signer, *user, *amount * SUFFIX_APTOS);
            } else { // OTM
              // DO NOTHING
            };
            
            // Update ModuleData
            module_data.total_call_volume = module_data.total_call_volume - *amount;

            // Update StakeData
            stake_data.current_call_plus_amount = stake_data.current_call_plus_amount - *amount;

            // UpdateStakedTokenAndUserData
            staked_token_and_user_data_by_strike_price.token_amount_to_be_settled = staked_token_and_user_data_by_strike_price.token_amount_to_be_settled - *amount;
          } else if (j == 1) {
            let token_name = get_token_name(maturity, strike_price_parsed, true, false);
            let amount = table::borrow(&staked_token_and_user_data_by_strike_price.call_minus_amount_by_user, *user);

            token::burn(&resource_signer, COLLECTION_ADDRESS, string::utf8(COLLECTION_NAME), token_name, 0, *amount);

            if (*strike_price <= price_at_maturity) { // ITM
              coin::transfer<T>(&resource_signer, *user,  *amount * *strike_price); 
            } else { // OTM
              coin::transfer<AptosCoin>(&resource_signer, *user, *amount * SUFFIX_APTOS); 
            };
            
            // Update ModuleData
            module_data.total_call_volume = module_data.total_call_volume - *amount;

            // Update StakeData
            stake_data.current_call_minus_amount = stake_data.current_call_minus_amount - *amount;

            // UpdateStakedTokenAndUserData
            staked_token_and_user_data_by_strike_price.token_amount_to_be_settled = staked_token_and_user_data_by_strike_price.token_amount_to_be_settled - *amount;
          } else if (j == 2) {
            let token_name = get_token_name(maturity, strike_price_parsed, false, true);
            let amount = table::borrow(&staked_token_and_user_data_by_strike_price.put_plus_amount_by_user, *user);

            token::burn(&resource_signer, COLLECTION_ADDRESS, string::utf8(COLLECTION_NAME), token_name, 0, *amount);

            if (*strike_price <= price_at_maturity) { // ITM
              coin::transfer<T>(&resource_signer, *user, *amount * (*strike_price - price_at_maturity));
            } else { // OTM
              // DO NOTHING
            };
            
            // Update ModuleData
            module_data.total_put_volume = module_data.total_put_volume - *amount;

            // Update StakeData
            stake_data.current_put_plus_amount = stake_data.current_put_plus_amount - *amount;

            // UpdateStakedTokenAndUserData
            staked_token_and_user_data_by_strike_price.token_amount_to_be_settled = staked_token_and_user_data_by_strike_price.token_amount_to_be_settled - *amount;
          } else if (j == 3) {
            let token_name = get_token_name(maturity, strike_price_parsed, false, false);
            let amount = table::borrow(&staked_token_and_user_data_by_strike_price.put_minus_amount_by_user, *user);

            token::burn(&resource_signer, COLLECTION_ADDRESS, string::utf8(COLLECTION_NAME), token_name, 0, *amount);

            if (*strike_price <= price_at_maturity) { // ITM
              coin::transfer<T>(&resource_signer, *user, *amount * price_at_maturity);
            } else { // OTM
              coin::transfer<T>(&resource_signer, *user, *amount * *strike_price);
            };
            
            // Update ModuleData
            module_data.total_put_volume = module_data.total_put_volume - *amount;

            // Update StakeData
            stake_data.current_put_minus_amount = stake_data.current_put_minus_amount - *amount;

            // UpdateStakedTokenAndUserData
            staked_token_and_user_data_by_strike_price.token_amount_to_be_settled = staked_token_and_user_data_by_strike_price.token_amount_to_be_settled - *amount;
          };
        };

        j = j + 1;
      };

      i = i + 1;
    };

    stake_data_by_maturity.is_settled = true;    
  }

  public entry fun recover_token(caller: &signer) acquires ModuleData {
    let caller_address = signer::address_of(caller);
    assert!(caller_address == ADMIN_ADDRESS, error::permission_denied(ENOT_AUTHORIZED));

    let module_data = borrow_global_mut<ModuleData>(@controller);
    let resource_signer = account::create_signer_with_capability(&module_data.signer_cap);

    let balance_aptos = coin::balance<AptosCoin>(@controller);
    let balance_usdc = coin::balance<T>(@controller);

    if (balance_aptos > 0) {
      coin::transfer<AptosCoin>(&resource_signer, ADMIN_ADDRESS, balance_aptos);
    };

    if (balance_usdc > 0) {
      coin::transfer<T>(&resource_signer, ADMIN_ADDRESS, balance_usdc);
    };
  }

  // Utility functions
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

  // Get functions
  public fun get_last_price(): u64 acquires ModuleData {
    let last_price = borrow_global_mut<ModuleData>(@controller).last_price;
    last_price
  }

  public fun get_token_name(
    maturity: u64,
    strike_price_parsed: u64,
    is_call: bool,
    is_plus: bool,
  ): String {
    let option_type = if (is_call) { string::utf8(b"CALL") } else { string::utf8(b"PUT") };
    let direction_type = if (is_plus) { string::utf8(b"LONG") } else { string::utf8(b"SHORT") };
    let token_name = string::utf8(b"");

    let (year, month, day, hour, minute, second) = date::timestamp_to_date_time(maturity);
    
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

    let strike_price_parsed_integer = to_string(strike_price_parsed / 100);
    let strike_price_parsed_decimal = to_string(strike_price_parsed % 100);

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
    string::append(&mut token_name, to_string_for_date(second));
    string::append(&mut token_name, string::utf8(b"UTC0"));

    string::append(&mut token_name, string::utf8(b"_"));
    string::append(&mut token_name, strike_price_parsed_integer);
    string::append(&mut token_name, string::utf8(b"."));
    string::append(&mut token_name, strike_price_parsed_decimal);

    string::append(&mut token_name, string::utf8(b"_"));
    string::append(&mut token_name, option_type);

    string::append(&mut token_name, string::utf8(b"_"));
    string::append(&mut token_name, direction_type);

    token_name
  }

  // Set functions
  public entry fun set_last_price(
    caller: &signer,
    new_price: u64
  ) acquires ModuleData {
    let caller_address = signer::address_of(caller);
    assert!(caller_address == ADMIN_ADDRESS, error::permission_denied(ENOT_AUTHORIZED));
    assert!(new_price >= 500000, EWRONG_PRICE_RANGE); // Strike price check

    let module_data = borrow_global_mut<ModuleData>(@controller);
    module_data.last_price = new_price;
  }

  public entry fun set_paused(
    caller: &signer,
    paused: bool
  ) acquires ModuleData {
    let caller_address = signer::address_of(caller);
    assert!(caller_address == ADMIN_ADDRESS, error::permission_denied(ENOT_AUTHORIZED));

    let module_data = borrow_global_mut<ModuleData>(@controller);
    module_data.paused = paused;
  }

  // View functions
  #[view]
  public fun get_payout(
    receiver_addr:address,
    token_name: String,
    balance: u64
  ): u64 {  
    let token_data_id = token::create_token_data_id(@controller, string::utf8(COLLECTION_NAME), token_name);
    let token_id = token::create_token_id(token_data_id, 0);

    // 0. Get token's properties
    let property = token::get_property_map(receiver_addr, token_id);
    let is_call = property_map::read_bool(&property, &string::utf8(b"option_type")) == true;
    let maturity = property_map::read_u64(&property, &string::utf8(b"maturity"));
    let strike_price = property_map::read_u64(&property, &string::utf8(b"strike_price")) * SUFFIX_PRICE_PARSING;
    let is_long = property_map::read_bool(&property, &string::utf8(b"direction_type")) == true;

    // 1. Get last price
    // let last_price = get_last_price();
    let price_at_maturity = price_feed::get_price(maturity);

    let payout;
    if (is_call) {
      if (strike_price <= price_at_maturity) { // ITM, ATM for Call Options
        if (is_long) {
          payout = balance * SUFFIX_APTOS;
        } else {
          payout = balance * strike_price;
        };
      } else { // OTM for Call Options
        if (is_long) {
          payout = 0;
        } else {
          payout = balance * SUFFIX_APTOS
        }
      };
    } else {
      if (strike_price >= price_at_maturity) { // ITM, ATM for Put Options
        if (is_long) {
          payout = balance * (strike_price - price_at_maturity);
        } else {
          payout = balance * price_at_maturity;
        };
      } else { // OTM for Put Options
        if (is_long) {
          payout = 0;
        } else {
          payout = balance * strike_price;
        };
      };
    };

    payout
  }

  #[view]
  public fun get_volume_data_by_maturity(
    keys: vector<u64>
  ): vector<vector<u64>> acquires ModuleData {
    let key_len = vector::length(&keys);
    let result = vector::empty<vector<u64>>();

    let i=0;
    while (i < key_len) {
      let data = vector::empty<u64>();
      let key = vector::borrow(&keys, i);
      let maturity = *key;

      let module_data = borrow_global_mut<ModuleData>(@controller);
      let value;
      if (table::contains(&mut module_data.volume_data_by_maturity, maturity)) {
        value = table::borrow_mut(&mut module_data.volume_data_by_maturity, maturity);
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
  public fun get_volume_data_by_strike_price(
    keys: vector<u64>
  ): vector<vector<u64>> acquires ModuleData {
    let key_len = vector::length(&keys);
    let result = vector::empty<vector<u64>>();

    let i=0;
    while (i < key_len) {
      let data = vector::empty<u64>();
      let key = vector::borrow(&keys, i);

      let module_data = borrow_global_mut<ModuleData>(@controller);
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
}