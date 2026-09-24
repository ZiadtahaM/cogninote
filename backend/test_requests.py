try:
    import requests.cookies
    print("Successfully imported requests.cookies")
except ImportError as e:
    print(f"Failed to import requests.cookies: {e}")
