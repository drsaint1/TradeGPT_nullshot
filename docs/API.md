# TradeGPT API Documentation

## Base URL

```
Development: http://localhost:4000/api
Production: https://your-domain.com/api
```

## Authentication

Currently, the API uses a simple user ID system stored in localStorage on the client side. For production, implement proper authentication (JWT, OAuth, etc.).

## API Endpoints

---

### Health Check

#### GET `/health`

Check if the server is running.

**Request:**
```http
GET /api/health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Status Codes:**
- `200 OK`: Server is healthy

---

### Chat

#### POST `/chat/message`

Send a message to the AI trading assistant.

**Request:**
```http
POST /api/chat/message
Content-Type: application/json

{
  "userId": "uuid-user-id",
  "message": "I want to long BTC with 100 USDC"
}
```

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| userId | string | Yes | Unique user identifier |
| message | string | Yes | User's message to AI |

**Response:**
```json
{
  "reply": {
    "id": "msg-uuid",
    "role": "assistant",
    "content": "Based on current market conditions...",
    "createdAt": "2024-01-15T10:30:00.000Z"
  },
  "trade": {
    "id": "trade-uuid",
    "userId": "uuid-user-id",
    "symbol": "BTC/USDC",
    "side": "LONG",
    "collateral": 100,
    "leverage": 2,
    "entryPrice": 42000,
    "stopLoss": 40000,
    "takeProfit": 46000,
    "status": "pending",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| reply | object | AI assistant's response message |
| reply.id | string | Message unique ID |
| reply.role | string | Always "assistant" |
| reply.content | string | AI's response text (markdown supported) |
| reply.createdAt | string | ISO timestamp |
| trade | object \| null | Trade suggestion (if applicable) |

**Trade Object:**

| Field | Type | Description |
|-------|------|-------------|
| id | string | Trade unique ID |
| userId | string | User ID |
| symbol | string | Trading pair (e.g., "BTC/USDC") |
| side | string | "LONG" or "SHORT" |
| collateral | number | Collateral amount in USDC |
| leverage | number | Leverage multiplier (1-100) |
| entryPrice | number | Entry price in USD |
| stopLoss | number \| null | Stop loss price |
| takeProfit | number \| null | Take profit price |
| status | string | Trade status (see below) |
| transactionHash | string \| null | Blockchain tx hash |
| preparedTx | object \| null | Prepared transaction data |
| createdAt | string | ISO timestamp |
| updatedAt | string | ISO timestamp |

**Trade Status Values:**
- `pending`: Trade suggested but not executed
- `staged`: Transaction prepared, awaiting execution
- `executed`: Trade executed on blockchain
- `cancelled`: Trade cancelled by user
- `failed`: Trade execution failed

**Status Codes:**
- `200 OK`: Message processed successfully
- `400 Bad Request`: Invalid request body
- `500 Internal Server Error`: Server error

**Example (JavaScript):**
```javascript
const response = await fetch('http://localhost:4000/api/chat/message', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'user-123',
    message: 'Should I buy ETH right now?'
  })
});

const data = await response.json();
console.log('AI Response:', data.reply.content);
if (data.trade) {
  console.log('Trade Suggested:', data.trade);
}
```

**Example (cURL):**
```bash
curl -X POST http://localhost:4000/api/chat/message \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-123",
    "message": "I want to long ETH with 50 USDC"
  }'
```

---

### Trades

#### GET `/trades/:userId`

Fetch all trades for a specific user.

**Request:**
```http
GET /api/trades/user-123
```

**URL Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| userId | string | Yes | User ID to fetch trades for |

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| status | string | No | Filter by status (pending, executed, etc.) |
| limit | number | No | Max trades to return (default: 100) |
| offset | number | No | Pagination offset (default: 0) |

**Response:**
```json
[
  {
    "id": "trade-1",
    "userId": "user-123",
    "symbol": "BTC/USDC",
    "side": "LONG",
    "collateral": 100,
    "leverage": 2,
    "entryPrice": 42000,
    "stopLoss": 40000,
    "takeProfit": 46000,
    "status": "executed",
    "transactionHash": "0x...",
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:05:00.000Z"
  },
  // ... more trades
]
```

**Status Codes:**
- `200 OK`: Trades fetched successfully
- `404 Not Found`: User has no trades

**Example (JavaScript):**
```javascript
const response = await fetch('http://localhost:4000/api/trades/user-123?status=executed');
const trades = await response.json();
console.log('Executed Trades:', trades);
```

---

#### POST `/trades/stage`

Prepare a trade transaction for execution.

**Request:**
```http
POST /api/trades/stage
Content-Type: application/json

{
  "userId": "user-123",
  "tradeId": "trade-uuid",
  "account": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
}
```

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| userId | string | Yes | User ID |
| tradeId | string | Yes | Trade ID to stage |
| account | string | Yes | User's EOA or smart account address |

**Response:**
```json
{
  "trade": {
    "id": "trade-uuid",
    "status": "staged",
    // ... other trade fields
  },
  "transaction": {
    "to": "0xRouterAddress",
    "data": "0x...",
    "value": "0",
    "chainId": 50312,
    "gasLimit": "300000"
  }
}
```

**Transaction Object:**

| Field | Type | Description |
|-------|------|-------------|
| to | string | Contract address to call |
| data | string | Encoded function call data |
| value | string | Native token amount (wei) |
| chainId | number | Network chain ID |
| gasLimit | string | Recommended gas limit |

**Status Codes:**
- `200 OK`: Transaction prepared successfully
- `400 Bad Request`: Invalid trade ID or parameters
- `404 Not Found`: Trade not found
- `500 Internal Server Error`: Failed to prepare transaction

**Example (JavaScript with wagmi):**
```javascript
// Stage the trade
const stageResponse = await fetch('http://localhost:4000/api/trades/stage', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'user-123',
    tradeId: 'trade-uuid',
    account: userAddress
  })
});

const { transaction } = await stageResponse.json();

// Execute with wagmi
const txHash = await sendTransaction({
  to: transaction.to,
  data: transaction.data,
  value: BigInt(transaction.value),
  gas: BigInt(transaction.gasLimit)
});

// Wait for confirmation
await waitForTransaction({ hash: txHash });
```

---

#### PATCH `/trades/:id`

Update trade parameters.

**Request:**
```http
PATCH /api/trades/trade-uuid
Content-Type: application/json

{
  "userId": "user-123",
  "stopLoss": 40500,
  "takeProfit": 45000,
  "leverage": 3,
  "collateral": 150
}
```

**URL Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Trade ID to update |

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| userId | string | Yes | User ID (for verification) |
| stopLoss | number | No | New stop loss price |
| takeProfit | number | No | New take profit price |
| leverage | number | No | New leverage (1-100) |
| collateral | number | No | New collateral amount |
| status | string | No | New status (for execution updates) |
| transactionHash | string | No | Tx hash after execution |

**Response:**
```json
{
  "id": "trade-uuid",
  "userId": "user-123",
  "stopLoss": 40500,
  "takeProfit": 45000,
  "leverage": 3,
  "collateral": 150,
  "updatedAt": "2024-01-15T10:35:00.000Z",
  // ... other fields
}
```

**Status Codes:**
- `200 OK`: Trade updated successfully
- `400 Bad Request`: Invalid parameters
- `403 Forbidden`: User doesn't own this trade
- `404 Not Found`: Trade not found

**Example (JavaScript):**
```javascript
const response = await fetch('http://localhost:4000/api/trades/trade-uuid', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'user-123',
    stopLoss: 40500,
    takeProfit: 45000
  })
});

const updatedTrade = await response.json();
```

---

#### DELETE `/trades/:id`

Cancel a pending trade.

**Request:**
```http
DELETE /api/trades/trade-uuid?userId=user-123
```

**URL Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Trade ID to cancel |

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| userId | string | Yes | User ID (for verification) |

**Response:**
```json
{
  "message": "Trade cancelled successfully",
  "trade": {
    "id": "trade-uuid",
    "status": "cancelled",
    // ... other fields
  }
}
```

**Status Codes:**
- `200 OK`: Trade cancelled successfully
- `400 Bad Request`: Cannot cancel executed trades
- `403 Forbidden`: User doesn't own this trade
- `404 Not Found`: Trade not found

---

## WebSocket API

### Connection

Connect to WebSocket server for real-time updates:

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:4000', {
  transports: ['websocket'],
  autoConnect: true
});

socket.on('connect', () => {
  console.log('Connected to WebSocket');
});

socket.on('disconnect', () => {
  console.log('Disconnected from WebSocket');
});
```

### Events

#### `trade.created`

Emitted when a new trade is created.

**Payload:**
```json
{
  "type": "trade.created",
  "payload": {
    "id": "trade-uuid",
    "userId": "user-123",
    "symbol": "BTC/USDC",
    // ... full trade object
  }
}
```

#### `trade.updated`

Emitted when a trade is updated.

**Payload:**
```json
{
  "type": "trade.updated",
  "payload": {
    "id": "trade-uuid",
    "status": "executed",
    // ... updated fields
  }
}
```

#### `trade.executed`

Emitted when a trade is executed on blockchain.

**Payload:**
```json
{
  "type": "trade.executed",
  "payload": {
    "id": "trade-uuid",
    "transactionHash": "0x...",
    "status": "executed"
  }
}
```

#### `trade.cancelled`

Emitted when a trade is cancelled.

**Payload:**
```json
{
  "type": "trade.cancelled",
  "payload": {
    "id": "trade-uuid",
    "status": "cancelled"
  }
}
```

### Example Usage

```javascript
import { useEffect } from 'react';
import io from 'socket.io-client';

function useTradeUpdates(onUpdate) {
  useEffect(() => {
    const socket = io('http://localhost:4000');

    socket.on('trade.created', (event) => {
      console.log('New trade:', event.payload);
      onUpdate(event.payload);
    });

    socket.on('trade.updated', (event) => {
      console.log('Trade updated:', event.payload);
      onUpdate(event.payload);
    });

    socket.on('trade.executed', (event) => {
      console.log('Trade executed:', event.payload);
      onUpdate(event.payload);
    });

    return () => socket.disconnect();
  }, [onUpdate]);
}
```

---

## Error Responses

All error responses follow this format:

```json
{
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "details": {}
  }
}
```

### Common Error Codes

| Code | Status | Description |
|------|--------|-------------|
| INVALID_REQUEST | 400 | Invalid request parameters |
| UNAUTHORIZED | 401 | Authentication required |
| FORBIDDEN | 403 | Access denied |
| NOT_FOUND | 404 | Resource not found |
| TRADE_NOT_FOUND | 404 | Trade ID doesn't exist |
| USER_MISMATCH | 403 | User doesn't own resource |
| ALREADY_EXECUTED | 400 | Trade already executed |
| INTERNAL_ERROR | 500 | Server error |
| AI_ERROR | 500 | AI service unavailable |
| BLOCKCHAIN_ERROR | 500 | Blockchain interaction failed |

### Example Error Response

```json
{
  "error": {
    "message": "Trade not found",
    "code": "TRADE_NOT_FOUND",
    "details": {
      "tradeId": "invalid-uuid"
    }
  }
}
```

---

## Rate Limiting

Currently no rate limiting is implemented. For production, consider:

```javascript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests'
});

app.use('/api/', limiter);
```

---

## CORS Configuration

Default CORS settings allow all origins in development:

```javascript
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  credentials: true
}));
```

For production, restrict to specific domains:

```javascript
app.use(cors({
  origin: 'https://your-frontend-domain.com',
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  credentials: true
}));
```

---

## TypeScript Types

```typescript
// User
interface User {
  id: string;
  address: string;
  smartAccount?: string;
}

// Message
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

// Trade
interface Trade {
  id: string;
  userId: string;
  symbol: string;
  side: 'LONG' | 'SHORT';
  collateral: number;
  leverage: number;
  entryPrice: number;
  stopLoss: number | null;
  takeProfit: number | null;
  status: 'pending' | 'staged' | 'executed' | 'cancelled' | 'failed';
  transactionHash: string | null;
  preparedTx: PreparedTransaction | null;
  createdAt: string;
  updatedAt: string;
}

// Prepared Transaction
interface PreparedTransaction {
  to: string;
  data: string;
  value: string;
  chainId: number;
  gasLimit: string;
}

// WebSocket Event
interface WebSocketEvent {
  type: string;
  payload: any;
}
```

---

## Testing the API

### Using cURL

```bash
# Health check
curl http://localhost:4000/api/health

# Send chat message
curl -X POST http://localhost:4000/api/chat/message \
  -H "Content-Type: application/json" \
  -d '{"userId":"test-user","message":"Show me BTC price"}'

# Fetch trades
curl http://localhost:4000/api/trades/test-user

# Update trade
curl -X PATCH http://localhost:4000/api/trades/trade-123 \
  -H "Content-Type: application/json" \
  -d '{"userId":"test-user","stopLoss":40000}'

# Cancel trade
curl -X DELETE "http://localhost:4000/api/trades/trade-123?userId=test-user"
```

### Using Postman

1. Import collection from `/docs/postman_collection.json` (create if needed)
2. Set environment variables:
   - `baseUrl`: `http://localhost:4000/api`
   - `userId`: `your-test-user-id`
3. Run requests

---

## Client SDK (Future)

Consider creating a TypeScript SDK for easier integration:

```typescript
import { TradeGPTClient } from '@tradegpt/sdk';

const client = new TradeGPTClient({
  baseUrl: 'http://localhost:4000/api',
  userId: 'user-123'
});

// Send message
const response = await client.chat.sendMessage('I want to long ETH');

// Get trades
const trades = await client.trades.list({ status: 'executed' });

// Update trade
await client.trades.update('trade-id', { stopLoss: 40000 });

// Subscribe to updates
client.on('trade.executed', (trade) => {
  console.log('Trade executed:', trade);
});
```

---

## API Versioning

For future versions, use URL versioning:

```
/api/v1/chat/message
/api/v2/chat/message
```

Or header versioning:

```http
GET /api/chat/message
Accept: application/vnd.tradegpt.v1+json
```

---

## Additional Resources

- [Express Documentation](https://expressjs.com/)
- [Socket.io Documentation](https://socket.io/docs/)
- [REST API Best Practices](https://restfulapi.net/)
- [WebSocket Protocol](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)
