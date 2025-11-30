#!/usr/bin/env python3
"""
Financial Calculation Validator
Validates report calculations from Convex database against independent Python calculations.
Accepts JSON input from report data and performs verification.
"""

import json
import sys
from datetime import datetime
from typing import Dict, List, Any, Optional
from decimal import Decimal, ROUND_HALF_UP

# Set precision for financial calculations
DECIMAL_PLACES = 2


def round_decimal(value: float) -> Decimal:
    """Round to 2 decimal places for currency"""
    return Decimal(str(value)).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)


def calculate_pnl(revenue: float, expenses: float) -> Dict[str, Any]:
    """Calculate Profit & Loss metrics"""
    revenue_dec = round_decimal(revenue)
    expenses_dec = round_decimal(expenses)
    net_income = revenue_dec - expenses_dec
    gross_margin = (net_income / revenue_dec * 100) if revenue_dec > 0 else Decimal('0')
    
    return {
        "revenue": float(revenue_dec),
        "expenses": float(expenses_dec),
        "net_income": float(net_income),
        "gross_margin": float(gross_margin)
    }


def calculate_balance_sheet(assets: List[Dict], liabilities: List[Dict], equity: List[Dict], retained_earnings: float) -> Dict[str, Any]:
    """Calculate Balance Sheet totals and verify balance"""
    total_assets = round_decimal(sum(item.get("balance", 0) for item in assets))
    total_liabilities = round_decimal(sum(item.get("balance", 0) for item in liabilities))
    total_equity = round_decimal(sum(item.get("balance", 0) for item in equity) + retained_earnings)
    total_liab_equity = total_liabilities + total_equity
    
    difference = abs(total_assets - total_liab_equity)
    is_balanced = difference < Decimal('0.01')
    
    return {
        "total_assets": float(total_assets),
        "total_liabilities": float(total_liabilities),
        "total_equity": float(total_equity),
        "total_liabilities_and_equity": float(total_liab_equity),
        "difference": float(difference),
        "is_balanced": is_balanced
    }


def calculate_cash_flow(net_income: float, change_in_assets: float, change_in_liabilities: float) -> Dict[str, Any]:
    """Calculate Cash Flow from Operations (Indirect Method)"""
    net_income_dec = round_decimal(net_income)
    change_in_assets_dec = round_decimal(change_in_assets)
    change_in_liabilities_dec = round_decimal(change_in_liabilities)
    
    cash_from_operations = net_income_dec - change_in_assets_dec + change_in_liabilities_dec
    
    return {
        "net_income": float(net_income_dec),
        "change_in_current_assets": float(-change_in_assets_dec),
        "change_in_current_liabilities": float(change_in_liabilities_dec),
        "cash_from_operations": float(cash_from_operations)
    }


def calculate_trial_balance(entries: List[Dict]) -> Dict[str, Any]:
    """Calculate Trial Balance totals"""
    total_debits = round_decimal(0)
    total_credits = round_decimal(0)
    
    for entry in entries:
        total_debits += round_decimal(entry.get("debit", 0))
        total_credits += round_decimal(entry.get("credit", 0))
    
    difference = abs(total_debits - total_credits)
    is_balanced = difference < Decimal('0.01')
    
    return {
        "total_debits": float(total_debits),
        "total_credits": float(total_credits),
        "difference": float(difference),
        "is_balanced": is_balanced
    }


def calculate_burn_rate(monthly_burns: List[float], current_balance: float) -> Dict[str, Any]:
    """Calculate burn rate and runway"""
    if not monthly_burns:
        return {
            "average_monthly_burn": 0.0,
            "runway_months": None
        }
    
    burns_dec = [round_decimal(burn) for burn in monthly_burns]
    average_burn = sum(burns_dec) / len(burns_dec)
    current_balance_dec = round_decimal(current_balance)
    
    runway_months = float(current_balance_dec / average_burn) if average_burn > 0 else None
    
    return {
        "average_monthly_burn": float(average_burn),
        "current_monthly_burn": float(burns_dec[-1]) if burns_dec else 0.0,
        "runway_months": runway_months
    }


def calculate_growth_rate(current: float, previous: float) -> Optional[float]:
    """Calculate percentage growth rate"""
    if previous == 0:
        return None
    growth = ((current - previous) / previous) * 100
    return float(round_decimal(growth))


def calculate_aging_buckets(transactions: List[Dict], current_date: Optional[float] = None) -> Dict[str, float]:
    """Calculate aging buckets for receivables/payables"""
    if current_date is None:
        current_date = datetime.now().timestamp() * 1000
    
    buckets = {
        "0-30": round_decimal(0),
        "31-60": round_decimal(0),
        "61-90": round_decimal(0),
        "90+": round_decimal(0)
    }
    
    for transaction in transactions:
        tx_date = transaction.get("date", current_date)
        days_old = (current_date - tx_date) / (24 * 60 * 60 * 1000)
        amount = round_decimal(abs(transaction.get("amount", 0)))
        
        if days_old <= 30:
            buckets["0-30"] += amount
        elif days_old <= 60:
            buckets["31-60"] += amount
        elif days_old <= 90:
            buckets["61-90"] += amount
        else:
            buckets["90+"] += amount
    
    return {k: float(v) for k, v in buckets.items()}


def validate_profit_loss(data: Dict[str, Any]) -> Dict[str, Any]:
    """Validate Profit & Loss report calculations"""
    revenue_total = data.get("revenue", {}).get("total", 0)
    expenses_total = data.get("expenses", {}).get("total", 0)
    reported_net_income = data.get("netIncome", 0)
    reported_gross_margin = data.get("grossMargin", 0)
    
    calculated = calculate_pnl(revenue_total, expenses_total)
    
    net_income_match = abs(calculated["net_income"] - reported_net_income) < 0.01
    margin_match = abs(calculated["gross_margin"] - reported_gross_margin) < 0.1
    
    return {
        "valid": net_income_match and margin_match,
        "calculated": calculated,
        "reported": {
            "net_income": reported_net_income,
            "gross_margin": reported_gross_margin
        },
        "discrepancies": {
            "net_income": abs(calculated["net_income"] - reported_net_income) if not net_income_match else 0,
            "gross_margin": abs(calculated["gross_margin"] - reported_gross_margin) if not margin_match else 0
        }
    }


def validate_balance_sheet(data: Dict[str, Any]) -> Dict[str, Any]:
    """Validate Balance Sheet calculations"""
    assets = data.get("assets", {}).get("items", [])
    liabilities = data.get("liabilities", {}).get("items", [])
    equity = data.get("equity", {}).get("items", [])
    retained_earnings = data.get("equity", {}).get("retainedEarnings", 0)
    
    calculated = calculate_balance_sheet(assets, liabilities, equity, retained_earnings)
    
    reported_total_assets = data.get("assets", {}).get("total", 0)
    reported_total_liab_equity = data.get("totalLiabilitiesAndEquity", 0)
    reported_is_balanced = data.get("isBalanced", False)
    
    assets_match = abs(calculated["total_assets"] - reported_total_assets) < 0.01
    balance_match = calculated["is_balanced"] == reported_is_balanced
    
    return {
        "valid": assets_match and balance_match,
        "calculated": calculated,
        "reported": {
            "total_assets": reported_total_assets,
            "total_liabilities_and_equity": reported_total_liab_equity,
            "is_balanced": reported_is_balanced
        },
        "discrepancies": {
            "assets": abs(calculated["total_assets"] - reported_total_assets) if not assets_match else 0,
            "balance": calculated["difference"] if not balance_match else 0
        }
    }


def validate_trial_balance(data: Dict[str, Any]) -> Dict[str, Any]:
    """Validate Trial Balance calculations"""
    entries = data.get("entries", [])
    reported_totals = data.get("totals", {})
    reported_is_balanced = data.get("isBalanced", False)
    
    calculated = calculate_trial_balance(entries)
    
    debits_match = abs(calculated["total_debits"] - reported_totals.get("debits", 0)) < 0.01
    credits_match = abs(calculated["total_credits"] - reported_totals.get("credits", 0)) < 0.01
    balance_match = calculated["is_balanced"] == reported_is_balanced
    
    return {
        "valid": debits_match and credits_match and balance_match,
        "calculated": calculated,
        "reported": {
            "debits": reported_totals.get("debits", 0),
            "credits": reported_totals.get("credits", 0),
            "is_balanced": reported_is_balanced
        },
        "discrepancies": {
            "debits": abs(calculated["total_debits"] - reported_totals.get("debits", 0)) if not debits_match else 0,
            "credits": abs(calculated["total_credits"] - reported_totals.get("credits", 0)) if not credits_match else 0,
            "balance": calculated["difference"] if not balance_match else 0
        }
    }


def validate_burn_rate(data: Dict[str, Any]) -> Dict[str, Any]:
    """Validate Burn Rate calculations"""
    monthly_burns = [month.get("burn", 0) for month in data.get("monthlyBurns", [])]
    ending_balance = data.get("endingBalance", 0)
    reported_avg_burn = data.get("averageMonthlyBurn", 0)
    reported_runway = data.get("runwayMonths")
    
    calculated = calculate_burn_rate(monthly_burns, ending_balance)
    
    avg_burn_match = abs(calculated["average_monthly_burn"] - reported_avg_burn) < 0.01
    runway_match = (
        calculated["runway_months"] is None and reported_runway is None
    ) or (
        calculated["runway_months"] is not None and reported_runway is not None and
        abs(calculated["runway_months"] - reported_runway) < 0.1
    )
    
    return {
        "valid": avg_burn_match and runway_match,
        "calculated": calculated,
        "reported": {
            "average_monthly_burn": reported_avg_burn,
            "runway_months": reported_runway
        },
        "discrepancies": {
            "average_burn": abs(calculated["average_monthly_burn"] - reported_avg_burn) if not avg_burn_match else 0,
            "runway": abs(calculated["runway_months"] - reported_runway) if not runway_match and calculated["runway_months"] and reported_runway else 0
        }
    }


def validate_accounts_receivable(data: Dict[str, Any]) -> Dict[str, Any]:
    """Validate Accounts Receivable aging buckets"""
    customers = data.get("customers", [])
    reported_buckets = data.get("agingBuckets", {})
    reported_total = data.get("totalOutstanding", 0)
    
    # Reconstruct transactions from customers
    transactions = []
    for customer in customers:
        # Use oldest transaction date as proxy
        oldest_date = customer.get("oldestTransaction", 0)
        transactions.append({
            "date": oldest_date,
            "amount": customer.get("totalOwed", 0)
        })
    
    calculated_buckets = calculate_aging_buckets(transactions)
    calculated_total = sum(calculated_buckets.values())
    
    total_match = abs(calculated_total - reported_total) < 0.01
    
    return {
        "valid": total_match,
        "calculated": {
            "aging_buckets": calculated_buckets,
            "total_outstanding": calculated_total
        },
        "reported": {
            "aging_buckets": reported_buckets,
            "total_outstanding": reported_total
        },
        "discrepancies": {
            "total": abs(calculated_total - reported_total) if not total_match else 0
        }
    }


def main():
    """Main validation function"""
    if len(sys.argv) < 3:
        print("Usage: python validate_report_calculations.py <report_type> <json_file>")
        print("Report types: pnl, balance_sheet, cash_flow, trial_balance, burn_rate, ar, ap")
        sys.exit(1)
    
    report_type = sys.argv[1]
    json_file = sys.argv[2]
    
    try:
        with open(json_file, 'r') as f:
            data = json.load(f)
    except FileNotFoundError:
        print(f"Error: File {json_file} not found")
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON in {json_file}: {e}")
        sys.exit(1)
    
    validators = {
        "pnl": validate_profit_loss,
        "profit_loss": validate_profit_loss,
        "balance_sheet": validate_balance_sheet,
        "trial_balance": validate_trial_balance,
        "burn_rate": validate_burn_rate,
        "ar": validate_accounts_receivable,
        "accounts_receivable": validate_accounts_receivable,
    }
    
    if report_type not in validators:
        print(f"Error: Unknown report type '{report_type}'")
        print(f"Available types: {', '.join(validators.keys())}")
        sys.exit(1)
    
    validator = validators[report_type]
    result = validator(data)
    
    print(json.dumps(result, indent=2))
    
    if not result["valid"]:
        sys.exit(1)


if __name__ == "__main__":
    main()

