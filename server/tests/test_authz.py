#!/usr/bin/env python3
"""Authorization tests for the @require_auth middleware and ownership rules.

Run against a live server (see README) with USE_MOCK_DB=1:
    python tests/test_authz.py

Verifies that protected listing/order endpoints reject unauthenticated,
invalid-token, wrong-role, and cross-owner requests, while still allowing
legitimate owners through.
"""
import requests
import random

BASE = "http://localhost:8800"
SUF = str(random.randint(10000, 99999))
results = []


def check(name, cond, detail=""):
    results.append((name, cond, detail))
    print(("PASS" if cond else "FAIL"), "|", name, "|", str(detail)[:120])


def make_user(user_type, tag):
    """Register + log in a distinct user; returns (session, user_id)."""
    email = f"{tag}{SUF}@test.com"
    payload = {
        "username": f"{tag}{SUF}", "email": email, "password": "pass123",
        "userType": user_type, "verificationCode": tag,
        "latitude": 23.1, "longitude": 79.9, "locationName": "Jabalpur",
    }
    r = requests.post(f"{BASE}/register", json=payload)
    assert r.status_code == 201, f"register {tag} failed: {r.text}"
    s = requests.Session()
    r = s.post(f"{BASE}/login", json={"email": email, "password": "pass123"})
    assert r.status_code == 200, f"login {tag} failed: {r.text}"
    return s, r.json()["user"]["_id"]


# Three distinct principals.
rest1, rid1 = make_user("Restaurant", "resA")
rest2, rid2 = make_user("Restaurant", "resB")
ngo1, nid1 = make_user("Charity/NGO", "ngoA")
assert rid1 != rid2, "restaurants must have distinct ids"

# --- Authentication (no / bad token) ---
r = requests.get(f"{BASE}/listings/{rid1}")
check("No token -> 401", r.status_code == 401, r.status_code)
r = requests.get(f"{BASE}/listings/{rid1}", cookies={"accessToken": "not.a.jwt"})
check("Malformed token -> 401", r.status_code == 401, r.status_code)

# --- Role enforcement ---
r = ngo1.post(f"{BASE}/listings", json={"name": "x", "quantity": 1, "expiry": 1, "food_type": "Vegan"})
check("NGO cannot create listing (role) -> 403", r.status_code == 403, r.status_code)

# --- Ownership: listings ---
r = rest2.get(f"{BASE}/listings/{rid1}")
check("Cross-restaurant read listings -> 403", r.status_code == 403, r.status_code)

r = rest1.post(f"{BASE}/listings", json={"name": "Soup", "quantity": 5, "expiry": 1, "food_type": "Vegan"})
check("Owner creates listing -> 201", r.status_code == 201, r.status_code)
lid = r.json().get("_id")

r = rest2.put(f"{BASE}/listings/{lid}", json={"quantity": 99})
check("Cross-restaurant update listing -> 403", r.status_code == 403, r.status_code)
r = rest2.delete(f"{BASE}/listings/{lid}")
check("Cross-restaurant delete listing -> 403", r.status_code == 403, r.status_code)
r = rest1.put(f"{BASE}/listings/{lid}", json={"quantity": 42})
check("Owner updates own listing -> 200", r.status_code == 200, r.status_code)

# --- Ownership: orders ---
r = rest1.get(f"{BASE}/orders/ngo", params={"ngo_id": nid1})
check("Restaurant reading NGO's orders -> 403", r.status_code == 403, r.status_code)
r = ngo1.get(f"{BASE}/orders/restaurant", params={"restaurant_id": rid1})
check("NGO reading restaurant's orders -> 403", r.status_code == 403, r.status_code)

print("\n===== SUMMARY =====")
passed = sum(1 for _, c, _ in results if c)
print(f"{passed}/{len(results)} passed")
for n, c, d in results:
    if not c:
        print("FAILED:", n)

import sys
sys.exit(0 if passed == len(results) else 1)
