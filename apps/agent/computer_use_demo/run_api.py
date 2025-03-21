"""
Run the Computer Use Demo API server.
"""

from computer_use_demo.api import start_api_server

if __name__ == "__main__":
    print("Starting Computer Use Demo API server...")
    print("API will be available at http://0.0.0.0:8000/api/prompt")
    print("API documentation available at http://0.0.0.0:8000/docs")
    start_api_server(host="0.0.0.0", port=8000) 