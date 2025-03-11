# Thunderstack Automated Tests

## **Prerequisites**

### **1. Clone the Repository**
```bash
git clone https://github.com/RGB-OS/thunderstack-tests.git
cd thunderstack-tests
```

### **2. Install Dependencies**
```bash
npm install
```

### **3. Set Up Environment Variables**
- Copy `.env.example` to `.env` and set values:
  
  ```bash
  CLOUD_API=https://cloud-api.test.thunderstack.org/api/  # Use test environment
  # or
  CLOUD_API=https://cloud-api.thunderstack.org/api/  # Use production environment
  
  AUTH_TOKEN=your_auth_token_here  # Generate in Thunderstack Cloud UI
  NODE_PASSWORD=your_node_password_here
  NETWORK=regtest  # Options: regtest, testnet, bitfinex_regtest
  ```

- **Generating `AUTH_TOKEN`**: Visit [Thunderstack Cloud UI](https://cloud.thunderstack.org/tokens) to create a token.

---

## **Scenario: Creating Two Nodes, Issuing Asset, Opening Channel, Sending Asset, Closing Channel, and Destroying Nodes**

### **1. Create Two Nodes**
```bash
NODE_NAME=Node_A npx playwright test tests/api.node-run.test.ts   
NODE_NAME=Node_B npx playwright test tests/api.node-run.test.ts   
```
- This generates `/node_envs/Node_A.env` and `/node_envs/Node_B.env`, which store node variables.

---

### **2. Issue Asset**
```bash
NODE_NAME=Node_A npx playwright test tests/api.node-issueasset.test.ts
```
- This test mints an asset on **Node_A**.

---

### **3. Open Asset Channel Between Nodes**
```bash
NODE_NAME_A='Node_A' NODE_NAME_B='Node_B' npx playwright test tests/api.node-openchannel_asset.test.ts
```
- Opens a channel for asset transfer between `Node_A` and `Node_B`.

---

### **4. Send Asset from Node_A to Node_B**
```bash
NODE_NAME_A='Node_A' NODE_NAME_B='Node_B' npx playwright test tests/api.node-payment_asset.test.ts
```
- Transfers the issued asset through the open channel.

---

### **5. Close the Asset Channel**
```bash
NODE_NAME_A='Node_A' NODE_NAME_B='Node_B' npx playwright test tests/api.node-closechannel.test.ts
```
- Closes the asset channel between the two nodes.

---

### **6. Destroy the Nodes**
```bash
NODE_NAME=Node_A npx playwright test tests/api.node-destroy.test.ts   
NODE_NAME=Node_B npx playwright test tests/api.node-destroy.test.ts   
```
- Removes both nodes from the system.

---

## **General Notes**
- **Each test runs independently**; variables are stored in `/node_envs/Node_X.env`.
- **`NODE_NAME_A` and `NODE_NAME_B`** are used to extract variables dynamically:
  
  ```js
  const NODE_NAME_A = process.env.NODE_NAME_A;
  const NODE_NAME_B = process.env.NODE_NAME_B;
  
  const NODE_A_ID = process.env[`${NODE_NAME_A}_ID`];
  const NODE_B_ID = process.env[`${NODE_NAME_B}_ID`];
  const ASSET_ID = process.env[`${NODE_NAME_A}_ASSET_ID`];
  ```
- **`node_envs` can be manually adjusted ** if needed, ensuring proper formatting.
---