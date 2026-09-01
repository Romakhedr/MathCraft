from http.server import BaseHTTPRequestHandler
import json

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            # قراءة البيانات المرسلة من الواجهة الأمامية
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            body = json.loads(post_data.decode('utf-8'))
            user_message = body.get("message", "")

            # تنسيق الرد بحيث يدعم المعادلات الرياضية المتوافقة مع KaTeX
            # مثال: استخدام الـ LaTeX داخل الرد ليظهر بتصميم احترافي في MathCraft
            reply_text = (
                f"أهلاً بك في **MathCraft**! لقد استلمت استفسارك حول: *'{user_message}'*.\n\n"
                f"إليك الحل الرياضي بالتفصيل:\n"
                f"$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$\n\n"
                f"يمكننا متابعة الحل بناءً على المعطيات الخاصة بك."
            )

            response_data = {"reply": reply_text}

            # إرسال الرد مع تفعيل الـ CORS لتجنب مشاكل الاتصال
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
            self.end_headers()
            
            self.wfile.write(json.dumps(response_data).encode('utf-8'))
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))

    def do_OPTIONS(self):
        # التعامل مع طلبات الفحص المسبق للمتصفح (CORS Preflight)
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
