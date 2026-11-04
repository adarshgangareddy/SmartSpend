import json
import logging
import os
import urllib.request
import urllib.error
from datetime import datetime, timedelta
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path
from typing import Dict, Optional, Tuple, Any

logger = logging.getLogger(__name__)

# Supported 12 currencies
SUPPORTED_CURRENCIES = {
    "INR", "USD", "EUR", "GBP", "JPY", "AUD", "CAD", "SGD", "AED", "CNY", "KRW", "CHF"
}

# Zero decimal currencies
ZERO_DECIMAL_CURRENCIES = {"JPY", "KRW"}

# Cache file path
DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data"
CACHE_FILE = DATA_DIR / "exchange_rates_cache.json"


class CurrencyService:
    """
    Intelligent historical exchange rate fetching, multi-tier caching, and conversion.
    Multi-tier caching:
      Tier 1: In-memory dictionary
      Tier 2: Local JSON file cache (persisted across server restarts)
      Tier 3: Supabase public.exchange_rates table (if table exists)
    """

    _memory_cache: Dict[str, Dict[str, Decimal]] = {}
    _cache_loaded_from_disk: bool = False

    @classmethod
    def _ensure_disk_cache_loaded(cls):
        if cls._cache_loaded_from_disk:
            return
        cls._cache_loaded_from_disk = True
        try:
            if CACHE_FILE.exists():
                with open(CACHE_FILE, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    for d_str, rates in data.items():
                        if d_str not in cls._memory_cache:
                            cls._memory_cache[d_str] = {
                                k.upper(): Decimal(str(v)) for k, v in rates.items()
                            }
                logger.info(f"Loaded {len(cls._memory_cache)} dates from exchange rates disk cache.")
        except Exception as e:
            logger.warning(f"Could not load exchange rates disk cache: {e}")

    @classmethod
    def _save_to_disk_cache(cls, date_str: str, rates: Dict[str, Decimal]):
        try:
            DATA_DIR.mkdir(parents=True, exist_ok=True)
            current_data = {}
            if CACHE_FILE.exists():
                try:
                    with open(CACHE_FILE, "r", encoding="utf-8") as f:
                        current_data = json.load(f)
                except Exception:
                    current_data = {}
            current_data[date_str] = {k: str(v) for k, v in rates.items()}
            with open(CACHE_FILE, "w", encoding="utf-8") as f:
                json.dump(current_data, f, indent=2)
        except Exception as e:
            logger.warning(f"Could not write exchange rates to disk cache: {e}")

    @classmethod
    def _save_to_database(cls, client: Any, date_str: str, rates: Dict[str, Decimal]):
        if not client:
            return
        try:
            rates_json = {k: float(v) for k, v in rates.items()}
            client.table("exchange_rates").upsert({
                "date": date_str,
                "base_currency": "USD",
                "rates": rates_json,
                "updated_at": datetime.utcnow().isoformat(),
            }).execute()
        except Exception as e:
            # Table might not exist yet; gracefully ignore DB write error
            logger.debug(f"DB exchange_rates write skipped or table not created: {e}")

    @classmethod
    def _fetch_from_database(cls, client: Any, date_str: str) -> Optional[Dict[str, Decimal]]:
        if not client:
            return None
        try:
            res = client.table("exchange_rates").select("rates").eq("date", date_str).eq("base_currency", "USD").limit(1).execute()
            if res.data and len(res.data) > 0:
                raw_rates = res.data[0].get("rates", {})
                return {k.upper(): Decimal(str(v)) for k, v in raw_rates.items()}
        except Exception:
            return None
        return None

    @classmethod
    def _fetch_rates_from_api(cls, date_str: str) -> Optional[Dict[str, Decimal]]:
        """
        Fetch historical rates based on USD from open, reliable CDNs.
        Primary: @fawazahmed0/currency-api on jsDelivr
        Secondary: @fawazahmed0/currency-api on Cloudflare Pages
        Tertiary: open.er-api.com
        """
        urls = [
            f"https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@{date_str}/v1/currencies/usd.json",
            f"https://{date_str}.currency-api.pages.dev/v1/currencies/usd.json",
        ]

        today_str = datetime.utcnow().strftime("%Y-%m-%d")
        if date_str >= today_str:
            urls.append("https://open.er-api.com/v6/latest/USD")
            urls.append("https://latest.currency-api.pages.dev/v1/currencies/usd.json")

        for url in urls:
            try:
                req = urllib.request.Request(
                    url,
                    headers={"User-Agent": "SmartSpend-Currency-Engine/1.0"}
                )
                with urllib.request.urlopen(req, timeout=5) as response:
                    if response.status == 200:
                        data = json.loads(response.read().decode("utf-8"))
                        rates = {}
                        if "usd" in data and isinstance(data["usd"], dict):
                            for k, v in data["usd"].items():
                                try:
                                    rates[k.upper()] = Decimal(str(v))
                                except Exception:
                                    pass
                        elif "rates" in data and isinstance(data["rates"], dict):
                            for k, v in data["rates"].items():
                                try:
                                    rates[k.upper()] = Decimal(str(v))
                                except Exception:
                                    pass

                        if rates and "USD" in rates:
                            return rates
            except Exception as e:
                logger.debug(f"Failed fetching rates from {url}: {e}")

        return None

    @classmethod
    def get_usd_rates_for_date(cls, date_str: str, client: Any = None) -> Dict[str, Decimal]:
        """
        Retrieve exchange rates for a given date (YYYY-MM-DD) with USD base.
        Handles caching and date fallback (weekends / missing days).
        """
        cls._ensure_disk_cache_loaded()

        # Check Tier 1: In-memory
        if date_str in cls._memory_cache:
            return cls._memory_cache[date_str]

        # Check Tier 3: Supabase DB
        db_rates = cls._fetch_from_database(client, date_str)
        if db_rates:
            cls._memory_cache[date_str] = db_rates
            cls._save_to_disk_cache(date_str, db_rates)
            return db_rates

        # Try to fetch from API for target date
        rates = cls._fetch_rates_from_api(date_str)
        if rates:
            cls._memory_cache[date_str] = rates
            cls._save_to_disk_cache(date_str, rates)
            cls._save_to_database(client, date_str, rates)
            return rates

        # If target date failed (e.g. weekend, holiday, or very recent date),
        # walk back up to 5 days to find the closest available trading day
        try:
            dt = datetime.strptime(date_str, "%Y-%m-%d")
            for offset in range(1, 6):
                fallback_dt = dt - timedelta(days=offset)
                fallback_date_str = fallback_dt.strftime("%Y-%m-%d")

                if fallback_date_str in cls._memory_cache:
                    return cls._memory_cache[fallback_date_str]

                fallback_rates = cls._fetch_rates_from_api(fallback_date_str)
                if fallback_rates:
                    cls._memory_cache[fallback_date_str] = fallback_rates
                    cls._save_to_disk_cache(fallback_date_str, fallback_rates)
                    cls._save_to_database(client, fallback_date_str, fallback_rates)
                    # Cache under target date as well so repeated lookups don't refetch
                    cls._memory_cache[date_str] = fallback_rates
                    return fallback_rates
        except Exception as e:
            logger.warning(f"Error during date fallback walking for {date_str}: {e}")

        # Final safety fallback: Return any latest cached rates or default parity
        if cls._memory_cache:
            latest_cached_date = sorted(cls._memory_cache.keys())[-1]
            return cls._memory_cache[latest_cached_date]

        # Ultimate fallback static approximate rates (USD base) to prevent crashes
        default_rates = {
            "USD": Decimal("1.0"),
            "INR": Decimal("86.5"),
            "EUR": Decimal("0.92"),
            "GBP": Decimal("0.79"),
            "JPY": Decimal("152.0"),
            "AUD": Decimal("1.55"),
            "CAD": Decimal("1.39"),
            "SGD": Decimal("1.34"),
            "AED": Decimal("3.67"),
            "CNY": Decimal("7.24"),
            "KRW": Decimal("1390.0"),
            "CHF": Decimal("0.89"),
        }
        return default_rates

    @classmethod
    def convert_amount(
        cls,
        amount: Any,
        from_currency: str,
        to_currency: str,
        transaction_date: Optional[str] = None,
        client: Any = None,
    ) -> Tuple[Decimal, Decimal, bool]:
        """
        Converts an amount from one currency to another using historical exchange rates.
        Returns:
            (converted_amount, exchange_rate, is_converted)
        """
        from_curr = (from_currency or "INR").upper().strip()
        to_curr = (to_currency or "INR").upper().strip()

        try:
            dec_amount = Decimal(str(amount))
        except Exception:
            dec_amount = Decimal("0.0")

        if from_curr == to_curr:
            return dec_amount, Decimal("1.0"), False

        # Normalize date
        date_str = transaction_date
        if not date_str:
            date_str = datetime.utcnow().strftime("%Y-%m-%d")
        else:
            # Handle timestamps (e.g. 2026-11-04T12:00:00Z)
            date_str = date_str[:10]

        rates = cls.get_usd_rates_for_date(date_str, client=client)

        rate_from = rates.get(from_curr, Decimal("1.0"))
        rate_to = rates.get(to_curr, Decimal("1.0"))

        if rate_from <= 0:
            rate_from = Decimal("1.0")

        # Converted = Amount / Rate_From * Rate_To
        converted = (dec_amount / rate_from) * rate_to
        effective_rate = rate_to / rate_from

        # Round according to currency conventions
        if to_curr in ZERO_DECIMAL_CURRENCIES:
            converted = converted.quantize(Decimal("1"), rounding=ROUND_HALF_UP)
        else:
            converted = converted.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

        effective_rate = effective_rate.quantize(Decimal("0.000001"), rounding=ROUND_HALF_UP)

        return converted, effective_rate, True
