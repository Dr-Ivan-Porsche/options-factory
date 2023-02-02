import { request, gql } from 'graphql-request'
import { forkJoin, from, Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import { CONTRACT_ADDRESS } from '../constants/address'
import { hexToUtf8 } from '../utils/misc'

export const INDEXER_URL = "https://indexer-devnet.staging.gcp.aptosdev.com/v1/graphql"

export const getMyOptions$ = ({ account, page }: { account: string, page: number }) => {
  return from(
    request(
      INDEXER_URL,
      gql`
      query($account: String!, $creator_address: String!, $offset: Int!) {
        current_token_ownerships(
          limit: 5,
          offset: $offset,
          where: {owner_address: {_eq: $account}, creator_address: {_eq: $creator_address }, amount: {_gte: "1"}},
          order_by: {last_transaction_timestamp: desc}
        ) {
          amount
          name
          owner_address
          current_token_data {
            supply
            default_properties
            last_transaction_timestamp
          }
        } 
      }
    `, {
      account: String(account).toLowerCase(),
      offset: 5 * (page - 1),
      creator_address: CONTRACT_ADDRESS,
    })).pipe(
      map(({ current_token_ownerships }) => {

        return current_token_ownerships.map((item: any) => {
          const properties = item?.current_token_data?.default_properties

          return {
            ...item,
            last_transaction_timestamp: new Date(item.current_token_data.last_transaction_timestamp).getTime(),
            direction_type: properties?.direction_type === "true" ? "LONG" : "SHORT",
            maturity: properties?.maturity,
            option_type: properties?.option_type === "true" ? "CALL" : "PUT",
            strike_price: hexToUtf8(properties?.strike_price),
            last_price_at_maturity: Number(properties?.last_price_at_maturity) / 100,
            // item.current_token_data.default_properties
          }
        })
      })
    )
}

export const getAllIssuances$ = ({ page }: { page: number }) => {
  return from(
    request(
      INDEXER_URL,
      gql`
      query($creator_address: String!, $offset: Int!) {
        current_token_ownerships(
          limit: 100,
          offset: $offset,
          where: { creator_address: {_eq: $creator_address }, amount: {_gte: "1"}},
          order_by: {last_transaction_timestamp: desc}
        ) {
          amount
          name
          owner_address
          current_token_data {
            supply
            default_properties
            last_transaction_timestamp
          }
        } 
      }
    `, {
      offset: 100 * (page - 1),
      creator_address: CONTRACT_ADDRESS,
    })).pipe(
      map(({ current_token_ownerships }) => {
        return current_token_ownerships.map((item: any) => {
          const properties = item?.current_token_data?.default_properties
          return {
            ...item,
            last_transaction_timestamp: new Date(item.current_token_data.last_transaction_timestamp).getTime(),
            direction_type: properties?.direction_type === "true" ? "LONG" : "SHORT",
            maturity: properties?.maturity,
            option_type: properties?.option_type === "true" ? "CALL" : "PUT",
            strike_price: hexToUtf8(properties?.strike_price),
            last_price_at_maturity: Number(properties?.last_price_at_maturity) / 100,
            // item.current_token_data.default_properties
          }
        })
      })
    )
}

type GetOptionArg = {
  account: string,
  name: string
}

export const getOption$ = ({ account, name }: GetOptionArg) => {
  return from(
    request(
      INDEXER_URL,
      gql`
      query($account: String!, $creator_address: String!, $name: String!) {
        current_token_ownerships(
          where: {owner_address: {_eq: $account}, creator_address: {_eq: $creator_address }, name: {_eq: $name}, amount: {_gte: "1"}},
          order_by: {last_transaction_timestamp: desc}
        ) {
          amount
          name
          owner_address
          current_token_data {
            supply
            default_properties
          }
        } 
      }
    `, {
      account: String(account).toLowerCase(),
      creator_address: CONTRACT_ADDRESS,
      name,
    })).pipe(
      map(({ current_token_ownerships }) => {

        return current_token_ownerships.map((item: any) => {
          const properties = item?.current_token_data?.default_properties
          return {
            ...item,
            direction_type: properties?.direction_type === "true" ? "LONG" : "SHORT",
            maturity: hexToUtf8(properties?.maturity),
            option_type: properties?.option_type === "true" ? "CALL" : "PUT",
            strike_price: hexToUtf8(properties?.strike_price),
            // item.current_token_data.default_properties
          }
        })[0]
      })
    )
}