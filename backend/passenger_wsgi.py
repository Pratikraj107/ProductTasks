"""
WSGI entry point for Passenger (used by some hosting providers)
"""
import sys
import os

# Add the backend directory to the path
sys.path.insert(0, os.path.dirname(__file__))

from main import app

# Passenger expects 'application' variable
application = app
