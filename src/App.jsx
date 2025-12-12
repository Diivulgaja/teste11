// src/Admin.jsx
import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from './supabaseClient';
import { Trash2, Clock, Check, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Legend } from 'recharts';

const ADMIN_PASSWORD = '071224';
const TABLE = 'doceeser_pedidos';
const MOTOBOY_NUMBER = '5548991692018'; // número do motoboy (DDI+DDD+numero)

const STATUS_LABELS = {
  novo: 'Novo',
  preparando: 'Preparando',
  pronto: 'Pronto',
  entregue: 'Entregue'
};

export default function Admin() {
  const [isAuth, setIsAuth] = useState(() => !!localStorage.getItem('doceeser_admin'));
  const [passwordInput, setPasswordInput] = useState('');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [showNewOrderBanner, setShowNewOrderBanner] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [view, setView] = useState('orders'); // 'orders' or 'dashboard'
  const [autoSendWhatsapp, setAutoSendWhatsapp] = useState(false); // se true, tenta abrir WhatsApp quando novo pedido chegar
  const [stats, setStats] = useState({});

  // ask notification permission once
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  // helper: play sound
  const playSound = () => {
    try {
      const audio = new Audio('/ding.mp3'); // coloque ding.mp3 em public/
      audio.volume = 1.0;
      audio.play().catch(() => {});
    } catch (e) {
      console.warn('Erro ao tocar som de notificação', e);
    }
  };

  // format whatsapp message for an order
  const formatWhatsappMessage = (order) => {
    const customer = order.customer || {};
    const address = customer.rua ? `${customer.rua}, ${customer.numero || ''} - ${customer.bairro || ''}` : 'Endereço não informado';
    const items = Array.isArray(order.items) ? order.items.map(it => `${it.quantity||1}x ${it.name}${it.toppings ? ` (+${it.toppings.join(', ')})` : ''}`).join('%0A') : '';
    const maps = customer.latitude && customer.longitude ? `https://maps.google.com/?q=${customer.latitude},${customer.longitude}` : '';
    const body = `🚚 NOVO PEDIDO%0ACliente: ${customer.nome || '-'}%0ATelefone: ${customer.telefone || '-'}%0AEndereço: ${address}%0A${maps ? `Mapa: ${maps}%0A` : ''}%0AItens:%0A${items}%0A%0ATotal: R$ ${order.total ? Number(order.total).toFixed(2).replace('.',',') : '0,00'}%0A%0AAcompanhar: ${window.location.origin}/status/${order.id}`;
    return body;
  };

  const sendWhatsapp = (order) => {
    try {
      const text = formatWhatsappMessage(order);
      const url = `https://wa.me/${MOTOBOY_NUMBER}?text=${text}`;
      window.open(url, '_blank');
    } catch (e) {
      console.error('Erro ao abrir WhatsApp:', e);
    }
  };

  // compute dashboard stats from local orders array
  const computeStats = (ordersArr) => {
    try {
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const ordersList = ordersArr || [];
      const todayOrders = ordersList.filter(o => o.createdAt && new Date(o.createdAt) >= new Date(startOfToday));
      const totalToday = todayOrders.reduce((s, o) => s + (Number(o.total || 0) || 0), 0);
      const countToday = todayOrders.length;
      const ticketAverage = countToday ? totalToday / countToday : 0;
      const statusMap = {};
      ordersList.forEach(o => { statusMap[o.status] = (statusMap[o.status] || 0) + 1; });
      const statusSeries = Object.keys(statusMap).map(k => ({ status: k, count: statusMap[k] }));
      const days = [];
      for (let i=6;i>=0;i--) {
        const d = new Date(); d.setDate(d.getDate()-i);
        const key = d.toISOString().slice(0,10);
        days.push({ key, total: 0, date: key });
      }
      ordersList.forEach(o => {
        if (!o.createdAt) return;
        const dateKey = new Date(o.createdAt).toISOString().slice(0,10);
        const day = days.find(dd => dd.key === dateKey);
        if (day) day.total += Number(o.total || 0) || 0;
      });
      const salesSeries = days.map(d => ({ date: d.date, total: d.total }));
      setStats({ totalToday, countToday, ticketAverage, statusSeries, salesSeries });
    } catch (e) {
      console.error('Erro computing stats', e);
    }
  };

  // initial load & realtime subscription
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from(TABLE)
        .select('*')
        .order('createdAt', { ascending: false });

      if (error) {
        console.error('Erro ao buscar pedidos:', error);
        setOrders([]);
        setStats({});
      } else {
        const arr = Array.isArray(data) ? data : [];
        setOrders(arr);
        computeStats(arr);
      }
    } catch (err) {
      console.error('Erro fetchOrders:', err);
      setOrders([]);
      setStats({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuth) return;
    let mounted = true;
    setLoading(true);

    // initial fetch
    fetchOrders();

    // realtime
    const channel = supabase.channel('public:' + TABLE)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: TABLE },
        payload => {
          (async () => {
            try {
              if (payload.eventType === 'INSERT' || payload.event === 'INSERT') {
                const pedido = payload.record || payload.new || null;
                if (pedido) {
                  if ('Notification' in window && Notification.permission === 'granted') {
                    try {
                      new Notification('Novo pedido recebido!', {
                        body: `Pedido #${pedido.id} — ${pedido.total ? `R$ ${Number(pedido.total).toFixed(2)}` : ''}`,
                        tag: pedido.id
                      });
                    } catch (e) {}
                  }
                  if (soundEnabled) playSound();
                  if (mounted) {
                    setShowNewOrderBanner(true);
                    setTimeout(() => setShowNewOrderBanner(false), 5000);
                  }
                }
                // Auto send WhatsApp to motoboy if enabled
                try {
                  if (autoSendWhatsapp && pedido) sendWhatsapp(pedido);
                } catch(e) { console.error('Erro auto-send whatsapp', e); }
              }
              // refresh full list and stats
              if (mounted) await fetchOrders();
            } catch (e) {
              console.error('Erro no handler realtime:', e);
            }
          })();
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      try { channel.unsubscribe(); } catch (e) { try { supabase.removeChannel(channel); } catch(_) {} }
    };
  }, [isAuth, soundEnabled, autoSendWhatsapp]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (passwordInput === ADMIN_PASSWORD) {
      localStorage.setItem('doceeser_admin', '1');
      setIsAuth(true);
    } else {
      alert('Senha incorreta.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('doceeser_admin');
    setIsAuth(false);
  };

  // updateStatus function (inside component)
  const updateStatus = async (orderId, newStatus) => {
    try {
      const normalizedId = String(orderId).trim();
      const { data, error } = await supabase
        .from(TABLE)
        .update({ status: newStatus })
        .eq('id', normalizedId)
        .select()
        .maybeSingle();

      if (error) {
        console.error('Erro ao atualizar status:', error);
        alert('Erro ao atualizar status. Veja o console.');
      } else {
        setOrders(prev => prev.map(o => (String(o.id) === normalizedId ? { ...o, status: newStatus } : o)));
        computeStats((orders || []).map(o => (String(o.id) === normalizedId ? { ...o, status: newStatus } : o)));
      }
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
      alert('Erro ao atualizar status. Veja o console.');
    }
  };

  const filtered = useMemo(() => {
    if (filter === 'all') return orders;
    return orders.filter(o => o.status === filter);
  }, [orders, filter]);

  if (!isAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <form onSubmit={handleLogin} className="w-full max-w-sm bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Painel Admin — Doce É Ser</h2>
          <p className="text-sm text-gray-600 mb-4">Digite a senha para acessar o painel.</p>
          <input type="password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)}
            placeholder="Senha" className="w-full p-2 border rounded mb-4" />
          <div className="flex gap-2">
            <button className="flex-1 bg-amber-700 text-white py-2 rounded">Entrar</button>
            <button type="button" onClick={() => setPasswordInput('')} className="px-4 py-2 border rounded">Limpar</button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">

        <header className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Painel de Pedidos — Doce É Ser</h1>
            <p className="text-sm text-gray-600">Acompanhe pedidos em tempo real.</p>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={()=>setView(prev=> prev==='dashboard' ? 'orders' : 'dashboard')} className="px-3 py-1 bg-blue-600 text-white rounded">
              Status Da Loja
            </button>
            <button onClick={() => setAutoSendWhatsapp(prev => !prev)} className="px-3 py-1 bg-green-600 text-white rounded">
              {autoSendWhatsapp ? 'Auto WhatsApp: ON' : 'Auto WhatsApp: OFF'}
            </button>
            <select value={filter} onChange={e => setFilter(e.target.value)} className="p-2 border rounded bg-white">
              <option value="all">Todos</option>
              <option value="novo">Novo</option>
              <option value="preparando">Preparando</option>
              <option value="pronto">Pronto</option>
              <option value="entregue">Entregue</option>
            </select>
            <button onClick={() => setSoundEnabled(prev => !prev)} className="px-3 py-1 bg-amber-500 text-white rounded">
              {soundEnabled ? '🔕 Desativar som' : '🔔 Ativar alertas'}
            </button>
            <button onClick={handleLogout} className="px-4 py-2 bg-red-600 text-white rounded">Sair</button>
          </div>
        </header>

        {view === 'dashboard' ? (
          <div className="bg-white p-6 rounded shadow mb-6">
            <h2 className="text-xl font-bold mb-4">Dashboard — Status da Loja</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="p-4 rounded border">
                <div className="text-sm text-gray-500">Vendas Hoje</div>
                <div className="text-2xl font-bold">{stats.totalToday ? `R$ ${Number(stats.totalToday).toFixed(2).replace('.',',')}` : 'R$ 0,00'}</div>
              </div>
              <div className="p-4 rounded border">
                <div className="text-sm text-gray-500">Pedidos Hoje</div>
                <div className="text-2xl font-bold">{stats.countToday || 0}</div>
              </div>
              <div className="p-4 rounded border">
                <div className="text-sm text-gray-500">Ticket Médio</div>
                <div className="text-2xl font-bold">{stats.ticketAverage ? `R$ ${Number(stats.ticketAverage).toFixed(2).replace('.',',')}` : 'R$ 0,00'}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded border bg-white">
                <div className="font-semibold mb-2">Pedidos por status</div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={stats.statusSeries || []}>
                    <XAxis dataKey="status" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="p-4 rounded border bg-white">
                <div className="font-semibold mb-2">Vendas últimos 7 dias</div>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={stats.salesSeries || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="total" stroke="#8884d8" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        ) : null}

        {showNewOrderBanner && (
          <div className="mb-4 p-4 bg-amber-600 text-white font-semibold rounded-lg shadow animate-pulse text-center">
            🔔 Novo pedido chegando!
          </div>
        )}

        <main>
          {loading ? (
            <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin" /></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filtered.length === 0 ? (
                <div className="col-span-full bg-white p-6 rounded shadow text-center">Nenhum pedido encontrado.</div>
              ) : filtered.map(order => (
                <div key={order.id} className="bg-white p-4 rounded shadow">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold">Pedido: <span className="text-amber-600">{order.id}</span></div>
                      <div className="text-sm text-gray-600">Status: <strong>{STATUS_LABELS[order.status] || order.status}</strong></div>
                      <div className="text-xs text-gray-500">
                        Criado: {order.createdAt ? (new Date(order.createdAt).toLocaleString()) : ''}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">
                        {order.total ? `R$ ${Number(order.total).toFixed(2).replace('.',',')}` : ''}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 text-sm text-gray-700">
                    <div className="font-semibold">Cliente</div>
                    <div>{order.customer?.nome || '—'}</div>
                    <div className="text-xs text-gray-500">{order.customer?.telefone || ''}</div>
                    <div className="text-xs text-gray-500">
                      {order.customer?.rua ? `${order.customer.rua}, ${order.customer.numero || ''} — ${order.customer.bairro || ''}` : ''}
                    </div>
                  </div>

                  <div className="mt-3 text-sm">
                    <div className="font-semibold">Itens</div>
                    <ul className="list-disc ml-5 text-xs text-gray-700">
                      {Array.isArray(order.items) ? order.items.map((it, idx) => (
                        <li key={idx}>{(it.quantity || 1)}x {it.name} {it.toppings ? `(+${it.toppings.join(', ')})` : ''}</li>
                      )) : <li>—</li>}
                    </ul>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button onClick={() => updateStatus(String(order.id), 'preparando')} className="px-3 py-1 bg-amber-500 text-white rounded">Preparando</button>
                    <button onClick={() => updateStatus(String(order.id), 'pronto')} className="px-3 py-1 bg-green-600 text-white rounded">Pronto</button>
                    <button onClick={() => updateStatus(String(order.id), 'entregue')} className="px-3 py-1 bg-gray-600 text-white rounded">Entregue</button>
                    <button onClick={() => sendWhatsapp(order)} className="px-3 py-1 bg-indigo-600 text-white rounded">Chamar motoboy</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>

      </div>
    </div>
  );
}
