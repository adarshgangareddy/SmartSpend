
#!/bin/bash

# ==============================================================================
# SMARTSPEND - FINANCIAL ANALYTICS MODULE
# Displays income, expenses, and net balance
# ==============================================================================


# ------------------------------------------
# 1. VIEW FINANCIAL SUMMARY
# ------------------------------------------

view_summary() {

    ensure_authenticated || return 1

    print_header

    echo -e "${BOLD}${CYAN}FINANCIAL SUMMARY${NC}"
    print_line
    if [[ -n "${1:-}" ]]; then
        print_warning "$1"
    fi

    # Supported currencies
    local currencies=("INR" "USD" "JPY" "EUR" "GBP" "CAD" "AUD" "SGD")

    echo -e "${BOLD}${MAGENTA}Select Currency:${NC}"

    local i

    for i in "${!currencies[@]}"; do
        printf "  %d. %s\n" "$((i+1))" "${currencies[$i]}"
    done

    local choice currency

    # Currency selection and validation
    while true; do

        read -r -p "${YELLOW}Choose currency [Default: 1 - INR]: ${NC}" choice || return

        if [[ -z "$choice" ]]; then
            currency="INR"
            break
        fi

        if [[ "$choice" =~ ^[0-9]+$ ]] &&
           [[ "$choice" -ge 1 ]] &&
           [[ "$choice" -le "${#currencies[@]}" ]]; then

            currency="${currencies[$((choice-1))]}"
            break

        else

            print_error "Invalid selection. Please try again."

        fi

    done

    # Request financial summary from backend
    local response status body error

    response=$(api_request GET "/analytics/summary?currency=${currency}")

    status=$(api_status "$response")
    body=$(api_body "$response")

    # Handle API errors
    if [[ "$status" != "200" ]]; then

        error=$(echo "$body" | jq -r '.detail // "Failed to fetch financial summary."')

        echo
        print_error "Failed to fetch summary (HTTP ${status}): ${error}"

        pause_menu
        return 1

    fi

    # Extract financial values
    local income expenses balance

    income=$(echo "$body" | jq -r '.total_income // 0')
    expenses=$(echo "$body" | jq -r '.total_expenses // 0')
    balance=$(echo "$body" | jq -r '.balance // 0')
    local transaction_count
    transaction_count=$(echo "$body" | jq -r '.transaction_count // 0')

    # Display summary
    echo
    print_line

    echo -e "${BOLD}       FINANCIAL SUMMARY (${currency})${NC}"

    print_line

    printf "  Total Income   : ${GREEN}%12.2f %s${NC}\n" \
        "$income" "$currency"

    printf "  Total Expenses : ${RED}%12.2f %s${NC}\n" \
        "$expenses" "$currency"
    printf "  Transactions   : %12s\n" "$transaction_count"

    print_line

    # Determine savings or deficit
    if awk -v b="$balance" 'BEGIN { exit !(b >= 0) }'; then

        printf "  Net Balance    : ${GREEN}%12.2f %s${NC} (Savings)\n" \
            "$balance" "$currency"

    else

        printf "  Net Balance    : ${RED}%12.2f %s${NC} (Deficit)\n" \
            "$balance" "$currency"

    fi

    print_line

    pause_menu
}

