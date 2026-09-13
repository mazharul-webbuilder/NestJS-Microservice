# 🚀 NestJS Microservices Architecture

A comprehensive, production-ready reference project demonstrating modern **Microservices Patterns**, **Distributed Systems**, and **Resilient Communication** built with [NestJS](https://nestjs.com).

---

## 🏛️ System Architecture

```mermaid
flowchart TD
    Client(["🌐 Client / Frontend / api.http"])

    subgraph Gateway ["🚪 API Gateway (Port 3000)"]
        HTTP["REST Endpoints<br/>/api/todos"]
        Validation["🛡️ ValidationPipe (class-validator)"]
        Resilience["⏱️ RxJS Timeout (2s) & Fallback"]
    end

    subgraph TodoService ["📝 Todo Microservice (Port 3001)"]
        TCP["TCP Server<br/>@MessagePattern"]
        DB[("💾 Isolated In-Memory Store")]
    end

    subgraph Broker ["⚡ Redis Server (Port 6379)"]
        PubSub["Pub/Sub Channel: 'todo.created'"]
    end

    subgraph NotificationService ["🔔 Notification Microservice"]
        Sub["Redis Subscriber<br/>@EventPattern"]
    end

    Client -->|HTTP Request| HTTP
    HTTP --> Validation
    Validation --> Resilience
    Resilience -->|"1. Synchronous RPC (TCP)"| TCP
    TCP --> DB
    TCP -.->|"2. Async Event Emit (Fire-and-Forget)"| PubSub
    PubSub -.->|"3. Real-Time Broadcast"| Sub
```

---

## 🔑 Core Concepts & Patterns Implemented

### 1. API Gateway Pattern (`Port 3000`)
* **File:** `src/main.ts` & `src/gateway/todos-gateway.controller.ts`
* Acts as the single public entry point for clients, routing external REST requests to internal microservices over TCP.

### 2. Synchronous RPC via TCP (`Request-Response`)
* **File:** `src/todo-microservice.ts` & `src/todo-service/todo-service.controller.ts` (`Port 3001`)
* Uses `client.send({ cmd: '...' }, payload)` & `@MessagePattern()`.
* The caller waits for the remote procedure to finish and return data.

### 3. Asynchronous Event-Driven Architecture via Redis Pub/Sub (`Fire-and-Forget`)
* **File:** `src/notification-microservice.ts` & `src/notification-service/notification-service.controller.ts` (`Port 6379`)
* Uses `client.emit('todo.created', payload)` & `@EventPattern()`.
* Decoupled broadcast: The Todo service emits the event and immediately responds to the user without waiting for notifications or emails to send.

### 4. Gateway Firewall & Shared DTO Validation
* **File:** `src/common/dto/create-todo.dto.ts`
* Uses `class-validator` & `class-transformer` with `ValidationPipe`.
* **Fail Fast at the Edge:** Rejects bad or malicious payloads (`400 Bad Request`) at the Gateway border before wasting internal network bandwidth or TCP sockets.

### 5. Fault Tolerance & Resilient RPC (Timeouts & Fallbacks)
* **File:** `src/gateway/todos-gateway.controller.ts` (`/api/todos/resilient`)
* Uses RxJS `timeout(2000)` and `catchError()`.
* If a downstream microservice hangs or crashes, the Gateway cuts the wait at 2 seconds and returns a **Graceful Fallback** instead of leaving users hanging or crashing with an HTTP 500.

### 6. RPC Error Handling (`RpcException` ➔ `HttpException`)
* Microservices throw `RpcException` over TCP.
* The Gateway intercepts the error and translates it into clean HTTP status codes (e.g., `404 Not Found`).

### 7. Persistent Message Queues via BullMQ (`Guaranteed Delivery`)
* **Producer:** `TodosGatewayController` (`POST /api/todos/queue/email`)
* **Consumer / Worker:** `EmailConsumer` (`src/notification-service/email.consumer.ts`)
* **Inspection:** `GET /api/todos/queue/status`
* **Solves the "Lost Event" Flaw:** Jobs are persisted in Redis with automatic retries and exponential backoff. Even if the Notification Worker is stopped, jobs wait safely in Redis and process immediately once the worker comes online.

### 8. Enterprise AMQP Event Bus via RabbitMQ (`Manual ACKs & DLQ`)
* **Producer:** `TodoServiceController` (`PATCH /api/todos/:id` ➔ Emits `todo.updated`)
* **Consumer:** `NotificationServiceController` (`@EventPattern('todo.updated')` with `RmqContext`)
* **Guaranteed Delivery with Manual ACKs (`noAck: false`):** Messages remain in the queue until the worker explicitly executes `channel.ack(originalMsg)`. If a worker crashes midway, RabbitMQ instantly redelivers the message to another active worker.

### 9. Distributed Event Streaming via Apache Kafka (`Partitions & Offsets`)
* **Producer:** `TodoServiceController` (`DELETE /api/todos/:id` ➔ Streams to topic `todo.deleted`)
* **Consumer:** `NotificationServiceController` (`@EventPattern('todo.deleted')` with `KafkaContext`)
* **Horizontal Scalability:** Events are partitioned by key, distributed across consumer groups, and persisted with immutable sequential offsets.

---

## 🛠️ Prerequisites

* **Node.js:** `>= 20.x`
* **Redis Server:** Running on `127.0.0.1:6379`
* **RabbitMQ Server:** CloudAMQP instance or local RabbitMQ (`amqps://...`)
* **Kafka Cluster:** Redpanda Cloud / Apache Kafka (`SASL_SSL`)

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run All 3 Services (in separate terminal windows)

```bash
# Terminal 1: API Gateway (HTTP REST on port 3000)
npm run start:dev

# Terminal 2: Todo Microservice (TCP on port 3001)
npm run start:todo:dev

# Terminal 3: Notification Microservice (Redis Pub/Sub, RabbitMQ & Kafka)
npm run start:notification:dev
```

---

## 📡 API Endpoints & Testing

You can test all endpoints directly inside VS Code / Antigravity IDE using the included **[`api.http`](./api.http)** file (via the REST Client extension) or via `curl`:

| Method | Endpoint | Description | Pattern |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/todos` | Fetch all todos | Standard Synchronous TCP RPC |
| `POST` | `/api/todos` | Create a todo | TCP RPC + Async Redis Pub/Sub |
| `PATCH` | `/api/todos/:id` | Update a todo | TCP RPC + RabbitMQ with Manual ACKs |
| `DELETE` | `/api/todos/:id` | Delete a todo | TCP RPC + Kafka Partitioned Stream |
| `GET` | `/api/todos/resilient` | Fetch todos with 2s timeout protection | Resilient RPC |
| `GET` | `/api/todos/resilient?slow=true` | Simulates 5s microservice lag | Triggers 2s Timeout ➔ Fallback response |
| `GET` | `/api/todos/1` | Fetch Todo by ID | Synchronous TCP RPC |
| `GET` | `/api/todos/999` | Non-existent Todo | Translates `RpcException` ➔ `HTTP 404` |
| `POST` | `/api/todos/queue/email` | Push durable job to BullMQ | Persistent Redis Queue |
| `GET` | `/api/todos/queue/status` | Real-time queue counters | Queue Monitoring |

---

## 🧪 Testing Validation Rules

Try posting these payloads to `/api/todos`:

* **Title too short (< 3 characters):**
  ```json
  { "title": "Hi" }
  ```
  👉 *Returns `400 Bad Request: Title must be at least 3 characters long`*

* **Unauthorized Injected Fields:**
  ```json
  { "title": "Valid title", "isAdmin": true }
  ```
  👉 *Returns `400 Bad Request: property isAdmin should not exist`*

---

## 📂 Project Structure

```text
nest-todo/
├── api.http                                 # Ready-to-run HTTP testing file
├── src/
│   ├── main.ts                              # API Gateway HTTP entry point (:3000)
│   ├── todo-microservice.ts                 # Todo TCP microservice entry point (:3001)
│   ├── notification-microservice.ts         # Notification Redis microservice entry point (:6379)
│   ├── app.module.ts                        # Gateway root module
│   ├── common/
│   │   ├── dto/
│   │   │   └── create-todo.dto.ts           # Shared validation contract
│   │   └── middleware/
│   │       └── logging.middleware.ts        # HTTP request logging
│   ├── gateway/
│   │   ├── todos-gateway.controller.ts      # REST controller with RPC & resilience
│   │   └── todos-gateway.module.ts          # Gateway client proxy registration
│   ├── todo-service/
│   │   ├── todo-service.controller.ts       # TCP message handlers & Redis event emitter
│   │   └── todo-service.module.ts           # Todo module & Redis client registration
│   └── notification-service/
│       ├── notification-service.controller.ts # Redis event consumer (@EventPattern)
│       └── notification-service.module.ts   # Notification module
└── package.json
```

---

## 📝 License

This project is licensed under the [UNLICENSED](LICENSE) terms.
