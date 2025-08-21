#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

# install dependencies
npm i

# run the app
node index.js
