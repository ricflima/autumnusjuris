// src/pages/clients/CreateClient.tsx - CORRIGIDO
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, User, Building, Mail, Phone, MapPin } from 'lucide-react';
import { clientsService, type CreateClientRequest } from '@/services/clients.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import toast from 'react-hot-toast';

const createClientSchema = z.object({
  name: z
    .string()
    .min(1, 'Nome é obrigatório')
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),
  
  email: z
    .string()
    .min(1, 'E-mail é obrigatório')
    .email('E-mail inválido'),
  
  phone: z
    .string()
    .min(1, 'Telefone é obrigatório')
    .regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, 'Formato inválido. Use (11) 99999-9999'),
  
  document: z
    .string()
    .min(1, 'Documento é obrigatório'),
  
  documentType: z.enum(['cpf', 'cnpj']),
  
  type: z.enum(['individual', 'company']),
  
  classification: z.enum(['vip', 'premium', 'standard', 'basic']),
  
  // Endereço
  street: z
    .string()
    .min(1, 'Logradouro é obrigatório')
    .max(100, 'Logradouro muito longo'),
  
  number: z
    .string()
    .min(1, 'Número é obrigatório'),
  
  complement: z
    .string()
    .optional(),
  
  neighborhood: z
    .string()
    .min(1, 'Bairro é obrigatório'),
  
  city: z
    .string()
    .min(1, 'Cidade é obrigatória'),
  
  state: z
    .string()
    .min(2, 'Estado é obrigatório')
    .max(2, 'Use a sigla do estado (SP, RJ, etc.)'),
  
  zipCode: z
    .string()
    .min(1, 'CEP é obrigatório')
    .regex(/^\d{5}-\d{3}$/, 'Formato do CEP inválido. Use 12345-678'),
  
  country: z
    .string()
    .default('Brasil'),
  
  // Campos específicos para pessoa física
  birthDate: z
    .string()
    .optional()
    .refine((val) => {
      if (!val) return true;
      const date = new Date(val);
      const now = new Date();
      const age = now.getFullYear() - date.getFullYear();
      return age >= 16 && age <= 120;
    }, 'Idade deve estar entre 16 e 120 anos'),
  
  profession: z
    .string()
    .optional(),
  
  maritalStatus: z
    .string()
    .optional(),
  
  // Campos específicos para pessoa jurídica
  contactPerson: z
    .string()
    .optional(),
  
  // Campos gerais
  notes: z
    .string()
    .optional()
    .refine((val) => {
      if (!val) return true;
      return val.length <= 1000;
    }, 'Observações devem ter no máximo 1000 caracteres'),
}).refine((data) => {
  // Validação do documento baseada no tipo
  if (data.documentType === 'cpf') {
    return /^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(data.document);
  } else {
    return /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/.test(data.document);
  }
}, {
  message: 'Formato do documento inválido',
  path: ['document']
}).refine((data) => {
  // Campos obrigatórios para pessoa física
  if (data.type === 'individual') {
    return data.birthDate && data.profession;
  }
  return true;
}, {
  message: 'Data de nascimento e profissão são obrigatórias para pessoa física',
  path: ['birthDate']
}).refine((data) => {
  // Campos obrigatórios para pessoa jurídica
  if (data.type === 'company') {
    return data.contactPerson;
  }
  return true;
}, {
  message: 'Pessoa de contato é obrigatória para pessoa jurídica',
  path: ['contactPerson']
});

type CreateClientFormData = z.infer<typeof createClientSchema>;

const BRAZILIAN_STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

const MARITAL_STATUS = [
  'Solteiro(a)',
  'Casado(a)',
  'Divorciado(a)',
  'Viúvo(a)',
  'União Estável',
  'Separado(a)'
];

export default function CreateClient() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [clientType, setClientType] = useState<'individual' | 'company'>('individual');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<CreateClientFormData>({
    resolver: zodResolver(createClientSchema),
    defaultValues: {
      type: 'individual',
      documentType: 'cpf',
      classification: 'standard',
      country: 'Brasil',
    },
    mode: 'onChange',
  });

  const watchType = watch('type');
  const watchDocumentType = watch('documentType');

  // Atualizar tipo de cliente quando mudar
  useEffect(() => {
    if (watchType !== clientType) {
      setClientType(watchType);
      // Limpar campos específicos quando mudar o tipo
      if (watchType === 'individual') {
        setValue('documentType', 'cpf');
        setValue('contactPerson', '');
      } else {
        setValue('documentType', 'cnpj');
        setValue('birthDate', '');
        setValue('profession', '');
        setValue('maritalStatus', '');
      }
    }
  }, [watchType, clientType, setValue]);

  // Mutation para criar cliente
  const createClientMutation = useMutation({
    mutationFn: (data: CreateClientRequest) => clientsService.createClient(data),
    onSuccess: (newClient) => {
      // Invalidar cache de clientes
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      
      toast.success('Cliente criado com sucesso!', {
        duration: 4000,
        icon: '✅',
      });
      
      // Navegar para o cliente criado
      navigate(`/clients/${newClient.id}`);
    },
    onError: (error: any) => {
      const message = error.message || 'Erro ao criar cliente. Tente novamente.';
      toast.error(message, {
        duration: 5000,
        icon: '❌',
      });
    },
  });

  const onSubmit = async (data: CreateClientFormData) => {
    try {
      // Preparar dados para envio
      const requestData: CreateClientRequest = {
        name: data.name,
        email: data.email,
        phone: data.phone,
        document: data.document,
        documentType: data.documentType,
        type: data.type,
        classification: data.classification,
        address: {
          street: data.street,
          number: data.number,
          complement: data.complement || '',
          neighborhood: data.neighborhood,
          city: data.city,
          state: data.state,
          zipCode: data.zipCode,
          country: data.country,
        },
        contactPerson: data.contactPerson,
        birthDate: data.birthDate,
        profession: data.profession,
        maritalStatus: data.maritalStatus,
        notes: data.notes,
        customFields: {},
      };
      
      await createClientMutation.mutateAsync(requestData);
    } catch (error) {
      console.error('Erro ao criar cliente:', error);
    }
  };

  const handleCancel = () => {
    if (confirm('Tem certeza que deseja cancelar? Todos os dados serão perdidos.')) {
      navigate('/clients');
    }
  };

  // Formatação automática de campos
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length <= 11) {
      value = value.replace(/(\d{2})(\d{4,5})(\d{4})/, '($1) $2-$3');
    }
    setValue('phone', value);
  };

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (watchDocumentType === 'cpf') {
      value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    } else {
      value = value.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    setValue('document', value);
  };

  const handleZipCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    value = value.replace(/(\d{5})(\d{3})/, '$1-$2');
    setValue('zipCode', value);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate('/clients')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
          
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
              <User className="w-8 h-8 text-blue-600" />
              Novo Cliente
            </h1>
            <p className="text-gray-600 mt-1">
              Preencha as informações do cliente
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={createClientMutation.isPending}
          >
            Cancelar
          </Button>
          
          <Button
            onClick={handleSubmit(onSubmit)}
            disabled={!isValid || createClientMutation.isPending}
            className="flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {createClientMutation.isPending ? 'Salvando...' : 'Salvar Cliente'}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Tipo de Cliente */}
        <Card>
          <CardHeader>
            <CardTitle>Tipo de Cliente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="individual"
                  value="individual"
                  {...register('type')}
                  className="w-4 h-4"
                />
                <label htmlFor="individual" className="flex items-center gap-2 cursor-pointer">
                  <User className="w-4 h-4" />
                  Pessoa Física
                </label>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="company"
                  value="company"
                  {...register('type')}
                  className="w-4 h-4"
                />
                <label htmlFor="company" className="flex items-center gap-2 cursor-pointer">
                  <Building className="w-4 h-4" />
                  Pessoa Jurídica
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Informações Básicas */}
        <Card>
          <CardHeader>
            <CardTitle>Informações Básicas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nome/Razão Social */}
              <div className="md:col-span-2">
                <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                  {clientType === 'individual' ? 'Nome Completo' : 'Razão Social'} *
                </Label>
                <Input
                  id="name"
                  {...register('name')}
                  placeholder={clientType === 'individual' ? 'João da Silva' : 'Empresa ABC Ltda'}
                  className="mt-1"
                />
                {errors.email && (
                  <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>
                )}
              </div>

              {/* Telefone */}
              <div>
                <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                  Telefone *
                </Label>
                <div className="relative mt-1">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="phone"
                    {...register('phone')}
                    onChange={handlePhoneChange}
                    placeholder="(11) 99999-9999"
                    maxLength={15}
                    className="pl-10"
                  />
                </div>
                {errors.phone && (
                  <p className="text-sm text-red-600 mt-1">{errors.phone.message}</p>
                )}
              </div>

              {/* Documento */}
              <div>
                <Label htmlFor="document" className="text-sm font-medium text-gray-700">
                  {watchDocumentType === 'cpf' ? 'CPF' : 'CNPJ'} *
                </Label>
                <div className="flex gap-2 mt-1">
                  <select
                    {...register('documentType')}
                    className="px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                  >
                    <option value="cpf">CPF</option>
                    <option value="cnpj">CNPJ</option>
                  </select>
                  <Input
                    id="document"
                    {...register('document')}
                    onChange={handleDocumentChange}
                    placeholder={watchDocumentType === 'cpf' ? '123.456.789-00' : '12.345.678/0001-90'}
                    maxLength={watchDocumentType === 'cpf' ? 14 : 18}
                    className="flex-1"
                  />
                </div>
                {errors.document && (
                  <p className="text-sm text-red-600 mt-1">{errors.document.message}</p>
                )}
              </div>

              {/* Classificação */}
              <div>
                <Label htmlFor="classification" className="text-sm font-medium text-gray-700">
                  Classificação *
                </Label>
                <select
                  id="classification"
                  {...register('classification')}
                  className="mt-1 block w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                >
                  <option value="basic">Básico</option>
                  <option value="standard">Padrão</option>
                  <option value="premium">Premium</option>
                  <option value="vip">VIP</option>
                </select>
                {errors.classification && (
                  <p className="text-sm text-red-600 mt-1">{errors.classification.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Informações Específicas */}
        {clientType === 'individual' ? (
          <Card>
            <CardHeader>
              <CardTitle>Informações Pessoais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Data de Nascimento */}
                <div>
                  <Label htmlFor="birthDate" className="text-sm font-medium text-gray-700">
                    Data de Nascimento *
                  </Label>
                  <Input
                    id="birthDate"
                    type="date"
                    {...register('birthDate')}
                    className="mt-1"
                  />
                  {errors.birthDate && (
                    <p className="text-sm text-red-600 mt-1">{errors.birthDate.message}</p>
                  )}
                </div>

                {/* Profissão */}
                <div>
                  <Label htmlFor="profession" className="text-sm font-medium text-gray-700">
                    Profissão *
                  </Label>
                  <Input
                    id="profession"
                    {...register('profession')}
                    placeholder="Engenheiro, Médico, etc."
                    className="mt-1"
                  />
                  {errors.profession && (
                    <p className="text-sm text-red-600 mt-1">{errors.profession.message}</p>
                  )}
                </div>

                {/* Estado Civil */}
                <div>
                  <Label htmlFor="maritalStatus" className="text-sm font-medium text-gray-700">
                    Estado Civil
                  </Label>
                  <select
                    id="maritalStatus"
                    {...register('maritalStatus')}
                    className="mt-1 block w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                  >
                    <option value="">Selecione...</option>
                    {MARITAL_STATUS.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                  {errors.maritalStatus && (
                    <p className="text-sm text-red-600 mt-1">{errors.maritalStatus.message}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Informações da Empresa</CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="contactPerson" className="text-sm font-medium text-gray-700">
                  Pessoa de Contato *
                </Label>
                <Input
                  id="contactPerson"
                  {...register('contactPerson')}
                  placeholder="João Silva (Diretor Jurídico)"
                  className="mt-1"
                />
                {errors.contactPerson && (
                  <p className="text-sm text-red-600 mt-1">{errors.contactPerson.message}</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Endereço */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Endereço
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* CEP */}
              <div>
                <Label htmlFor="zipCode" className="text-sm font-medium text-gray-700">
                  CEP *
                </Label>
                <Input
                  id="zipCode"
                  {...register('zipCode')}
                  onChange={handleZipCodeChange}
                  placeholder="12345-678"
                  maxLength={9}
                  className="mt-1"
                />
                {errors.zipCode && (
                  <p className="text-sm text-red-600 mt-1">{errors.zipCode.message}</p>
                )}
              </div>

              {/* Logradouro */}
              <div className="md:col-span-2">
                <Label htmlFor="street" className="text-sm font-medium text-gray-700">
                  Logradouro *
                </Label>
                <Input
                  id="street"
                  {...register('street')}
                  placeholder="Rua das Flores, Av. Paulista, etc."
                  className="mt-1"
                />
                {errors.street && (
                  <p className="text-sm text-red-600 mt-1">{errors.street.message}</p>
                )}
              </div>

              {/* Número */}
              <div>
                <Label htmlFor="number" className="text-sm font-medium text-gray-700">
                  Número *
                </Label>
                <Input
                  id="number"
                  {...register('number')}
                  placeholder="123"
                  className="mt-1"
                />
                {errors.number && (
                  <p className="text-sm text-red-600 mt-1">{errors.number.message}</p>
                )}
              </div>

              {/* Complemento */}
              <div>
                <Label htmlFor="complement" className="text-sm font-medium text-gray-700">
                  Complemento
                </Label>
                <Input
                  id="complement"
                  {...register('complement')}
                  placeholder="Apto 45, Sala 12, etc."
                  className="mt-1"
                />
              </div>

              {/* Bairro */}
              <div>
                <Label htmlFor="neighborhood" className="text-sm font-medium text-gray-700">
                  Bairro *
                </Label>
                <Input
                  id="neighborhood"
                  {...register('neighborhood')}
                  placeholder="Centro, Vila Olimpia, etc."
                  className="mt-1"
                />
                {errors.neighborhood && (
                  <p className="text-sm text-red-600 mt-1">{errors.neighborhood.message}</p>
                )}
              </div>

              {/* Cidade */}
              <div>
                <Label htmlFor="city" className="text-sm font-medium text-gray-700">
                  Cidade *
                </Label>
                <Input
                  id="city"
                  {...register('city')}
                  placeholder="São Paulo"
                  className="mt-1"
                />
                {errors.city && (
                  <p className="text-sm text-red-600 mt-1">{errors.city.message}</p>
                )}
              </div>

              {/* Estado */}
              <div>
                <Label htmlFor="state" className="text-sm font-medium text-gray-700">
                  Estado *
                </Label>
                <select
                  id="state"
                  {...register('state')}
                  className="mt-1 block w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                >
                  <option value="">Selecione...</option>
                  {BRAZILIAN_STATES.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
                {errors.state && (
                  <p className="text-sm text-red-600 mt-1">{errors.state.message}</p>
                )}
              </div>

              {/* País */}
              <div>
                <Label htmlFor="country" className="text-sm font-medium text-gray-700">
                  País
                </Label>
                <Input
                  id="country"
                  {...register('country')}
                  className="mt-1"
                  readOnly
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Observações */}
        <Card>
          <CardHeader>
            <CardTitle>Observações Adicionais</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <Label htmlFor="notes" className="text-sm font-medium text-gray-700">
                Observações
              </Label>
              <textarea
                id="notes"
                {...register('notes')}
                rows={4}
                placeholder="Informações importantes sobre o cliente, histórico, preferências, etc."
                className="mt-1 block w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent resize-vertical"
                maxLength={1000}
              />
              {errors.notes && (
                <p className="text-sm text-red-600 mt-1">{errors.notes.message}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Máximo 1000 caracteres
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Botões de ação (duplicados no final) */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={createClientMutation.isPending}
          >
            Cancelar
          </Button>
          
          <Button
            type="submit"
            disabled={!isValid || createClientMutation.isPending}
            className="flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {createClientMutation.isPending ? 'Salvando...' : 'Criar Cliente'}
          </Button>
        </div>
      </form>
    </div>
  );
}.name && (
                  <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
                )}
              </div>

              {/* E-mail */}
              <div>
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  E-mail *
                </Label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="email"
                    type="email"
                    {...register('email')}
                    placeholder="exemplo@email.com"
                    className="pl-10"
                  />
                </div>
                {errors
