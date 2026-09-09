import http.server
import socketserver
import json
import cgi
import time

PORT = 3001 

class CustomHandler(http.server.SimpleHTTPRequestHandler):
    def do_POST(self):
        if self.path == '/api/extract':
            ctype, pdict = cgi.parse_header(self.headers.get('content-type'))
            if ctype == 'multipart/form-data':
                
                time.sleep(2)
                
                
                response_data = {
                    "text": "This is a simulated OCR result.\nThe neural network successfully processed your image.\n\nHandwriting recognized:\n'Hello World! This is an amazing AI OCR app!'"
                }
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(response_data).encode('utf-8'))
            else:
                self.send_response(400)
                self.end_headers()
                self.wfile.write(b'{"error": "Expected multipart/form-data"}')
        else:
            self.send_response(404)
            self.end_headers()

print(f"Starting OCR mock server on port {PORT}...")
with socketserver.TCPServer(("", PORT), CustomHandler) as httpd:
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    httpd.server_close()
