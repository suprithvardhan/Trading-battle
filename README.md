# Paper Trading Battle

A real-time paper trading platform where users can compete in trading matches with professional-grade order execution.

## Features

- **Real-time Trading**: Live price data from Binance WebSocket feeds
- **Smart Order Execution**: Professional-grade order matching with breakout/pullback logic
- **Trading Matches**: Compete with friends in real-time trading battles
- **Advanced Charting**: Multiple timeframes with zoom/pan functionality
- **Order Management**: Complete order lifecycle management
- **Position Tracking**: Real-time P&L and margin calculations
- **Microservice Architecture**: Scalable order execution service

## Tech Stack

- **Frontend**: React, Vite, Tailwind CSS, Framer Motion, Socket.IO
- **Backend**: Node.js, Express, MongoDB, Mongoose
- **Order Execution**: Dedicated microservice with WebSocket management
- **Real-time**: Binance WebSocket feeds, Socket.IO for client communication
- **Charts**: Highcharts with professional trading features

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

## Getting Started

### Quick Start (All Services)

1. Clone the repository
2. Run `start-all-services.bat` (Windows) or manually start each service
3. Open http://localhost:5173

### Manual Setup

1. **Install Dependencies**
   ```bash
   npm install                    # Frontend dependencies
   cd backend && npm install     # Backend dependencies
   cd ../order-execution-service && npm install  # Execution service
   ```

2. **Start Services**
   ```bash
   # Terminal 1: Backend Server
   cd backend
   npm start
   
   # Terminal 2: Order Execution Service
   cd order-execution-service
   npm start
   
   # Terminal 3: Frontend
   npm run dev
   ```

3. **Access the Application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000
   - Order Execution: http://localhost:5001

## Project Structure

```
paper-trading-battle/
├── src/                           # Frontend React app
│   ├── components/                # React components
│   ├── services/                  # WebSocket services
│   └── pages/                    # Page components
├── backend/                       # Main backend server
│   ├── models/                   # MongoDB models
│   ├── routes/                   # API routes
│   └── middleware/               # Express middleware
├── order-execution-service/       # Order execution microservice
│   ├── server.js                 # Execution service server
│   └── package.json              # Service dependencies
├── public/                       # Static assets
└── README.md
```

## Order Execution Features

- **Smart Execution Logic**: Breakout/pullback detection for realistic order execution
- **Real-time Processing**: WebSocket-based price monitoring
- **Efficient Resource Management**: One connection per ticker, multiple orders
- **Automatic Reconnection**: Handles connection drops gracefully
- **Position Management**: Automatic position creation and updates
- **TP/SL Orders**: Automatic take profit and stop loss order creation

## Development

The application uses a microservice architecture for scalability:

1. **Main Server**: Handles user authentication, order CRUD, and database operations
2. **Execution Service**: Dedicated service for real-time order execution
3. **Frontend**: React application with real-time WebSocket connections

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test all services
5. Submit a pull request