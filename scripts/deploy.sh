#!/bin/bash

# Pull the latest updates from the repository
git pull

# Restart the server using systemctl
sudo -S systemctl restart deployserver
