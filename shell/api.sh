
#!/bin/bash

# ==========================================
# SMARTSPEND - API MODULE
# ==========================================

API_BASE_URL="${API_BASE_URL:-${API_URL:-https://smartspend-50r1.onrender.com/api}}"

# ------------------------------------------
# API REQUEST
# ------------------------------------------

api_request() {
    local method="$1"
    local endpoint="$2"
    local data="${3:-}"
    local token=""

    if declare -F get_access_token >/dev/null 2>&1; then
        token=$(get_access_token)
    fi

    local -a curl_args=(--silent --show-error --connect-timeout 15 --max-time 45
        --write-out $'\n%{http_code}' --request "$method" "${API_BASE_URL%/}${endpoint}")

    if [[ -n "$token" ]]; then
        curl_args+=(--header "Authorization: Bearer ${token}")
    fi
    if [[ -n "$data" ]]; then
        curl_args+=(--header 'Content-Type: application/json' --data "$data")
    fi

    local response curl_status status
    response=$(curl "${curl_args[@]}" 2>/dev/null)
    curl_status=$?

    if [[ "$curl_status" -ne 0 || -z "$response" ]]; then
        printf '%s\n000\n' '{"detail":"Unable to connect to SmartSpend backend. Note: Live backend may be waking up if idle."}'
        return 1
    fi

    status=$(api_status "$response")
    if [[ "$status" == "401" && -n "$token" && -n "${TOKEN_FILE:-}" && "$endpoint" != "/auth/login" ]]; then
        rm -f -- "$TOKEN_FILE"
        SESSION_NOTICE="Your session is invalid or expired. Please log in again."
    fi

    printf '%s\n' "$response"
}

# ------------------------------------------
# CHECK API CONNECTION
# ------------------------------------------

check_api_connection() {
    local health_url="${HEALTH_CHECK_URL:-${API_BASE_URL%/}/health}"
    print_info "Checking SmartSpend backend ($health_url)..."

    local response curl_status
    response=$(curl -s --connect-timeout 15 --max-time 30 \
        -w "\n%{http_code}" \
        "$health_url" 2>/dev/null)
    curl_status=$?

    local status
    status=$(api_status "$response")

    if [[ "$curl_status" -eq 0 && "$status" == "200" ]]; then
        print_success "Backend is connected."
        return 0
    else
        print_error "Backend is unavailable (HTTP ${status:-000})."
        print_info "If using local backend: cd backend && uvicorn app.main:app --reload --port 8000"
        print_info "Or configure API_URL='https://your-backend.com/api' before running."
        return 1
    fi
}

# ------------------------------------------
# API RESPONSE HELPERS
# ------------------------------------------

api_status() {
    local response="$1"
    printf '%s\n' "$response" | tail -n 1
}

api_body() {
    local response="$1"
    if [[ "$response" == *$'\n'* ]]; then
        printf '%s' "${response%$'\n'*}"
    fi
}

