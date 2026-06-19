import http.server
import socketserver
import json
import os

PORT = 8000

class Handler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/api/products':
            self.path = '/database/products.json'
        elif self.path == '/api/settings':
            self.path = '/database/settings.json'
        elif self.path == '/api/account':
            self.path = '/database/account.json'
        elif self.path == '/api/timeline':
            self.path = '/database/timeline.json'
        return super().do_GET()

    def do_POST(self):
        if self.path == '/api/products' or self.path == '/api/save':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            try:
                with open('database/products.json', 'wb') as f:
                    f.write(post_data)
                
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(b'{"status":"success"}')
            except Exception as e:
                self.send_response(500)
                self.end_headers()
                self.wfile.write(f'{{"error":"{str(e)}"}}'.encode())
        elif self.path == '/api/settings':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            try:
                with open('database/settings.json', 'wb') as f:
                    f.write(post_data)
                
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(b'{"status":"success"}')
            except Exception as e:
                self.send_response(500)
                self.end_headers()
                self.wfile.write(f'{{"error":"{str(e)}"}}'.encode())
        elif self.path == '/api/account':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            try:
                with open('database/account.json', 'wb') as f:
                    f.write(post_data)
                
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(b'{"status":"success"}')
            except Exception as e:
                self.send_response(500)
                self.end_headers()
                self.wfile.write(f'{{"error":"{str(e)}"}}'.encode())
        elif self.path == '/api/timeline':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            try:
                with open('database/timeline.json', 'wb') as f:
                    f.write(post_data)
                
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(b'{"status":"success"}')
            except Exception as e:
                self.send_response(500)
                self.end_headers()
                self.wfile.write(f'{{"error":"{str(e)}"}}'.encode())
        else:
            self.send_response(404)
            self.end_headers()

if __name__ == "__main__":
    # Allow restarting quickly by setting allow_reuse_address
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"Serving at port {PORT} with API enabled")
        httpd.serve_forever()
