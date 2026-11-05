
#!/bin/bash

# ==========================================
# SMARTSPEND - AUTHENTICATION MODULE
# ==========================================

TOKEN_FILE="$HOME/.config/smartspend/token.json"

# ------------------------------------------
# TOKEN MANAGEMENT
# ------------------------------------------

is_logged_in() {
    [[ -f "$TOKEN_FILE" ]] &&
        jq -e '.access_token | strings | length > 0' "$TOKEN_FILE" >/dev/null 2>&1
}

get_access_token() {
    [[ -f "$TOKEN_FILE" ]] &&
    jq -r '.access_token // empty' "$TOKEN_FILE"
}

get_user_email() {
    [[ -f "$TOKEN_FILE" ]] &&
    jq -r '.user.email // empty' "$TOKEN_FILE"
}

get_user_id() {
    [[ -f "$TOKEN_FILE" ]] &&
        jq -r '.user.id // empty' "$TOKEN_FILE"
}

get_user_role() {
    [[ -f "$TOKEN_FILE" ]] &&
    jq -r '.user.role // empty' "$TOKEN_FILE"
}

save_token() {
    local response="$1"

    local token_dir temp_file
    token_dir="$(dirname "$TOKEN_FILE")"
    mkdir -p "$token_dir" || return 1
    chmod 700 "$token_dir" || return 1

    temp_file="${TOKEN_FILE}.tmp.$$"
    (umask 077; printf '%s\n' "$response" | jq '.' > "$temp_file") || {
        rm -f -- "$temp_file"
        return 1
    }
    chmod 600 "$temp_file" && mv -f -- "$temp_file" "$TOKEN_FILE"
}

# ------------------------------------------
# LOGIN
# ------------------------------------------

login() {
    print_header
    print_dashboard_title "SMARTSPEND LOGIN"

    local email password payload response status body access_token
    read -r -p "${BOLD}${YELLOW}Email    : ${NC}" email || return 1
    if ! validate_email "$email"; then
        print_error "Enter a valid email address."
        pause_menu
        return 1
    fi

    read -r -s -p "${BOLD}${YELLOW}Password : ${NC}" password || return 1
    echo
    if [[ -z "$password" ]]; then
        print_error "Password cannot be empty."
        pause_menu
        return 1
    fi

    payload=$(jq -n \
        --arg email "$email" \
        --arg password "$password" \
        '{email: $email, password: $password}')

    unset password

    print_info "Authenticating..."
    response=$(api_request POST "/auth/login" "$payload")
    status=$(api_status "$response")
    body=$(api_body "$response")

    if [[ "$status" != "200" ]]; then
        print_error "Login failed: $(echo "$body" | jq -r '.detail // .message // "Please check your credentials."' 2>/dev/null)"
        pause_menu
        return 1
    fi

    access_token=$(echo "$body" | jq -r '.access_token // empty')

    if [[ -z "$access_token" ]]; then
        print_error "Login response did not contain an access token."
        pause_menu
        return 1
    fi

    if ! save_token "$body"; then
        print_error "Unable to save the local session securely."
        pause_menu
        return 1
    fi

    if ! verify_session; then
        if ! is_logged_in; then
            pause_menu
            return 1
        fi
        print_warning "Credentials were accepted; waiting for the backend to verify your role."
        pause_menu
        return 0
    fi

    print_success "Login successful."
    return 0
}

# Verify saved credentials and replace any locally cached role with the server role.
verify_session() {
    is_logged_in || return 1

    local response status body user_id user_email role updated
    response=$(api_request GET "/auth/me")
    status=$(api_status "$response")
    body=$(api_body "$response")

    if [[ "$status" != "200" ]]; then
        if [[ "$status" == "401" || "$status" == "403" ]]; then
            rm -f -- "$TOKEN_FILE"
            SESSION_NOTICE="Your session is invalid or expired. Please log in again."
            print_warning "$SESSION_NOTICE"
        else
            print_error "Unable to verify the current session (HTTP ${status:-000})."
        fi
        return 1
    fi

    user_id=$(echo "$body" | jq -r '.id // .user.id // empty' 2>/dev/null)
    user_email=$(echo "$body" | jq -r '.email // .user.email // empty' 2>/dev/null)
    role=$(echo "$body" | jq -r '.role // .user.role // empty' 2>/dev/null)
    if [[ -z "$user_id" || ( "$role" != "admin" && "$role" != "user" ) ]]; then
        rm -f -- "$TOKEN_FILE"
        print_error "The backend returned an incomplete or unsupported account identity."
        return 1
    fi

    updated=$(jq --arg id "$user_id" --arg email "$user_email" --arg role "$role" \
        '.user = {id: $id, email: $email, role: $role}' "$TOKEN_FILE") || return 1
    (umask 077; printf '%s\n' "$updated" > "${TOKEN_FILE}.tmp.$$") || return 1
    chmod 600 "${TOKEN_FILE}.tmp.$$" && mv -f -- "${TOKEN_FILE}.tmp.$$" "$TOKEN_FILE" || return 1
    return 0
}

# ------------------------------------------
# LOGOUT
# ------------------------------------------

logout() {
    rm -f -- "$TOKEN_FILE"
    print_success "Successfully logged out."
}

# ------------------------------------------
# AUTHENTICATION CHECK
# ------------------------------------------

ensure_authenticated() {
    if ! is_logged_in; then
        print_error "Please log in first."
        return 1
    fi

    return 0
}

