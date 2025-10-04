# Order Execution Microservice

This microservice handles real-time order execution for the Paper Trading Battle application.

## Features

- **Real-time Order Processing**: Monitors Binance WebSocket feeds for price updates
- **Smart Execution Logic**: Implements breakout/pullback execution logic
- **WebSocket Communication**: Real-time communication with frontend clients
- **Efficient Resource Management**: One WebSocket connection per ticker, multiple orders
- **Automatic Reconnection**: Handles connection drops gracefully

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Main Server   │    │ Order Execution  │    │   Binance WS    │
│   (Port 5000)   │    │   Microservice   │    │   (Real-time)    │
│                 │    │   (Port 5001)    │    │                 │
│  - User Auth    │───▶│  - Order Logic   │───▶│  - Price Feed   │
│  - Order CRUD   │    │  - Execution     │    │  - Ticker Data   │
│  - Database    │    │  - WebSocket     │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │
         │                       │
         ▼                       ▼
┌─────────────────┐    ┌──────────────────┐
│   Frontend      │    │   Database       │
│   (Port 5173)   │    │   (MongoDB)      │
│                 │    │                 │
│  - Order UI     │    │  - Orders        │
│  - Positions   │    │  - Positions     │
│  - WebSocket   │    │  - Users         │
└─────────────────┘    └──────────────────┘
```

## Installation

```bash
cd order-execution-service
npm install
```

## Running

```bash
npm start
```

## API Endpoints

- `POST /notify-new-order` - Notify service of new orders
- `GET /health` - Health check endpoint

## WebSocket Events

### Client → Server
- `subscribe_orders` - Subscribe to order execution for a user/match

### Server → Client
- `price_update` - Real-time price updates
- `order_executed` - Order execution notifications

## Configuration

The service connects to the same MongoDB database as the main server and listens on port 5001 by default.

## Smart Execution Logic

The service implements intelligent order execution based on market conditions:

1. **Breakout Orders**: When market price at placement < limit price, execute when current price >= limit price
2. **Pullback Orders**: When market price at placement > limit price, execute when current price <= limit price
3. **Stop Market Orders**: Execute when price crosses the stop level

This ensures orders execute in realistic market conditions, similar to professional trading platforms.
