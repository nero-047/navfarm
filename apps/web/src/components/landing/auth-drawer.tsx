import React, { useState } from 'react';
import { X, Building, Mail, Lock, AlertCircle, CheckCircle, Compass } from 'lucide-react';
import Input from '../source-ui/input';
import Button from '../source-ui/button';
import { api } from '../../services/api-client';
import { persistAuthSession } from '../../lib/api-client';
import { useRouter } from 'next/navigation';

interface AuthDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'login' | 'signup';
}

export const AuthDrawer: React.FC<AuthDrawerProps> = ({
  isOpen,
  onClose,
  initialTab = 'login',
}) => {
  const [authTab, setAuthTab] = useState<'login' | 'signup'>((initialTab as any) === 'register_admin' ? 'login' : initialTab as any);
  const router = useRouter();

  // Login Form States
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginSuccess, setLoginSuccess] = useState("");

  // Unified Signup Form States
  const [signupData, setSignupData] = useState({
    tenant_code: "",
    tenant_name: "",
    billing_email: "",
    plan_id: "PLAN_PRO",
    admin_name: "",
    admin_email: "",
    admin_password: "",
  });
  const [signupError, setSignupError] = useState("");
  const [signupSuccess, setSignupSuccess] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoginSuccess("");

    if (!loginEmail || !loginPassword) {
      setLoginError("Please enter email and password.");
      return;
    }

    try {
      const res = await api.post('/auth/login', {
        email: loginEmail,
        password: loginPassword,
      });

      setLoginSuccess("Logged in successfully! Redirecting...");

      persistAuthSession(res);

      setTimeout(() => {
        onClose();
        if (res.user.userType === 'SYSTEM_ADMIN') {
          router.push('/admin');
        } else {
          router.push('/console');
        }
      }, 1000);
    } catch (err: any) {
      setLoginError(err?.message || 'Login failed. Please try again.');
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError("");
    setSignupSuccess("");

    if (
      !signupData.tenant_code ||
      !signupData.tenant_name ||
      !signupData.billing_email ||
      !signupData.admin_name ||
      !signupData.admin_email ||
      !signupData.admin_password
    ) {
      setSignupError("All fields are required.");
      return;
    }

    try {
      const res = await api.post('/tenant/signup', signupData);
      setSignupSuccess("Tenant workspace & Administrator registered successfully! You can now log in.");

      localStorage.setItem('tenant_id', res.tenant_id);

      setTimeout(() => {
        setAuthTab('login');
        setLoginEmail(signupData.admin_email);
        setSignupSuccess("");
      }, 3000);
    } catch (err: any) {
      setSignupError(err?.message || 'Tenant signup failed. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm transition-opacity duration-300">

      <div className="absolute inset-0" onClick={onClose} />

      <div className={`relative w-full ${authTab === 'signup' ? 'max-w-3xl' : 'max-w-md'} h-full bg-[#0a0f1d] border-l border-gray-800 p-8 flex flex-col justify-between shadow-2xl z-10 transition-all duration-300 translate-x-0 overflow-y-auto`}>

        <div>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight text-white">
                NAV<span className="text-teal-400">Farm</span>
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tenant Signup is restricted to Super Admin console, landing page is login-only */}

          {authTab === "login" && (
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <h3 className="text-xl font-bold text-white mb-2">Access your Workspace</h3>

              <Input
                label="Email Address"
                type="email"
                placeholder="admin@navfarm.com"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
                icon={<Mail className="w-4 h-4" />}
              />

              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center w-full">
                  <label className="text-xs font-bold text-gray-400 uppercase">Password</label>
                  <a href="#" className="text-[10px] text-teal-400 hover:underline">Forgot password?</a>
                </div>
                <Input
                  type="password"
                  placeholder="Password@123"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                  icon={<Lock className="w-4 h-4" />}
                />
              </div>

              {loginError && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-lg p-3 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              {loginSuccess && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-lg p-3 flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{loginSuccess}</span>
                </div>
              )}

              <Button type="submit" className="mt-4">
                Authenticate Session
              </Button>

              <div className="text-center text-[10px] text-gray-500 mt-4 leading-relaxed">
                Default Platform Credentials:<br />
                Username: <span className="text-gray-300 font-bold">admin@navfarm.com</span> / Password: <span className="text-gray-300 font-bold">Password@123</span>
              </div>
            </form>
          )}

          {authTab === "signup" && (
            <form onSubmit={handleSignup} className="flex flex-col gap-6">
              <div>
                <h3 className="text-xl font-bold text-white">Create Tenant Account</h3>
                <p className="text-xs text-gray-400 mt-1">Get started with your dedicated enterprise workspace.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Section 1: Tenant Workspace Card */}
                <div className="bg-[#0e1322] border border-gray-800/80 rounded-2xl p-5 flex flex-col gap-4 shadow-inner">
                  <div className="flex items-center gap-2 border-b border-gray-850 pb-2 mb-1">
                    <span className="w-1.5 h-3.5 bg-teal-500 rounded-full"></span>
                    <span className="text-xs font-bold text-white uppercase tracking-wider">Step 1: Workspace Context</span>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase">Subdomain Short Code</label>
                    <div className="relative">
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-500">.navfarm.com</span>
                      <Input
                        placeholder="gvf"
                        value={signupData.tenant_code}
                        onChange={(e) => setSignupData({...signupData, tenant_code: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '')})}
                        required
                        maxLength={20}
                        icon={<Compass className="w-4 h-4" />}
                        className="pr-24"
                      />
                    </div>
                  </div>

                  <Input
                    label="Legal Business / Tenant Name"
                    placeholder="Green Valley Farms Ltd"
                    value={signupData.tenant_name}
                    onChange={(e) => setSignupData({...signupData, tenant_name: e.target.value})}
                    required
                    icon={<Building className="w-4 h-4" />}
                  />

                  <Input
                    label="Billing Contact Email"
                    type="email"
                    placeholder="billing@greenvalley.com"
                    value={signupData.billing_email}
                    onChange={(e) => setSignupData({...signupData, billing_email: e.target.value})}
                    required
                    icon={<Mail className="w-4 h-4" />}
                  />

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase">SaaS Plan selected</label>
                    <select
                      value={signupData.plan_id}
                      onChange={(e) => setSignupData({...signupData, plan_id: e.target.value})}
                      className="w-full bg-[#070a14] border border-gray-800 rounded-xl py-3 px-4 text-sm text-white focus:border-teal-500/50 outline-none"
                    >
                      <option value="PLAN_BASIC">Basic Plan ($99 / mo)</option>
                      <option value="PLAN_PRO">Pro Plan ($199 / mo)</option>
                      <option value="PLAN_ENTERPRISE">Enterprise Plan ($499 / mo)</option>
                    </select>
                  </div>
                </div>

                {/* Section 2: Administrator Profile Card */}
                <div className="bg-[#0e1322] border border-gray-800/80 rounded-2xl p-5 flex flex-col gap-4 shadow-inner justify-between">
                  <div>
                    <div className="flex items-center gap-2 border-b border-gray-850 pb-2 mb-4">
                      <span className="w-1.5 h-3.5 bg-teal-500 rounded-full"></span>
                      <span className="text-xs font-bold text-white uppercase tracking-wider">Step 2: Tenant Administrator</span>
                    </div>

                    <div className="flex flex-col gap-4">
                      <Input
                        label="Admin Full Name"
                        placeholder="Jane Doe"
                        value={signupData.admin_name}
                        onChange={(e) => setSignupData({...signupData, admin_name: e.target.value})}
                        required
                        icon={<Building className="w-4 h-4" />}
                      />

                      <Input
                        label="Admin Email"
                        type="email"
                        placeholder="admin@mycompany.com"
                        value={signupData.admin_email}
                        onChange={(e) => setSignupData({...signupData, admin_email: e.target.value})}
                        required
                        icon={<Mail className="w-4 h-4" />}
                      />

                      <Input
                        label="Admin Password"
                        type="password"
                        placeholder="Minimum 8 characters"
                        value={signupData.admin_password}
                        onChange={(e) => setSignupData({...signupData, admin_password: e.target.value})}
                        required
                        icon={<Lock className="w-4 h-4" />}
                      />
                    </div>
                  </div>

                  <div className="mt-6 flex flex-col gap-4">
                    {signupError && (
                      <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-lg p-3 flex items-start gap-2 animate-fade-in">
                        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>{signupError}</span>
                      </div>
                    )}

                    {signupSuccess && (
                      <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-lg p-3 flex items-start gap-2 animate-fade-in">
                        <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>{signupSuccess}</span>
                      </div>
                    )}

                    <Button type="submit" className="w-full h-12 justify-center font-bold tracking-wide">
                      Provision Workspace Context
                    </Button>
                  </div>
                </div>
              </div>
            </form>
          )}
        </div>

        <div className="text-center text-[10px] text-gray-500 mt-8 border-t border-gray-900 pt-4">
          NAVFarm Multi-Tenant ERP engine uses context AsyncLocalStorage filtering to prevent data leakage.
        </div>

      </div>
    </div>
  );
};
export default AuthDrawer;
