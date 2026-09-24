import pytesseract

try:
    print(pytesseract.get_tesseract_version())
except Exception as e:
    print(f"Error: {e}")
    print("Please ensure Tesseract OCR is installed and its path is correctly configured.")
