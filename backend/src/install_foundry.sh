#!/bin/bash

set -e  # Exit immediately if a command exits with a non-zero status.

# Function to check if a command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Function to wait for foundryup to complete and verify installation
wait_for_foundry_installation() {
  local max_attempts=60  # Maximum number of attempts (10 minutes)
  local attempt=0

  while [ $attempt -lt $max_attempts ]; do
    if command_exists forge && command_exists cast && command_exists anvil; then
      echo "Foundry installation completed successfully"
      return 0
    fi
    echo "Waiting for Foundry installation to complete... (attempt $((attempt+1))/$max_attempts)"
    sleep 10  # Wait for 10 seconds before checking again
    attempt=$((attempt+1))
  done

  echo "Error: Foundry installation timed out"
  return 1
}

# Output messages to the user
echo "-----> Installing Foundry"

# Install Foundry using the provided command
if ! command_exists foundryup; then
  curl -L https://foundry.paradigm.xyz | bash
  # Source the updated PATH
  source "$HOME/.bashrc"
fi

# Ensure the Foundry directory exists
if [ ! -d "$HOME/.foundry/bin" ]; then
  mkdir -p "$HOME/.foundry/bin"
fi

# Add Foundry to PATH if not already there
if [[ ":$PATH:" != *":$HOME/.foundry/bin:"* ]]; then
  export PATH="$HOME/.foundry/bin:$PATH"
fi

# Run foundryup to install Foundry components
echo "Running foundryup..."
foundryup

# Wait for foundryup to complete and verify installation
if ! wait_for_foundry_installation; then
  echo "Error: Foundry installation failed"
  exit 1
fi

# Configure Git user name and email globally
git config --global user.name "Foundry Learner"
git config --global user.email "evmbrahmin@gmail.com"

# Print Git configuration for verification
git config --global --list

# Initialize Foundry project (optional, depending on your setup)
# Uncomment the following lines if you want to initialize a Foundry project
# echo "Initializing Foundry project..."
# if forge init; then
#   echo "Forge initialization completed successfully"
# else
#   echo "Error: Forge initialization failed"
#   exit 1
# fi

echo "Foundry installation and setup completed."