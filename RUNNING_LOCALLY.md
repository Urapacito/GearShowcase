# How to Run Locally

Because this project dynamically fetches data using JavaScript, simply opening `index.html` in your browser will cause a **CORS error**. Additionally, the new auto-saving Admin Dashboard requires a backend script to write updates to `products.json`.

## Using the Start Script (Windows)

The easiest way to run the project with full auto-saving functionality:
1. Double-click the `start.bat` file in your project folder.
2. This will automatically start the Python API server on port 8000 and open your browser to both the Showcase and the Admin Dashboard.

## Manual Start (Mac/Linux/Windows)

If you don't use the `.bat` file, open your terminal, navigate to the `GearShowcase` folder, and run:

```bash
python server.py
```
Then, open your web browser and go to: `http://localhost:8000`

## Testing the Admin Dashboard

1. Navigate to `http://localhost:8000/admin.html`.
2. Add, edit, or delete products.
3. Because the `server.py` is running, changes will be **automatically saved** to your `products.json` file.
4. You can also import new JSON databases or export them as needed.
