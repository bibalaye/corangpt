import requests
try:
    response = requests.post("http://127.0.0.1:8000/api/auth/register/", json={
        "username": "testuserx",
        "email": "test@testx.com",
        "password": "mypassword"
    })
    print(response.status_code)
    print(response.text)
except Exception as e:
    print(e)
