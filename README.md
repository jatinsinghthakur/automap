# UP BhuNaksha Ultra-High Resolution Map Downloader

A comprehensive dual-interface (CLI & Web) toolkit designed to effortlessly download official cadastral maps (Khasra maps) from the UP BhuNaksha portal in ultra-high resolution.

By default, the official portal generates low-resolution maps where plot numbers become unreadable when zooming into clustered areas. This tool completely bypasses that limitation, ensuring you get crisp, legible numbers across the entire village map.

## 🌟 Key Features
- **Smart Phonetic Search Engine**: Automatically resolves names in both English and Hindi.
- **Ultra-High Resolution Exports**: Defaults to a 2200px width canvas ensuring all small plots and numbers remain sharp.
- **Multi-Word AI Parsing**: Type complex names like `Gautam Buddha Nagar Sikanderpur Bais` natively without worrying about exact spelling.
- **Dual Interfaces**: Choose between a sleek, responsive React Web App and a blazing-fast Python CLI tool.
- **PDF & PNG Support**: Generate print-ready formatted PDFs or raw high-resolution images.

---

## 🖥️ 1. Web Application (React + Vite)
The web app provides a beautifully designed, minimalistic, and responsive user interface. It connects to a built-in proxy that bypasses official server restrictions (like IPv6 drops and persistent connection resets).

### Setup & Run
```bash
cd frontend
npm install
npm run dev
```

### Usage Modes
- **One-Shot Search Mode**: Type directly into the magical search bar (e.g. `bulandshahr khurja kapna`). The system uses phonetics and fuzzy matching to instantly resolve the location. You can also use commas for extreme clarity: `Gautam Buddha Nagar, Sadar, Arnia Khurd`.
- **Interactive Mode**: Select your location using step-by-step cascading dropdowns for District -> Tehsil -> Village.
- **Exporting**: Click the main `Download` button to instantly get a PDF, or click the dropdown arrow next to it to select PNG Image.

---

## 🤖 2. Python Command Line Tool (`bot.py`)
The Python script is perfect for power users, batch processing, automated downloads, and lightning-fast CLI usage.

### Setup
```bash
pip install Pillow PyMuPDF
```
*(Note: `PyMuPDF` is optional but highly recommended for fast native PDF generation. If not installed, it falls back to standard PIL PDF generation).*

### Usage Modes & Commands

**1. One-Line Magical Search**
Search directly by passing the names as arguments. Spaces and commas are both fully supported!
```bash
python bot.py "bulandshahr khurja kapna"
python bot.py "Gautam Buddha Nagar, Sadar, Arnia Khurd"
```

**2. Direct GIS Code Search**
Pass the official 14-digit GIS code directly to bypass all name resolution.
```bash
python bot.py 14200751121533
```

**3. Interactive Wizard**
Run the bot without arguments (or with `-i`) to enter an interactive step-by-step terminal wizard.
```bash
python bot.py
python bot.py --interactive
```

**4. Explicit Flag Mode**
For precise automated scripts, explicitly declare the district, tehsil, and village using flags. You can mix and match text names with numerical codes!
```bash
python bot.py --district "Bulandshahr" --tehsil "Khurja" --village "Kapna"
python bot.py -d 142 -t 00751 -v 121533
```

**5. Directory Listing Commands**
Explore available districts, tehsils, and villages directly from your terminal.
```bash
python bot.py --list-districts
python bot.py --list-tehsils "Bulandshahr"
python bot.py --list-villages "Bulandshahr" "Khurja"
```

### Advanced Options & Plot Reports
- `--report <number>`: Fetch official khata details, khasra subdivisions, land owners, and mutation orders for the given plot number and download a print-ready Plot Cadastral Report PDF matching the frontend design.
- `--outdir` (`-o`): Specify the directory to save the downloaded maps and reports (default: `output`, automatically created).
- `--width` (`-w`): Control the output map image width. Default is `2200` for large readable numbers. Set it to `4000` or `8000` for massive posters.

**Example: Download village map and full plot report:**
```bash
python bot.py "bulandshahr khurja kapna" --report 807
```
*(This downloads both the village cadastral map PNG/PDF and the official `Plot_Report_807_<village>.pdf` into the `output/` folder!)*

**Example of an advanced command:**
```bash
python bot.py "agra fatehabad" --width 3500 -o output --report 125
```
*(Notice how the village is missing? The bot will intelligently pause and ask you to select a village before continuing!)*

