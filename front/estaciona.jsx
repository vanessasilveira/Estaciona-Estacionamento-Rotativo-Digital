import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Car,
  Clock,
  Check,
  CreditCard,
  Award,
  Info,
  ArrowLeft,
  Plus,
  Minus,
  CheckCircle2,
  ShieldCheck,
  Navigation,
  Sparkles,
  User,
  Lock,
  Mail,
  Phone,
  FileText,
  Timer,
  QrCode,
  Copy
} from 'lucide-react';

// ============================================================================
// DADOS FIXOS DAS RUAS (O TEMPO DE PERMANÊNCIA É DEFINIDO PELA RUA ESCOLHIDA)
// ============================================================================
const INITIAL_STREETS = [
  {
    id: 1,
    name: 'Rua 1',
    zone: 'Zona Central • Av. Principal',
    durationHours: 2
  },
  {
    id: 2,
    name: 'Rua 2',
    zone: 'Centro Comercial • Praça da Matriz',
    durationHours: 3
  },
  {
    id: 3,
    name: 'Rua 3',
    zone: 'Setor Bancário • Rua do Comércio',
    durationHours: 4
  },
  {
    id: 4,
    name: 'Rua 4',
    zone: 'Bairro Residencial • Av. Getúlio Vargas',
    durationHours: 5
  },
  {
    id: 5,
    name: 'Rua 5',
    zone: 'Zona Afastada • Largo da Estação',
    durationHours: 6
  }
];

const HOURLY_RATE = 2.5;
const POINTS_DISCOUNT_COST = 100;
const POINTS_DISCOUNT_VALUE = 2.0;

// ============================================================================
// COMPONENTE DO LOGOTIPO "ESTACIONA"
// ============================================================================
const EstacionaLogo = ({ size = 'lg' }) => {
  return (
    <div className="inline-flex items-center justify-center select-none">
      <div
        className={`font-black tracking-tight text-blue-950 flex items-center ${
          size === 'lg' ? 'text-3xl' : 'text-xl'
        }`}
      >
        <span>Estaci</span>
        <span
          className={`inline-flex flex-col items-center justify-center rounded-full border-[3px] border-blue-700 bg-blue-900 text-white mx-0.5 shadow-sm relative ${
            size === 'lg' ? 'w-9 h-9 text-lg' : 'w-6 h-6 text-[11px]'
          }`}
        >
          <span className="font-extrabold leading-none">E</span>
        </span>
        <span>na</span>
      </div>
    </div>
  );
};

// ============================================================================
// COMPONENTE PRINCIPAL DO PROTÓTIPO
// ============================================================================
export default function App() {
  // Navegação entre as 6 telas do wireframe
  const [currentScreen, setCurrentScreen] = useState('login');

  // Dados do usuário (inicia com 200 pontos)
  const [user, setUser] = useState({
    name: 'Carlos Silva',
    email: 'carlos.silva@email.com',
    cpf: '123.456.789-00',
    phone: '(37) 99842-1109',
    cep: '35600-000',
    points: 200
  });

  // Lista de ruas disponíveis
  const [streets] = useState(INITIAL_STREETS);
  const [selectedStreetId, setSelectedStreetId] = useState(1);

  // Veículos cadastrados
  const [vehicles, setVehicles] = useState([
    {
      id: 1,
      modelColor: 'Onix Plus Prata',
      plate: 'RTA2E49',
      holderName: 'Carlos Silva',
      holderPhone: '(37) 99842-1109',
      holderCpf: '123.456.789-00',
      holderEmail: 'carlos.silva@email.com',
      holderCep: '35600-000'
    }
  ]);
  const [selectedVehicleId, setSelectedVehicleId] = useState(1);

  // Formulário de Login
  const [loginForm, setLoginForm] = useState({
    login: 'carlos.silva@email.com',
    password: '••••••••'
  });

  // Formulário de Cadastro de Usuário
  const [regForm, setRegForm] = useState({
    name: '',
    cpf: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    cep: ''
  });

  // Formulário de Cadastro de Veículo
  const [vehicleForm, setVehicleForm] = useState({
    modelColor: '',
    plate: '',
    holderName: 'Carlos Silva',
    holderPhone: '(37) 99842-1109',
    holderCpf: '123.456.789-00',
    holderEmail: 'carlos.silva@email.com',
    holderCep: '35600-000'
  });

  // Estados da Tela Finalizar Compra
  const [quantity, setQuantity] = useState(1);
  const [usePoints, setUsePoints] = useState(false);

  // Estados da Tela de Pagamento (Pix ou Cartão)
  const [paymentMethod, setPaymentMethod] = useState('pix'); // 'pix' | 'card'
  const [savedCards, setSavedCards] = useState([]); // Inicia vazio para exibir o cadastro de cartão
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [showCardForm, setShowCardForm] = useState(false);
  const [cardForm, setCardForm] = useState({
    number: '',
    holder: '',
    expiry: '',
    cvv: ''
  });
  const [pixCode, setPixCode] = useState('');

  // Ticket ativo & cronômetro
  const [activeTicket, setActiveTicket] = useState(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  // Notificação interna (toast)
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3200);
  };

  // Cronômetro regressivo para o ticket ativo
  useEffect(() => {
    if (!activeTicket || remainingSeconds <= 0) return;
    const interval = setInterval(() => {
      setRemainingSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [activeTicket, remainingSeconds]);

  const formatCountdown = (totalSecs) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(
      secs
    ).padStart(2, '0')}`;
  };

  // Rua e veículo atualmente selecionados
  const selectedStreet =
    streets.find((s) => s.id === selectedStreetId) || streets[0];
  const selectedVehicle =
    vehicles.find((v) => v.id === selectedVehicleId) || vehicles[0];

  // Tempo de permanência automático definido pela rua selecionada
  const automaticDurationHours = selectedStreet.durationHours;

  // Cálculo financeiro
  const subtotal = automaticDurationHours * HOURLY_RATE * quantity;
  const discount =
    usePoints && user.points >= POINTS_DISCOUNT_COST
      ? Math.min(POINTS_DISCOUNT_VALUE, subtotal)
      : 0;
  const finalTotal = Math.max(0, subtotal - discount);

  // Handlers de ações
  const handleLoginSubmit = (e) => {
    e.preventDefault();
    if (!loginForm.login.trim()) {
      showToast('Informe seu login ou e-mail para entrar.', 'error');
      return;
    }
    showToast(`Bem-vindo de volta, ${user.name}!`);
    setCurrentScreen('home');
  };

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    if (!regForm.name.trim() || !regForm.email.trim()) {
      showToast('Preencha pelo menos Nome e E-mail.', 'error');
      return;
    }
    if (regForm.password !== regForm.confirmPassword) {
      showToast('As senhas digitadas não conferem.', 'error');
      return;
    }
    setUser({
      ...user,
      name: regForm.name,
      email: regForm.email,
      cpf: regForm.cpf || '000.000.000-00',
      phone: regForm.phone || '(37) 99999-9999',
      cep: regForm.cep || '35600-000',
      points: 200
    });
    showToast('Cadastro concluído! Você iniciou com 200 pontos.');
    setCurrentScreen('home');
  };

  const handleAddVehicle = (e) => {
    e.preventDefault();
    if (!vehicleForm.modelColor.trim() || !vehicleForm.plate.trim()) {
      showToast('Informe o modelo/cor e a placa do veículo.', 'error');
      return;
    }
    const cleanPlate = vehicleForm.plate.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const newVeh = {
      id: Date.now(),
      modelColor: vehicleForm.modelColor,
      plate: cleanPlate || 'ABC1D23',
      holderName: vehicleForm.holderName || user.name,
      holderPhone: vehicleForm.holderPhone || user.phone,
      holderCpf: vehicleForm.holderCpf || user.cpf,
      holderEmail: vehicleForm.holderEmail || user.email,
      holderCep: vehicleForm.holderCep || user.cep
    };
    setVehicles((prev) => [newVeh, ...prev]);
    setSelectedVehicleId(newVeh.id);
    setVehicleForm({
      ...vehicleForm,
      modelColor: '',
      plate: ''
    });
    showToast(`Veículo ${newVeh.plate} cadastrado com sucesso!`);
    setCurrentScreen('home');
  };

  const generatePixPayload = (amount) => {
    const cents = Math.round(amount * 100);
    const rand = Math.floor(10000000 + Math.random() * 90000000);
    return `00020126580014BR.GOV.BCB.PIX0136estaciona-rotativo-${rand}5204000053039865406${(
      cents / 100
    ).toFixed(2)}5802BR5913ESTACIONA APP6009SAO PAULO62070503***6304E4A1`;
  };

  const handleGoToPayment = () => {
    setActiveTicket(null);
    setPixCode(generatePixPayload(finalTotal));
    setShowCardForm(savedCards.length === 0);
    setCurrentScreen('payment');
  };

  const handleSaveCard = (e) => {
    e.preventDefault();
    const digits = cardForm.number.replace(/\D/g, '');
    if (digits.length < 4 || !cardForm.holder.trim() || !cardForm.expiry.trim() || cardForm.cvv.length < 3) {
      showToast('Preencha todos os dados válidos do cartão.', 'error');
      return;
    }
    const newCard = {
      id: Date.now(),
      last4: digits.slice(-4),
      holder: cardForm.holder.toUpperCase(),
      expiry: cardForm.expiry,
      brand: digits.startsWith('4') ? 'Visa' : 'Mastercard'
    };
    setSavedCards((prev) => [newCard, ...prev]);
    setSelectedCardId(newCard.id);
    setShowCardForm(false);
    setCardForm({ number: '', holder: '', expiry: '', cvv: '' });
    showToast(`Cartão finalizado em •••• ${newCard.last4} cadastrado!`);
  };

  const handleFinalizePurchase = () => {
    if (paymentMethod === 'card' && savedCards.length === 0) {
      showToast('Cadastre um cartão antes de concluir o pagamento.', 'error');
      setShowCardForm(true);
      return;
    }

    const activeCard = savedCards.find((c) => c.id === selectedCardId) || savedCards[0];

    setUser((prev) => ({
      ...prev,
      points:
        usePoints && prev.points >= POINTS_DISCOUNT_COST
          ? prev.points - POINTS_DISCOUNT_COST + 30
          : prev.points + 30
    }));

    const newTicket = {
      code: `EST-${Math.floor(100000 + Math.random() * 900000)}`,
      streetName: selectedStreet.name,
      durationHours: automaticDurationHours,
      quantity,
      vehicleLabel: selectedVehicle
        ? `${selectedVehicle.modelColor} (${selectedVehicle.plate})`
        : 'Veículo Cadastrado',
      paymentLabel:
        paymentMethod === 'pix'
          ? 'Pix Instantâneo'
          : `Cartão ${activeCard.brand} •••• ${activeCard.last4}`,
      totalPaid: finalTotal
    };

    setActiveTicket(newTicket);
    setRemainingSeconds(automaticDurationHours * 3600);
    setUsePoints(false);
    setCurrentScreen('checkout');
  };

  const navTabs = [
    { id: 'login', label: '1. Login' },
    { id: 'register', label: '2. Cadastro' },
    { id: 'home', label: '3. Tela Inicial' },
    { id: 'vehicle', label: '4. Veículo' },
    { id: 'mapBuy', label: '5. Pontos GPS' },
    { id: 'checkout', label: '6. Resumo' },
    { id: 'payment', label: '7. Pagamento' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex flex-col items-center justify-center p-3 sm:p-6 font-sans">
      {/* BARRA SUPERIOR DE NAVEGAÇÃO RÁPIDA ENTRE AS TELAS DO PROTÓTIPO */}
      <div className="w-full max-w-2xl mb-4 bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-2 flex flex-wrap items-center justify-center gap-1.5 shadow-xl">
        {navTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setActiveTicket(null);
              setCurrentScreen(tab.id);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              currentScreen === tab.id
                ? 'bg-blue-600 text-white shadow-md scale-[1.02]'
                : 'text-slate-200 hover:bg-white/10'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* MOLDURA DO SMARTPHONE */}
      <div className="relative w-full max-w-[390px] h-[760px] bg-slate-950 rounded-[48px] p-3 shadow-[0_25px_70px_-15px_rgba(0,0,0,0.85)] border-[4px] border-slate-800 flex flex-col">
        {/* TELA INTERNA DO SMARTPHONE */}
        <div className="relative w-full h-full bg-slate-50 rounded-[38px] overflow-hidden flex flex-col">
          {/* Status Bar com horário 11:20 */}
          <div className="w-full bg-white pt-2 pb-1.5 px-6 flex items-center justify-between text-[11px] font-extrabold text-slate-800 z-20 shrink-0">
            <span>11:20</span>
            <div className="w-24 h-5 bg-slate-950 rounded-full flex items-center justify-end px-2">
              <div className="w-2 h-2 rounded-full bg-blue-500/70" />
            </div>
            <div className="flex items-center gap-1 text-[10px] text-slate-700">
              <span>5G</span>
              <div className="w-4 h-2.5 border border-slate-700 rounded-[3px] p-[1px] flex items-center">
                <div className="w-full h-full bg-emerald-500 rounded-[1px]" />
              </div>
            </div>
          </div>

          {/* Notificação Toast Interna */}
          {toast && (
            <div
              className={`mx-4 mt-2 px-3.5 py-2.5 rounded-xl text-xs font-bold shadow-lg flex items-center gap-2 z-30 animate-bounce ${
                toast.type === 'error'
                  ? 'bg-rose-600 text-white'
                  : 'bg-emerald-600 text-white'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{toast.message}</span>
            </div>
          )}

          {/* CONTEÚDO ROLÁVEL DA TELA ATIVA */}
          <div className="flex-1 overflow-y-auto flex flex-col">
            {/* --------------------------------------------------------------
                TELA 1: TELA LOGIN
               -------------------------------------------------------------- */}
            {currentScreen === 'login' && (
              <div className="flex-1 bg-white px-6 py-6 flex flex-col justify-between">
                <div className="text-center mt-4">
                  <EstacionaLogo size="lg" />
                  <p className="text-xs font-medium text-slate-500 mt-1.5">
                    Estacionamento Rotativo Digital
                  </p>
                </div>

                <form onSubmit={handleLoginSubmit} className="space-y-4 my-auto">
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1">
                      Login
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        value={loginForm.login}
                        onChange={(e) =>
                          setLoginForm({ ...loginForm, login: e.target.value })
                        }
                        placeholder="Digite seu e-mail ou CPF"
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-blue-700 focus:bg-white transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1">
                      Senha
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="password"
                        value={loginForm.password}
                        onChange={(e) =>
                          setLoginForm({ ...loginForm, password: e.target.value })
                        }
                        placeholder="••••••••"
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-blue-700 focus:bg-white transition"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-0.5">
                    <button
                      type="button"
                      onClick={() =>
                        showToast('Link de recuperação enviado para seu e-mail!')
                      }
                      className="text-xs font-semibold text-slate-500 hover:text-blue-700 underline cursor-pointer"
                    >
                      Esqueci a senha
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentScreen('register')}
                      className="text-xs font-extrabold text-blue-800 hover:text-blue-950 cursor-pointer"
                    >
                      Cadastrar
                    </button>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-blue-800 hover:bg-blue-900 active:scale-[0.99] text-white font-extrabold rounded-xl shadow-md transition cursor-pointer text-sm"
                  >
                    Entrar
                  </button>
                </form>

                {/* Ícones Sociais Inferiores (Google, E-mail, Facebook conforme esboço) */}
                <div className="pb-3">
                  <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-slate-200" />
                    <span className="flex-shrink mx-3 text-[11px] font-semibold text-slate-400">
                      ou acesse com
                    </span>
                    <div className="flex-grow border-t border-slate-200" />
                  </div>
                  <div className="flex items-center justify-center gap-4 mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        showToast('Login realizado via Google!');
                        setCurrentScreen('home');
                      }}
                      className="w-11 h-11 rounded-full border border-slate-300 bg-white hover:bg-slate-50 flex items-center justify-center font-black text-base text-rose-600 shadow-xs cursor-pointer"
                      title="Entrar com Google"
                    >
                      G
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        showToast('Login realizado via E-mail!');
                        setCurrentScreen('home');
                      }}
                      className="w-11 h-11 rounded-full border border-slate-300 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-700 shadow-xs cursor-pointer"
                      title="Entrar com E-mail"
                    >
                      <Mail className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        showToast('Login realizado via Facebook!');
                        setCurrentScreen('home');
                      }}
                      className="w-11 h-11 rounded-full border border-slate-300 bg-white hover:bg-slate-50 flex items-center justify-center font-black text-base text-blue-700 shadow-xs cursor-pointer"
                      title="Entrar com Facebook"
                    >
                      f
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* --------------------------------------------------------------
                TELA 2: CADASTRO
               -------------------------------------------------------------- */}
            {currentScreen === 'register' && (
              <div className="flex-1 bg-white px-5 py-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <button
                      type="button"
                      onClick={() => setCurrentScreen('login')}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <div>
                      <h2 className="text-base font-black text-slate-900">
                        Cadastro
                      </h2>
                      <p className="text-[11px] text-slate-500">
                        Crie sua conta e ganhe 200 pontos iniciais
                      </p>
                    </div>
                  </div>

                  <form
                    id="register-form"
                    onSubmit={handleRegisterSubmit}
                    className="space-y-2.5"
                  >
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                        Nome
                      </label>
                      <input
                        type="text"
                        value={regForm.name}
                        onChange={(e) =>
                          setRegForm({ ...regForm, name: e.target.value })
                        }
                        placeholder="Nome completo"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-blue-700 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                        CPF
                      </label>
                      <input
                        type="text"
                        value={regForm.cpf}
                        onChange={(e) =>
                          setRegForm({ ...regForm, cpf: e.target.value })
                        }
                        placeholder="000.000.000-00"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-blue-700 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                        E-mail
                      </label>
                      <input
                        type="email"
                        value={regForm.email}
                        onChange={(e) =>
                          setRegForm({ ...regForm, email: e.target.value })
                        }
                        placeholder="seuemail@exemplo.com"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-blue-700 focus:bg-white"
                      />
                    </div>

                    {/* Senha / Conf. Senha lado a lado conforme esboço */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                          Senha
                        </label>
                        <input
                          type="password"
                          value={regForm.password}
                          onChange={(e) =>
                            setRegForm({ ...regForm, password: e.target.value })
                          }
                          placeholder="••••••"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-blue-700 focus:bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                          Conf. senha
                        </label>
                        <input
                          type="password"
                          value={regForm.confirmPassword}
                          onChange={(e) =>
                            setRegForm({
                              ...regForm,
                              confirmPassword: e.target.value
                            })
                          }
                          placeholder="••••••"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-blue-700 focus:bg-white"
                        />
                      </div>
                    </div>

                    {/* Tel / CEP lado a lado conforme esboço */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                          Tel
                        </label>
                        <input
                          type="text"
                          value={regForm.phone}
                          onChange={(e) =>
                            setRegForm({ ...regForm, phone: e.target.value })
                          }
                          placeholder="(37) 99999-9999"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-blue-700 focus:bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                          CEP
                        </label>
                        <input
                          type="text"
                          value={regForm.cep}
                          onChange={(e) =>
                            setRegForm({ ...regForm, cep: e.target.value })
                          }
                          placeholder="35600-000"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-blue-700 focus:bg-white"
                        />
                      </div>
                    </div>
                  </form>
                </div>

                {/* Botões Cancelar / Cadastrar no rodapé */}
                <div className="grid grid-cols-2 gap-2.5 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setCurrentScreen('login')}
                    className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold rounded-xl text-xs transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    form="register-form"
                    className="py-2.5 bg-blue-800 hover:bg-blue-900 text-white font-extrabold rounded-xl text-xs shadow-sm transition cursor-pointer"
                  >
                    Cadastrar
                  </button>
                </div>
              </div>
            )}

            {/* --------------------------------------------------------------
                TELA 3: TELA INICIAL (RUAS COM TEMPO AUTOMÁTICO + REGRAS)
               -------------------------------------------------------------- */}
            {currentScreen === 'home' && (
              <div className="flex-1 bg-slate-50 flex flex-col justify-between">
                {/* Topo com Logo e Indicador de Pontos */}
                <div className="bg-white px-4 py-2.5 border-b border-slate-200/80 flex items-center justify-between">
                  <EstacionaLogo size="sm" />
                  <div className="flex items-center gap-2">
                    <div className="bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full flex items-center gap-1">
                      <Award className="w-3.5 h-3.5 text-amber-600" />
                      <span className="text-[11px] font-extrabold text-amber-900">
                        Pontos: {user.points}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Banner de Ticket Ativo (se já houver compra concluída) */}
                {activeTicket && remainingSeconds > 0 && (
                  <div className="mx-4 mt-2.5 bg-emerald-600 text-white p-2.5 rounded-2xl shadow-md flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-100">
                        <Timer className="w-3.5 h-3.5 animate-pulse" />
                        <span>
                          Ativo • {activeTicket.streetName} ({activeTicket.durationHours}h)
                        </span>
                      </div>
                      <p className="text-sm font-black mt-0.5">
                        Tempo restante: {formatCountdown(remainingSeconds)}
                      </p>
                    </div>
                    <span className="px-2 py-0.5 bg-white/20 rounded-lg text-[11px] font-bold">
                      Regular
                    </span>
                  </div>
                )}

                {/* Lista Interativa das 5 Ruas */}
                <div className="px-4 pt-2.5 flex-1">
                  <div className="flex items-center justify-between mb-1.5">
                    <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                      Escolha a rua onde vai estacionar
                    </h3>
                    <button
                      type="button"
                      onClick={() => setCurrentScreen('mapBuy')}
                      className="text-[11px] font-bold text-blue-700 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <MapPin className="w-3 h-3" /> Ver pontos
                    </button>
                  </div>

                  <div className="space-y-2">
                    {streets.map((street) => {
                      const isSelected = selectedStreetId === street.id;

                      return (
                        <div
                          key={street.id}
                          onClick={() => setSelectedStreetId(street.id)}
                          className={`p-2.5 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? 'bg-blue-50 border-blue-700 shadow-xs'
                              : 'bg-white border-slate-200 hover:border-blue-300'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            {/* Etiqueta informativa do tempo fixo daquela rua (2h a 6h) */}
                            <div
                              className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center font-black shrink-0 ${
                                isSelected
                                  ? 'bg-blue-800 text-white'
                                  : 'bg-slate-100 text-blue-900'
                              }`}
                            >
                              <span className="text-xs leading-none">
                                {street.durationHours}h
                              </span>
                              <span className="text-[8px] font-bold uppercase opacity-80 mt-0.5">
                                fixo
                              </span>
                            </div>

                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-extrabold text-sm text-slate-900">
                                  {street.name}
                                </span>
                                <span
                                  className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${
                                    isSelected
                                      ? 'text-blue-900 bg-blue-100/80 border-blue-300'
                                      : 'text-slate-700 bg-slate-100 border-slate-200'
                                  }`}
                                >
                                  Permanência: {street.durationHours}h
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                {street.zone}
                              </p>
                            </div>
                          </div>

                          {/* Caixinha de seleção (checkbox de escolha única) */}
                          <div
                            className={`w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 transition ${
                              isSelected
                                ? 'bg-blue-800 border-blue-800 text-white'
                                : 'border-slate-300 bg-white'
                            }`}
                          >
                            {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Quadro: Regras do Estacionamento Rotativo */}
                  <div className="mt-2.5 bg-blue-950/5 border border-blue-200 rounded-xl p-2.5">
                    <div className="flex items-center gap-1.5 text-blue-900 font-extrabold text-[11px] mb-1">
                      <Info className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                      <span>// Exibindo Regras do estacionamento rotativo</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-snug">
                      O tempo máximo de permanência é definido{' '}
                      <strong className="text-slate-800">
                        automaticamente pela rua
                      </strong>{' '}
                      selecionada (de <strong>2h na Rua 1</strong> até{' '}
                      <strong>6h na Rua 5</strong>, conforme a distância do
                      centro). Tarifa: R$ 2,50/hora.
                    </p>
                  </div>
                </div>

                {/* Rodapé com Botões "Veículos" e "Comprar" */}
                <div className="p-3.5 bg-white border-t border-slate-200 grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setCurrentScreen('vehicle')}
                    className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <Car className="w-4 h-4 text-blue-800" />
                    <span>Veículos ({vehicles.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTicket(null);
                      setCurrentScreen('checkout');
                    }}
                    className="py-2.5 px-3 bg-blue-800 hover:bg-blue-900 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Comprar</span>
                  </button>
                </div>
              </div>
            )}

            {/* --------------------------------------------------------------
                TELA 4: CADASTRAR VEÍCULO
               -------------------------------------------------------------- */}
            {currentScreen === 'vehicle' && (
              <div className="flex-1 bg-white px-4 py-3.5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setCurrentScreen('home')}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </button>
                      <h2 className="text-base font-black text-slate-900">
                        Cadastrar Veículo
                      </h2>
                    </div>
                  </div>

                  {/* Veículos já salvos */}
                  <div className="mb-3">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                      Veículo ativo para estacionamento
                    </span>
                    <div className="space-y-1.5 max-h-24 overflow-y-auto pr-0.5">
                      {vehicles.map((veh) => (
                        <div
                          key={veh.id}
                          onClick={() => setSelectedVehicleId(veh.id)}
                          className={`px-3 py-2 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                            selectedVehicleId === veh.id
                              ? 'bg-blue-50 border-blue-700'
                              : 'bg-slate-50 border-slate-200'
                          }`}
                        >
                          <div>
                            <p className="text-xs font-extrabold text-slate-900">
                              {veh.modelColor}
                            </p>
                            <p className="text-[10px] text-slate-500">
                              Titular: {veh.holderName}
                            </p>
                          </div>
                          {/* Placa estilo Mercosul */}
                          <div className="border-2 border-slate-800 rounded-md overflow-hidden bg-white shadow-2xs">
                            <div className="bg-blue-800 text-white text-[7px] font-bold px-1.5 text-center leading-tight">
                              BRASIL
                            </div>
                            <div className="px-2 py-0.5 text-[11px] font-black tracking-wider text-slate-900">
                              {veh.plate}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Formulário Novo Veículo + Titular do Veículo */}
                  <form
                    id="vehicle-form"
                    onSubmit={handleAddVehicle}
                    className="space-y-2 border-t border-slate-200 pt-2.5"
                  >
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                          Modelo e cor
                        </label>
                        <input
                          type="text"
                          value={vehicleForm.modelColor}
                          onChange={(e) =>
                            setVehicleForm({
                              ...vehicleForm,
                              modelColor: e.target.value
                            })
                          }
                          placeholder="Ex: HB20 Branco"
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-blue-700"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                          Placa
                        </label>
                        <input
                          type="text"
                          maxLength={7}
                          value={vehicleForm.plate}
                          onChange={(e) =>
                            setVehicleForm({
                              ...vehicleForm,
                              plate: e.target.value.toUpperCase()
                            })
                          }
                          placeholder="ABC1D23"
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold uppercase focus:outline-none focus:border-blue-700"
                        />
                      </div>
                    </div>

                    <div className="pt-1">
                      <h3 className="text-xs font-black text-blue-950 border-b border-slate-200 pb-1 mb-2">
                        Titular do Veículo
                      </h3>
                      <div className="space-y-1.5">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600">
                            Nome
                          </label>
                          <input
                            type="text"
                            value={vehicleForm.holderName}
                            onChange={(e) =>
                              setVehicleForm({
                                ...vehicleForm,
                                holderName: e.target.value
                              })
                            }
                            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-600">
                              Tel
                            </label>
                            <input
                              type="text"
                              value={vehicleForm.holderPhone}
                              onChange={(e) =>
                                setVehicleForm({
                                  ...vehicleForm,
                                  holderPhone: e.target.value
                                })
                              }
                              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-600">
                              CPF
                            </label>
                            <input
                              type="text"
                              value={vehicleForm.holderCpf}
                              onChange={(e) =>
                                setVehicleForm({
                                  ...vehicleForm,
                                  holderCpf: e.target.value
                                })
                              }
                              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-600">
                              E-mail
                            </label>
                            <input
                              type="email"
                              value={vehicleForm.holderEmail}
                              onChange={(e) =>
                                setVehicleForm({
                                  ...vehicleForm,
                                  holderEmail: e.target.value
                                })
                              }
                              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-600">
                              CEP
                            </label>
                            <input
                              type="text"
                              value={vehicleForm.holderCep}
                              onChange={(e) =>
                                setVehicleForm({
                                  ...vehicleForm,
                                  holderCep: e.target.value
                                })
                              }
                              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </form>
                </div>

                {/* Botões Inferiores do Cadastro de Veículo */}
                <div className="grid grid-cols-2 gap-2.5 pt-2.5 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setCurrentScreen('home')}
                    className="py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold rounded-xl text-xs cursor-pointer"
                  >
                    Voltar
                  </button>
                  <button
                    type="submit"
                    form="vehicle-form"
                    className="py-2 bg-blue-800 hover:bg-blue-900 text-white font-extrabold rounded-xl text-xs shadow-sm cursor-pointer"
                  >
                    Salvar Veículo
                  </button>
                </div>
              </div>
            )}

            {/* --------------------------------------------------------------
                TELA 5: PONTOS DE ESTACIONAMENTO (PINS DE LOCALIZAÇÃO GPS)
               -------------------------------------------------------------- */}
            {currentScreen === 'mapBuy' && (
              <div className="flex-1 bg-slate-50 flex flex-col justify-between">
                <div>
                  <div className="bg-white px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setCurrentScreen('home')}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </button>
                      <div>
                        <h2 className="text-sm font-black text-slate-900">
                          Selecionar Ponto / Rua
                        </h2>
                        <p className="text-[10px] text-slate-500">
                          O tempo de permanência segue a rua escolhida
                        </p>
                      </div>
                    </div>
                    <Navigation className="w-4 h-4 text-blue-700" />
                  </div>

                  {/* Lista vertical com pins de localização */}
                  <div className="p-4 space-y-2.5">
                    {streets.map((street) => {
                      const isSelected = selectedStreetId === street.id;
                      return (
                        <div
                          key={street.id}
                          onClick={() => setSelectedStreetId(street.id)}
                          className={`p-3 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? 'bg-blue-50 border-blue-700 shadow-xs'
                              : 'bg-white border-slate-200 hover:border-blue-300'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                                isSelected
                                  ? 'bg-blue-800 text-white shadow-sm'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              <MapPin className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-extrabold text-sm text-slate-900">
                                  {street.name}
                                </span>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-700">
                                  {street.durationHours}h fixo
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500">
                                {street.zone}
                              </p>
                            </div>
                          </div>

                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              isSelected
                                ? 'border-blue-800 bg-blue-800 text-white'
                                : 'border-slate-300'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Resumo inferior do ponto escolhido */}
                <div className="p-4 bg-white border-t border-slate-200 space-y-2.5">
                  <div className="flex items-center justify-between bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
                    <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-blue-800" />
                      Permanência na {selectedStreet.name}:
                    </span>
                    <span className="text-xs font-black text-blue-900 bg-blue-100 px-2.5 py-1 rounded-lg">
                      {automaticDurationHours} horas (automático)
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTicket(null);
                      setCurrentScreen('checkout');
                    }}
                    className="w-full py-3 bg-blue-800 hover:bg-blue-900 text-white font-extrabold rounded-xl text-xs shadow-md transition cursor-pointer"
                  >
                    Prosseguir para Resumo ({selectedStreet.name} • {automaticDurationHours}h)
                  </button>
                </div>
              </div>
            )}

            {/* --------------------------------------------------------------
                TELA 6: RESUMO DA COMPRA (ANTES DO PAGAMENTO)
               -------------------------------------------------------------- */}
            {currentScreen === 'checkout' && !activeTicket && (
              <div className="flex-1 bg-white px-5 py-4 flex flex-col justify-between">
                <div>
                  {/* Cabeçalho com "Pontos: 200" no canto superior direito */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setCurrentScreen('home')}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </button>
                      <h2 className="text-lg font-black text-slate-900">
                        Finalizar
                      </h2>
                    </div>

                    <div className="bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full flex items-center gap-1">
                      <Award className="w-3.5 h-3.5 text-amber-600" />
                      <span className="text-[11px] font-extrabold text-amber-900">
                        Pontos: {user.points}
                      </span>
                    </div>
                  </div>

                  {/* Detalhes da Compra */}
                  <div className="mt-4 space-y-3">
                    {/* Rua */}
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">
                        Rua selecionada
                      </span>
                      <span className="text-sm font-black text-slate-900">
                        {selectedStreet.name}
                      </span>
                      <span className="text-[11px] text-slate-500 block">
                        {selectedStreet.zone}
                      </span>
                    </div>

                    {/* Veículo vinculado */}
                    <div className="bg-slate-50 px-3 py-2 rounded-xl border border-slate-200/80 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">
                          Veículo
                        </span>
                        <span className="text-xs font-extrabold text-slate-800">
                          {selectedVehicle
                            ? `${selectedVehicle.modelColor} • ${selectedVehicle.plate}`
                            : 'Nenhum veículo'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCurrentScreen('vehicle')}
                        className="text-[11px] font-bold text-blue-700 hover:underline cursor-pointer"
                      >
                        Trocar
                      </button>
                    </div>

                    {/* Quantidade (Quant.) */}
                    <div className="flex items-center justify-between bg-slate-50 px-3 py-2.5 rounded-xl border border-slate-200/80">
                      <span className="text-xs font-extrabold text-slate-700">
                        Quant.:
                      </span>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                          className="w-7 h-7 rounded-lg bg-white border border-slate-300 flex items-center justify-center text-slate-700 hover:bg-slate-100 cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-sm font-black text-slate-900 w-4 text-center">
                          {quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => setQuantity((q) => Math.min(5, q + 1))}
                          className="w-7 h-7 rounded-lg bg-white border border-slate-300 flex items-center justify-center text-slate-700 hover:bg-slate-100 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Tempo definido automaticamente pela rua selecionada */}
                    <div className="flex items-center justify-between bg-blue-50/70 px-3 py-2.5 rounded-xl border border-blue-200">
                      <div>
                        <span className="text-xs font-extrabold text-slate-800 block">
                          Tempo:
                        </span>
                        <span className="text-[10px] font-semibold text-blue-800">
                          Definido pela {selectedStreet.name}
                        </span>
                      </div>
                      <span className="px-3 py-1 bg-blue-800 text-white font-black text-xs rounded-lg shadow-2xs">
                        {automaticDurationHours}h ({automaticDurationHours * quantity}h total)
                      </span>
                    </div>

                    {/* Checkbox: "Usar os pontos..." */}
                    <div
                      onClick={() => {
                        if (user.points < POINTS_DISCOUNT_COST) {
                          showToast('Você precisa de pelo menos 100 pontos.', 'error');
                          return;
                        }
                        setUsePoints(!usePoints);
                      }}
                      className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                        usePoints
                          ? 'bg-amber-50 border-amber-400'
                          : 'bg-slate-50 border-slate-200 hover:border-amber-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                        <div>
                          <span className="text-xs font-extrabold text-slate-800 block">
                            Usar os pontos...
                          </span>
                          <span className="text-[10px] text-slate-500">
                            Resgatar {POINTS_DISCOUNT_COST} pts (-R${' '}
                            {POINTS_DISCOUNT_VALUE.toFixed(2).replace('.', ',')})
                          </span>
                        </div>
                      </div>

                      <div
                        className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition ${
                          usePoints
                            ? 'bg-amber-500 border-amber-500 text-white'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {usePoints && <Check className="w-4 h-4 stroke-[3]" />}
                      </div>
                    </div>

                    {/* Total */}
                    <div className="pt-2 border-t border-slate-200 flex items-baseline justify-between">
                      <span className="text-sm font-black text-slate-700">
                        Total:
                      </span>
                      <div className="text-right">
                        {discount > 0 && (
                          <span className="text-[11px] line-through text-slate-400 mr-2">
                            R$ {subtotal.toFixed(2).replace('.', ',')}
                          </span>
                        )}
                        <span className="text-2xl font-black text-blue-900">
                          R$ {finalTotal.toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Botões Inferiores: "Alterar seleção" e "Ir para pagamento" */}
                <div className="space-y-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setCurrentScreen('home')}
                    className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold rounded-xl text-xs transition cursor-pointer"
                  >
                    Alterar seleção
                  </button>
                  <button
                    type="button"
                    onClick={handleGoToPayment}
                    className="w-full py-3 bg-blue-800 hover:bg-blue-900 text-white font-extrabold rounded-xl text-sm shadow-md transition cursor-pointer flex items-center justify-center gap-2"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Ir para pagamento</span>
                  </button>
                </div>
              </div>
            )}

            {/* --------------------------------------------------------------
                TELA 7: PAGAMENTO (ESCOLHA ENTRE PIX OU CARTÃO)
               -------------------------------------------------------------- */}
            {currentScreen === 'payment' && (
              <div className="flex-1 bg-white px-5 py-4 flex flex-col justify-between">
                <div>
                  {/* Cabeçalho */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setCurrentScreen('checkout')}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </button>
                      <div>
                        <h2 className="text-base font-black text-slate-900">
                          Pagamento
                        </h2>
                        <p className="text-[10px] text-slate-500">
                          {selectedStreet.name} • {automaticDurationHours}h ({quantity}x)
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">
                        Total
                      </span>
                      <span className="text-base font-black text-blue-900">
                        R$ {finalTotal.toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  </div>

                  {/* Seletor de Forma de Pagamento: Pix ou Cartão */}
                  <div className="grid grid-cols-2 gap-2.5 mt-3.5">
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentMethod('pix');
                        if (!pixCode) setPixCode(generatePixPayload(finalTotal));
                      }}
                      className={`p-3 rounded-xl border-2 flex flex-col items-center justify-center gap-1.5 transition cursor-pointer ${
                        paymentMethod === 'pix'
                          ? 'bg-emerald-50 border-emerald-600 text-emerald-900 shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <QrCode
                        className={`w-6 h-6 ${
                          paymentMethod === 'pix' ? 'text-emerald-600' : 'text-slate-500'
                        }`}
                      />
                      <span className="text-xs font-black">Pix</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setPaymentMethod('card');
                        if (savedCards.length === 0) setShowCardForm(true);
                      }}
                      className={`p-3 rounded-xl border-2 flex flex-col items-center justify-center gap-1.5 transition cursor-pointer ${
                        paymentMethod === 'card'
                          ? 'bg-blue-50 border-blue-800 text-blue-950 shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <CreditCard
                        className={`w-6 h-6 ${
                          paymentMethod === 'card' ? 'text-blue-800' : 'text-slate-500'
                        }`}
                      />
                      <span className="text-xs font-black">Cartão</span>
                    </button>
                  </div>

                  {/* OPÇÃO 1: PAGAMENTO VIA PIX (GERA CÓDIGO E QR CODE) */}
                  {paymentMethod === 'pix' && (
                    <div className="mt-3.5 bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-center space-y-2.5">
                      <span className="inline-block px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-extrabold uppercase">
                        Código Pix Gerado
                      </span>

                      {/* QR Code Visual Simulado em SVG */}
                      <div className="w-32 h-32 mx-auto bg-white p-2.5 rounded-xl border-2 border-slate-800 flex items-center justify-center shadow-2xs">
                        <svg viewBox="0 0 100 100" className="w-full h-full fill-slate-900">
                          <rect x="5" y="5" width="25" height="25" />
                          <rect x="10" y="10" width="15" height="15" className="fill-white" />
                          <rect x="13" y="13" width="9" height="9" />
                          <rect x="70" y="5" width="25" height="25" />
                          <rect x="75" y="10" width="15" height="15" className="fill-white" />
                          <rect x="78" y="13" width="9" height="9" />
                          <rect x="5" y="70" width="25" height="25" />
                          <rect x="10" y="75" width="15" height="15" className="fill-white" />
                          <rect x="13" y="78" width="9" height="9" />
                          <rect x="38" y="8" width="8" height="8" />
                          <rect x="52" y="14" width="10" height="6" />
                          <rect x="40" y="26" width="12" height="12" />
                          <rect x="10" y="42" width="14" height="8" />
                          <rect x="32" y="46" width="8" height="14" />
                          <rect x="48" y="44" width="14" height="14" />
                          <rect x="70" y="42" width="10" height="10" />
                          <rect x="85" y="48" width="10" height="14" />
                          <rect x="40" y="70" width="10" height="10" />
                          <rect x="58" y="66" width="14" height="8" />
                          <rect x="76" y="74" width="18" height="8" />
                          <rect x="44" y="86" width="22" height="8" />
                        </svg>
                      </div>

                      <div className="text-left">
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">
                          Pix Copia e Cola:
                        </label>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            readOnly
                            value={pixCode}
                            className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-lg text-[10px] font-mono text-slate-700"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (navigator.clipboard) {
                                navigator.clipboard.writeText(pixCode).catch(() => {});
                              }
                              showToast('Código Pix copiado para a área de transferência!');
                            }}
                            className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-[11px] font-extrabold flex items-center gap-1 shrink-0 cursor-pointer"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copiar</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* OPÇÃO 2: PAGAMENTO VIA CARTÃO (LISTA OU CADASTRO SE NÃO HOUVER) */}
                  {paymentMethod === 'card' && (
                    <div className="mt-3.5 space-y-2.5">
                      {savedCards.length > 0 && !showCardForm ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-extrabold text-slate-700">
                              Cartão selecionado
                            </span>
                            <button
                              type="button"
                              onClick={() => setShowCardForm(true)}
                              className="text-[11px] font-bold text-blue-700 hover:underline flex items-center gap-0.5 cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" /> Novo cartão
                            </button>
                          </div>

                          {savedCards.map((c) => (
                            <div
                              key={c.id}
                              onClick={() => setSelectedCardId(c.id)}
                              className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer ${
                                selectedCardId === c.id
                                  ? 'bg-blue-50 border-blue-700'
                                  : 'bg-slate-50 border-slate-200'
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <CreditCard className="w-5 h-5 text-blue-800" />
                                <div>
                                  <p className="text-xs font-black text-slate-900">
                                    {c.brand} •••• {c.last4}
                                  </p>
                                  <p className="text-[10px] text-slate-500">
                                    {c.holder} • Val: {c.expiry}
                                  </p>
                                </div>
                              </div>
                              <div
                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                  selectedCardId === c.id
                                    ? 'bg-blue-800 border-blue-800 text-white'
                                    : 'border-slate-300'
                                }`}
                              >
                                {selectedCardId === c.id && <Check className="w-3 h-3 stroke-[3]" />}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <form
                          onSubmit={handleSaveCard}
                          className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-slate-900">
                              Cadastrar Cartão
                            </span>
                            {savedCards.length > 0 && (
                              <button
                                type="button"
                                onClick={() => setShowCardForm(false)}
                                className="text-[10px] font-bold text-slate-500 hover:underline cursor-pointer"
                              >
                                Cancelar
                              </button>
                            )}
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                              Número do cartão
                            </label>
                            <input
                              type="text"
                              maxLength={19}
                              value={cardForm.number}
                              onChange={(e) => {
                                const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
                                const formatted = raw.replace(/(\d{4})(?=\d)/g, '$1 ');
                                setCardForm({ ...cardForm, number: formatted });
                              }}
                              placeholder="0000 0000 0000 0000"
                              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono focus:outline-none focus:border-blue-700"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                              Nome impresso no cartão
                            </label>
                            <input
                              type="text"
                              value={cardForm.holder}
                              onChange={(e) =>
                                setCardForm({ ...cardForm, holder: e.target.value })
                              }
                              placeholder="CARLOS SILVA"
                              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs uppercase focus:outline-none focus:border-blue-700"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                                Validade
                              </label>
                              <input
                                type="text"
                                maxLength={5}
                                value={cardForm.expiry}
                                onChange={(e) => {
                                  const raw = e.target.value.replace(/\D/g, '').slice(0, 4);
                                  const formatted =
                                    raw.length > 2 ? `${raw.slice(0, 2)}/${raw.slice(2)}` : raw;
                                  setCardForm({ ...cardForm, expiry: formatted });
                                }}
                                placeholder="MM/AA"
                                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-blue-700"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                                CVV
                              </label>
                              <input
                                type="password"
                                maxLength={4}
                                value={cardForm.cvv}
                                onChange={(e) =>
                                  setCardForm({
                                    ...cardForm,
                                    cvv: e.target.value.replace(/\D/g, '')
                                  })
                                }
                                placeholder="123"
                                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-blue-700"
                              />
                            </div>
                          </div>

                          <button
                            type="submit"
                            className="w-full py-2 bg-blue-800 hover:bg-blue-900 text-white font-extrabold rounded-lg text-xs transition cursor-pointer"
                          >
                            Salvar cartão
                          </button>
                        </form>
                      )}
                    </div>
                  )}
                </div>

                {/* Botão Final de Confirmação do Pagamento */}
                <div className="pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleFinalizePurchase}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-sm shadow-md transition cursor-pointer flex items-center justify-center gap-2"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>
                      {paymentMethod === 'pix'
                        ? 'Confirmar pagamento Pix'
                        : 'Pagar com Cartão'}
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* --------------------------------------------------------------
                TELA DE CONFIRMAÇÃO: TICKET ROTATIVO ATIVO
               -------------------------------------------------------------- */}
            {currentScreen === 'checkout' && activeTicket && (
              <div className="flex-1 bg-white px-5 py-5 flex flex-col justify-between text-center">
                <div className="my-auto">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-xs">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <span className="inline-block px-3 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[11px] font-extrabold uppercase tracking-wider">
                    Ticket Rotativo Ativo
                  </span>
                  <h2 className="text-xl font-black text-slate-900 mt-1.5">
                    Estacionamento Liberado!
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Comprovante #{activeTicket.code}
                  </p>

                  {/* Cronômetro Regressivo */}
                  <div className="mt-4 bg-blue-950 text-white rounded-2xl p-4 shadow-md">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-blue-300 block">
                      Tempo de permanência restante
                    </span>
                    <div className="text-3xl font-black tracking-wider mt-1 font-mono">
                      {formatCountdown(remainingSeconds)}
                    </div>
                  </div>

                  {/* Resumo do Ticket */}
                  <div className="mt-3 bg-slate-50 rounded-2xl p-3 text-left text-xs space-y-1.5 border border-slate-200/80">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Rua:</span>
                      <span className="font-bold text-slate-800">
                        {activeTicket.streetName}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Veículo / Placa:</span>
                      <span className="font-bold text-slate-800">
                        {activeTicket.vehicleLabel}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Permanência / Qtd:</span>
                      <span className="font-bold text-slate-800">
                        {activeTicket.durationHours}h ({activeTicket.quantity}x)
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Pagamento:</span>
                      <span className="font-bold text-slate-800">
                        {activeTicket.paymentLabel}
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-slate-200 pt-1.5">
                      <span className="text-slate-500">Valor Pago:</span>
                      <span className="font-extrabold text-emerald-600">
                        R$ {activeTicket.totalPaid.toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentScreen('home')}
                  className="w-full py-3 bg-blue-800 hover:bg-blue-900 text-white font-extrabold rounded-xl text-xs shadow-md transition cursor-pointer"
                >
                  Voltar para Tela Inicial
                </button>
              </div>
            )}
          </div>

          {/* Barra Home Inferior do Smartphone */}
          <div className="w-full bg-white py-2 flex justify-center shrink-0">
            <div className="w-32 h-1 bg-slate-300 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}