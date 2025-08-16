import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./App.css";
import "./responsive.css";
import PaymentFlow from "./components/PaymentFlow";

// 設定 Axios 全域基底與攔截器
axios.defaults.baseURL = "http://localhost:4000";
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// --- 幣別格式化工具 ---
const currency = (n) =>
  new Intl.NumberFormat("zh-HK", { style: "currency", currency: "HKD" }).format(n);

// 登入表單
function Login({ onLogin, switchToRegister }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post("/api/auth/login", { email, password });
      localStorage.setItem("token", data.token);
      onLogin(data.user);
    } catch (err) {
      setError(err.response?.data?.error || "登入失敗");
    }
  };

  return (
    <div className="auth-scope">
      <div className="auth-page">
        <div className="auth-illustration"><div className="glow" /></div>

        <div className="auth-card">
          <div className="auth-brand">
            <div className="auth-logo">🔒</div>
            <h2 className="auth-title">會員登入</h2>
            <p className="auth-subtitle">請輸入帳號密碼</p>
          </div>

          {error && <p className="auth-alert">{error}</p>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div>
              <label className="auth-label">Email</label>
              <input className="auth-input" type="email" value={email}
                     onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <label className="auth-label">密碼</label>
              <input className="auth-input" type="password" value={password}
                     onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <button type="submit" className="auth-btn">登入</button>
          </form>

          <p className="auth-switch">
            還沒有帳號？<button onClick={switchToRegister} className="auth-link">立即註冊</button>
          </p>
        </div>
      </div>
    </div>
  );
}

// 註冊表單
function Register({ onRegister, switchToLogin }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) {
      setError("密碼與確認不符");
      return;
    }
    try {
      await axios.post("/api/auth/register", { name, email, password });
      // 註冊成功後自動登入
      const { data } = await axios.post("/api/auth/login", { email, password });
      localStorage.setItem("token", data.token);
      onRegister(data.user);
    } catch (err) {
      setError(err.response?.data?.error || "註冊失敗");
    }
  };

  return (
    <div className="auth-card">
      <div className="auth-brand">
        <div className="auth-logo">🛒</div>
        <h1 className="auth-title">建立帳號</h1>
        <p className="auth-subtitle">快速完成註冊開始購物</p>
      </div>

      {error && <div className="auth-alert" role="alert">{error}</div>}

      <form onSubmit={handleSubmit} className="auth-form">
        <label className="auth-label">姓名</label>
        <input className="auth-input" value={name} onChange={(e)=>setName(e.target.value)} required />

        <label className="auth-label">Email</label>
        <input className="auth-input" type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required />

        <label className="auth-label">密碼</label>
        <input className="auth-input" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} required />

        <label className="auth-label">確認密碼</label>
        <input className="auth-input" type="password" value={confirm} onChange={(e)=>setConfirm(e.target.value)} required />

        <button type="submit" className="auth-btn">註冊</button>
      </form>

      <p className="auth-switch">
        已有帳號？<button onClick={switchToLogin} className="auth-link">立即登入</button>
      </p>
    </div>
  );
}

// 主應用
function App() {
  const [user, setUser] = useState(null);
  const [showRegister, setShowRegister] = useState(false);
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState(() => JSON.parse(localStorage.getItem("cart") || "[]"));
  const [buyer, setBuyer] = useState({ name: "", phone: "", address: "", payment: "credit", email: "" });
  const [placing, setPlacing] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [showPayment, setShowPayment] = useState(false);

  // 啟動時檢查 token 並撈用戶
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      axios.get("/api/auth/me")
        .then(res => setUser(res.data.user))
        .catch(() => { localStorage.removeItem("token"); setUser(null); });
    }
  }, []);

  // 登出
  function logout() {
    localStorage.removeItem("token");
    setUser(null);
    setShowRegister(false);
  }

  // 取得商品
  useEffect(() => {
    if (!user) return;
    axios.get("/api/products").then(res => setProducts(res.data));
  }, [user]);

  // 購物車持久化
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  const total = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.qty, 0), [cart]);

  function addToCart(p) {
    setCart((prev) => {
      const found = prev.find((x) => x.id === p.id);
      const currentQty = found ? found.qty : 0;
      if (currentQty >= p.stock) return prev; // 庫存不足時不再增加
      if (found) return prev.map((x) => (x.id === p.id ? { ...x, qty: x.qty + 1 } : x));
      return [...prev, { id: p.id, name: p.name, price: p.price, qty: 1, stock: p.stock }];
    });
  }
  
  function updateQty(id, qty) {
    setCart((prev) => prev
      .map((x) => (x.id === id ? { ...x, qty: Math.min(Math.max(qty, 1), x.stock) } : x))
      .filter((x) => x.qty > 0));
  }
  
  function removeItem(id) { setCart((prev) => prev.filter((x) => x.id !== id)); }
  function clearCart() { setCart([]); }
  
  async function placeOrder(e) {
    e.preventDefault();
    if (!cart.length) return alert("購物車是空的");
    if (!buyer.name || !buyer.phone || !buyer.address || !buyer.email)
      return alert("請完整填寫收件資料");

    // 显示支付流程
    setShowPayment(true);
  }

  async function processPayment(paymentResult) {
    try {
      setPlacing(true);
      
      // 创建订单
      const resp = await axios.post('/api/orders', {
        buyer,
        items: cart,
        total,
        payment: paymentResult
      });
      
      const id = resp.data.id;
      setOrderId(id);

      // 视觉上扣库存/清空购物车
      setProducts(prev => prev.map(p => {
        const inCart = cart.find(c => c.id === p.id);
        return inCart ? { ...p, stock: p.stock - inCart.qty } : p;
      }));
      setCart([]);
      
      // 隐藏支付流程
      setShowPayment(false);
      
      alert(`下單成功！訂單編號：${id}\n已寄出訂單確認信至：${buyer.email}`);
    } catch (err) {
      alert(err.response?.data?.error || "下單失敗，請稍後再試");
    } finally {
      setPlacing(false);
    }
  }

  function handlePaymentCancel() {
    setShowPayment(false);
  }

  // 尚未登入：顯示登入或註冊
  if (!user) {
    return showRegister ? (
      <Register onRegister={(u) => setUser(u)} switchToLogin={() => setShowRegister(false)} />
    ) : (
      <Login onLogin={(u) => setUser(u)} switchToRegister={() => setShowRegister(true)} />
    );
  }

  // 已登入：下單頁面
  return (
    <div className="app">
      <header className="header">
        <div className="container header-bar">
          <h1 className="title">🛒 歡迎，{user.name}</h1>
          <button className="btn" onClick={logout}>登出</button>
        </div>
      </header>
      <main className="container main-grid">
        {/* 商品清單 */}
        <section className="products">
          <h2 className="section-title">商品</h2>
          <div className="product-grid">
            {products.map((p) => (
              <article key={p.id} className="card product-card">
                {/* 圖片顯示 */}
                <img
                  src={p.image_url}
                  alt={p.name}
                  className="product-img"
                />
                <div className="product-head">
                  <div>
                    <h3 className="product-name">{p.name}</h3>
                    <p className="product-price">{currency(p.price)}</p>
                  </div>
                  <span
                    className={`badge ${
                      p.stock > 0 ? "badge-ok" : "badge-out"
                    }`}
                  >
                    庫存 {p.stock}
                  </span>
                </div>
                <button
                  disabled={p.stock === 0}
                  onClick={() => addToCart(p)}
                  className="btn btn-block"
                >
                  加入購物車
                </button>
              </article>
            ))}
          </div>
        </section>

        {/* 購物車 & 結帳 */}
        <section className="cart">
          <h2 className="section-title">購物車</h2>
          <div className="card">
            {!cart.length && <p className="muted">尚未加入商品</p>}
            {cart.map((it) => (
              <div key={it.id} className="line">
                <div>
                  <h4>{it.name}</h4>
                  <p className="muted">{currency(it.price)} × {it.qty}</p>
                </div>
                <div className="actions">
                  <button
                    onClick={() => updateQty(it.id, it.qty - 1)}
                    className="btn btn-sm"
                    disabled={it.qty <= 1}
                  >
                    -
                  </button>
                  <span className="qty">{it.qty}</span>
                  <button
                    onClick={() => updateQty(it.id, it.qty + 1)}
                    className="btn btn-sm"
                    disabled={it.qty >= it.stock}
                  >
                    +
                  </button>
                  <button
                    onClick={() => removeItem(it.id)}
                    className="btn btn-sm btn-danger"
                  >
                    移除
                  </button>
                </div>
              </div>
            ))}
            {cart.length > 0 && (
              <div className="summary">
                <div className="summary-label">總計</div>
                <div className="summary-value">{currency(total)}</div>
              </div>
            )}
            <div className="end">
              <button
                onClick={clearCart}
                className="link"
                disabled={!cart.length}
              >
                清空
              </button>
            </div>
          </div>

          <h2 className="section-title">結帳</h2>
          <form onSubmit={placeOrder} className="card form">
            <div className="form-group">
              <label className="label">收件人姓名</label>
              <input
                value={buyer.name}
                onChange={(e) => setBuyer({ ...buyer, name: e.target.value })}
                className="input"
                required
              />
            </div>
            <div className="form-group">
              <label className="label">電話</label>
              <input
                value={buyer.phone}
                onChange={(e) => setBuyer({ ...buyer, phone: e.target.value })}
                className="input"
                required
              />
            </div>
            <div className="form-group">
              <label className="label">Email</label>
              <input type="email"
                value={buyer.email}
                onChange={(e) => setBuyer({ ...buyer, email: e.target.value })}
                className="input"
                required />
            </div>
            <div className="form-group">
              <label className="label">地址</label>
              <textarea
                value={buyer.address}
                onChange={(e) => setBuyer({ ...buyer, address: e.target.value })}
                className="input"
                rows={2}
                required
              />
            </div>
            <button
              type="submit"
              disabled={placing || !cart.length}
              className="btn btn-block btn-primary"
            >
              {placing ? "處理中…" : "繼續付款"}
            </button>
            {orderId && <p className="hint-success">訂單建立成功：{orderId}</p>}
          </form>

          {/* 支付流程 */}
          {showPayment && (
            <PaymentFlow
              amount={total}
              onPaymentSuccess={processPayment}
              onPaymentCancel={handlePaymentCancel}
            />
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
