// src/pages/auth/LoginPage.tsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Scale, Mail, Lock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'E-mail é obrigatório')
    .email('E-mail inválido'),
  password: z
    .string()
    .min(1, 'Senha é obrigatória')
    .min(6, 'Senha deve ter pelo menos 6 caracteres'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoginLoading, loginError } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data);
    } catch (error: any) {
      // Erro já é tratado no hook useAuth com toast
      // Mas podemos mostrar erro específico no formulário se quiser
      if (error.message?.includes('Credenciais inválidas')) {
        setError('email', { message: 'E-mail ou senha incorretos' });
        setError('password', { message: 'E-mail ou senha incorretos' });
      }
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo e Título */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-slate-900 rounded-full">
              <Scale className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Autumnus Juris
          </h1>
          <p className="text-slate-600 text-sm">
            Sistema de Gestão Jurídica
          </p>
        </div>

        {/* Card de Login */}
        <Card className="border-0 shadow-xl">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-xl text-center font-semibold text-slate-800">
              Acesse sua conta
            </CardTitle>
            <p className="text-sm text-slate-600 text-center">
              Entre com suas credenciais para continuar
            </p>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Erro geral */}
            {loginError && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-800 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>Falha no login. Verifique suas credenciais e tente novamente.</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Campo E-mail */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                  E-mail
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    className="pl-10 h-11 border-slate-200 focus:border-slate-900 focus:ring-slate-900"
                    {...register('email')}
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              {/* Campo Senha */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-slate-700">
                  Senha
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Digite sua senha"
                    className="pl-10 pr-10 h-11 border-slate-200 focus:border-slate-900 focus:ring-slate-900"
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>

              {/* Link Esqueci Senha */}
              <div className="flex justify-end">
                <button
                  type="button"
                  className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
                  onClick={() => {
                    // TODO: Implementar recuperação de senha
                    alert('Funcionalidade em desenvolvimento');
                  }}
                >
                  Esqueceu sua senha?
                </button>
              </div>

              {/* Botão de Login */}
              <Button
                type="submit"
                className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white font-medium transition-colors"
                disabled={isSubmitting || isLoginLoading}
              >
                {isSubmitting || isLoginLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Entrando...
                  </div>
                ) : (
                  'Entrar'
                )}
              </Button>
            </form>

            {/* Usuários de demonstração */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="text-sm font-medium text-blue-900 mb-2">
                Usuários de demonstração:
              </h4>
              <div className="space-y-1 text-xs text-blue-800">
                <p><strong>Admin:</strong> joao@autumnusjuris.com / 123456</p>
                <p><strong>Advogado:</strong> maria@autumnusjuris.com / 123456</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-slate-500">
            © 2024 Autumnus Juris. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}