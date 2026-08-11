const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 5000;
const DATA_FILE = path.join(__dirname, 'products.json');
const PUBLIC_DIR = path.join(__dirname, '..');

// المنتجات الافتراضية الأولية
const DEFAULT_PRODUCTS = [
  {
    id: 1,
    title: "لوحة تحفة فنية مخصصة بالذهب",
    category: "لوحات وتحف",
    price: "12,000 ر.ي",
    badge: "الأكثر مبيعاً",
    desc: "لوحة جدارية فنية أنيقة مصممة بلمسات ريشة فن وورق الذهب مع إمكانية كتابة الاسم حسب الطلب.",
    imgUrl: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=600&q=80"
  },
  {
    id: 2,
    title: "باقة ريشة فن الفاخرة",
    category: "ورود",
    price: "8,500 ر.ي",
    badge: "تنسيق خاص",
    desc: "باقة فاخرة تجمع بين الورود الجورية الطبيعية وأغصان اللافندر بتنسيق يدوي راقٍ.",
    imgUrl: "https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=600&q=80"
  },
  {
    id: 3,
    title: "صندوق شوكولاتة وتحفة فنية",
    category: "شوكولاتة",
    price: "10,000 ر.ي",
    badge: "جديد",
    desc: "صندوق إهداء مميز يضم أجود أنواع الشوكولاتة المحشوة مع ورد طبيعي كهدية تليق بأحبابك.",
    imgUrl: "https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=600&q=80"
  },
  {
    id: 4,
    title: "باقة الورد الوردي والرقيق",
    category: "ورود",
    price: "6,000 ر.ي",
    badge: "",
    desc: "تنسيق رقيق وناعم من زهور الورد الوردي الهولندي يناسب المناسبات السعيدة.",
    imgUrl: "https://images.unsplash.com/photo-1526047932273-341f2a7631f9?w=600&q=80"
  },
  {
    id: 5,
    title: "مجموعة العطور والورود الفاخرة",
    category: "عطور",
    price: "15,000 ر.ي",
    badge: "هدية مميزة",
    desc: "صندوق خشبي مزخرف يحتوي على عطر فرنسي فاخر محاط بالورد الطبيعي والمسك.",
    imgUrl: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=600&q=80"
  }
];

// دالة قراءة المنتجات من ملف التخزين
function getProducts() {
  if (!fs.existsSync(DATA_FILE)) {
    saveProducts(DEFAULT_PRODUCTS);
    return DEFAULT_PRODUCTS;
  }
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('خطأ في قراءة ملف المنتجات:', err);
    return DEFAULT_PRODUCTS;
  }
}

// دالة حفظ المنتجات في ملف التخزين
function saveProducts(products) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(products, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('خطأ في حفظ ملف المنتجات:', err);
    return false;
  }
}

// إنشاء خادم HTTP
const server = http.createServer((req, res) => {
  // إعداد ترويسات CORS لتمكين أي متصفح أو جهاز من الاتصال بالخادم
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const urlParts = req.url.split('?')[0];

  // API 1: جلب كافة المنتجات GET /api/products
  if (req.method === 'GET' && urlParts === '/api/products') {
    const products = getProducts();
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(products));
    return;
  }

  // API 2: حفظ أو تحديث قائل المنتجات POST /api/products
  if (req.method === 'POST' && urlParts === '/api/products') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        let products = getProducts();
        
        if (Array.isArray(payload)) {
          products = payload;
        } else if (typeof payload === 'object' && payload !== null) {
          // إضافة أو تحديث منتج واحد
          const index = products.findIndex(p => p.id == payload.id);
          if (index !== -1) {
            products[index] = payload;
          } else {
            products.unshift(payload);
          }
        }
        
        saveProducts(products);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: true, count: products.length, products }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, error: 'تنسيق البيانات غير صحيح' }));
      }
    });
    return;
  }

  // API 3: حذف منتج DELETE /api/products/:id
  if (req.method === 'DELETE' && urlParts.startsWith('/api/products/')) {
    const id = parseInt(urlParts.split('/')[3]);
    let products = getProducts();
    products = products.filter(p => p.id !== id);
    saveProducts(products);
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: true, count: products.length }));
    return;
  }

  // تقديم ملفات المتجر الساكنة (Static HTML/CSS/JS)
  let targetFile = urlParts === '/' ? (fs.existsSync(path.join(PUBLIC_DIR, 'index.html')) ? 'index.html' : 'ريشة فن.html') : decodeURIComponent(urlParts);
  let filePath = path.join(PUBLIC_DIR, targetFile);
  
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    const contentTypeMap = {
      '.html': 'text/html; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.js': 'application/javascript; charset=utf-8',
      '.json': 'application/json; charset=utf-8',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.svg': 'image/svg+xml'
    };
    const contentType = contentTypeMap[ext] || 'text/plain';
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end('<h1>404 - الصفحة غير موجودة في متجر ريشة فن</h1>');
  }
});

server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 خادم متجر ريشة فن يعمل بنجاح!`);
  console.log(`📡 رابط المتجر للعملاء: http://localhost:${PORT}`);
  console.log(`📦 خادم API المنتجات: http://localhost:${PORT}/api/products`);
  console.log(`====================================================`);
});
