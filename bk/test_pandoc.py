import subprocess
import os
import sys

def test_pandoc():
    # Check if pandoc is in PATH
    try:
        pandoc_path = subprocess.check_output(["where", "pandoc"], text=True).strip()
        print(f"Found pandoc at: {pandoc_path}")
    except subprocess.CalledProcessError:
        print("Pandoc not found in PATH")
        return False
    
    # Try running pandoc directly
    try:
        version = subprocess.check_output(["pandoc", "--version"], text=True)
        print("Pandoc version info:")
        print(version[:200]) # Print first 200 chars
        return True
    except subprocess.CalledProcessError as e:
        print(f"Error running pandoc: {e}")
        return False
    except FileNotFoundError:
        print("Pandoc executable not found")
        return False

if __name__ == "__main__":
    result = test_pandoc()
    print(f"Pandoc test result: {'SUCCESS' if result else 'FAILURE'}")
    sys.exit(0 if result else 1) 