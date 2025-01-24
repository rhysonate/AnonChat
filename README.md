# 🌐 AnonChat

Welcome to **AnonChat** — a Node.js-based API that enables seamless anonymous chats between users through bot agents. The platform lets bots pair up users and facilitate anonymous conversations. No names, just conversations.

## 🚀 Features

- **Agent Management**: Register agents that can act as intermediaries.
- **User Accounts**: Create, modify, and delete user accounts.
- **Anonymous Pairing**: Connect users anonymously for private chats.
- **Message Handling**: Send and receive messages securely.
- **Account Customization**: Change username, linked agent, passkey, and more.
- **Notification Control**: Configure pairing notifications.

---

## 📄 Table of Contents

1. [Getting Started](#getting-started)
2. [API Endpoints](#api-endpoints)
3. [Examples](#examples)
4. [Contributing](#contributing)
5. [License](#license)

---

## 🔧 Getting Started

1. **Clone the Repository**
   ```bash
   git clone https://github.com/Taki-Monroe/AnonChat.git
   cd AnonChat
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Run the Server**
   ```bash
   node server.js
   ```
   Your server should now be running on `http://localhost:3000` (or your preferred port).

---

## 📌 API Endpoints

### 1. **Agent Registration and Management**

- **Register Agent**
  ```http
  POST /register-endpoint
  ```
  **Body:**
  ```json
  { "name": "Agent Name", "url": "Agent URL" }
  ```

- **Get All Agents**
  ```http
  GET /register-endpoint/agents
  ```

- **Get Agent by Username**
  ```http
  GET /register-endpoint/agents/@username
  ```

- **Update Agent**
  ```http
  PATCH /register-endpoint/agents/@username
  ```
  **Body:**
  ```json
  { "name": "New Agent Name" }
  ```

- **Restart Server**
  ```http
  POST /restart-endpoint
  ```

### 2. **User Account Management**

- **Create Account**
  ```http
  POST /create_account
  ```
  **Body:**
  ```json
  { "uid": "User ID", "name": "User Name", "passkey": "Password", "agent_username": "Agent Username" }
  ```

- **Get Account Info**
  ```http
  GET /menu/account?uid=<UID>&passkey=<PASSKEY>
  ```

- **Update Account Info**
  ```http
  PUT /menu/change
  ```
  **Body:**
  ```json
  { "uid": "<UID>", "passkey": "<Current Passkey>", "newName": "New Name" }
  ```

- **Delete Account**
  ```http
  PUT /menu/delete-account
  ```
  **Body:**
  ```json
  { "uid": "<UID>", "passkey": "<PASSKEY>" }
  ```

### 3. **Pairing and Messaging**

- **Send Pair Request**
  ```http
  POST /pair_request/send
  ```
  **Body:**
  ```json
  { "uid": "<UID>", "agent_username": "@agent", "message": "Hello?" }
  ```

- **Accept Pairing**
  ```http
  POST /pair_request/accept
  ```
  **Body:**
  ```json
  { "uid": "<UID>", "username": "OtherUser" }
  ```

- **Send Message**
  ```http
  POST /send_message
  ```
  **Body:**
  ```json
  { "uid": "<UID>", "agent_username": "@agent", "message": "Your message here" }
  ```

- **Dismiss Pair**
  ```http
  POST /dismiss_pair/dismiss
  ```
  **Body:**
  ```json
  { "uid": "<UID>", "passkey": "YourPasskey" }
  ```

---

## 📝 Examples

### Register an Agent

```bash
curl -X POST https://example.com/register-endpoint \
-H "Content-Type: application/json" \
-d '{ "name": "Bot Agent", "url": "https://bot.example.com" }'
```

### Create a User Account

```bash
curl -X POST https://example.com/create_account \
-H "Content-Type: application/json" \
-d '{ "uid": "100087608374890", "name": "John Doe", "passkey": "1234", "agent_username": "@botagent" }'
```

### Send a Pairing Request

```bash
curl -X POST https://example.com/pair_request/send \
-H "Content-Type: application/json" \
-d '{ "uid": "100087608374890", "agent_username": "@botagent", "message": "Hello?" }'
```

---

## 🤝 Contributing

Contributions are welcome! Please open an issue or create a pull request. Be sure to follow the [contributing guidelines](CONTRIBUTING.md) and code of conduct.

## 📜 License

This project is licensed under the MIT License. See the [LICENSE](https://github.com/Taki-Monroe/AnonChat/blob/main/LICENSE) file for details.
