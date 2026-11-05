
#!/bin/bash

# ==========================================
# SMARTSPEND - ADMIN MODULE
# ==========================================

# ------------------------------------------
# 1. VIEW ALL USERS
# ------------------------------------------

view_all_users() {

    ensure_authenticated || return 1

    print_header

    echo -e "${BOLD}${CYAN}REGISTERED USERS${NC}"
    print_line

    printf "%-5s %-38s %-12s %-22s\n" \
        "NO." "EMAIL" "ROLE" "CREATED AT"

    print_line

    local response status body error page=1 per_page=100 total=0 count index=1
    local user id email role created

    while true; do
        response=$(api_request GET "/admin/users?page=${page}&per_page=${per_page}")
        status=$(api_status "$response")
        body=$(api_body "$response")
        if [[ "$status" != "200" ]]; then
            error=$(echo "$body" | jq -r '.detail // "Unable to fetch users."' 2>/dev/null)
            print_error "$error"
            pause_menu
            return 1
        fi

        count=$(echo "$body" | jq '.users | length' 2>/dev/null)
        if [[ ! "$count" =~ ^[0-9]+$ ]]; then
            print_error "The backend returned an invalid user list."
            pause_menu
            return 1
        fi
        total=$(echo "$body" | jq -r '.total // 0')
        while IFS= read -r user; do
            id=$(echo "$user" | jq -r '.id // "N/A"')
            email=$(echo "$user" | jq -r '.email // "N/A"')
            role=$(echo "$user" | jq -r '.role // "N/A"')
            created=$(echo "$user" | jq -r '.created_at // "N/A"' | cut -d'T' -f1)
            printf "%-5s %-38s %-12s %-22s\n" "$index" "$email" "$role" "$created"
            printf "      %sID:%s %s\n" "$CYAN" "$NC" "$id"
            print_line
            ((index += 1))
        done < <(echo "$body" | jq -c '.users[]')

        ((count == 0 || index > total)) && break
        ((page += 1))
    done

    if (( index == 1 )); then
        print_info "No registered users found."
    fi
    echo
    print_success "Total registered users: ${total}"

    pause_menu
}


# ------------------------------------------
# 2. ADD USER
# ------------------------------------------

add_user() {

    ensure_authenticated || return 1

    print_header

    echo -e "${CYAN}ADD NEW USER${NC}"
    print_line

    local email password role payload response
    local status body error

    read -r -p "${YELLOW}Enter new user email: ${NC}" email || return 1

    if ! validate_email "$email"; then
        print_error "Enter a valid email address."
        pause_menu
        return 1
    fi

    read -r -s -p "${YELLOW}Enter temporary password (minimum 8 characters): ${NC}" password || return 1
    echo

    if ! validate_password "$password"; then
        print_error "Password must contain at least 8 characters."
        unset password
        pause_menu
        return 1
    fi

    echo
    print_menu_section "SELECT ROLE"
    print_menu_item 1 "User"
    print_menu_item 2 "Admin"
    local role_choice
    read -r -p "${YELLOW}Choose role [1-2, default 1]: ${NC}" role_choice || { unset password; return 1; }
    case "${role_choice:-1}" in
        1) role="user" ;;
        2) role="admin" ;;
        *)
            unset password
            print_error "Choose 1 for User or 2 for Admin."
            pause_menu
            return 1
            ;;
    esac

    payload=$(jq -n \
        --arg email "$email" \
        --arg password "$password" \
        --arg role "$role" \
        '{email: $email, password: $password, role: $role}')

    unset password

    response=$(api_request POST "/admin/users" "$payload")

    status=$(api_status "$response")
    body=$(api_body "$response")

    if [[ "$status" == "200" || "$status" == "201" ]]; then

        print_success "User created successfully."

        local new_user_email
        new_user_email=$(echo "$body" | jq -r '.user.email // empty')

        if [[ -n "$new_user_email" ]]; then
            print_info "Created account: $new_user_email"
        fi

    else

        error=$(echo "$body" | jq -r '.detail // "Failed to create user."')
        print_error "Failed to create user: ${error}"

    fi

    pause_menu
}


# ------------------------------------------
# 3. UPDATE USER
# ------------------------------------------

update_user() {

    ensure_authenticated || return 1

    print_header

    echo -e "${CYAN}UPDATE USER${NC}"
    print_line

    local user_id choice email password payload
    local response status body error

    read -r -p "${YELLOW}Enter the User ID: ${NC}" user_id || return 1

    if [[ -z "$user_id" ]]; then
        print_error "User ID cannot be empty."
        pause_menu
        return 1
    fi
    if [[ ! "$user_id" =~ ^[0-9a-fA-F]{8}-([0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12}$ ]]; then
        print_error "Enter a valid user UUID."
        pause_menu
        return 1
    fi

    echo
    echo "What do you want to update?"
    echo "1. Email"
    echo "2. Password"
    echo "3. Both Email and Password"
    echo "4. Cancel"

    read -r -p "${YELLOW}Enter choice: ${NC}" choice || return 1

    case "$choice" in

        1)

            read -r -p "${YELLOW}Enter new email: ${NC}" email || return 1

            if ! validate_email "$email"; then
                print_error "Enter a valid email address."
                pause_menu
                return 1
            fi

            payload=$(jq -n \
                --arg email "$email" \
                '{email: $email}')

            ;;

        2)

            read -r -s -p "${YELLOW}Enter new password: ${NC}" password || return 1
            echo

            if ! validate_password "$password"; then
                print_error "Password must contain at least 8 characters."
                unset password
                pause_menu
                return 1
            fi

            payload=$(jq -n \
                --arg password "$password" \
                '{password: $password}')

            unset password

            ;;

        3)

            read -r -p "${YELLOW}Enter new email: ${NC}" email || return 1

            if ! validate_email "$email"; then
                print_error "Enter a valid email address."
                pause_menu
                return 1
            fi

            read -r -s -p "${YELLOW}Enter new password: ${NC}" password || return 1
            echo

            if ! validate_password "$password"; then
                print_error "Password must contain at least 8 characters."
                unset password
                pause_menu
                return 1
            fi

            payload=$(jq -n \
                --arg email "$email" \
                --arg password "$password" \
                '{email: $email, password: $password}')

            unset password

            ;;

        4)

            print_warning "Update cancelled."
            pause_menu
            return 0

            ;;

        *)

            print_error "Invalid choice."
            pause_menu
            return 1

            ;;

    esac

    response=$(api_request PUT "/admin/users/${user_id}" "$payload")

    status=$(api_status "$response")
    body=$(api_body "$response")

    if [[ "$status" == "200" ]]; then

        print_success "User updated successfully."
        echo "$body" | jq -r '"  ID: \(.user.id) | Email: \(.user.email) | Role: \(.user.role)"' 2>/dev/null

    else

        error=$(echo "$body" | jq -r '.detail // "Failed to update user."')
        print_error "Failed to update user: ${error}"

    fi

    pause_menu
}


# ------------------------------------------
# 4. REMOVE USER
# ------------------------------------------

remove_user() {

    ensure_authenticated || return 1

    print_header

    echo -e "${RED}REMOVE USER ACCOUNT${NC}"
    print_line

    local user_id confirmation
    local response status body error

    read -r -p "${YELLOW}Enter the User ID to remove: ${NC}" user_id || return 1

    if [[ -z "$user_id" ]]; then
        print_error "User ID cannot be empty."
        pause_menu
        return 1
    fi
    if [[ ! "$user_id" =~ ^[0-9a-fA-F]{8}-([0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12}$ ]]; then
        print_error "Enter a valid user UUID."
        pause_menu
        return 1
    fi

    if [[ "$user_id" == "$(get_user_id)" ]]; then
        print_error "You cannot remove your own administrator account."
        pause_menu
        return 1
    fi

    echo
    print_warning "This action permanently deletes the account."
    echo
    read -r -p "${YELLOW}Type DELETE to confirm: ${NC}" confirmation || return 1

    if [[ "$confirmation" != "DELETE" ]]; then
        print_warning "Deletion cancelled."
        pause_menu
        return 0
    fi

    response=$(api_request DELETE "/admin/users/${user_id}")

    status=$(api_status "$response")
    body=$(api_body "$response")

    if [[ "$status" == "200" ]]; then

        print_success "User removed successfully."

    else

        error=$(echo "$body" | jq -r '.detail // "Failed to remove user."')
        print_error "Failed to remove user: ${error}"

    fi

    pause_menu
}

