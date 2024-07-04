#!/bin/bash

# Output messages to the user
echo "-----> Installing Foundry"

# Install Foundry using the provided command
curl -L https://foundry.paradigm.xyz | bash

# Add Foundry to PATH
export PATH="$HOME/.foundry/bin:$PATH"

# Ensure the Foundry directory exists
if [ ! -d "$HOME/.foundry/bin" ]; then
  mkdir -p $HOME/.foundry/bin
fi

# Run foundryup to install Foundry components
foundryup

# Verify the installation
if [ $? -ne 0 ]; then
  echo "Error: Foundry installation failed"
  exit 1
else
  echo "Foundry installation completed successfully"
fi

# Configure Git user name and email globally
git config --global user.name "Foundry Learner"
git config --global user.email "evmbrahmin@gmail.com"

# Print Git configuration for verification
git config --global --list

# Initialize Foundry project (optional, depending on your setup)
# forge init

# Verify the initialization
if [ $? -ne 0 ]; then
  echo "Error: Forge initialization failed"
  exit 1
else
  echo "Forge initialization completed successfully"
fi
