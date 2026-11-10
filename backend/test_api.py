"""
End-to-end Automated Test Suite for PayNex FastAPI Backend
"""
from starlette.testclient import TestClient
from app.main import app
from app.database import Base, engine, SessionLocal
from app.services.seed import seed_database

client = TestClient(app)

def setup_module():
    """Ensure database is up to date and seeded."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

def test_categories():
    response = client.get("/api/v1/categories")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 8
    slugs = [c["slug"] for c in data]
    assert "laptops" in slugs
    assert "smartphones" in slugs

def test_products_list_and_search():
    # List all
    res = client.get("/api/v1/products")
    assert res.status_code == 200
    data = res.json()
    assert data["total"] >= 12
    assert len(data["items"]) > 0

    # Search
    res_search = client.get("/api/v1/products?q=MacBook")
    assert res_search.status_code == 200
    search_data = res_search.json()
    assert any("MacBook" in p["name"] for p in search_data["items"])

    # Filter category
    res_cat = client.get("/api/v1/products?category=laptops")
    assert res_cat.status_code == 200
    for p in res_cat.json()["items"]:
        assert p["category"]["slug"] == "laptops"

def test_product_detail():
    res = client.get("/api/v1/products/laptop-001")
    assert res.status_code == 200
    data = res.json()
    assert data["slug"] == "laptop-001"
    assert data["name"] == "MacBook Air M3"
    assert "Apple M3" in data["specs"]["Processor"]

def test_auth_workflow_and_protected_routes():
    import uuid
    random_email = f"test_{uuid.uuid4().hex[:8]}@example.com"
    password = "SecurePassword123!"

    # 1. Register
    reg_res = client.post("/api/v1/auth/register", json={
        "full_name": "Test User",
        "email": random_email,
        "password": password,
    })
    assert reg_res.status_code == 201
    token = reg_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Login
    login_res = client.post("/api/v1/auth/login", json={
        "email": random_email,
        "password": password,
    })
    assert login_res.status_code == 200
    assert "access_token" in login_res.json()

    # 3. Get /me
    me_res = client.get("/api/v1/auth/me", headers=headers)
    assert me_res.status_code == 200
    assert me_res.json()["email"] == random_email

    # 4. Cart operations
    cart_add = client.post("/api/v1/cart", headers=headers, json={
        "product_id": 1,
        "quantity": 2,
    })
    assert cart_add.status_code == 200
    cart_data = cart_add.json()
    assert cart_data["item_count"] == 2
    assert len(cart_data["items"]) == 1

    # 5. Wishlist operations
    wish_add = client.post("/api/v1/wishlist/2", headers=headers)
    assert wish_add.status_code == 200
    wish_list = client.get("/api/v1/wishlist", headers=headers)
    assert wish_list.status_code == 200
    assert len(wish_list.json()) == 1

    # 6. Create Order
    order_res = client.post("/api/v1/orders", headers=headers, json={
        "shipping": {
            "name": "Test User",
            "email": random_email,
            "phone": "+91 9876543210",
            "address1": "123 Tech Street",
            "city": "Mumbai",
            "state": "Maharashtra",
            "pincode": "400001"
        }
    })
    assert order_res.status_code == 201
    order_data = order_res.json()
    assert order_data["status"] == "pending"
    assert len(order_data["items"]) == 1

    # 7. List Orders
    orders_list = client.get("/api/v1/orders", headers=headers)
    assert orders_list.status_code == 200
    assert len(orders_list.json()) >= 1

    # 8. AI Chat
    ai_res = client.post("/api/v1/ai/chat", headers=headers, json={
        "message": "Find a laptop for programming under 120000",
        "budget": 120000,
    })
    assert ai_res.status_code == 200
    ai_data = ai_res.json()
    assert "message" in ai_data
    assert isinstance(ai_data["products"], list)

    # 9. Dashboard Stats
    dash_res = client.get("/api/v1/dashboard/stats", headers=headers)
    assert dash_res.status_code == 200
    dash_data = dash_res.json()
    assert dash_data["order_count"] >= 1
    assert dash_data["wishlist_count"] >= 1

    # 10. Profile Get and Update
    prof_res = client.get("/api/v1/profile", headers=headers)
    assert prof_res.status_code == 200
    assert prof_res.json()["email"] == random_email

    update_res = client.put("/api/v1/profile", headers=headers, json={
        "phone": "+91 9999999999",
        "preferred_categories": ["laptops", "headphones"],
        "budget_max": 150000,
    })
    assert update_res.status_code == 200
    assert update_res.json()["phone"] == "+91 9999999999"
    assert "laptops" in update_res.json()["preferred_categories"]

if __name__ == "__main__":
    print("Running automated backend tests...")
    setup_module()
    test_health_check()
    print("✓ Health check passed")
    test_categories()
    print("✓ Categories API passed")
    test_products_list_and_search()
    print("✓ Products list, search & filter passed")
    test_product_detail()
    print("✓ Product detail API passed")
    test_auth_workflow_and_protected_routes()
    print("✓ Full Auth, Cart, Wishlist, Order, AI, Dashboard & Profile workflow passed!")
    print("\nALL BACKEND AUTOMATED TESTS PASSED!")
