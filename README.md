# 🚀 Ultimate NestJS Microservices Architecture & Learning Guide

A comprehensive, production-grade reference and learning repository demonstrating modern **Microservices Communication Patterns**, **Multi-Broker Architecture**, **Fault Tolerance**, and **Event-Driven Distributed Systems** using [NestJS](https://nestjs.com).

---

## 🏛️ System Architecture

```mermaid
flowchart TD
    Client(["🌐 Client / Frontend / api.http"])

    subgraph Gateway ["🚪 1. API Gateway (HTTP REST :3000)"]
        HTTP["REST Endpoints<br/>/api/todos"]
        Validation["🛡️ ValidationPipe (class-validator)"]
        Resilience["⏱️ RxJS Timeout (2s) & Fallback"]
    end

    subgraph TodoService ["📝 2. Todo Microservice (TCP RPC :3001)"]
        TCP["TCP Server<br/>@MessagePattern"]
        Store[("💾 In-Memory State Store")]
    end

    subgraph RedisBroker ["⚡ 3. Redis Broker (:6379)"]
        PubSub["Pub/Sub Channel: 'todo.created'<br/>(Fire-and-Forget)"]
        BullMQQueue["BullMQ Queue: 'email-queue'<br/>(Persistent Retries)"]
    end

    subgraph RabbitMQBroker ["🐇 4. RabbitMQ Broker (CloudAMQP)"]
        RMQQueue["Queue: 'todo_updates_queue'<br/>Event: 'todo.updated'<br/>(Manual ACKs)"]
    end

    subgraph KafkaBroker ["⚡ 5. Apache Kafka / Redpanda Cloud"]
        KafkaTopic["Topic: 'todo.deleted'<br/>(Partitioned Event Stream)"]
    end

    subgraph NotificationService ["🔔 6. Notification Microservice (Multi-Consumer)"]
        RedisSub["Redis Consumer<br/>@EventPattern(Transport.REDIS)"]
        RMQSub["RabbitMQ Consumer<br/>@EventPattern(Transport.RMQ)<br/>channel.ack()"]
        KafkaSub["Kafka Consumer Group<br/>@EventPattern(Transport.KAFKA)<br/>Offsets & Partitions"]
        BullMQWorker["BullMQ Worker<br/>@Processor('email-queue')"]
    end

    %% Flow Connections
    Client -->|HTTP Request| HTTP
    HTTP --> Validation
    Validation --> Resilience
    Resilience -->|"1. Synchronous RPC (TCP :3001)"| TCP
    TCP --> Store

    %% Event Emits from Todo Service
    TCP -.->|"2. Async Event Emit (Redis Pub/Sub)"| PubSub
    PubSub -.->|"Broadcast"| RedisSub

    TCP -.->|"3. AMQP Event Emit (RabbitMQ)"| RMQQueue
    RMQQueue -.->|"Deliver with ACK Guarantee"| RMQSub

    TCP -.->|"4. Stream Event Emit (Kafka)"| KafkaTopic
    KafkaTopic -.->|"Partition Log Stream"| KafkaSub

    %% Gateway to BullMQ Queue
    HTTP -.->|"5. Enqueue Durable Job"| BullMQQueue
    BullMQQueue -.->|"Reliable Job Process"| BullMQWorker
```

---

## 🧠 The 4 Communication Paradigms Compared

This repository implements all major communication styles side-by-side so you can understand when to use each in production:

| Pattern | Protocol / Broker | NestJS Decorator / Method | Delivery Guarantee | Use Case |
| :--- | :--- | :--- | :--- | :--- |
| **Synchronous RPC** | Raw **TCP** (`:3001`) | `client.send()` / `@MessagePattern()` | Immediate response | Point-to-point CRUD where caller must wait |
| **Real-Time Pub/Sub** | **Redis** (`:6379`) | `client.emit()` / `@EventPattern(..., Transport.REDIS)` | Fire-and-forget (No ACK) | Real-time notifications, in-memory chat, live signals |
| **Persistent Queue** | **BullMQ** (Redis) | `queue.add()` / `@Processor('email-queue')` | At-least-once (Retries + Backoff) | Heavy background tasks, welcome emails, PDF generation |
| **Enterprise Message Queue** | **RabbitMQ** (AMQP) | `client.emit()` / `@EventPattern(..., Transport.RMQ)` | Guaranteed delivery via **Manual ACKs** (`channel.ack()`) | Financial transactions, critical order updates, DLQ routing |
| **Distributed Event Streaming** | **Apache Kafka** / Redpanda | `client.emit()` / `@EventPattern(..., Transport.KAFKA)` | Immutable Commit Log (Partitioned Streams & Offsets) | Audit logs, telemetry, big data pipelines, event sourcing |

---

## 📦 Required NPM Packages & Modules

```bash
# Core NestJS & Microservice Infrastructure
npm install @nestjs/core @nestjs/common @nestjs/microservices @nestjs/platform-express reflect-metadata rxjs

# Data Validation & Transformation (Gateway Edge Protection)
npm install class-validator class-transformer

# Message Broker Clients
npm install ioredis                      # Redis client
npm install @nestjs/bullmq bullmq        # Persistent Redis Queues
npm install amqplib amqp-connection-manager  # RabbitMQ AMQP client
npm install kafkajs                      # Apache Kafka client

# Dev & Type Definitions
npm install --save-dev @types/amqplib @types/node typescript
```

---

## 🌐 Third-Party Services & Broker Setup

You can run this project using **100% Free Cloud Services** OR **100% Local Services**:

### 1. Redis Server (Local or Cloud)
* **Local (Laragon):** Right-click Laragon tray icon ➔ **Redis** ➔ **Start Redis** (`127.0.0.1:6379`).
* **Or Docker:** `docker run -d -p 6379:6379 redis:alpine`
* **Used By:** `TodosGatewayController` (BullMQ), `TodoServiceController` (Pub/Sub), `NotificationService` (Subscriber & BullMQ Worker).

### 2. RabbitMQ Server (CloudAMQP)
* **Cloud (Recommended - 1-click Free):** [CloudAMQP](https://www.cloudamqp.com/) (Free "Little Lemur" plan).
  * URL format: `amqps://username:password@hostname/vhost`
* **Local Alternative (Docker):** `docker run -d -p 5672:5672 -p 15672:15672 rabbitmq:3-management`
* **Used By:** `TodoService` (Publisher) and `NotificationService` (Manual ACK Subscriber).

### 3. Apache Kafka / Redpanda Cloud
* **Cloud (Recommended - Free Serverless):** [Redpanda Cloud](https://cloud.redpanda.com/)
  * Create a Cluster ➔ Create topic `todo.deleted` ➔ Create user under **Security** with `SCRAM-SHA-256` and **Allow all operations**.
* **Local Alternative (Docker):** Run the included [`docker-compose.yml`](./docker-compose.yml) (`docker compose up -d`).
* **Used By:** `TodoService` (Producer) and `NotificationService` (Consumer Group with Partition & Offset logging).

---

## 🚀 Running the Services

Start the 3 independent microservice applications in separate terminal tabs:

```bash
# Terminal 1: API Gateway (HTTP REST on http://localhost:3000)
npm run start:dev

# Terminal 2: Todo Microservice (TCP Server on port 3001)
npm run start:todo:dev

# Terminal 3: Notification Microservice (Redis + RabbitMQ + Kafka Multi-Consumer)
npm run start:notification:dev
```

---

## 📡 API Endpoints & Testing Matrix

You can test all scenarios using the included **[`api.http`](./api.http)** file with the VS Code / IDE REST Client extension:

| Method | Endpoint | Microservices Involved | Architectural Concept |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/todos` | Gateway ➔ TCP Todo Service | **Synchronous TCP RPC** (`client.send()`) |
| `POST` | `/api/todos` | Gateway ➔ TCP ➔ Redis Pub/Sub | **Async Event-Driven** (`client.emit()`) |
| `PATCH`| `/api/todos/:id` | Gateway ➔ TCP ➔ RabbitMQ | **AMQP Queue with Manual ACK** (`channel.ack()`) |
| `DELETE`| `/api/todos/:id`| Gateway ➔ TCP ➔ Apache Kafka | **Distributed Event Streaming** (Offsets & Partitions) |
| `GET` | `/api/todos/resilient` | Gateway ➔ TCP (with 2s RxJS timeout) | **Fault Tolerance & Resilience** |
| `GET` | `/api/todos/resilient?slow=true` | Gateway ➔ TCP (simulates 5s hang) | **Circuit Breaker / Graceful Fallback** |
| `GET` | `/api/todos/:id` | Gateway ➔ TCP (Throws `RpcException`) | **Distributed Error Mapping** (`RpcException` ➔ `HTTP 404`) |
| `POST` | `/api/todos/queue/email` | Gateway ➔ BullMQ ➔ Notification Worker | **Persistent Durable Jobs with Retries** |
| `GET` | `/api/todos/queue/status`| Gateway ➔ BullMQ Redis Inspection | **Queue Telemetry & State Monitoring** |

---

## 🧪 Edge Validation Test Cases

The API Gateway runs a firewall using `ValidationPipe` (`class-validator` & `class-transformer`):

* **Invalid Short Title (`< 3 chars`):**
  ```json
  POST /api/todos
  { "title": "No" }
  ```
  👉 *Returns `400 Bad Request: Title must be at least 3 characters long` (Fails at edge without wasting TCP sockets).*

* **Injected Malicious Fields:**
  ```json
  POST /api/todos
  { "title": "Valid Todo", "isAdmin": true }
  ```
  👉 *Returns `400 Bad Request: property isAdmin should not exist` (`forbidNonWhitelisted: true`).*

---

## 📂 Project Architecture Map

```text
NestJS-Microservice/
├── api.http                                      # Ready-to-run interactive REST test suite
├── docker-compose.yml                            # Local Kafka KRaft cluster definition
├── src/
│   ├── main.ts                                   # 🚪 API Gateway HTTP Entry Point (:3000)
│   ├── todo-microservice.ts                      # 📝 Todo Microservice TCP Entry Point (:3001)
│   ├── notification-microservice.ts              # 🔔 Notification Multi-Transport Entry Point
│   ├── app.module.ts                             # Gateway root module
│   ├── common/
│   │   ├── dto/
│   │   │   ├── create-todo.dto.ts                # Shared validation contract (Creation)
│   │   │   └── update-todo.dto.ts                # Shared validation contract (Patch)
│   │   └── middleware/
│   │       └── logging.middleware.ts             # Gateway HTTP request logger
│   ├── gateway/
│   │   ├── todos-gateway.controller.ts           # REST Controller with RPC routing & Fallbacks
│   │   └── todos-gateway.module.ts               # Gateway ClientProxy & BullMQ producer registration
│   ├── todo-service/
│   │   ├── todo-service.controller.ts            # TCP RPC handlers + Redis/RabbitMQ/Kafka emitters
│   │   └── todo-service.module.ts                # Todo microservice broker client registrations
│   └── notification-service/
│       ├── notification-service.controller.ts    # Multi-transport consumer (@EventPattern for Redis/RMQ/Kafka)
│       ├── notification-service.module.ts        # Notification module & BullMQ worker setup
│       └── email.consumer.ts                     # BullMQ durable job processor (@Processor)
└── package.json
```

---

## 📝 Key Takeaways for Microservices Interviews

1. **API Gateway vs Direct Microservices**: Public clients should never talk directly to internal microservices. The Gateway handles SSL termination, authentication, validation, rate limiting, and protocol translation.
2. **Synchronous vs Asynchronous**: Use TCP/gRPC only when you need the response immediately. For side effects (emails, notifications, analytics), always use asynchronous events (Redis/RabbitMQ/Kafka) to keep HTTP response times under 20ms.
3. **At-Least-Once Delivery**: Redis Pub/Sub does not guarantee delivery if the subscriber is offline. Use **RabbitMQ with manual ACKs** or **BullMQ** when losing a message is unacceptable.
4. **Kafka vs RabbitMQ**: RabbitMQ routes messages to queues and deletes them upon ACK (smart broker). Kafka writes messages to an immutable commit log where consumers track their own offsets and can replay history (smart consumer).

---

## 📜 License
This project is open-source under the [UNLICENSED](LICENSE) terms for learning and educational purposes.
