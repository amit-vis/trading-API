require("dotenv").config();
const WebSocket = require("ws");
const logger = require("../utils/logger")

let currentPrice = null;
let socket;
let subscribedSymbols = new Set(); // To track subscribed symbols

// WebSocket setup for real-time stock prices
const getAPI = async () => {
    socket = new WebSocket('wss://ws.finnhub.io?token=crvvkl1r01qrbtrl5f40crvvkl1r01qrbtrl5f4g');

    socket.on('open', () => {
        console.log('WebSocket connection opened');
        subscribeToSymbol('AAPL');           // Apple stock
        subscribeToSymbol('BINANCE:BTCUSDT'); // Bitcoin/USDT on Binance
        subscribeToSymbol('IC MARKETS:1');    // EUR/USD on IC Markets
    });

    socket.on('message', (data) => {
        const parsedData = JSON.parse(data);

        if (parsedData.type === 'trade') {
            parsedData.data.forEach(trade => {
                if (trade.s === 'AAPL') {
                    currentPrice = trade.p;

                    // Initialize previousPrice if it's null
                    if (previousPrice === null) {
                        previousPrice = currentPrice;
                    }
                    return executeStrategy();  // Call strategy here when price is updated
                }
            });
        }
    });

    socket.on('error', (err) => {
        console.error('WebSocket error:', err);
    });

    socket.on('close', () => {
        console.log('WebSocket connection closed');
    });
};

// Subscribe to a symbol
const subscribeToSymbol = (symbol) => {
    if (socket && socket.readyState === WebSocket.OPEN && !subscribedSymbols.has(symbol)) {
        socket.send(JSON.stringify({ 'type': 'subscribe', 'symbol': symbol }));
        subscribedSymbols.add(symbol); // Track the subscribed symbol
        console.log(`Subscribed to ${symbol}`);
    }
};

// Unsubscribe from a symbol
const unsubscribeFromSymbol = (symbol) => {
    if (socket && socket.readyState === WebSocket.OPEN && subscribedSymbols.has(symbol)) {
        socket.send(JSON.stringify({ 'type': 'unsubscribe', 'symbol': symbol }));
        subscribedSymbols.delete(symbol); // Remove symbol from the subscribed list
        console.log(`Unsubscribed from ${symbol}`);
    }
};

// Buy and Sell Logic
let previousPrice = null;
let balance = 220;
let position = 0;

const buyStock = (price) => {
    if (balance >= price) {
        position = balance / price;
        balance = 0;
        logger.log(`Bought at $${price.toFixed(2)}. Current position: ${position} shares.`)
    }
};

const sellStock = (price) => {
    if (position > 0) {
        balance = position * price;
        position = 0;
        logger.log(`Sold at $${price.toFixed(2)}. Balance: $${balance.toFixed(2)}.`);

    }
};

// Trading Strategy based on price changes
const executeStrategy = () => {
    logger.log(`Current Price: $${currentPrice.toFixed(2)}`);
    if (previousPrice) {
        const priceDrops = ((previousPrice - currentPrice) / previousPrice) * 100;
        const priceRise = ((currentPrice - previousPrice) / previousPrice) * 100;

        if (priceDrops >= 2) {
            return buyStock(currentPrice);
        } else if (priceRise >= 3) {
            return sellStock(currentPrice);
        }
    }

    // Update previousPrice to currentPrice for the next iteration
    previousPrice = currentPrice;
};

// Start the trading process
const startTrading = async (res) => {
    try {
        await getAPI(); // Initialize WebSocket connection
    } catch (error) {
        return res.status(500).json({
            message: "Error in starting the trading",
            err: error.message
        });
    }
};

// Example: Unsubscribe from a symbol after some time (optional use case)
const stopTrading = () => {
    unsubscribeFromSymbol('AAPL'); // Unsubscribe from Apple stock updates
    unsubscribeFromSymbol('BINANCE:BTCUSDT'); // Unsubscribe from BTC/USDT updates
};

module.exports = { startTrading, stopTrading };
