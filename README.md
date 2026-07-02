# ISPConfig Mail Dashboard

This repository contains the full-stack Mail Dashboard for monitoring ISPConfig mail logs (`/var/log/mail.log`). It features a real-time, premium UI to track Sent Emails, Bounces, Deferred Emails, and identifies the top domains/emails causing errors.

## Repository Strategy for Multiple Servers

Since you have **4 different VPS servers**, this project is designed to use a **Single Shared Repository**. 

You only need **one** repository (e.g., `mail_server_dashboard`). You push the code to this single repo, and then you SSH into **Server 1, Server 2, Server 3, and Server 4** and `git clone` this exact same repository on all of them. 

* **Benefit**: When you make an update to the dashboard, you only push it once. All 4 servers can just `git pull` the same update. The dashboard will automatically read the local `/var/log/mail.log` of whichever server it is currently running on, dynamically showing the correct server's data.

---

## Deployment Instructions (For Each Server)

Follow these steps on **every** Ubuntu Server (Server 1 to 4) where you want to run the dashboard.

### 1. Clone the Code
SSH into your server and run:
```bash
git clone https://github.com/abdullahfc/mail_server_dashboard.git
cd mail_server_dashboard
```

### 2. Install Dependencies
You need to install the Node packages for both the backend (server) and the frontend (client):
```bash
# Install Backend
cd server
npm install

# Install Frontend
cd ../client
npm install
```

### 3. Build the Frontend
Compile the React code for production:
```bash
npm run build
```

### 4. Start the Application
For production, it is highly recommended to use **PM2** to keep the Node.js server running in the background.
```bash
# Go back to the server directory
cd ../server

# Install PM2 globally if you don't have it
sudo npm install -g pm2

# Start the backend API using PM2
pm2 start index.js --name "mail-dashboard-api"

# Save the PM2 process so it restarts if the server reboots
pm2 save
pm2 startup
```

### 5. Access the Dashboard
By default, the backend API runs on port `3001`. You can configure NGINX or Apache on your ISPConfig server to serve the static frontend files located in `client/dist/` and proxy the API requests to `http://localhost:3001/api/stats`.

---

## Local Development (Windows Preview Mode)
If you run this code locally on Windows, the backend automatically detects it is not on Linux. Instead of reading `/var/log/mail.log`, it will generate **mock data** so you can preview and edit the UI locally.

1. Open a terminal and run the backend: `cd server && node index.js`
2. Open another terminal and run the frontend: `cd client && npm run dev`
