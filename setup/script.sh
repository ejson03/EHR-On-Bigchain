#!/bin/sh
apt-get update
apt-get install -y git
apt install apt-transport-https ca-certificates curl software-properties-common
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu bionic stable"
apt update
apt-cache policy docker-ce
apt install -y docker-ce
apt-get install -y docker-compose
git clone https://github.com/bigchaindb/bigchaindb.git





