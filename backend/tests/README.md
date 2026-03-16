# PaySim Test Suite

This directory contains standalone scripts for verifying specific features of the PaySim Platform.

## Available Tests
- `test_email_config.js`: Verifies Brevo SMTP integration and environment variable loading.
- `test_2fa_flow.js`: End-to-end verification of the 2FA login and OTP delivery logic.

## Running Tests
Run tests from the project root:
```bash
node tests/test_email_config.js
```
