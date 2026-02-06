#!/usr/bin/env python3
"""
Student Dashboard Server
Double-click this file to start the dashboard, then open your browser.
"""

import http.server
import socketserver
import os
import webbrowser
import sys
from pathlib import Path

PORT = 8080

# Change to the dist directory (where the built files are)
script_dir = Path(__file__).parent.resolve()
dist_dir = script_dir / "dist"

if not dist_dir.exists():
    print("❌ Error: 'dist' folder not found!")
    print("   Please run 'npm run build' first to generate the static files.")
    input("Press Enter to exit...")
    sys.exit(1)

os.chdir(dist_dir)

class QuietHandler(http.server.SimpleHTTPRequestHandler):
    """Custom handler that serves index.html for SPA routing"""
    
    def log_message(self, format, *args):
        # Only show important messages
        if "404" in str(args):
            print(f"📄 {args[0]}")
    
    def do_GET(self):
        # For SPA: serve index.html for all non-file routes
        path = self.translate_path(self.path)
        if not os.path.exists(path) or os.path.isdir(path):
            if not self.path.startswith('/assets') and '.' not in self.path.split('/')[-1]:
                self.path = '/index.html'
        return super().do_GET()

def main():
    print("=" * 50)
    print("🎓 Student Data Dashboard")
    print("=" * 50)
    print()
    
    with socketserver.TCPServer(("", PORT), QuietHandler) as httpd:
        url = f"http://localhost:{PORT}"
        print(f"✅ Server running at: {url}")
        print()
        print("📌 Opening browser automatically...")
        print("   (If it doesn't open, copy the URL above)")
        print()
        print("🛑 To stop: Press Ctrl+C or close this window")
        print("-" * 50)
        
        # Open browser
        webbrowser.open(url)
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n\n👋 Server stopped. Goodbye!")

if __name__ == "__main__":
    main()
