// src/App.jsx
import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  ShoppingCart, Plus, Minus, X, Home, ChevronRight, Truck, MapPin,
  Loader2, Cake, Heart
} from "lucide-react";

import { supabase } from "./supabaseClient";

/* ------------- Constants & Data ------------- */
const COLLECTION_ORDERS = "doceeser_pedidos";
const COLLECTION_CARTS = "carts";
const DELIVERY_FEE = 2.99;
const ETA_TEXT = "20–35 min"; // tempo estimado fornecido

// --- DADOS ADICIONAIS AÇAÍ ---
const ACAI_TOPPINGS = [
  { name: "Banana", price: 0.01 },
  { name: "Morango", price: 2.00 },
  { name: "Leite Ninho", price: 1.00 },
  { name: "Leite Condensado", price: 0.01 },
  { name: "Creme de Ninho", price: 1.00 },
  { name: "Nutella", price: 3.00 },
  { name: "Amendoim", price: 1.00 },
];

const ACAI_ID = 18;
const ACAI_BASE_PRICE = 17.90;

const initialProducts = [
  // ... (mantive exatamente os produtos do seu arquivo original)
  {
    id: 9,
    name: "Red velvet com Ninho e Morangos",
    price: 15.90,
    category: 'bolos',
    description: "Massa aveludada e macia, coberta com creme de leite Ninho cremoso e morangos fresquinhos no topo. Uma combinação elegante.",
    imageUrl: "https://i.imgur.com/3UDWhLR.png"
  },
  {
    id: 2,
    name: "Bolo Cenoura com chocolate",
    price: 15.90,
    category: 'bolos',
    description: "Mini vulcão de cenoura: uma massa fofinha e úmida de bolo de cenoura, recheada com explosão de calda cremosa de chocolate.",
    imageUrl: "https://i.imgur.com/aaUdL2b.png"
  },
  {
    id: 10,
    name: "Chocolate com Morangos",
    price: 15.90,
    category: 'bolos',
    description: "Bolo fofinho de chocolate, cobertura cremosa 50% e morangos fresquinhos.",
    imageUrl: "https://i.imgur.com/MMbQohl.png"
  },
  {
    id: 13,
    name: "Chocolatudo!!!",
    price: 15.90,
    category: 'bolos',
    description: "Bolo chocolatudo com creme de chocolate 50% e granulados.",
    imageUrl: "https://i.imgur.com/3Hva4Df.png"
  },
  {
    id: 16,
    name: "Bolo de Ferreiro com Nutella",
    price: 16.90,
    category: 'bolos',
    description: "Bolo de chocolate com amendoim, Nutella e chocolate 50%.",
    imageUrl: "https://i.imgur.com/OamNqov.png"
  },

  // Categoria COPO DA FELICIDADE
  {
    id: 17,
    name: "Copo Oreo com Nutella",
    price: 24.90,
    category: 'copo_felicidade',
    description: "Camadas de creme de Ninho, Oreo e Nutella.",
    imageUrl: "https://i.imgur.com/1EZRMVl.png"
  },
  {
    id: 24,
    name: "Copo Maracujá com Brownie",
    price: 24.90,
    category: 'copo_felicidade',
    description: "Creme de maracujá, chocolate 50% e pedaços de brownie.",
    imageUrl: "https://i.imgur.com/PypEwAz.png"
  },
  {
    id: 25,
    name: "Copo Brownie Dois Amores",
    price: 22.90,
    category: 'copo_felicidade',
    description: "Dois amores + brownie macio em camadas.",
    imageUrl: "https://i.imgur.com/mMQtXDB.png"
  },
  {
    id: 26,
    name: "Copo Encanto de Ninho e Morangos",
    price: 22.90,
    category: 'copo_felicidade',
    description: "Camadas de creme de Ninho e morangos frescos.",
    imageUrl: "https://i.imgur.com/EgFhhwL.png"
  },
  {
    id: 27,
    name: "Copo de Brownie com Ferreiro e Nutella",
    price: 26.90,
    category: 'copo_felicidade',
    description: "Brownie, Ferrero, chocolate 50% e Nutella.",
    imageUrl: "https://i.imgur.com/t6xeVDf.png"
  },

  // Categoria BROWNIES
  {
    id: 20,
    name: "Brownie De Ninho e Nutella",
    price: 11.90,
    category: 'brownie',
    description: "Brownie com creme de Ninho e Nutella.",
    imageUrl: "https://i.imgur.com/vWdYZ8K.png"
  },
  {
    id: 21,
    name: "Brownie Recheado com Nutella e Morangos",
    price: 22.90,
    category: 'brownie',
    description: "Brownie recheado com creme de Ninho, Nutella e morangos.",
    imageUrl: "https://i.imgur.com/P1pprjF.png"
  },
  {
    id: 22,
    name: "Brownie Ferreiro com Nutella",
    price: 11.90,
    category: 'brownie',
    description: "Brownie com Nutella e amendoim torrado.",
    imageUrl: "https://i.imgur.com/rmp3LtH.png"
  },
  {
    id: 23,
    name: "Brownie Duo com Oreo",
    price: 11.90,
    category: 'brownie',
    description: "Brownie com cobertura de chocolate e pedaços de Oreo.",
    imageUrl: "https://i.imgur.com/8IbcWWj.png"
  },

  // Categoria AÇAÍ
  {
    id: ACAI_ID,
    name: "Copo de Açaí 250ml",
    price: ACAI_BASE_PRICE,
    category: 'acai',
    description: "Copo de Açaí cremoso — escolha seus acompanhamentos.",
    imageUrl: "https://i.imgur.com/OrErP8N.png"
  },

  // Categoria SALGADOS
  {
    id: 6,
    name: "Empada de Camarão e Requeijão",
    price: 12.00,
    category: 'salgado',
    description: "Camarão cremoso com requeijão. Feito na marmitinha.",
    imageUrl: "https://i.imgur.com/rV18DkJ.png"
  }
];

const categories = {
  all: 'Todos os Produtos',
  bolos: 'Bolos',
  copo_felicidade: 'Copo da Felicidade',
  brownie: 'Brownies',
  acai: 'Açaí',
  salgado: 'Salgados',
};

const PAYMENT_METHODS = [{ id: 'pix', name: 'Pix', details: 'Pagamento via QR Code ou chave Pix.' }];

/* ------------- Helpers ------------- */
const formatBR = (value) => `R$ ${Number(value || 0).toFixed(2).replace('.', ',')}`;

/* ------------- Guest ID helpers ------------- */
const GUEST_KEY = "doceeser_guest_id";
const ensureGuestId = () => {
  try {
    let id = localStorage.getItem(GUEST_KEY);
    if (!id) {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) id = crypto.randomUUID();
      else id = `guest_${Date.now()}`;
      localStorage.setItem(GUEST_KEY, id);
    }
    return id;
  } catch (e) {
    return `guest_${Date.now()}`;
  }
};

/* ------------- Cart persistence helpers (Supabase upsert fallback) ------------- */
const saveCartToSupabase = async (userId, cart) => {
  try {
    if (!userId) return;
    // try upsert into table 'carts' (if exists). If the table doesn't exist, this will fail silently.
    await supabase
      .from(COLLECTION_CARTS)
      .upsert({ id: userId, items: cart, updatedAt: new Date().toISOString() })
      .select();
  } catch (err) {
    console.warn("Erro salvando carrinho no Supabase (provavel tabela ausente):", err);
  }
};

/* ------------- Create order in Supabase ------------- */
const createOrderInSupabase = async ({ cart, total, customer, deliveryType }) => {
  try {
    const id = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `ord_${Date.now()}`;
    const payload = {
      id,
      data: { items: cart, customer: customer || {}, deliveryType, paymentMethod: null },
      status: 'novo',
      createdAt: new Date().toISOString(),
      total: Number(total || 0),
      items: cart, // denormalizado para facilitar leitura no frontend
      customer: customer || {}
    };
    const { data, error } = await supabase
      .from(COLLECTION_ORDERS)
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error("Erro insert pedido:", error);
      return null;
    }
    return id;
  } catch (err) {
    console.error("Erro ao criar pedido (supabase):", err);
    return null;
  }
};

/* ---------- LocalStorage helpers for 'Meus Pedidos' ---------- */
const LOCAL_ORDERS_KEY = "doceeser_local_orders";

const saveLocalOrderId = (orderId) => {
  try {
    const existingJson = localStorage.getItem(LOCAL_ORDERS_KEY);
    const arr = existingJson ? JSON.parse(existingJson) : [];
    const newArr = [orderId, ...arr.filter(id => id !== orderId)];
    localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(newArr.slice(0, 50)));
  } catch (e) {
    console.warn("Erro salvando localOrders", e);
  }
};

const readLocalOrders = () => {
  try {
    const existingJson = localStorage.getItem(LOCAL_ORDERS_KEY);
    return existingJson ? JSON.parse(existingJson) : [];
  } catch (e) {
    return [];
  }
};

/* ------------- Small UI components ------------- */
// ProductCard, OrderSummary, AcaiModal kept unchanged — reuse your implementations
// (I'll include them below unchanged to keep the app working exactly as before)

const ProductCard = ({ product, onAdd, onCustomize }) => {
  const isAcai = product.id === ACAI_ID;
  return (
    <div className="flex flex-col rounded-xl shadow-lg overflow-hidden bg-white">
      <div className="h-40 overflow-hidden relative">
        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" onError={(e)=>e.target.src="https://placehold.co/400x250/cccccc/333333?text=Doce+É+Ser"} />
        <div className="absolute top-0 right-0 p-2 rounded-bl-lg bg-amber-600 text-white text-xs font-bold">{product.category}</div>
      </div>
      <div className="p-4 flex-grow flex flex-col justify-between">
        <div>
          <h3 className="text-lg font-bold">{product.name}</h3>
          <p className="text-sm text-gray-600">{product.description}</p>
        </div>
        <div className="mt-4 flex justify-between items-center">
          <span className="font-extrabold text-amber-700">{formatBR(product.price)}</span>
          <button onClick={() => (isAcai ? onCustomize(product) : onAdd(product))} className="bg-amber-600 text-white p-2 rounded-full">
            {isAcai ? "Customizar" : "Adicionar"}
          </button>
        </div>
      </div>
    </div>
  );
};

const OrderSummary = ({ cart, deliveryType = 'delivery' }) => {
  const subtotal = cart.reduce((s, i) => s + (i.price * (i.quantity || 1)), 0);
  const deliveryFee = deliveryType === 'delivery' ? DELIVERY_FEE : 0;
  const total = subtotal + deliveryFee;
  if (!cart || cart.length === 0) return null;
  return (
    <div className="bg-white p-4 rounded-xl shadow-lg">
      <h4 className="font-bold text-lg">Resumo do Pedido</h4>
      <div className="mt-3 text-sm text-gray-600">
        <div className="flex justify-between"><span>Subtotal</span><span>{formatBR(subtotal)}</span></div>
        <div className="flex justify-between"><span>Entrega</span><span>{deliveryType === 'delivery' ? formatBR(deliveryFee) : 'GRÁTIS'}</span></div>
        <hr className="my-2" />
        <div className="flex justify-between font-bold"><span>Total</span><span>{formatBR(total)}</span></div>
      </div>
      <div className="mt-3 text-xs text-gray-500">
        Itens:
        <ul className="mt-1 list-disc ml-5">
          {cart.map((it, i) => <li key={it.uniqueId || `${it.id}-${i}`}>{(it.quantity||1)}x {it.name} {it.toppings ? `(${it.toppings.join(', ')})` : ''}</li>)}
        </ul>
      </div>
    </div>
  );
};

/* ------------- Order Tracking Page (polling) ------------- */
const OrderTrackingPage = ({ orderId }) => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;
    let mounted = true;

    const fetchOrder = async () => {
      try {
        const { data, error } = await supabase
          .from(COLLECTION_ORDERS)
          .select('*')
          .eq('id', orderId)
          .single();

        if (error) {
          console.error("Erro buscando pedido:", error);
          if (mounted) setOrder(null);
        } else {
          if (mounted) setOrder(data);
        }
      } catch (err) {
        console.error("Erro fetch order:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchOrder();
    const t = setInterval(fetchOrder, 3000);
    return () => { mounted = false; clearInterval(t); };
  }, [orderId]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>
  );

  if (!order) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white p-6 rounded shadow text-center">
        <h3 className="font-bold text-lg">Pedido não encontrado</h3>
        <p className="text-sm text-gray-600">Verifique se o ID está correto.</p>
      </div>
    </div>
  );

  const status = order.status || '—';
  const subtitle = {
    novo: 'Pedido recebido',
    preparando: 'Estamos preparando',
    pronto: 'Pedido pronto',
    entregue: 'Entregue'
  }[status] || status;

  const createdAt = order.createdAt ? new Date(order.createdAt).toLocaleString() : '';

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold">Pedido: <span className="text-amber-600">{order.id}</span></h2>
              <p className="text-sm text-gray-600">{subtitle}</p>
              <p className="text-xs text-gray-400 mt-1">Criado: {createdAt}</p>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold">{order.total ? formatBR(Number(order.total)) : ''}</div>
              <div className="text-sm text-gray-500">{ETA_TEXT}</div>
            </div>
          </div>

          <div className="mt-4">
            <h4 className="font-semibold">Itens</h4>
            <ul className="list-disc ml-5 text-sm mt-2">
              {Array.isArray(order.items) ? order.items.map((it, i) => (
                <li key={i}>{(it.quantity || 1)}x {it.name} {it.toppings ? `(+${it.toppings.join(', ')})` : ''}</li>
              )) : <li>—</li>}
            </ul>
          </div>

          <div className="mt-4">
            <h4 className="font-semibold">Endereço / Cliente</h4>
            <p className="text-sm">{order.customer?.nome || '—'}</p>
            <p className="text-xs text-gray-500">{order.customer?.telefone || ''}</p>
            <p className="text-xs text-gray-500">{order.customer?.rua ? `${order.customer.rua}, ${order.customer.numero || ''} — ${order.customer.bairro || ''}` : ''}</p>
          </div>

          <div className="mt-6 flex gap-2">
            <button onClick={()=>navigator.clipboard.writeText(window.location.href)} className="px-4 py-2 rounded bg-amber-700 text-white">Copiar link</button>
            <a href="/meus-pedidos" className="px-4 py-2 rounded border">Meus pedidos</a>
            <a href="/" className="px-4 py-2 rounded border">Voltar ao menu</a>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ------------- My Orders Page (polling per ID) ------------- */
const MyOrdersPage = () => {
  const [localIds, setLocalIds] = useState(readLocalOrders());
  const [orders, setOrders] = useState([]); // array of {id, data}
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLocalIds(readLocalOrders());
  }, []);

  useEffect(() => {
    if (localIds.length === 0) { setLoading(false); return; }
    let mounted = true;
    setLoading(true);

    const fetchAll = async () => {
      try {
        const { data, error } = await supabase
          .from(COLLECTION_ORDERS)
          .select('*')
          .in('id', localIds);

        if (error) {
          console.error("Erro buscando meus pedidos:", error);
          if (mounted) setOrders([]);
        } else {
          // order by localIds order
          const ordered = localIds.map(id => data.find(d => d.id === id)).filter(Boolean);
          if (mounted) setOrders(ordered);
        }
      } catch (err) {
        console.error("Erro fetch meus pedidos:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchAll();
    const t = setInterval(fetchAll, 3000);
    return () => { mounted = false; clearInterval(t); };
  }, [localIds]);

  const handleOpen = (id) => window.location.href = `/pedido/${id}`;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">Meus Pedidos</h2>
        {loading && <div className="p-6 bg-white rounded shadow text-center"><Loader2 className="animate-spin" /></div>}
        {!loading && orders.length === 0 && <div className="p-6 bg-white rounded shadow text-center">Nenhum pedido salvo neste dispositivo.</div>}
        <div className="space-y-4">
          {orders.map(order => (
            <div key={order.id} className="bg-white p-4 rounded shadow flex justify-between items-center">
              <div>
                <div className="font-semibold">Pedido: <span className="text-amber-600">{order.id}</span></div>
                <div className="text-sm text-gray-600">{order.status || '—'} — {order.createdAt ? new Date(order.createdAt).toLocaleString() : ''}</div>
                <div className="text-xs text-gray-500 mt-1">{order.items?.length || 0} itens — {formatBR(Number(order.total || 0))}</div>
              </div>
              <div className="flex gap-2">
                <button onClick={()=>handleOpen(order.id)} className="px-3 py-1 bg-amber-700 text-white rounded">Acompanhar</button>
                <button onClick={()=>{ navigator.clipboard.writeText(window.location.origin + `/pedido/${order.id}`); alert('Link copiado'); }} className="px-3 py-1 border rounded">Copiar link</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ------------- App (main) ------------- */
const App = () => {
  const [page, setPage] = useState('menu'); // menu, cart, delivery, payment, about, meus-pedidos, tracking
  const [activeCategory, setActiveCategory] = useState('all');
  const [cart, setCart] = useState([]);
  const [deliveryType, setDeliveryType] = useState('delivery');
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(true); // site doesn't require auth
  const [userId, setUserId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [isAcaiModalOpen, setIsAcaiModalOpen] = useState(false);
  const [acaiProduct, setAcaiProduct] = useState(null);

  const [customerInfo, setCustomerInfo] = useState({
    nome: '', telefone: '', rua: '', numero: '', bairro: '', referencia: ''
  });

  const [lastCreatedOrderId, setLastCreatedOrderId] = useState(null);

  const cartItemCount = useMemo(() => cart.reduce((s, i) => s + (i.quantity || 1), 0), [cart]);

  /* ----------------- Guest ID & cart persistence ----------------- */
  useEffect(() => {
    const id = ensureGuestId();
    setUserId(id);
    setIsAuthReady(true);

    // try load cart from supabase carts table first, otherwise keep localStorage
    const loadCart = async () => {
      try {
        const { data, error } = await supabase
          .from(COLLECTION_CARTS)
          .select('items')
          .eq('id', id)
          .single();

        if (!error && data && Array.isArray(data.items)) {
          setCart(data.items);
        } else {
          // fallback to localStorage cart
          const existing = localStorage.getItem('doceeser_cart');
          if (existing) {
            try { setCart(JSON.parse(existing)); } catch(e) { setCart([]); }
          } else setCart([]);
        }
      } catch (err) {
        const existing = localStorage.getItem('doceeser_cart');
        if (existing) {
          try { setCart(JSON.parse(existing)); } catch(e) { setCart([]); }
        } else setCart([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadCart();
  }, []);

  useEffect(() => {
    if (!isAuthReady || !userId) { setIsLoading(false); return; }
    const t = setTimeout(()=> {
      try {
        localStorage.setItem('doceeser_cart', JSON.stringify(cart));
      } catch(e){}
      // attempt to save to supabase (if table exists)
      saveCartToSupabase(userId, cart);
    }, 400);
    return () => clearTimeout(t);
  }, [cart, isAuthReady, userId]);

  /* ----------------- Url handling for /pedido/:id and /meus-pedidos ----------------- */
  useEffect(() => {
    const p = window.location.pathname || '/';
    if (p.startsWith('/pedido/') || p.startsWith('/status/')) {
      setPage('tracking');
    } else if (p === '/meus-pedidos') {
      setPage('meus-pedidos');
    } else {
      // keep existing behavior (menu etc) if not those paths
    }
  }, []);

  /* ----------------- Cart ops ----------------- */
  const addToCart = useCallback((product) => {
    setCart(prev => {
      const existing = prev.find(p => p.id === product.id && !p.isCustom);
      if (existing) return prev.map(p => p.id === product.id && !p.isCustom ? { ...p, quantity: (p.quantity||1) + 1 } : p);
      return [...prev, { ...product, quantity: 1, isCustom: false }];
    });
  }, []);

  const openAcaiModal = (product) => { setAcaiProduct(product); setIsAcaiModalOpen(true); };
  const closeAcaiModal = () => { setAcaiProduct(null); setIsAcaiModalOpen(false); };

  const addCustomAcai = (customItem) => {
    setCart(prev => [...prev, customItem]);
    closeAcaiModal();
  };

  const updateQuantity = (key, delta) => {
    setCart(prev => prev.flatMap(it => {
      const k = it.uniqueId || it.id;
      if (k !== key) return it;
      const nq = (it.quantity||1) + delta;
      if (nq <= 0) return [];
      return { ...it, quantity: nq };
    }));
  };

  const removeItem = (key) => setCart(prev => prev.filter(it => (it.uniqueId || it.id) !== key));

  /* ----------------- Checkout & create order (Supabase) ----------------- */
  const subtotal = useMemo(() => cart.reduce((s, i) => s + (i.price * (i.quantity || 1)), 0), [cart]);
  const deliveryFee = deliveryType === 'delivery' ? DELIVERY_FEE : 0;
  const total = subtotal + deliveryFee;

  const handleCreateOrder = async () => {
    if (cart.length === 0) { alert("Carrinho vazio."); return null; }
    if (!customerInfo.nome || !customerInfo.telefone || !customerInfo.rua || !customerInfo.numero || !customerInfo.bairro) {
      alert("Preencha nome, telefone, rua, número e bairro antes de confirmar.");
      return null;
    }

    const id = await createOrderInSupabase({ cart, total, customer: customerInfo, deliveryType });
    if (id) {
      saveLocalOrderId(id);
      setLastCreatedOrderId(id);
      setCart([]);
      if (userId) {
        try { await saveCartToSupabase(userId, []); } catch(e){}
        try { localStorage.setItem('doceeser_cart', JSON.stringify([])); } catch(e){}
      }
      window.history.pushState({}, '', `/pedido/${id}`);
      setPage('tracking');
      return id;
    } else {
      alert("Erro ao criar pedido. Tente novamente.");
      return null;
    }
  };

  /* ------------- Simple UI pages (menu/cart/delivery/payment/about) ------------- */
  const MenuPage = (
    <div className="p-4 md:p-8">
      <h2 className="text-3xl font-extrabold mb-6">{categories[activeCategory]}</h2>
      <div className="flex gap-3 mb-6 flex-wrap">
        {Object.keys(categories).map(k => (
          <button key={k} onClick={()=>setActiveCategory(k)} className={`px-4 py-2 rounded ${k===activeCategory ? 'bg-amber-700 text-white' : 'bg-gray-100'}`}>
            {categories[k].split(' ')[0]}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {initialProducts.filter(p => activeCategory === 'all' ? true : p.category === activeCategory).map(p => (
          <ProductCard key={p.id} product={p} onAdd={addToCart} onCustomize={openAcaiModal} />
        ))}
      </div>
    </div>
  );

  const CartPage = (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <h3 className="text-2xl font-bold mb-4">Seu Carrinho</h3>
      {cart.length === 0 ? (
        <div className="text-center p-10 bg-white rounded shadow">
          <ShoppingCart className="mx-auto w-12 h-12 text-gray-300" />
          <p className="mt-3">Seu carrinho está vazio.</p>
          <button onClick={()=>setPage('menu')} className="mt-4 text-amber-700">Voltar ao Menu</button>
        </div>
      ) : (
        <div className="lg:flex lg:space-x-6">
          <div className="flex-grow space-y-4">
            {cart.map((it, idx) => {
              const key = it.uniqueId || it.id || idx;
              return (
                <div key={key} className="flex items-center bg-white p-4 rounded shadow">
                  <div className="flex-grow">
                    <div className="font-semibold">{it.name}</div>
                    <div className="text-sm text-gray-500">{formatBR(it.price)} / un</div>
                    {it.isCustom && it.toppings && <div className="text-xs text-gray-600">+ {it.toppings.join(', ')}</div>}
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={()=>updateQuantity(key, -1)} className="p-1 border rounded"><Minus className="w-4 h-4" /></button>
                    <div className="font-bold">{it.quantity || 1}</div>
                    <button onClick={()=>updateQuantity(key, 1)} className="p-1 border rounded"><Plus className="w-4 h-4" /></button>
                  </div>
                  <div className="ml-4 font-bold text-amber-700">{formatBR((it.price || 0) * (it.quantity || 1))}</div>
                  <button onClick={()=>removeItem(key)} className="ml-4 text-red-500"><X /></button>
                </div>
              );
            })}
            <div>
              <button onClick={()=>setPage('menu')} className="mt-4 text-amber-700">Continuar comprando</button>
            </div>
          </div>

          <div className="lg:w-80 mt-6 lg:mt-0">
            <OrderSummary cart={cart} deliveryType={deliveryType} />
            <button onClick={()=>setPage('delivery')} className="w-full mt-4 bg-amber-700 text-white py-2 rounded">Prosseguir para Entrega</button>
          </div>
        </div>
      )}
    </div>
  );

  const DeliveryPage = (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <h3 className="text-2xl font-bold mb-4">Entrega</h3>
      <div className="grid md:grid-cols-2 gap-4">
        <label className={`p-4 rounded border ${deliveryType==='delivery' ? 'border-amber-600 bg-amber-50' : 'bg-white'}`}>
          <input type="radio" checked={deliveryType==='delivery'} onChange={()=>setDeliveryType('delivery')} className="hidden" />
          <div className="font-semibold">Entrega (R$ {DELIVERY_FEE.toFixed(2)})</div>
          <div className="text-sm text-gray-600 mt-2">
            <input placeholder="CEP" className="w-full p-2 border rounded mb-2" />
            <input placeholder="Rua, Número, Bairro" value={customerInfo.rua} onChange={(e)=>setCustomerInfo(prev=>({...prev, rua: e.target.value}))} className="w-full p-2 border rounded" />
          </div>
        </label>

        <label className={`p-4 rounded border ${deliveryType==='retirada' ? 'border-amber-600 bg-amber-50' : 'bg-white'}`}>
          <input type="radio" checked={deliveryType==='retirada'} onChange={()=>setDeliveryType('retirada')} className="hidden" />
          <div className="font-semibold">Retirada na loja (GRÁTIS)</div>
          <div className="text-sm text-gray-600 mt-2">
            <input placeholder="Nome para retirada" value={customerInfo.nome} onChange={(e)=>setCustomerInfo(prev=>({...prev, nome: e.target.value}))} className="w-full p-2 border rounded mb-2" />
            <input placeholder="Telefone" value={customerInfo.telefone} onChange={(e)=>setCustomerInfo(prev=>({...prev, telefone: e.target.value}))} className="w-full p-2 border rounded mb-2" />
          </div>
        </label>
      </div>

      <div className="mt-4 flex gap-2">
        <button onClick={()=>setPage('payment')} className="bg-amber-700 text-white px-4 py-2 rounded">Prosseguir para Pagamento</button>
        <button onClick={()=>setPage('cart')} className="bg-gray-200 px-4 py-2 rounded">Voltar</button>
      </div>
    </div>
  );

  const PaymentPage = (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <h3 className="text-2xl font-bold mb-4">Pagamento</h3>
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <div className="space-y-3">
            {PAYMENT_METHODS.map(m => (
              <label key={m.id} className={`block p-4 rounded border ${paymentMethod===m.id ? 'border-amber-600 bg-amber-50' : 'bg-white'}`}>
                <input type="radio" checked={paymentMethod===m.id} onChange={()=>setPaymentMethod(m.id)} className="hidden"/>
                <div className="font-bold">{m.name}</div>
                <div className="text-sm text-gray-600">{m.details}</div>
              </label>
            ))}
          </div>

          {paymentMethod === 'pix' && (
            <div className="mt-4">
              <div className="bg-white p-4 rounded shadow">
                <div className="text-center font-bold text-green-700 mb-3">Pagamento via PIX</div>
                <div className="text-sm">Beneficiário: Doce É Ser Tapera</div>
                <div className="text-sm">Chave (CNPJ): 61.982.423/0001-49</div>
                <div className="text-xl font-bold mt-2">Valor: {formatBR(total)}</div>
                <div className="mt-4">
                  <input placeholder="Nome" value={customerInfo.nome} onChange={(e)=>setCustomerInfo(prev=>({...prev, nome: e.target.value}))} className="w-full p-2 border rounded mb-2"/>
                  <input placeholder="Telefone" value={customerInfo.telefone} onChange={(e)=>setCustomerInfo(prev=>({...prev, telefone: e.target.value}))} className="w-full p-2 border rounded mb-2"/>
                  <input placeholder="Rua" value={customerInfo.rua} onChange={(e)=>setCustomerInfo(prev=>({...prev, rua: e.target.value}))} className="w-full p-2 border rounded mb-2"/>
                  <div className="grid grid-cols-2 gap-2">
                    <input placeholder="Número" value={customerInfo.numero} onChange={(e)=>setCustomerInfo(prev=>({...prev, numero: e.target.value}))} className="p-2 border rounded"/>
                    <input placeholder="Bairro" value={customerInfo.bairro} onChange={(e)=>setCustomerInfo(prev=>({...prev, bairro: e.target.value}))} className="p-2 border rounded"/>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <button onClick={handleCreateOrder} className="w-full py-2 rounded bg-green-600 text-white">Enviei o pagamento</button>
                </div>
                <p className="text-xs text-gray-500 mt-2">Tempo estimado: {ETA_TEXT}</p>
              </div>
            </div>
          )}
        </div>

        <div>
          <OrderSummary cart={cart} deliveryType={deliveryType} />
        </div>
      </div>
    </div>
  );

  const AboutPage = (
    <div className="p-8 max-w-4xl mx-auto text-center">
      <h2 className="text-3xl font-bold text-amber-700">Doce É Ser</h2>
      <p className="mt-4 text-gray-600">Nascida da paixão em equilibrar o doce e o salgado, a Doce É Ser é mais do que uma loja: é um ponto de encontro para quem ama a culinária artesanal. Trabalhamos com ingredientes frescos e receitas exclusivas para garantir que cada mordida seja uma experiência inesquecível.</p>
      <button onClick={()=>setPage('menu')} className="mt-6 bg-amber-700 text-white px-4 py-2 rounded">Ver cardápio</button>
    </div>
  );

  /* ------------- Render logic ------------- */
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/';
  const trackedOrderIdFromPath = currentPath.startsWith('/pedido/') ? currentPath.replace('/pedido/', '').split('/')[0] : null;

  if (page === 'tracking' && trackedOrderIdFromPath) {
    return (
      <div>
        {lastCreatedOrderId === trackedOrderIdFromPath && (
          <div className="bg-green-600 text-white p-4 text-center">
            <div className="max-w-3xl mx-auto">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg font-bold">Pedido enviado com sucesso!</div>
                  <div className="text-sm">Número do pedido: <strong>{trackedOrderIdFromPath}</strong></div>
                </div>
                <div className="text-right">
                  <div>{ETA_TEXT}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        <OrderTrackingPage orderId={trackedOrderIdFromPath} />
      </div>
    );
  }

  if (page === 'meus-pedidos') {
    return <MyOrdersPage />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 bg-white shadow p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={()=>{ setPage('menu'); window.history.pushState({}, '', '/'); }}>
            <Cake className="w-6 h-6 text-amber-500" />
            <h1 className="font-bold">Doce É Ser</h1>
          </div>
          <nav className="hidden md:flex gap-4">
            <button onClick={()=>{ setPage('menu'); window.history.pushState({}, '', '/'); }} className={`px-3 py-1 rounded ${page==='menu' ? 'bg-amber-100 text-amber-700' : ''}`}>Menu</button>
            <button onClick={()=>{ setPage('about'); window.history.pushState({}, '', '/about'); }} className={`px-3 py-1 rounded ${page==='about' ? 'bg-amber-100 text-amber-700' : ''}`}>Sobre</button>
            <button onClick={()=>{ setPage('meus-pedidos'); window.history.pushState({}, '', '/meus-pedidos'); }} className="px-3 py-1 rounded">Meus pedidos</button>
          </nav>
          <div className="flex items-center gap-3">
            <button onClick={()=>{ setPage('cart'); window.history.pushState({}, '', '/cart'); }} className="relative bg-amber-700 text-white p-3 rounded-full">
              <ShoppingCart className="w-5 h-5"/>
              {cartItemCount > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 text-xs rounded-full bg-red-600 flex items-center justify-center border-2 border-white">{cartItemCount}</span>}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto pb-12">
        {page === 'menu' && MenuPage}
        {page === 'cart' && CartPage}
        {page === 'delivery' && DeliveryPage}
        {page === 'payment' && PaymentPage}
        {page === 'about' && AboutPage}
      </main>

      {isAcaiModalOpen && acaiProduct && (
        <AcaiModal
          product={acaiProduct}
          onClose={closeAcaiModal}
          onAdd={(selectedToppings) => {
            const priceExtra = selectedToppings.reduce((s, n) => s + (ACAI_TOPPINGS.find(t=>t.name===n)?.price || 0), 0);
            const item = {
              id: acaiProduct.id,
              uniqueId: `acai-${Date.now()}`,
              name: acaiProduct.name,
              toppings: selectedToppings,
              price: (ACAI_BASE_PRICE + priceExtra),
              quantity: 1,
              isCustom: true
            };
            addCustomAcai(item);
          }}
        />
      )}

      <footer className="bg-gray-800 text-white p-4 text-center">
        <div>Desenvolvido por @DivulgaJà</div>
      </footer>
    </div>
  );
};

/* ------------- Acai Modal Component ------------- */
const AcaiModal = ({ product, onClose, onAdd }) => {
  const [selected, setSelected] = useState([]);
  const toggle = (name) => setSelected(prev => prev.includes(name) ? prev.filter(x => x !== name) : [...prev, name]);
  const total = ACAI_BASE_PRICE + selected.reduce((s, n) => s + (ACAI_TOPPINGS.find(t=>t.name===n)?.price || 0), 0);
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-lg p-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold">{product.name}</h3>
          <button onClick={onClose}><X /></button>
        </div>
        <p className="text-sm text-gray-600 mt-2">Selecione adicionais:</p>
        <div className="mt-4 space-y-2">
          {ACAI_TOPPINGS.map(t => {
            const active = selected.includes(t.name);
            return (
              <div key={t.name} onClick={()=>toggle(t.name)} className={`p-3 rounded border cursor-pointer ${active ? 'bg-amber-50 border-amber-300' : 'bg-white'}`}>
                <div className="flex justify-between items-center">
                  <div>{t.name}</div>
                  <div className="text-sm text-gray-600">{formatBR(t.price)}</div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex justify-between items-center">
          <div className="font-bold">Total: {formatBR(total)}</div>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 rounded border">Cancelar</button>
            <button onClick={()=>onAdd(selected)} className="px-4 py-2 rounded bg-amber-700 text-white">Adicionar</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
