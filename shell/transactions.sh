
#!/bin/bash

# ==========================================
# SMARTSPEND - TRANSACTION MODULE
# ==========================================

# ------------------------------------------
# VIEW TRANSACTIONS
# ------------------------------------------

view_transactions() {
    ensure_authenticated || return 1

    print_header
    echo -e "${BOLD}${CYAN}${1:-MY TRANSACTIONS}${NC}"
    print_line
    if [[ -n "${2:-}" ]]; then
        print_warning "$2"
    fi

    local response status body count offset=0 total=0 failed=0
    while true; do
        response=$(api_request GET "/transactions?limit=500&offset=${offset}")
        status=$(api_status "$response")
        body=$(api_body "$response")

        if [[ "$status" != "200" ]]; then
            print_error "Failed to fetch transactions (HTTP ${status:-000}): $(echo "$body" | jq -r '.detail // .message // "Unknown error."' 2>/dev/null)"
            failed=1
            break
        fi

        count=$(echo "$body" | jq 'if type == "array" then length else -1 end' 2>/dev/null)
        if [[ ! "$count" =~ ^[0-9]+$ ]]; then
            print_error "The backend returned an invalid transaction response."
            failed=1
            break
        fi
        [[ "$count" -eq 0 ]] && break

        if [[ "$total" -eq 0 ]]; then
            printf '%-8s %-12s %-10s %-20s %-18s %s\n' "ID" "DATE" "TYPE" "CATEGORY" "AMOUNT" "DESCRIPTION"
            print_line
        fi

        while IFS=$'\t' read -r id tx_date tx_type category amount currency description; do
            local type_color amount_color
            if [[ "$tx_type" == "income" ]]; then
                type_color="$GREEN"
                amount_color="$GREEN"
            else
                type_color="$RED"
                amount_color="$RED"
            fi
            printf '%s%-8s%s %-12s %s%-10s%s %s%-20s%s %s%-18s%s %s\n' \
                "$CYAN" "$id" "$NC" "$tx_date" \
                "$type_color" "$tx_type" "$NC" \
                "$MAGENTA" "$category" "$NC" \
                "$amount_color" "$amount $currency" "$NC" "$description"
        done < <(echo "$body" | jq -r '.[] | [.id, .transaction_date, .type, .category, .amount, .currency, (.description // "-")] | @tsv')

        total=$((total + count))
        offset=$((offset + count))
        [[ "$count" -lt 500 ]] && break
    done

    if [[ "$failed" -eq 0 ]]; then
        if [[ "$total" -eq 0 ]]; then
            print_info "No transactions found."
        else
            print_line
            print_info "Showing ${total} transaction(s)."
        fi
    fi

    if [[ "${3:-}" != "no-pause" ]]; then
        pause_menu
    fi
    return "$failed"
}

# ------------------------------------------
# ADD TRANSACTION
# ------------------------------------------

add_transaction() {
    ensure_authenticated || return 1

    local type="${1:-}"
    if [[ "$type" != "income" && "$type" != "expense" ]]; then
        print_error "Transaction type must be income or expense."
        pause_menu
        return 1
    fi

    print_header
    if [[ "$type" == "income" ]]; then
        print_dashboard_title "ADD INCOME"
        local categories=("Salary" "Freelance" "Business" "Investment" "Gift" "Other")
    else
        print_dashboard_title "ADD EXPENSE"
        local categories=("Food" "Transportation" "Shopping" "Education" "Bills" "Healthcare" "Entertainment" "Rent" "Other")
    fi

    local amount category description tx_date currency category_choice confirm_choice currency_choice index
    local currencies=("INR" "USD" "EUR" "GBP" "JPY" "CAD" "AUD" "SGD")

    read -r -p "${BOLD}${YELLOW}Amount: ${NC}" amount || return 1

    if ! validate_amount "$amount"; then
        print_error "Enter a valid positive amount with up to two decimal places."
        pause_menu
        return 1
    fi

    echo
    print_menu_section "SELECT CURRENCY"
    for index in "${!currencies[@]}"; do
        print_menu_item "$((index + 1))" "${currencies[$index]}"
    done
    while true; do
        read -r -p "${YELLOW}Choose currency [1-${#currencies[@]}]: ${NC}" currency_choice || return 1
        if [[ "$currency_choice" =~ ^[0-9]+$ ]] &&
            (( currency_choice >= 1 && currency_choice <= ${#currencies[@]} )); then
            currency="${currencies[$((currency_choice - 1))]}"
            break
        fi
        print_error "Choose a currency number from the list."
    done

    echo
    print_menu_section "SELECT CATEGORY"
    for index in "${!categories[@]}"; do
        print_menu_item "$((index + 1))" "${categories[$index]}"
    done
    while true; do
        read -r -p "${YELLOW}Choose category [1-${#categories[@]}]: ${NC}" category_choice || return 1
        if [[ "$category_choice" =~ ^[0-9]+$ ]] &&
            (( category_choice >= 1 && category_choice <= ${#categories[@]} )); then
            category="${categories[$((category_choice - 1))]}"
            break
        fi
        print_error "Choose a category number from the list."
    done

    read -r -p "${YELLOW}Description (optional, press Enter to skip): ${NC}" description || return 1
    read -r -p "${YELLOW}Date [Today: $(date +%Y-%m-%d), Enter to accept]: ${NC}" tx_date || return 1
    tx_date="${tx_date:-$(date +%Y-%m-%d)}"

    if [[ -z "${category//[[:space:]]/}" || ${#category} -gt 50 ]]; then
        print_error "Category must contain 1 to 50 non-whitespace characters."
        pause_menu
        return 1
    fi
    if [[ ${#description} -gt 500 ]]; then
        print_error "Description cannot exceed 500 characters."
        pause_menu
        return 1
    fi
    if [[ ! "$currency" =~ ^[A-Z]{3}$ ]]; then
        print_error "Currency must be a three-letter code, such as INR or USD."
        pause_menu
        return 1
    fi
    if ! validate_date "$tx_date"; then
        print_error "Invalid date. Use YYYY-MM-DD."
        pause_menu
        return 1
    fi

    print_line
    print_info "Please review the transaction before submitting."
    printf '  Type        : %s\n' "$type"
    printf '  Amount      : %s %s\n' "$amount" "$currency"
    printf '  Category    : %s%s%s\n' "$MAGENTA" "$category" "$NC"
    printf '  Description : %s\n' "${description:-—}"
    printf '  Date        : %s\n' "$tx_date"
    print_line
    print_menu_item 1 "Confirm" "$GREEN"
    print_menu_item 2 "Cancel" "$RED"
    while true; do
        read -r -p "${YELLOW}Enter your choice [1-2]: ${NC}" confirm_choice || return 1
        case "$confirm_choice" in
            1) break ;;
            2)
                print_warning "Transaction cancelled; nothing was saved."
                pause_menu
                return 0
                ;;
            *) print_error "Choose 1 to confirm or 2 to cancel." ;;
        esac
    done

    local payload
    payload=$(jq -n \
        --arg type "$type" \
        --arg category "$category" \
        --arg description "$description" \
        --arg transaction_date "$tx_date" \
        --arg currency "$currency" \
        --argjson amount "$amount" \
        '{
            type: $type,
            category: $category,
            description: (if $description == "" then null else $description end),
            transaction_date: $transaction_date,
            currency: $currency,
            amount: $amount
        }')

    local response status body

    response=$(api_request POST "/transactions" "$payload")
    status=$(api_status "$response")
    body=$(api_body "$response")

    if [[ "$status" == "200" || "$status" == "201" ]]; then
        print_success "Transaction added successfully (ID $(echo "$body" | jq -r '.id // "N/A"'))."
    else
        print_error "Failed to add transaction (HTTP ${status:-000}): $(echo "$body" | jq -r '.detail // .message // "Unknown error."' 2>/dev/null)"
    fi

    pause_menu
}

# ------------------------------------------
# DELETE TRANSACTION
# ------------------------------------------

delete_transaction() {
    ensure_authenticated || return 1

    if [[ "${2:-}" != "no-list" ]]; then
        if ! view_transactions "MY TRANSACTIONS" "" "no-pause"; then
            return 1
        fi
    fi
    print_dashboard_title "DELETE TRANSACTION"
    if [[ -n "${1:-}" ]]; then
        print_warning "$1"
    fi

    local transaction_id
    read -r -p "${YELLOW}Enter transaction ID: ${NC}" transaction_id || return 1

    if [[ ! "$transaction_id" =~ ^[1-9][0-9]*$ ]]; then
        print_error "Enter a positive numeric transaction ID."
        pause_menu
        return 1
    fi

    local confirmation
    read -r -p "${YELLOW}Delete transaction ${transaction_id}? Type DELETE to confirm: ${NC}" confirmation || return 1
    if [[ "$confirmation" != "DELETE" ]]; then
        print_warning "Deletion cancelled."
        pause_menu
        return 0
    fi

    local response status body

    response=$(api_request DELETE "/transactions/$transaction_id")
    status=$(api_status "$response")
    body=$(api_body "$response")

    if [[ "$status" == "200" || "$status" == "204" ]]; then
        print_success "Transaction deleted successfully."
    else
        print_error "Failed to delete transaction (HTTP ${status:-000}): $(echo "$body" | jq -r '.detail // .message // "Unknown error."' 2>/dev/null)"
    fi

    pause_menu
}

# ------------------------------------------
# UPDATE ACCOUNT PROFILE
# ------------------------------------------

update_account() {
    ensure_authenticated || return 1

    print_header "UPDATE ACCOUNT PROFILE"

    echo "You can update your display name and preferred currency."
    print_warning "Self-service email change is not available in the backend. Password change is available."

    local full_name currency password choice

    read -r -p "${YELLOW}Enter new display name (blank to keep current): ${NC}" full_name || return 1
    read -r -p "${YELLOW}Enter preferred currency (blank to keep current): ${NC}" currency || return 1
    read -r -p "${YELLOW}Change password too? [y/N]: ${NC}" choice || return 1

    if [[ "$choice" =~ ^[Yy]$ ]]; then
        read -r -s -p "${YELLOW}Enter new password (minimum 6 characters): ${NC}" password || return 1
        echo
        if [[ ${#password} -lt 6 ]]; then
            unset password
            print_error "Password must contain at least 6 characters."
            pause_menu
            return 1
        fi
    fi

    if [[ -z "$full_name" && -z "$currency" && -z "$password" ]]; then
        print_info "No changes requested."
        pause_menu
        return
    fi

    if [[ -n "$full_name" && ${#full_name} -gt 150 ]]; then
        print_error "Display name cannot exceed 150 characters."
        pause_menu
        return 1
    fi
    if [[ -n "$currency" ]]; then
        currency="${currency^^}"
        if [[ ! "$currency" =~ ^[A-Z]{3}$ ]]; then
            print_error "Currency must be a three-letter code, such as INR or USD."
            pause_menu
            return 1
        fi
    fi

    local payload
    payload=$(jq -n \
        --arg full_name "$full_name" \
        --arg currency "$currency" \
        '{full_name: $full_name, preferred_currency: $currency}
        | with_entries(select(.value != ""))')

    local response status body failed=0

    if [[ -n "$full_name" || -n "$currency" ]]; then
        response=$(api_request PUT "/profile" "$payload")
        status=$(api_status "$response")
        body=$(api_body "$response")
        if [[ "$status" == "200" ]]; then
            print_success "Profile updated successfully."
        else
            print_error "Failed to update profile (HTTP ${status:-000}): $(echo "$body" | jq -r '.detail // .message // "Unknown error."' 2>/dev/null)"
            failed=1
        fi
    fi

    if [[ -n "$password" ]]; then
        local password_payload
        password_payload=$(jq -n --arg new_password "$password" '{new_password: $new_password}')
        unset password
        response=$(api_request POST "/auth/update-password" "$password_payload")
        status=$(api_status "$response")
        body=$(api_body "$response")
        if [[ "$status" == "200" ]]; then
            print_success "Password updated successfully."
        else
            print_error "Failed to update password (HTTP ${status:-000}): $(echo "$body" | jq -r '.detail // .message // "Unknown error."' 2>/dev/null)"
            failed=1
        fi
    fi

    pause_menu
    return "$failed"
}

# ------------------------------------------
# DELETE ACCOUNT
# ------------------------------------------

delete_account() {
    ensure_authenticated || return 1

    print_header "DELETE ACCOUNT"

    print_warning "This permanently deletes your account and personal data."
    read -r -p "${YELLOW}Type DELETE to confirm: ${NC}" confirmation || return 1

    if [[ "$confirmation" != "DELETE" ]]; then
        print_warning "Account deletion cancelled."
        pause_menu
        return
    fi

    local response status body

    response=$(api_request DELETE "/profile")
    status=$(api_status "$response")
    body=$(api_body "$response")

    if [[ "$status" == "200" ]]; then
        rm -f -- "$TOKEN_FILE"
        print_success "Account and personal data deleted successfully."
        print_info "You have been logged out."
    else
        print_error "Failed to delete account (HTTP ${status:-000}): $(echo "$body" | jq -r '.detail // .message // "Unknown error."' 2>/dev/null)"
    fi

    pause_menu
}

