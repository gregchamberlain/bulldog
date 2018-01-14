const express = require('express');
const axios = require('axios');
const ccxt = require('ccxt');

const BASE_CURRENCIES = ['LTC', 'BTC', 'XRP'];
const EXCHANGES = ['kraken', 'bittrex', 'bitfinex'];

const app = express();

app.get('/', (req, res) => {
  res.send('hello');
});

app.listen(3000, () => {
  console.log('Listening on port 3000');
});

const getMarketData = async (exchangeName) => {
  const exchange = new ccxt[exchangeName]();
  const markets = await exchange.load_markets();
  const ret = {};
  Object.entries(markets).forEach(([market, marketInfo]) => {
    if (new RegExp(`${BASE_CURRENCIES.join('|')}`).test(market)) {
      ret[market] = marketInfo;
    }
  });
  return ret;
};

const mergeMarketData = async (exchanges) => {
  const perMarket = {};
  for (const ex of EXCHANGES) {
    const marketData = await getMarketData(ex);
    Object.entries(marketData).forEach(([market, marketInfo]) => {
      perMarket[market] ? perMarket[market].push(marketInfo) : perMarket[market] = [marketInfo];
    });
  }

  const arbitrageAvailables = {};
  Object.entries(perMarket).forEach(([market, marketInfoArr]) => {
    if (marketInfoArr.length > 1) {
      arbitrageAvailables[market] = marketInfoArr;
    }
  });
  console.log(arbitrageAvailables);
  return arbitrageAvailables;
};

mergeMarketData();
