try:
    import main
    print("Successfully imported main.py")
except ImportError as e:
    print(f"Failed to import main.py: {e}")
except Exception as e:
    print(f"An unexpected error occurred: {e}")