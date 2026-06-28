/// <reference path="./vite-env.d.ts" />

import React from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CalendarDays,
  CheckCircle2,
  Loader2,
  LockKeyhole,
  Mail,
  MapPin,
  Phone,
  Scissors,
  UserRound,
  UsersRound,
} from "lucide-react";
import "./styles.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "https://baro-api.onrender.com";
const AUTH_STORAGE_KEY = "baro_admin_auth";

type AppView = "register" | "registerSuccess" | "login" | "dashboard";

type FormState = {
  nombreBarberia: string;
  direccion: string;
  telefonoBarberia: string;
  emailBarberia: string;
  nombreAdmin: string;
  apellidosAdmin: string;
  emailAdmin: string;
  telefonoAdmin: string;
  password: string;
};

type LoginState = {
  email: string;
  password: string;
};

type AuthUser = {
  idUsuario: number;
  nombre: string;
  apellidos: string;
  email: string;
  esPremium: boolean;
  rol: string;
  barberiaId: number | null;
};

type AuthSession = {
  token: string;
  usuario: AuthUser;
};

type LoginResponse = {
  token: string;
  usuario: AuthUser;
};

type AdminSection = "citas" | "servicios" | "barberos" | "barberia";

type BarberiaData = {
  idBarberia: number;
  nombre: string;
  direccion: string | null;
  telefono: string | null;
  email: string | null;
  logoUrl: string | null;
  imagenPortadaUrl: string | null;
};

type ServicioData = {
  idServicio: number;
  nombre: string;
  descripcion: string | null;
  precio: number;
  duracionMin: number;
};

type BarberoData = {
  idBarbero: number;
  nombre: string;
  apellidos: string | null;
  especialidad: string | null;
  descripcion: string | null;
};

type CitaData = {
  idCita: number;
  fecha: string;
  hora: string;
  estado: string;
  pagada: boolean;
  precioFinal: number;
  cliente: string;
  servicio: string;
  barbero: string;
  observaciones: string | null;
};

type PanelData = {
  barberia: BarberiaData | null;
  servicios: ServicioData[];
  barberos: BarberoData[];
  citas: CitaData[];
};

const initialPanelData: PanelData = {
  barberia: null,
  servicios: [],
  barberos: [],
  citas: [],
};

const emptyServicio = {
  nombre: "",
  descripcion: "",
  precio: "",
  duracionMin: "",
};

const emptyBarbero = {
  nombre: "",
  apellidos: "",
  especialidad: "",
  descripcion: "",
};

type ApiObject = Record<string, unknown>;

function textValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

function numberValue(value: unknown) {
  return typeof value === "number" ? value : Number(value ?? 0);
}

function normalizeBarberia(value: unknown): BarberiaData {
  const item = value as ApiObject;

  return {
    idBarberia: numberValue(item.idBarberia ?? item.IdBarberia),
    nombre: textValue(item.nombre ?? item.Nombre),
    direccion: textValue(item.direccion ?? item.Direccion),
    telefono: textValue(item.telefono ?? item.Telefono),
    email: textValue(item.email ?? item.Email),
    logoUrl: textValue(item.logoUrl ?? item.LogoUrl),
    imagenPortadaUrl: textValue(item.imagenPortadaUrl ?? item.ImagenPortadaUrl),
  };
}

function normalizeServicio(value: unknown): ServicioData {
  const item = value as ApiObject;

  return {
    idServicio: numberValue(item.idServicio ?? item.IdServicio),
    nombre: textValue(item.nombre ?? item.Nombre),
    descripcion: textValue(item.descripcion ?? item.Descripcion),
    precio: numberValue(item.precio ?? item.Precio),
    duracionMin: numberValue(item.duracionMin ?? item.DuracionMin),
  };
}

function normalizeBarbero(value: unknown): BarberoData {
  const item = value as ApiObject;

  return {
    idBarbero: numberValue(item.idBarbero ?? item.IdBarbero),
    nombre: textValue(item.nombre ?? item.Nombre),
    apellidos: textValue(item.apellidos ?? item.Apellidos),
    especialidad: textValue(item.especialidad ?? item.Especialidad),
    descripcion: textValue(item.descripcion ?? item.Descripcion),
  };
}

function normalizeCita(value: unknown): CitaData {
  const item = value as ApiObject;

  return {
    idCita: numberValue(item.idCita ?? item.IdCita),
    fecha: textValue(item.fecha ?? item.Fecha),
    hora: textValue(item.hora ?? item.Hora),
    estado: textValue(item.estado ?? item.Estado),
    pagada: Boolean(item.pagada ?? item.Pagada),
    precioFinal: numberValue(item.precioFinal ?? item.PrecioFinal),
    cliente: textValue(item.cliente ?? item.Cliente),
    servicio: textValue(item.servicio ?? item.Servicio),
    barbero: textValue(item.barbero ?? item.Barbero),
    observaciones: textValue(item.observaciones ?? item.Observaciones),
  };
}

type Step = {
  title: string;
  subtitle: string;
  fields: Array<keyof FormState>;
};

const initialForm: FormState = {
  nombreBarberia: "",
  direccion: "",
  telefonoBarberia: "",
  emailBarberia: "",
  nombreAdmin: "",
  apellidosAdmin: "",
  emailAdmin: "",
  telefonoAdmin: "",
  password: "",
};

const initialLogin: LoginState = {
  email: "",
  password: "",
};

const steps: Step[] = [
  {
    title: "Como se llama tu barberia?",
    subtitle: "Este sera el nombre que veran los clientes dentro de BARO.",
    fields: ["nombreBarberia"],
  },
  {
    title: "Donde esta ubicada?",
    subtitle: "La direccion nos ayudara despues a mostrarla en mapas y busquedas.",
    fields: ["direccion"],
  },
  {
    title: "Como pueden contactar contigo?",
    subtitle: "Anade un telefono y un email publico para la barberia.",
    fields: ["telefonoBarberia", "emailBarberia"],
  },
  {
    title: "Quien gestionara la barberia?",
    subtitle: "Crea la cuenta principal que entrara al panel de administracion.",
    fields: ["nombreAdmin", "apellidosAdmin"],
  },
  {
    title: "Datos de acceso",
    subtitle: "Con este email y contrasena podras entrar al panel de BARO Admin.",
    fields: ["emailAdmin", "telefonoAdmin", "password"],
  },
  {
    title: "Revisa y confirma",
    subtitle: "Si todo esta correcto, registramos la barberia y creamos su cuenta.",
    fields: [],
  },
];

function getStoredSession() {
  const stored = window.localStorage.getItem(AUTH_STORAGE_KEY);

  if (!stored) {
    return null;
  }

  try {
    return JSON.parse(stored) as AuthSession;
  } catch {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

async function apiRequest<T>(token: string, path: string, options: RequestInit = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers ?? {}),
    },
  });

  const text = await response.text();
  let data: unknown = text;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    throw new Error(typeof data === "string" ? data : "La API devolvio un error.");
  }

  return data as T;
}

function App() {
  const [view, setView] = React.useState<AppView>(() => (getStoredSession() ? "dashboard" : "register"));
  const [session, setSession] = React.useState<AuthSession | null>(() => getStoredSession());
  const [form, setForm] = React.useState<FormState>(initialForm);
  const [login, setLogin] = React.useState<LoginState>(initialLogin);
  const [stepIndex, setStepIndex] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState("");
  const [error, setError] = React.useState("");

  const currentStep = steps[stepIndex];
  const progress = Math.round(((stepIndex + 1) / steps.length) * 100);
  const isRegisterFlow = view === "register" || view === "registerSuccess";

  function clearFeedback() {
    setMessage("");
    setError("");
  }

  function updateField(field: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    clearFeedback();
  }

  function updateLogin(field: keyof LoginState, value: string) {
    setLogin((current) => ({ ...current, [field]: value }));
    clearFeedback();
  }

  function goToLogin(email = "") {
    setView("login");
    setLogin({ email, password: "" });
    setStepIndex(0);
    clearFeedback();
  }

  function goToRegister() {
    setView("register");
    clearFeedback();
  }

  function logout() {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    setSession(null);
    setView("login");
    setLogin(initialLogin);
    clearFeedback();
  }

  function getFieldError(field: keyof FormState) {
    const value = form[field].trim();

    if (field === "nombreBarberia" && !value) {
      return "Escribe el nombre de la barberia.";
    }

    if (field === "nombreAdmin" && !value) {
      return "Escribe el nombre del administrador.";
    }

    if (field === "apellidosAdmin" && !value) {
      return "Escribe los apellidos del administrador.";
    }

    if (field === "emailAdmin" && !value) {
      return "Escribe el email de acceso.";
    }

    if ((field === "emailAdmin" || field === "emailBarberia") && value && !value.includes("@")) {
      return "El email debe tener un formato valido.";
    }

    if (field === "password" && value.length < 6) {
      return "La contrasena debe tener al menos 6 caracteres.";
    }

    return "";
  }

  function validateCurrentStep() {
    const firstError = currentStep.fields.map(getFieldError).find(Boolean);

    if (firstError) {
      setError(firstError);
      return false;
    }

    setError("");
    return true;
  }

  function nextStep() {
    if (!validateCurrentStep()) {
      return;
    }

    setStepIndex((current) => Math.min(current + 1, steps.length - 1));
  }

  function previousStep() {
    clearFeedback();
    setStepIndex((current) => Math.max(current - 1, 0));
  }

  async function submitRegister(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validateCurrentStep()) {
      return;
    }

    setLoading(true);
    clearFeedback();

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register-barberia`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const text = await response.text();
      let data: unknown = text;

      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }

      if (!response.ok) {
        setError(typeof data === "string" ? data : "No se pudo registrar la barberia.");
        return;
      }

      setMessage("Barberia registrada correctamente. Ya puedes iniciar sesion.");
      setLogin({ email: form.emailAdmin, password: "" });
      setForm(initialForm);
      setStepIndex(0);
      setView("registerSuccess");
    } catch {
      setError("No se pudo conectar con la API de BARO.");
    } finally {
      setLoading(false);
    }
  }

  async function submitLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    clearFeedback();

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(login),
      });

      const text = await response.text();
      let data: unknown = text;

      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }

      if (!response.ok || typeof data === "string") {
        setError(typeof data === "string" ? data : "No se pudo iniciar sesion.");
        return;
      }

      const loginData = data as LoginResponse;

      if (loginData.usuario.rol !== "admin_barberia") {
        setError("Esta cuenta no pertenece a una barberia.");
        return;
      }

      const nextSession = {
        token: loginData.token,
        usuario: loginData.usuario,
      };

      window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextSession));
      setSession(nextSession);
      setView("dashboard");
      setLogin(initialLogin);
    } catch {
      setError("No se pudo conectar con la API de BARO.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page-shell">
      <section className="brand-panel">
        <div className="brand-lockup">
          <img src="/baro.png?v=2" alt="BARO" />
          <div>
            <p>BARO Admin</p>
            <h1>{view === "dashboard" ? "Panel" : view === "login" ? "Acceso" : "Registro guiado"}</h1>
          </div>
        </div>

        {isRegisterFlow && view !== "registerSuccess" ? (
          <div className="progress-card">
            <span>
              Paso {stepIndex + 1} de {steps.length}
            </span>
            <div className="progress-track">
              <div style={{ width: `${progress}%` }} />
            </div>
          </div>
        ) : (
          <div className="progress-card">
            <span>{view === "dashboard" ? "Sesion iniciada" : "Panel privado"}</span>
            <div className="progress-track">
              <div style={{ width: view === "dashboard" ? "100%" : "50%" }} />
            </div>
          </div>
        )}

        <div className="status-strip">
          <span>API online</span>
          <strong>{API_BASE_URL.replace("https://", "")}</strong>
        </div>
      </section>

      {view === "register" && (
        <RegisterWizard
          currentStep={currentStep}
          error={error}
          form={form}
          loading={loading}
          message={message}
          stepIndex={stepIndex}
          updateField={updateField}
          nextStep={nextStep}
          previousStep={previousStep}
          submitRegister={submitRegister}
          goToLogin={() => goToLogin()}
        />
      )}

      {view === "registerSuccess" && <RegisterSuccess email={login.email} goToLogin={() => goToLogin(login.email)} />}

      {view === "login" && (
        <LoginScreen
          error={error}
          login={login}
          loading={loading}
          updateLogin={updateLogin}
          submitLogin={submitLogin}
          goToRegister={goToRegister}
        />
      )}

      {view === "dashboard" && session && <Dashboard session={session} logout={logout} />}

      <aside className="side-spacer" aria-hidden="true" />
    </main>
  );
}

type RegisterWizardProps = {
  currentStep: Step;
  error: string;
  form: FormState;
  loading: boolean;
  message: string;
  stepIndex: number;
  updateField: (field: keyof FormState, value: string) => void;
  nextStep: () => void;
  previousStep: () => void;
  submitRegister: (event: React.FormEvent<HTMLFormElement>) => void;
  goToLogin: () => void;
};

function RegisterWizard({
  currentStep,
  error,
  form,
  loading,
  message,
  stepIndex,
  updateField,
  nextStep,
  previousStep,
  submitRegister,
  goToLogin,
}: RegisterWizardProps) {
  return (
    <form className="admin-form" onSubmit={submitRegister}>
      <div className="top-switch">
        <span>Ya tienes cuenta?</span>
        <button type="button" onClick={goToLogin}>
          Iniciar sesion
        </button>
      </div>

      <section className="wizard-card">
        <div className="question-header">
          <span className="step-pill">Pregunta {stepIndex + 1}</span>
          <h2>{currentStep.title}</h2>
          <p>{currentStep.subtitle}</p>
        </div>

        {stepIndex === 0 && (
          <div className="single-question">
            <label>
              Nombre de la barberia
              <input
                autoFocus
                value={form.nombreBarberia}
                onChange={(event) => updateField("nombreBarberia", event.target.value)}
                placeholder="Ej. Barberia Blasco"
              />
            </label>
          </div>
        )}

        {stepIndex === 1 && (
          <div className="single-question">
            <label>
              Direccion
              <div className="input-with-icon">
                <MapPin size={18} />
                <input
                  autoFocus
                  value={form.direccion}
                  onChange={(event) => updateField("direccion", event.target.value)}
                  placeholder="Calle, numero, ciudad"
                />
              </div>
            </label>
          </div>
        )}

        {stepIndex === 2 && (
          <div className="field-grid">
            <label>
              Telefono de la barberia
              <div className="input-with-icon">
                <Phone size={18} />
                <input
                  autoFocus
                  value={form.telefonoBarberia}
                  onChange={(event) => updateField("telefonoBarberia", event.target.value)}
                  placeholder="600000000"
                />
              </div>
            </label>

            <label>
              Email de contacto
              <div className="input-with-icon">
                <Mail size={18} />
                <input
                  type="email"
                  value={form.emailBarberia}
                  onChange={(event) => updateField("emailBarberia", event.target.value)}
                  placeholder="contacto@barberia.com"
                />
              </div>
            </label>
          </div>
        )}

        {stepIndex === 3 && (
          <div className="field-grid">
            <label>
              Nombre
              <input
                autoFocus
                value={form.nombreAdmin}
                onChange={(event) => updateField("nombreAdmin", event.target.value)}
                placeholder="Carlos"
              />
            </label>

            <label>
              Apellidos
              <input
                value={form.apellidosAdmin}
                onChange={(event) => updateField("apellidosAdmin", event.target.value)}
                placeholder="Blasco"
              />
            </label>
          </div>
        )}

        {stepIndex === 4 && (
          <div className="field-grid">
            <label>
              Email de acceso
              <input
                autoFocus
                type="email"
                value={form.emailAdmin}
                onChange={(event) => updateField("emailAdmin", event.target.value)}
                placeholder="admin@barberia.com"
              />
            </label>

            <label>
              Telefono personal
              <input
                value={form.telefonoAdmin}
                onChange={(event) => updateField("telefonoAdmin", event.target.value)}
                placeholder="Opcional"
              />
            </label>

            <label className="full-width">
              Contrasena
              <input
                minLength={6}
                type="password"
                value={form.password}
                onChange={(event) => updateField("password", event.target.value)}
                placeholder="Minimo 6 caracteres"
              />
            </label>
          </div>
        )}

        {stepIndex === 5 && (
          <div className="summary-grid">
            <div>
              <Building2 size={19} />
              <span>Barberia</span>
              <strong>{form.nombreBarberia || "Sin nombre"}</strong>
              <p>{form.direccion || "Direccion pendiente"}</p>
            </div>
            <div>
              <Phone size={19} />
              <span>Contacto</span>
              <strong>{form.telefonoBarberia || "Sin telefono"}</strong>
              <p>{form.emailBarberia || "Sin email publico"}</p>
            </div>
            <div>
              <UserRound size={19} />
              <span>Administrador</span>
              <strong>
                {form.nombreAdmin} {form.apellidosAdmin}
              </strong>
              <p>{form.emailAdmin || "Sin email de acceso"}</p>
            </div>
          </div>
        )}
      </section>

      {message && (
        <div className="notice success">
          <CheckCircle2 size={19} />
          <span>{message}</span>
        </div>
      )}

      {error && <div className="notice error">{error}</div>}

      <div className="wizard-actions">
        <button className="ghost-button" type="button" onClick={previousStep} disabled={stepIndex === 0 || loading}>
          <ArrowLeft size={18} />
          Atras
        </button>

        {stepIndex < steps.length - 1 ? (
          <button className="submit-button" type="button" onClick={nextStep}>
            Siguiente
            <ArrowRight size={18} />
          </button>
        ) : (
          <button className="submit-button" type="submit" disabled={loading}>
            {loading ? <Loader2 className="spin" size={20} /> : <CheckCircle2 size={19} />}
            {loading ? "Registrando..." : "Registrar barberia"}
          </button>
        )}
      </div>
    </form>
  );
}

function RegisterSuccess({ email, goToLogin }: { email: string; goToLogin: () => void }) {
  return (
    <section className="admin-form centered-flow">
      <div className="success-panel">
        <CheckCircle2 size={38} />
        <span className="step-pill">Registro completado</span>
        <h2>Tu barberia ya esta registrada</h2>
        <p>Ahora inicia sesion con la cuenta administradora para entrar al panel privado.</p>
        {email && <strong>{email}</strong>}
        <button className="submit-button" type="button" onClick={goToLogin}>
          Ir al login
          <ArrowRight size={18} />
        </button>
      </div>
    </section>
  );
}

type LoginScreenProps = {
  error: string;
  login: LoginState;
  loading: boolean;
  updateLogin: (field: keyof LoginState, value: string) => void;
  submitLogin: (event: React.FormEvent<HTMLFormElement>) => void;
  goToRegister: () => void;
};

function LoginScreen({ error, login, loading, updateLogin, submitLogin, goToRegister }: LoginScreenProps) {
  return (
    <form className="admin-form login-form" onSubmit={submitLogin}>
      <div className="top-switch">
        <span>No tienes barberia registrada?</span>
        <button type="button" onClick={goToRegister}>
          Crear cuenta
        </button>
      </div>

      <section className="wizard-card login-card">
        <div className="question-header">
          <span className="step-pill">Acceso privado</span>
          <h2>Entra a BARO Admin</h2>
          <p>Usa el email y la contrasena de la cuenta administradora de tu barberia.</p>
        </div>

        <div className="single-question">
          <label>
            Email
            <div className="input-with-icon">
              <Mail size={18} />
              <input
                autoFocus
                type="email"
                value={login.email}
                onChange={(event) => updateLogin("email", event.target.value)}
                placeholder="admin@barberia.com"
              />
            </div>
          </label>

          <label>
            Contrasena
            <div className="input-with-icon">
              <LockKeyhole size={18} />
              <input
                type="password"
                value={login.password}
                onChange={(event) => updateLogin("password", event.target.value)}
                placeholder="Tu contrasena"
              />
            </div>
          </label>
        </div>
      </section>

      {error && <div className="notice error">{error}</div>}

      <button className="submit-button" type="submit" disabled={loading}>
        {loading ? <Loader2 className="spin" size={20} /> : <LockKeyhole size={18} />}
        {loading ? "Entrando..." : "Entrar al panel"}
      </button>
    </form>
  );
}

function Dashboard({ session, logout }: { session: AuthSession; logout: () => void }) {
  const user = session.usuario;
  const [section, setSection] = React.useState<AdminSection>("barberia");
  const [panelData, setPanelData] = React.useState<PanelData>(initialPanelData);
  const [panelLoading, setPanelLoading] = React.useState(true);
  const [panelMessage, setPanelMessage] = React.useState("");
  const [panelError, setPanelError] = React.useState("");
  const [barberiaForm, setBarberiaForm] = React.useState({
    nombre: "",
    direccion: "",
    telefono: "",
    email: "",
    logoUrl: "",
    imagenPortadaUrl: "",
  });
  const [servicioForm, setServicioForm] = React.useState(emptyServicio);
  const [barberoForm, setBarberoForm] = React.useState(emptyBarbero);
  const [editingServicioId, setEditingServicioId] = React.useState<number | null>(null);
  const [editingBarberoId, setEditingBarberoId] = React.useState<number | null>(null);

  async function loadPanelData() {
    setPanelLoading(true);
    setPanelError("");

    try {
      const [barberiaResponse, serviciosResponse, barberosResponse, citasResponse] = await Promise.all([
        apiRequest<unknown>(session.token, "/api/admin/mi-barberia"),
        apiRequest<unknown[]>(session.token, "/api/admin/servicios"),
        apiRequest<unknown[]>(session.token, "/api/admin/barberos"),
        apiRequest<unknown[]>(session.token, "/api/admin/citas"),
      ]);

      const barberia = normalizeBarberia(barberiaResponse);
      const servicios = serviciosResponse.map(normalizeServicio);
      const barberos = barberosResponse.map(normalizeBarbero);
      const citas = citasResponse.map(normalizeCita);

      setPanelData({ barberia, servicios, barberos, citas });
      setBarberiaForm({
        nombre: barberia.nombre,
        direccion: barberia.direccion ?? "",
        telefono: barberia.telefono ?? "",
        email: barberia.email ?? "",
        logoUrl: barberia.logoUrl ?? "",
        imagenPortadaUrl: barberia.imagenPortadaUrl ?? "",
      });
    } catch (err) {
      setPanelError(err instanceof Error ? err.message : "No se pudieron cargar los datos del panel.");
    } finally {
      setPanelLoading(false);
    }
  }

  React.useEffect(() => {
    void loadPanelData();
  }, [session.token]);

  function clearPanelFeedback() {
    setPanelMessage("");
    setPanelError("");
  }

  async function saveBarberia(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearPanelFeedback();

    try {
      await apiRequest(session.token, "/api/admin/mi-barberia", {
        method: "PUT",
        body: JSON.stringify(barberiaForm),
      });
      setPanelMessage("Datos de barberia guardados.");
      await loadPanelData();
    } catch (err) {
      setPanelError(err instanceof Error ? err.message : "No se pudo guardar la barberia.");
    }
  }

  async function createServicio(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearPanelFeedback();

    try {
      const payload = {
        nombre: servicioForm.nombre,
        descripcion: servicioForm.descripcion,
        precio: Number(servicioForm.precio),
        duracionMin: Number(servicioForm.duracionMin),
      };

      await apiRequest(session.token, editingServicioId ? `/api/admin/servicios/${editingServicioId}` : "/api/admin/servicios", {
        method: editingServicioId ? "PUT" : "POST",
        body: JSON.stringify({
          ...payload,
        }),
      });
      setServicioForm(emptyServicio);
      setEditingServicioId(null);
      setPanelMessage(editingServicioId ? "Servicio actualizado." : "Servicio creado.");
      await loadPanelData();
    } catch (err) {
      setPanelError(err instanceof Error ? err.message : "No se pudo guardar el servicio.");
    }
  }

  function editServicio(servicio: ServicioData) {
    clearPanelFeedback();
    setEditingServicioId(servicio.idServicio);
    setServicioForm({
      nombre: servicio.nombre,
      descripcion: servicio.descripcion ?? "",
      precio: String(servicio.precio),
      duracionMin: String(servicio.duracionMin),
    });
  }

  function cancelServicioEdit() {
    clearPanelFeedback();
    setEditingServicioId(null);
    setServicioForm(emptyServicio);
  }

  async function deleteServicio(id: number) {
    clearPanelFeedback();

    try {
      await apiRequest(session.token, `/api/admin/servicios/${id}`, { method: "DELETE" });
      setPanelMessage("Servicio eliminado.");
      await loadPanelData();
    } catch (err) {
      setPanelError(err instanceof Error ? err.message : "No se pudo eliminar el servicio.");
    }
  }

  async function createBarbero(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearPanelFeedback();

    try {
      await apiRequest(session.token, editingBarberoId ? `/api/admin/barberos/${editingBarberoId}` : "/api/admin/barberos", {
        method: editingBarberoId ? "PUT" : "POST",
        body: JSON.stringify(barberoForm),
      });
      setBarberoForm(emptyBarbero);
      setEditingBarberoId(null);
      setPanelMessage(editingBarberoId ? "Barbero actualizado." : "Barbero creado.");
      await loadPanelData();
    } catch (err) {
      setPanelError(err instanceof Error ? err.message : "No se pudo guardar el barbero.");
    }
  }

  function editBarbero(barbero: BarberoData) {
    clearPanelFeedback();
    setEditingBarberoId(barbero.idBarbero);
    setBarberoForm({
      nombre: barbero.nombre,
      apellidos: barbero.apellidos ?? "",
      especialidad: barbero.especialidad ?? "",
      descripcion: barbero.descripcion ?? "",
    });
  }

  function cancelBarberoEdit() {
    clearPanelFeedback();
    setEditingBarberoId(null);
    setBarberoForm(emptyBarbero);
  }

  async function deleteBarbero(id: number) {
    clearPanelFeedback();

    try {
      await apiRequest(session.token, `/api/admin/barberos/${id}`, { method: "DELETE" });
      setPanelMessage("Barbero eliminado.");
      await loadPanelData();
    } catch (err) {
      setPanelError(err instanceof Error ? err.message : "No se pudo eliminar el barbero.");
    }
  }

  async function updateCitaEstado(id: number, estado: string) {
    clearPanelFeedback();

    try {
      await apiRequest(session.token, `/api/admin/citas/${id}/estado`, {
        method: "PUT",
        body: JSON.stringify({ estado }),
      });
      setPanelMessage("Estado de cita actualizado.");
      await loadPanelData();
    } catch (err) {
      setPanelError(err instanceof Error ? err.message : "No se pudo actualizar la cita.");
    }
  }

  const pendingAppointments = panelData.citas.filter((cita) => cita.estado === "pendiente").length;
  const confirmedAppointments = panelData.citas.filter((cita) => cita.estado === "confirmada").length;

  return (
    <section className="admin-form dashboard">
      <div className="dashboard-header">
        <div>
          <span className="step-pill">Panel privado BARO</span>
          <h2 className="barberia-title">
            {panelData.barberia?.nombre || "Cargando barberia..."}
          </h2>
          <p className="dashboard-greeting">
            Hola, {user.nombre}. Gestiona citas, servicios, barberos y datos del negocio desde un unico panel.
          </p>
          <div className="barberia-contact-line">
            {panelData.barberia?.direccion && <span>{panelData.barberia.direccion}</span>}
            {panelData.barberia?.telefono && <span>{panelData.barberia.telefono}</span>}
            {panelData.barberia?.email && <span>{panelData.barberia.email}</span>}
          </div>
        </div>
        <button className="ghost-button" type="button" onClick={logout}>
          Cerrar sesion
        </button>
      </div>

      <div className="dashboard-meta">
        <div>
          <span>Servicios activos</span>
          <strong>{panelData.servicios.length}</strong>
        </div>
        <div>
          <span>Barberos</span>
          <strong>{panelData.barberos.length}</strong>
        </div>
        <div>
          <span>Citas pendientes</span>
          <strong>{pendingAppointments}</strong>
        </div>
        <div>
          <span>Citas confirmadas</span>
          <strong>{confirmedAppointments}</strong>
        </div>
      </div>

      <div className="dashboard-grid">
        <button type="button" className={section === "citas" ? "active-tile" : ""} onClick={() => setSection("citas")}>
          <CalendarDays size={24} />
          <span>Mis citas</span>
          <p>Ver y gestionar reservas de la barberia.</p>
        </button>
        <button
          type="button"
          className={section === "servicios" ? "active-tile" : ""}
          onClick={() => setSection("servicios")}
        >
          <Scissors size={24} />
          <span>Mis servicios</span>
          <p>Crear precios, duraciones y servicios disponibles.</p>
        </button>
        <button
          type="button"
          className={section === "barberos" ? "active-tile" : ""}
          onClick={() => setSection("barberos")}
        >
          <UsersRound size={24} />
          <span>Mis barberos</span>
          <p>Anadir profesionales y asignarlos a servicios.</p>
        </button>
        <button
          type="button"
          className={section === "barberia" ? "active-tile" : ""}
          onClick={() => setSection("barberia")}
        >
          <Building2 size={24} />
          <span>Mi barberia</span>
          <p>Editar datos, direccion, contacto y horarios.</p>
        </button>
      </div>

      {panelLoading && <div className="notice success">Cargando datos del panel...</div>}
      {panelMessage && <div className="notice success">{panelMessage}</div>}
      {panelError && <div className="notice error">{panelError}</div>}

      {!panelLoading && section === "barberia" && (
        <form className="panel-section" onSubmit={saveBarberia}>
          <div className="panel-title">
            <Building2 size={21} />
            <h3>Mi barberia</h3>
          </div>
          <div
            className="barberia-preview"
            style={
              barberiaForm.imagenPortadaUrl
                ? { backgroundImage: `linear-gradient(90deg, rgba(7, 7, 7, 0.9), rgba(7, 7, 7, 0.35)), url(${barberiaForm.imagenPortadaUrl})` }
                : undefined
            }
          >
            <div className="barberia-logo-preview">
              {barberiaForm.logoUrl ? <img src={barberiaForm.logoUrl} alt="" /> : <Building2 size={28} />}
            </div>
            <div>
              <span>Vista en BARO</span>
              <strong>{barberiaForm.nombre || "Nombre de la barberia"}</strong>
              <p>{barberiaForm.direccion || "Direccion pendiente"}</p>
            </div>
          </div>
          <div className="field-grid">
            <label>
              Nombre
              <input
                value={barberiaForm.nombre}
                onChange={(event) => setBarberiaForm((current) => ({ ...current, nombre: event.target.value }))}
              />
            </label>
            <label>
              Direccion
              <input
                value={barberiaForm.direccion}
                onChange={(event) => setBarberiaForm((current) => ({ ...current, direccion: event.target.value }))}
              />
            </label>
            <label>
              Telefono
              <input
                value={barberiaForm.telefono}
                onChange={(event) => setBarberiaForm((current) => ({ ...current, telefono: event.target.value }))}
              />
            </label>
            <label>
              Email
              <input
                type="email"
                value={barberiaForm.email}
                onChange={(event) => setBarberiaForm((current) => ({ ...current, email: event.target.value }))}
              />
            </label>
            <label>
              URL del logo
              <input
                value={barberiaForm.logoUrl}
                onChange={(event) => setBarberiaForm((current) => ({ ...current, logoUrl: event.target.value }))}
                placeholder="https://..."
              />
            </label>
            <label>
              URL de imagen de portada
              <input
                value={barberiaForm.imagenPortadaUrl}
                onChange={(event) =>
                  setBarberiaForm((current) => ({ ...current, imagenPortadaUrl: event.target.value }))
                }
                placeholder="https://..."
              />
            </label>
          </div>
          <button className="submit-button" type="submit">
            Guardar cambios
          </button>
        </form>
      )}

      {!panelLoading && section === "servicios" && (
        <section className="panel-section">
          <div className="panel-title">
            <Scissors size={21} />
            <h3>{editingServicioId ? "Editar servicio" : "Mis servicios"}</h3>
          </div>
          <form className="inline-create" onSubmit={createServicio}>
            <input
              required
              placeholder="Nombre del servicio"
              value={servicioForm.nombre}
              onChange={(event) => setServicioForm((current) => ({ ...current, nombre: event.target.value }))}
            />
            <input
              placeholder="Descripcion"
              value={servicioForm.descripcion}
              onChange={(event) => setServicioForm((current) => ({ ...current, descripcion: event.target.value }))}
            />
            <input
              required
              type="number"
              min="0"
              step="0.01"
              placeholder="Precio"
              value={servicioForm.precio}
              onChange={(event) => setServicioForm((current) => ({ ...current, precio: event.target.value }))}
            />
            <input
              required
              type="number"
              min="1"
              placeholder="Minutos"
              value={servicioForm.duracionMin}
              onChange={(event) => setServicioForm((current) => ({ ...current, duracionMin: event.target.value }))}
            />
            <button className="submit-button" type="submit">
              {editingServicioId ? "Guardar" : "Anadir"}
            </button>
            {editingServicioId && (
              <button className="ghost-button compact-button" type="button" onClick={cancelServicioEdit}>
                Cancelar
              </button>
            )}
          </form>
          <div className="admin-list">
            {panelData.servicios.map((servicio) => (
              <div key={servicio.idServicio}>
                <strong>{servicio.nombre}</strong>
                <span>
                  {servicio.precio} EUR - {servicio.duracionMin} min
                </span>
                <p>{servicio.descripcion || "Sin descripcion"}</p>
                <div className="row-actions">
                  <button type="button" onClick={() => editServicio(servicio)}>
                    Editar
                  </button>
                  <button type="button" onClick={() => deleteServicio(servicio.idServicio)}>
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {!panelLoading && section === "barberos" && (
        <section className="panel-section">
          <div className="panel-title">
            <UsersRound size={21} />
            <h3>{editingBarberoId ? "Editar barbero" : "Mis barberos"}</h3>
          </div>
          <form className="inline-create" onSubmit={createBarbero}>
            <input
              required
              placeholder="Nombre"
              value={barberoForm.nombre}
              onChange={(event) => setBarberoForm((current) => ({ ...current, nombre: event.target.value }))}
            />
            <input
              placeholder="Apellidos"
              value={barberoForm.apellidos}
              onChange={(event) => setBarberoForm((current) => ({ ...current, apellidos: event.target.value }))}
            />
            <input
              placeholder="Especialidad"
              value={barberoForm.especialidad}
              onChange={(event) => setBarberoForm((current) => ({ ...current, especialidad: event.target.value }))}
            />
            <input
              placeholder="Descripcion"
              value={barberoForm.descripcion}
              onChange={(event) => setBarberoForm((current) => ({ ...current, descripcion: event.target.value }))}
            />
            <button className="submit-button" type="submit">
              {editingBarberoId ? "Guardar" : "Anadir"}
            </button>
            {editingBarberoId && (
              <button className="ghost-button compact-button" type="button" onClick={cancelBarberoEdit}>
                Cancelar
              </button>
            )}
          </form>
          <div className="admin-list">
            {panelData.barberos.map((barbero) => (
              <div key={barbero.idBarbero}>
                <strong>
                  {barbero.nombre} {barbero.apellidos}
                </strong>
                <span>{barbero.especialidad || "Sin especialidad"}</span>
                <p>{barbero.descripcion || "Sin descripcion"}</p>
                <div className="row-actions">
                  <button type="button" onClick={() => editBarbero(barbero)}>
                    Editar
                  </button>
                  <button type="button" onClick={() => deleteBarbero(barbero.idBarbero)}>
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {!panelLoading && section === "citas" && (
        <section className="panel-section">
          <div className="panel-title">
            <CalendarDays size={21} />
            <h3>Mis citas</h3>
          </div>
          <div className="admin-list">
            {panelData.citas.map((cita) => (
              <div key={cita.idCita}>
                <strong>{cita.cliente}</strong>
                <span>
                  {new Date(cita.fecha).toLocaleDateString("es-ES")} - {cita.hora} - {cita.estado}
                </span>
                <p>
                  {cita.servicio} con {cita.barbero} - {cita.precioFinal} EUR
                </p>
                <div className="row-actions">
                  <button type="button" onClick={() => updateCitaEstado(cita.idCita, "confirmada")}>
                    Confirmar
                  </button>
                  <button type="button" onClick={() => updateCitaEstado(cita.idCita, "cancelada")}>
                    Cancelar
                  </button>
                  <button type="button" onClick={() => updateCitaEstado(cita.idCita, "completada")}>
                    Realizada
                  </button>
                </div>
              </div>
            ))}
            {panelData.citas.length === 0 && <p className="empty-state">Todavia no hay citas para esta barberia.</p>}
          </div>
        </section>
      )}
    </section>
  );
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
