# EHR

Access control of medical records using BigchainDB & IPFS

### Prerequisites

What things you need to install the software and how to install them

```
[Vagrant] (https://www.vagrantup.com/downloads.html)
[Virtualbox] (https://www.virtualbox.org/wiki/Downloads)
```

### BigchainDB Setup

```
cd setup
vagrant up bigchaindb
vagrant ssh bigchaindb (prompt password: vagrant)
git clone [https://github.com/bigchaindb/bigchaindb.git](https://github.com/bigchaindb/bigchaindb.git)
cd bigchaindb
sudo make run (first time)

sudo docker-compose start (when further encountered for development)
sudo docker-compose build (if bdb shows error)
```

### Dashboard setup

```
cd block-visualization
npm install
npm start
```

### Webapp

```
npm install
node open.js
```

### Ports for querying

```
mongodb:  <ip-address>:27017
bigchaindb:   <ip-address>:9984/api/v1
```

