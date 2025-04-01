#!/bin/bash

# Configure these variables
REPO="<REPONAME>"  # e.g. "username/my-repo"
TOKEN="<TOKEN>"  # Your GitHub Personal Access Token

echo "Starting script..."

# Extract organization name and repository name
ORG=$(echo "$REPO" | cut -d '/' -f 1)
REPO_NAME=$(echo "$REPO" | cut -d '/' -f 2)

echo "Organization: $ORG"
echo "Repository: $REPO_NAME"

# Check if .env file exists
if [ ! -f .env ]; then
    echo "Error: .env file not found!"
    exit 1
fi

echo "Found .env file"
echo "Contents of .env:"
cat .env
echo "-------------------"

# Check dependencies
command -v jq >/dev/null 2>&1 || { echo "Error: jq is required but not installed. Please install jq."; exit 1; }
command -v curl >/dev/null 2>&1 || { echo "Error: curl is required but not installed. Please install curl."; exit 1; }

# First, check if this is a repository secret or an organization secret
echo "Checking if repository exists and token has access..."
repo_check=$(curl -s -H "Authorization: token $TOKEN" \
    "https://api.github.com/repos/$REPO")

if [[ $(echo "$repo_check" | jq -r .message 2>/dev/null) == "Not Found" ]]; then
    echo "Error: Repository not found or token doesn't have access"
    echo "Response: $repo_check"
    exit 1
fi

# Get the public key for the repository
echo "Getting public key for repository in organization..."
public_key_response=$(curl -s -H "Authorization: token $TOKEN" \
    "https://api.github.com/repos/$REPO/actions/secrets/public-key")

if [[ $(echo "$public_key_response" | jq -r .message 2>/dev/null) == "Not Found" ]]; then
    echo "Repository public key not found. Trying organization public key..."
    public_key_response=$(curl -s -H "Authorization: token $TOKEN" \
        "https://api.github.com/orgs/$ORG/actions/secrets/public-key")
    
    if [[ $(echo "$public_key_response" | jq -r .message 2>/dev/null) == "Not Found" ]]; then
        echo "Error: Neither repository nor organization public key found."
        echo "Response: $public_key_response"
        exit 1
    fi
    echo "Using organization-level public key"
    using_org=true
else
    echo "Using repository-level public key"
    using_org=false
fi

key_id=$(echo "$public_key_response" | jq -r .key_id)
public_key=$(echo "$public_key_response" | jq -r .key)

echo "Retrieved public key: $key_id"

# Create a simple sodium encryption script with Node.js
cat > encrypt.js << 'EOF'
const crypto = require('crypto');
const sodium = require('sodium-native');

// Get the input text from stdin
let inputData = '';
process.stdin.on('data', chunk => {
  inputData += chunk;
});

process.stdin.on('end', () => {
  try {
    const publicKey = Buffer.from(process.argv[2], 'base64');
    const secretValue = inputData;
    
    // Create a libsodium sealed box
    const messageBuffer = Buffer.from(secretValue);
    const ciphertext = Buffer.alloc(messageBuffer.length + sodium.crypto_box_SEALBYTES);
    
    sodium.crypto_box_seal(ciphertext, messageBuffer, publicKey);
    
    console.log(ciphertext.toString('base64'));
  } catch (error) {
    console.error('Encryption error:', error.message);
    process.exit(1);
  }
});
EOF

# Try to install sodium-native if it's not already installed
if ! node -e "require('sodium-native')" 2>/dev/null; then
    echo "Installing sodium-native package..."
    npm install sodium-native --no-save || {
        echo "Failed to install sodium-native. Using simple base64 encoding instead.";
        fallback_to_base64=true;
    }
fi

# Create a temporary directory for our work
tmp_dir=$(mktemp -d)
trap 'rm -rf "$tmp_dir" encrypt.js' EXIT

# Function to parse and process .env file safely, handling multiline values
parse_env_file() {
    local env_file="$1"
    local current_key=""
    local in_value=false
    local value=""
    local line_num=0
    local total_lines=$(wc -l < "$env_file")
    
    while IFS= read -r line || [[ -n "$line" ]]; do
        ((line_num++))
        
        # Skip empty lines and comments
        [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue
        
        if [[ "$in_value" == false ]]; then
            # Look for key=value pattern
            if [[ "$line" =~ ^([A-Za-z0-9_]+)=(.*) ]]; then
                current_key="${BASH_REMATCH[1]}"
                value="${BASH_REMATCH[2]}"
                
                # Check if value starts with a quote
                if [[ "$value" =~ ^\" && ! "$value" =~ \"$ ]]; then
                    # This is the start of a multiline value
                    in_value=true
                    # Remove the starting quote
                    value="${value#\"}"
                else
                    # Single line value, remove quotes if present
                    value=$(echo "$value" | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//")
                    # Process this key-value pair
                    process_secret "$current_key" "$value"
                    current_key=""
                    value=""
                fi
            else
                echo "Warning: Line $line_num doesn't match key=value pattern: $line"
            fi
        else
            # We're in a multiline value
            # Check if this line ends the value
            if [[ "$line" =~ \"$ && ! "$line" =~ \\\"$ ]]; then
                # This ends the multiline value
                value="$value"$'\n'"${line%\"}"
                in_value=false
                # Process this key-value pair
                process_secret "$current_key" "$value"
                current_key=""
                value=""
            else
                # This is a continuation of the multiline value
                value="$value"$'\n'"$line"
            fi
        fi
        
        # If we're at the last line and still in a multiline value, process it anyway
        if [[ "$line_num" -eq "$total_lines" && "$in_value" == true && -n "$current_key" ]]; then
            echo "Warning: Unterminated quoted value for $current_key at end of file"
            process_secret "$current_key" "$value"
        fi
    done < "$env_file"
}

# Function to process a single secret
process_secret() {
    local key="$1"
    local value="$2"
    
    echo "Processing: $key"
    
    # Write the value to a temp file to handle special characters properly
    value_file="$tmp_dir/value_$key"
    echo -n "$value" > "$value_file"
    
    # Encrypt the value
    if [ "$fallback_to_base64" = true ]; then
        encrypted_value=$(base64 -w 0 < "$value_file")
        echo "Using fallback base64 encoding (not proper encryption)"
    else
        encrypted_value=$(cat "$value_file" | node encrypt.js "$public_key")
        echo "Value encrypted with libsodium"
    fi
    
    echo "Setting secret: $key"
    
    # Use the appropriate API endpoint based on whether it's an org or repo secret
    if [ "$using_org" = true ]; then
        # For organization secrets
        response=$(curl -v -X PUT \
            -H "Authorization: token $TOKEN" \
            -H "Accept: application/vnd.github.v3+json" \
            "https://api.github.com/orgs/$ORG/actions/secrets/$key" \
            -d "{\"encrypted_value\":\"$encrypted_value\", \"key_id\":\"$key_id\", \"visibility\":\"all\"}" 2>&1)
    else
        # Repository secret
        response=$(curl -v -X PUT \
            -H "Authorization: token $TOKEN" \
            -H "Accept: application/vnd.github.v3+json" \
            "https://api.github.com/repos/$REPO/actions/secrets/$key" \
            -d "{\"encrypted_value\":\"$encrypted_value\", \"key_id\":\"$key_id\"}" 2>&1)
    fi
    
    # Extract HTTP status code
    status_code=$(echo "$response" | grep -o "< HTTP/[0-9.]* [0-9]*" | awk '{print $3}')
    echo "HTTP Status Code: $status_code"
    
    # Check for success
    if [[ "$status_code" == "201" || "$status_code" == "204" ]]; then
        echo "Secret $key has been set successfully (Status: $status_code)"
    elif echo "$response" | grep -q "Bad credentials"; then
        echo "Error: Bad credentials. Check your GitHub token."
        exit 1
    elif echo "$response" | grep -q "message"; then
        error_message=$(echo "$response" | grep -o '"message":"[^"]*"')
        echo "Error response: $error_message"
    else
        echo "Unknown response. Secret may not have been set properly."
        echo "Response excerpt:"
        echo "$response" | tail -n 20
    fi
    
    # Clean up the temp file
    rm -f "$value_file"
    
    echo "-------------------"
}

# Parse and process the .env file
parse_env_file .env

# Verify secrets exist in the repository or organization
echo "Verifying secrets..."
if [ "$using_org" = true ]; then
    secrets_list=$(curl -s -H "Authorization: token $TOKEN" \
        "https://api.github.com/orgs/$ORG/actions/secrets")
    echo "Current organization secrets:"
else
    secrets_list=$(curl -s -H "Authorization: token $TOKEN" \
        "https://api.github.com/repos/$REPO/actions/secrets")
    echo "Current repository secrets:"
fi

echo "$secrets_list" | jq -r '.secrets[] | .name' 2>/dev/null

echo "Script finished"