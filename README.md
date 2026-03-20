# VTOP Auto Chrome Extension

Chrome extension that automatically logs you into the VTOP portal by autofilling credentials, solving the captcha using an API, and submitting the form.

Works on:
`https://vtop.vitbhopal.ac.in/*`

---

# Installation

1. Download or clone this repository.

```
git clone https://github.com/yourusername/vtop-autologin-extension.git
```

2. Open Chrome and go to:

```
chrome://extensions
```

3. Enable **Developer Mode** (top right).

4. Click **Load Unpacked**.

5. Select the extension folder.

---

# Setup

1. Click the extension icon in Chrome.
2. Enter your **VTOP Username**.
3. Enter your **Password**.
4. Select your **Role** (Student / Employee / Parent / Alumni).
5. Click **Save**.

Credentials are stored locally using `chrome.storage.local`.

---

# Usage

1. Open the VTOP website:

```
https://vtop.vitbhopal.ac.in
```

2. The extension will automatically:

* Select your role
* Autofill username and password
* Solve the captcha using an API
* Submit the login form

You will be logged in automatically.

---

# Security

* Credentials are stored **only on your local system**.
* No username or password is sent to any external server.
* The extension does not collect or store any user data remotely.

---

