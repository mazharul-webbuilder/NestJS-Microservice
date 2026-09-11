# 🗺️ Master Microservices Roadmap: Synchronous & Asynchronous Patterns

Welcome to your hands-on microservices journey! This roadmap is designed specifically for your NestJS workspace to take you from direct synchronous communication to production-grade distributed event streaming.

---

## 🎯 What You Will Master

| Pattern | Protocol / Broker | NestJS Mechanism | Real-World Use Case |
| :--- | :--- | :--- | :--- |
| **Synchronous** | **TCP** | `client.send()` + `@MessagePattern()` | Immediate query/command (e.g. Fetch todos, validate user, calculate order total). |
| **Asynchronous** | **Redis Pub/Sub** | `client.emit()` + `@EventPattern()` | Fast, lightweight notifications (e.g. Real-time updates, cache eviction). |
| **Asynchronous** | **RabbitMQ** | `client.emit()` + `@EventPattern()` | Guaranteed delivery, durable queues, worker pools (e.g. Process payment, send email). |
| **Asynchronous** | **Kafka** | `client.emit()` + `@EventPattern()` | High-volume event stream, immutable audit log, replayable history (e.g. Activity logging, financial transactions). |

---

## 🏗️ The System We Will Build Progressively

```
                          [ Client / Postman ]
                                    │  (HTTP REST)
                                    ▼
                         ┌────────────────────┐
                         │    API Gateway     │
                         │   (Port 3000)      │
                         └───────┬───┬───┬────┘
                                 │   │   │
        ┌────────────────────────┘   │   └───────────────────────┐
        │ TCP (Synchronous)          │ Redis / RabbitMQ / Kafka   │ (Asynchronous Events)
        ▼                            │ (Pub / Sub / Queue)        │
┌──────────────────┐                 ▼                            ▼
│ Todo Microservice│       ┌──────────────────┐         ┌───────────────────┐
│  (Port 3001)     │       │Notification Serv.│         │  Analytics / Audit│
│                  │       │ (Sends alerts)   │         │  (Tracks history) │
└──────────────────┘       └──────────────────┘         └───────────────────┘
```

---

## 📋 Step-by-Step Learning Modules

### Module 1: Synchronous Communication with TCP (Zero External Tools)
* **Goal**: Understand request-response over a lightweight network socket.
* **Concepts**:
  * Difference between HTTP overhead vs TCP socket.
  * NestJS `ClientProxy`: `client.send(pattern, data)`.
  * `@MessagePattern({ cmd: '...' })` handler.
  * Returning Observables / Promises across network boundaries.
* **Hands-On**:
  1. Create a standalone `todo-microservice.ts` running on TCP port 3001.
  2. Configure the API Gateway (`src/main.ts`) with a `ClientsModule.register()` TCP client.
  3. Send `GET /api/todos` and `POST /api/todos` to Gateway -> hops to TCP microservice -> returns data.

---

### Module 2: Asynchronous Communication with Redis Pub/Sub
* **Goal**: Learn the "Fire-and-Forget" broadcast pattern.
* **Concepts**:
  * Request-Response (`send`) vs Event Emission (`emit`).
  * Why the sender does **not** wait for a response.
  * Redis Channels & Subscribers.
* **Hands-On**:
  1. Run a lightweight Redis instance (via Docker or local Windows Redis).
  2. When a todo is created in the API Gateway, emit an event:
     `client.emit('todo_created', newTodo)`.
  3. Add an event listener: `@EventPattern('todo_created')` in a background worker service.

---

### Module 3: Enterprise Asynchronous Queues with RabbitMQ
* **Goal**: Learn guaranteed delivery, message persistence, and task distribution.
* **Concepts**:
  * Why Redis Pub/Sub isn't enough when consumers crash (lost messages).
  * RabbitMQ building blocks: **Exchanges**, **Queues**, and **Bindings**.
  * Message Acknowledgements (`ack` / `nack`) and Dead Letter Queues (DLQ).
  * Competing Consumers: Distributing heavy work across multiple instances.
* **Hands-On**:
  1. Connect NestJS to RabbitMQ using the AMQP transport.
  2. Emit a `send_reminder_email` message to a durable queue.
  3. Stop the consumer, emit 5 messages (see them queue safely in RabbitMQ), restart the consumer, and watch them process smoothly!

---

### Module 4: Distributed Event Streaming with Apache Kafka
* **Goal**: Master high-throughput, partitioned event logs.
* **Concepts**:
  * Queues (RabbitMQ) vs Distributed Log Streams (Kafka).
  * **Topics**, **Partitions**, and **Consumer Groups**.
  * Offsets: How Kafka lets consumers read at their own speed and replay past events.
* **Hands-On**:
  1. Set up a Kafka broker (with Kraft or Zookeeper).
  2. Stream `todo_activity` events into a Kafka topic with key-based partitioning.
  3. Build an Audit Consumer that reads the topic and maintains an immutable event history.

---

## 🏁 Key Differences Cheat Sheet

| Feature | TCP | Redis Pub/Sub | RabbitMQ | Apache Kafka |
| :--- | :--- | :--- | :--- | :--- |
| **Communication Style** | Synchronous (RPC) | Asynchronous (Fire & Forget) | Asynchronous (Message Queue) | Asynchronous (Event Stream) |
| **Does Caller Wait?** | Yes | No | No | No |
| **Message Persistence** | None (in-flight socket) | None (lost if consumer down) | Yes (saved to disk) | Yes (saved to disk for days/forever) |
| **Delivery Guarantee** | Immediate response or error | At-most-once | At-least-once (with ACKs) | At-least-once (with offset commit) |
| **Replay Old Messages** | No | No | No | Yes |
