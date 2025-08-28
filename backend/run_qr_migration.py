#!/usr/bin/env python3
"""
Run QR code migration only
"""

from migrations import migrate_user_qr_code

if __name__ == "__main__":
    print("Running QR code migration...")
    migrate_user_qr_code()
    print("QR code migration completed!")
