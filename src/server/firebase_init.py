import json

import firebase_admin
from firebase_admin import credentials

from .config import firebase_creds_str


def initialize_firebase() -> None:
    """
    Initialize the Firebase Admin SDK from the JSON credentials string.

    This mirrors the previous inline initialization logic in `main.py`,
    but keeps it encapsulated in a dedicated module.
    """
    try:
        # Parse the JSON credentials string into a Python dict
        cred_dict = json.loads(firebase_creds_str)
        cred = credentials.Certificate(cred_dict)

        # Avoid re-initializing if already initialized (e.g. in reload scenarios)
        if not firebase_admin._apps:
            firebase_admin.initialize_app(cred)

        print("✅ Firebase initialized successfully from Environment Variable")

    except json.JSONDecodeError:
        raise RuntimeError(
            "CRITICAL ERROR: 'FIREBASE_CREDENTIALS' is not a valid JSON string."
        )
    except Exception as e:
        raise RuntimeError(
            f"CRITICAL ERROR: Failed to initialize Firebase: {str(e)}"
        ) from e


# Initialize Firebase as soon as this module is imported.
initialize_firebase()

