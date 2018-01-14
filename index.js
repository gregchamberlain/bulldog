const express = require('express');
const axios = require('axios');
const ccxt = require('ccxt');
const _ = require('lodash');

const BASE_CURRENCIES = ['LTC', 'BTC', 'XRP'];
const EXCHANGES = ['kraken', 'bittrex'];

const app = express();

app.get('/', (req, res) => {
  res.send('hello');
});

app.listen(3000, () => {
  console.log('Listening on port 3000');
});

const getMarkets = async (exchangeName) => {
  const exchange = new ccxt[exchangeName]();
  const markets = await exchange.loadMarkets();
  const ret = [];
  Object.entries(markets).forEach(([market, marketInfo]) => {
    if (new RegExp(`${BASE_CURRENCIES.join('|')}`).test(market)) {
      ret.push(market);
    }
  });
  return ret;
};

const findArbitrageableMarkets = async (exchanges) => {
  const marketReverseIndex = {};
  for (const ex of exchanges) {
    const markets = await getMarkets(ex);
    markets.forEach((market) => {
      marketReverseIndex[market] = (marketReverseIndex[market] || []);
      marketReverseIndex[market].push(ex);
    });
  }

  const ret = _.pickBy(marketReverseIndex, (exchanges, market) => {
    return exchanges.length > 1;
  });
  return ret;
};

const getPerMarketData = async () => {
  const validMarkets = await findArbitrageableMarkets(EXCHANGES);
  const res = {};
  for (const [market, exchanges] of Object.entries(validMarkets)) {
    for (const exchange of exchanges) {
      const marketInfo = await new ccxt[exchange]().fetchTicker(market);
      res[market] = (res[market] || []);
      const cmpInfo = {
        info: marketInfo,
        exchange,
        price: marketInfo.last,
      };
      res[market].push(cmpInfo)
    }
  }
  return res;
};

const selectLimits = (exchangeMarketInfoArr) => {
  let minPrice = Infinity;
  let maxPrice = -Infinity;
  let minInfo, maxInfo;
  exchangeMarketInfoArr.forEach((emi) => {
    if (emi.price > maxPrice) {
      maxInfo = emi;
      maxPrice = emi.price;
    }
    if (emi.price < minPrice) {
      minInfo = emi;
      minPrice = emi.price;
    }
  });
  return [minInfo, maxInfo];
};

const compareExchanges = async () => {
  const comparisons = [];
  const perMarketData = await getPerMarketData();
  Object.entries(perMarketData).forEach(([market, exchangeMarketInfoArr]) => {
    const [minInfo, maxInfo] = selectLimits(exchangeMarketInfoArr);
    comparisons.push({
      market,
      lowest: {
        price: minInfo.price,
        exchange: minInfo.exchange,
      },
      highest: {
        price: maxInfo.price,
        exchange: maxInfo.exchange,
      }
    });
  });

  comparisons.forEach((comparison) => {
    console.log(comparison.market);
    console.log(comparison.lowest);
    console.log(comparison.highest);
    console.log('\n\n\n');
  });
  return comparisons
}

compareExchanges();
