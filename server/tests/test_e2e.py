#!/usr/bin/env python3
"""End-to-end test of every Food-Link feature against the running server."""
import requests, json, sys, socketio, time, random
SUF = str(random.randint(1000,9999))

BASE = "http://localhost:8800"
results = []

def oid(v):
    if isinstance(v, dict): return str(v.get("$oid") or v)
    return str(v)



def check(name, cond, detail=""):
    results.append((name, cond, detail))
    print(("PASS" if cond else "FAIL"), "|", name, "|", str(detail)[:140])

# ---------- 1. AUTH ----------
rest = {"username":f"TastyBites{SUF}","email":f"rest{SUF}@test.com","password":"pass123","userType":"Restaurant",
        "verificationCode":"R1CODE","latitude":23.1815,"longitude":79.9864,"locationName":"Jabalpur"}
ngo  = {"username":f"HelpingHands{SUF}","email":f"ngo{SUF}@test.com","password":"pass123","userType":"Charity/NGO",
        "verificationCode":"N1CODE","latitude":23.19,"longitude":79.99,"locationName":"Jabalpur"}

r = requests.post(f"{BASE}/register", json=rest); check("Register restaurant", r.status_code in (200,201), r.text)
r = requests.post(f"{BASE}/register", json=ngo);  check("Register NGO", r.status_code in (200,201), r.text)
r = requests.post(f"{BASE}/register", json=rest); check("Duplicate email rejected", r.status_code == 400, r.text)

s_rest, s_ngo = requests.Session(), requests.Session()
r = s_rest.post(f"{BASE}/login", json={"email":f"rest{SUF}@test.com","password":"pass123"})
check("Login restaurant (JWT cookie)", r.status_code==200 and "accessToken" in r.headers.get("Set-Cookie",""), r.status_code)
rest_id = r.json()["user"]["_id"]
r = s_ngo.post(f"{BASE}/login", json={"email":f"ngo{SUF}@test.com","password":"pass123"})
check("Login NGO", r.status_code==200, r.status_code)
ngo_id = r.json()["user"]["_id"]
r = requests.post(f"{BASE}/login", json={"email":f"rest{SUF}@test.com","password":"WRONG"})
check("Wrong password rejected", r.status_code==400, r.text)

# ---------- 2. LISTINGS ----------
r = s_rest.post(f"{BASE}/listings", json={"restaurantId":rest_id,"name":"Veg Biryani","quantity":20,"expiry":3,"food_type":"Vegetarian"})
check("Create listing 1", r.status_code in (200,201), r.text)
l1 = r.json().get("listing",{}).get("_id") or r.json().get("_id")
r = s_rest.post(f"{BASE}/listings", json={"restaurantId":rest_id,"name":"Chicken Curry","quantity":10,"expiry":2,"food_type":"Non-Vegetarian"})
check("Create listing 2", r.status_code in (200,201), r.text)
r = s_rest.get(f"{BASE}/listings/{rest_id}")
listings = r.json() if r.status_code==200 else []
check("Get restaurant listings", r.status_code==200 and len(listings if isinstance(listings,list) else listings.get('listings',[]))>=2, r.text[:200])
if isinstance(listings, dict): listings = listings.get('listings', [])
lid1 = oid(listings[0].get("_id"))
lid2 = oid(listings[1].get("_id"))
r = s_rest.put(f"{BASE}/listings/{lid1}", json={"quantity":25})
check("Update listing", r.status_code==200, r.text[:200])
r = s_ngo.get(f"{BASE}/nearbyRestaurants", params={"ngoId":ngo_id,"latitude":23.19,"longitude":79.99})
check("Nearby listings for NGO", r.status_code==200, r.text[:200])

# ---------- 3. ORDERS ----------
order_payload = {"restaurantId":rest_id,"ngoId":ngo_id,"status":"requested","listings":[{"listing":lid1,"name":"Veg Biryani","quantity":20,"expiry":3,"restaurant_id":rest_id,"restaurant_name":"TastyBites","view":"not blocked","food_type":"Vegetarian"}]}
r = s_ngo.post(f"{BASE}/orders", json=order_payload)
check("NGO creates order request", r.status_code in (200,201), r.text[:300])
order_id = None
rr = s_ngo.get(f"{BASE}/orders/ngo", params={"ngo_id":ngo_id})
try:
    orders = rr.json(); orders = orders if isinstance(orders,list) else orders.get('data', orders.get('orders',[]))
    order_id = oid(orders[0].get("_id"))
except Exception as e:
    pass
check("Get NGO orders", rr.status_code==200 and order_id, rr.text[:300])
rr = s_rest.get(f"{BASE}/orders/restaurant", params={"restaurant_id":rest_id})
check("Get restaurant orders", rr.status_code==200, rr.text[:200])

r = s_rest.put(f"{BASE}/orders/{order_id}/accept")
check("Restaurant accepts order", r.status_code==200, r.text[:300])
r = s_ngo.get(f"{BASE}/orders/{order_id}")
check("Get order info (hex codes present)", r.status_code==200 and ("rest_code" in r.text or "restCode" in r.text), r.text[:300])
info = r.json().get("data", r.json())
rest_code = info.get("rest_code")
ngo_code = info.get("ngo_code")

# ---------- 4. CHAT (Socket.IO) ----------
try:
    sio1, sio2 = socketio.Client(), socketio.Client()
    received = []
    sio2.on("receive_chat_message", lambda d: received.append(d))
    sio1.connect(BASE); sio2.connect(BASE)
    sio1.emit("join_chat_room", order_id); sio2.emit("join_chat_room", order_id)
    time.sleep(0.5)
    sio1.emit("send_chat_message", {"message":"Hello, when can we pick up?","sender":"HelpingHands","orderId":order_id})
    time.sleep(1.5)
    check("Socket.IO chat delivery", len(received)>0, received)
    sio1.disconnect(); sio2.disconnect()
except Exception as e:
    check("Socket.IO chat delivery", False, str(e))
r = s_ngo.get(f"{BASE}/orders/{order_id}/messages")
check("Chat history persisted", r.status_code==200 and "pick up" in r.text, r.text[:200])

# ---------- 5. FULFILL with hex codes ----------
r = s_rest.put(f"{BASE}/orders/{order_id}/fulfill", json={"code":ngo_code,"user_type":"Restaurant"})
check("Fulfill order (hex verification)", r.status_code==200, r.text[:300])

# ---------- 6. REVIEWS + SENTIMENT ----------
r = s_rest.post(f"{BASE}/addRestReview/{order_id}", json={"review":"Great NGO, very punctual and kind people. Wonderful experience!"})
check("Restaurant review + sentiment", r.status_code in (200,201) and "ositive" in r.text, r.text[:300])
r = s_ngo.post(f"{BASE}/addNgoReview/{order_id}", json={"review":"Terrible experience, food was stale and cold. Very bad."})
check("NGO review + sentiment", r.status_code in (200,201), r.text[:300])
r = requests.post(f"{BASE}/analyze-sentiment", json={"review":"I love this platform, amazing work!","text":"I love this platform, amazing work!"})
check("Standalone sentiment endpoint", r.status_code==200, r.text[:200])

# ---------- 7. RECOMMENDATIONS ----------
r = s_ngo.get(f"{BASE}/recommendations/ml", params={"ngo_id":ngo_id})
check("Collaborative filtering (SVD)", r.status_code==200, r.text[:200])
r = s_ngo.get(f"{BASE}/content-based-recommendations", params={"ngo_id":ngo_id})
check("Content-based filtering", r.status_code==200, r.text[:200])
r = s_ngo.get(f"{BASE}/graphs/order_counts")
check("Order-counts graph (matplotlib)", r.status_code==200 and r.headers.get("Content-Type","").startswith("image"), r.headers.get("Content-Type"))

# ---------- 8. CANCEL flow (new order) ----------
order_payload2 = {"restaurantId":rest_id,"ngoId":ngo_id,"status":"requested","listings":[{"listing":lid2,"name":"Chicken Curry","quantity":10,"expiry":2,"restaurant_id":rest_id,"restaurant_name":"TastyBites","view":"not blocked","food_type":"Non-Vegetarian"}]}
r = s_ngo.post(f"{BASE}/orders", json=order_payload2)
rr = s_ngo.get(f"{BASE}/orders/ngo", params={"ngo_id":ngo_id})
orders = rr.json(); orders = orders if isinstance(orders,list) else orders.get('data', orders.get('orders',[]))
o2 = [oid(o.get("_id")) for o in orders if (o.get("status")=="requested")]
if o2:
    r = s_rest.put(f"{BASE}/orders/{o2[0]}/decline")
    check("Decline order", r.status_code==200, r.text[:200])
else:
    check("Decline order", False, "no requested order found")

print("\n===== SUMMARY =====")
passed = sum(1 for _,c,_ in results if c); print(f"{passed}/{len(results)} passed")
for n,c,d in results:
    if not c: print("FAILED:", n)
