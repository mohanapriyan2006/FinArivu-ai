from __future__ import annotations

from enum import Enum


class UserRole(str, Enum):
    USER = "USER"
    ADMIN = "ADMIN"


class IncomeSource(str, Enum):
    SALARY = "Salary"
    FREELANCE = "Freelance"
    BUSINESS = "Business"
    INVESTMENT = "Investment"
    RENT = "Rent"
    INTEREST = "Interest"
    DIVIDEND = "Dividend"
    BONUS = "Bonus"
    GIFT = "Gift"
    OTHER = "Other"


class AssetType(str, Enum):
    CASH = "Cash"
    BANK = "Bank"
    FIXED_DEPOSIT = "Fixed Deposit"
    MUTUAL_FUND = "Mutual Fund"
    STOCK = "Stock"
    PROPERTY = "Property"
    GOLD = "Gold"
    PPF = "PPF"
    EPF = "EPF"
    NPS = "NPS"
    CRYPTO = "Crypto"
    OTHER = "Other"


class LiabilityType(str, Enum):
    HOME_LOAN = "Home Loan"
    CAR_LOAN = "Car Loan"
    CREDIT_CARD = "Credit Card"
    PERSONAL_LOAN = "Personal Loan"
    EDUCATION_LOAN = "Education Loan"
    MEDICAL_LOAN = "Medical Loan"
    OTHER = "Other"


class GoalStatus(str, Enum):
    ACTIVE = "Active"
    COMPLETED = "Completed"
    PAUSED = "Paused"
    CANCELLED = "Cancelled"


class GoalPriority(str, Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"


class BudgetPeriod(str, Enum):
    MONTHLY = "monthly"
    WEEKLY = "weekly"
    YEARLY = "yearly"


class PaymentMethod(str, Enum):
    CASH = "Cash"
    UPI = "UPI"
    CREDIT_CARD = "Credit Card"
    DEBIT_CARD = "Debit Card"
    BANK_TRANSFER = "Bank Transfer"
    NET_BANKING = "Net Banking"
    WALLET = "Wallet"
    OTHER = "Other"


class TaxRegime(str, Enum):
    OLD = "old"
    NEW = "new"


class ConsentType(str, Enum):
    PRIVACY_POLICY = "privacy_policy"
    TERMS_OF_SERVICE = "terms_of_service"
    DATA_PROCESSING = "data_processing"
    MARKETING = "marketing"


class NotificationChannel(str, Enum):
    EMAIL = "email"
    PUSH = "push"
    SMS = "sms"
    IN_APP = "in_app"


class NotificationFrequency(str, Enum):
    REALTIME = "realtime"
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    NEVER = "never"


# Convenience tuples for database CHECK constraints.
USER_ROLES = tuple(m.value for m in UserRole)
INCOME_SOURCES = tuple(m.value for m in IncomeSource)
ASSET_TYPES = tuple(m.value for m in AssetType)
LIABILITY_TYPES = tuple(m.value for m in LiabilityType)
GOAL_STATUSES = tuple(m.value for m in GoalStatus)
GOAL_PRIORITIES = tuple(m.value for m in GoalPriority)
BUDGET_PERIODS = tuple(m.value for m in BudgetPeriod)
PAYMENT_METHODS = tuple(m.value for m in PaymentMethod)
TAX_REGIMES = tuple(m.value for m in TaxRegime)
CONSENT_TYPES = tuple(m.value for m in ConsentType)
NOTIFICATION_CHANNELS = tuple(m.value for m in NotificationChannel)
NOTIFICATION_FREQUENCIES = tuple(m.value for m in NotificationFrequency)
