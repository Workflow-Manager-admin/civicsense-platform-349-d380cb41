# CivicSense – A Smart City Civic Issue Platform 🚦

Welcome to CivicSense, your smart city companion for simple, effective management of civic and public issues! This platform empowers citizens to report problems in their neighborhoods, while providing authorities with intelligent, efficient tools to resolve them quickly.

---

## 🌟 Platform Overview

CivicSense is a modern web platform designed for cities and local governments to streamline the entire lifecycle of public complaint management. From potholes and garbage to broken lights and water issues, each report is:

- Instantly auto-classified and prioritized using **NLP and LLMs**
- Geo-tagged from map inputs for precise localization
- Auto-tagged and deduplicated to avoid repeat complaints
- Embedded for similarity analysis and smart filtering
- Summarized and categorized for actionable insights
- Processed with automated authority responses

All data is securely managed via **Supabase** and visualized for authorities and citizens alike.

---

## 🚀 Main Features

- **Easy Issue Reporting:** Citizens can quickly submit problems, upload photos, and include precise locations.
- **Automatic Summarization & Tagging:** NLP/LLM tools extract key info, generate summaries, and derive relevant hashtags.
- **Duplicate Detection:** Intelligent deduplication checks prevent repeat complaints.
- **Geo-tag Visualization:** Issues are mapped live on a dashboard for both citizens & authorities.
- **Authority Toolkit:** Prioritize, filter, and resolve issues through an intuitive dashboard.
- **Automated Communication:** FastAI/LLM services suggest helpful, context-aware draft replies to citizens after resolution.
- **Feedback Loop:** Collect public feedback post-resolution, fueling platform improvements.

---

## 🏗️ Architecture & Technology

- **Frontend**: [React](citizen_authority_frontend_workspace/citizen_authority_frontend/) (web), with a modern, minimalistic UI and a fully responsive layout.
- **Backend**: [FastAPI](backend_workspace/backend/src/api/main.py) (Python), providing secure, high-performance APIs.
- **Data & Auth**: [Supabase](https://supabase.com/), handling authentication, data storage, and media secure uploads.
- **NLP & LLMs**: Integrated with Cohere and other cloud-based AI models for summarization, classification, similarity, tagging, and automated replies.

---

## 🎨 Custom UI Color Palette

CivicSense uses a contemporary, earthy palette for a civic, welcoming feeling. Here’s the color guide for designers & contributors:

| Role               | Name               | Hex       | Usage                                |
| ------------------ | ------------------ | --------- | ------------------------------------ |
| Background         | Deep Taupe         | #3B2F2F   | Page/app background                  |
| Card/Section BG    | Warm Cocoa         | #5A4A42   | Forms, containers                    |
| Primary Accent     | Dusty Terracotta   | #C08457   | Buttons, active states               |
| Primary Hover      | Sienna             | #A2603B   | Button hover/focus                   |
| Text Primary       | Cream Beige        | #E3C9A5   | Headings, key text                   |
| Text Secondary     | Muted Tan          | #D1B48C   | Paragraphs, labels                   |
| Border/Outline     | Burnt Umber        | #7B4F2A   | Input borders, dividers              |
| Success            | Olive Sage         | #A3B18A   | Toasts, success messages             |
| Error              | Dusty Red Clay     | #B85C38   | Form validation, error states        |

> The result is a UI that’s both accessible and stylish. See `citizen_authority_frontend/src/App.css` for live palette mappings.

---

## 👋 Getting Started

Ready to contribute or explore? Here are some next steps:

- **Develop new features:** Add issue types, map visuals, chat tools, or feedback forms.
- **Design the UI:** Use the color palette to create cards, forms, and dashboards. Keep it clean and accessible!
- **Integrate/Test Supabase:** Expand authentication or data models.
- **Improve NLP tools:** Enhance deduplication, auto-classification, or summary/reply logic.
- **Build Out the Test Suite:** Add frontend (Jest/Testing Library) or backend (pytest/FastAPI) tests.
- **Plan:** Draft user flows, component diagrams, or API specs for future features.
- **Document:** Keep this README and code comments up to date!

---

## 💡 Need Help?

Check out frontend and backend `README.md` files for developer instructions, or see the app running at your configured links. For architecture or onboarding assistance, post a question or consult the internal docs.

Let’s build a better, smarter city—one click at a time!
