# VTOP Auto Login (v7.0.0)

An ultra-fast, fully automatic Chrome Extension for the **VIT Bhopal-VTOP Portal**. It streamlines your login process by selecting your role, autofilling credentials, and solving CAPTCHAs in milliseconds using a custom-trained AI model.

---

## 🚀 Key Features

* **AI CAPTCHA Solver:** Powered by the **captop CRNN model**, specifically trained on over 800+ real VTOP CAPTCHAs for near 100% accuracy.
* **Zero-Click Login:** Automatically detects your role (Student, Employee, etc.), fills your credentials, and submits the form.
* **Multi-Role Support:** Works seamlessly for Students, Employees, Parents, and Alumni.
* **Modern UI:** Features a sleek, "Space Mono" inspired popup interface for easy credential management.
* **Smart Reload Guard:** Detects if the VTOP page fails to load the CAPTCHA image and refreshes automatically to ensure a successful login.

---

## 🛠️ Installation

1.  **Download** or Clone this repository:
    ```bash
    git clone https://github.com/yourusername/VTOP-Auto-Login.git
    ```
2.  Open **Google Chrome** and navigate to `chrome://extensions/`.
3.  Enable **Developer mode** (toggle in the top right corner).
4.  Click **Load unpacked** and select the `VTOP-Auto-blue` folder from the downloaded files.

---

## ⚙️ Setup

1.  Click the **VTOP Auto** icon in your Chrome toolbar.
2.  **Select your Role:** Choose between Student, Employee, Parent, or Alumni.
3.  **Enter Credentials:** Input your Registration/ID and VTOP Password.
4.  **Save & Enable:** Click the "Save & Enable" button. The status dot will turn **green** when ready.

---

## 🔒 Security & Privacy

* **Local Storage:** Your credentials are saved strictly on your local machine using `chrome.storage.local`.
* **Privacy Focused:** No passwords or usernames are sent to external servers. Only the CAPTCHA image blob is sent to the solver API for decoding.
* **Transparent:** No data collection or remote tracking.

---

## 💻 Technical Details

* **Manifest Version:** 3
* **CAPTCHA API:** Utilizes a Cloudflare Worker proxy (`captop-proxy.sykik.workers.dev`) for high availability.
* **Logic:** Uses a non-blocking `MutationObserver` to detect and interact with VTOP elements instantly as they appear in the DOM.

---

## 🤝 Support

Made with ❤️ for **Vitians**. 

*If you find this useful, consider giving the repo a ⭐!*

---

**Would you like me to generate a `CONTRIBUTING.md` file or a set of promo images for the Chrome Web Store?**
