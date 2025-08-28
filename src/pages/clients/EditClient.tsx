// src/pages/clients/EditClient.tsx
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Save, User, Building, Mail, Phone, MapPin } from 'lucide-react';
import { clientsService, type UpdateClientRequest } from '@/services/clients.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const editClientSchema = z.object({
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
    .min(1, 'Número é obrigatório')
    .max(10, 'Número muito longo'),
  
  complement: z
    .string()
    .max(50, 'Complemento muito longo')
    .optional(),
  
  neighborhood: z
    .string()
    .min(1, 'Bairro é obrigatório')
    .max(50, 'Bairro muito longo'),
  
  city: z
    .string()
    .min(1, 'Cidade é obrigatória')
    .max(50, 'Cidade muito longa'),
  
  state: z
    .string()
    .min(1, 'Estado é obrigatório')
    .max(2, 'Use a sigla do estado')
    .toUpperCase(),
  
  zipCode: z
    .string()
    .min(1, 'CEP é obrigatório')
    .regex(/^\d{5}-\d{3}$/, 'Formato inválido. Use 12345-678'),
  
  // Observações
  notes: z
    .string()
    .max(500, 'Observações muito longas')
    .optional(),
});

type EditClientFormData = z.infer<typeof editClientSchema>;

const EditClient = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Buscar dados do cliente
  const { data: client, isLoading: isLoadingClient } = useQuery({
    queryKey: ['client', id],
    queryFn: () => clientsService.getClientById(id!),
    enabled: !!id,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<EditClientFormData>({
    resolver: zodResolver(editClientSchema),
  });

  // Preencher formulário quando cliente for carregado
  useEffect(() => {
    if (client) {
      setValue('name', client.name);
      setValue('email', client.email);
      setValue('phone', client.phone);
      setValue('document', client.document);
      setValue('documentType', client.documentType);
      setValue('type', client.type);
      setValue('classification', client.classification);
      setValue('street', client.address.street);
      setValue('number', client.address.number);
      setValue('complement', client.address.complement || '');
      setValue('neighborhood', client.address.neighborhood);
      setValue('city', client.address.city);
      setValue('state', client.address.state);
      setValue('zipCode', client.address.zipCode);
      setValue('notes', client.notes || '');
    }
  }, [client, setValue]);

  const updateClientMutation = useMutation({
    mutationFn: (data: UpdateClientRequest) => clientsService.updateClient(id!, data),
    onSuccess: () => {
      toast.success('Cliente atualizado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['client', id] });
      navigate('/clients');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao atualizar cliente');
    },
  });

  const onSubmit = async (data: EditClientFormData) => {
    try {
      setIsSubmitting(true);
      
      const updateData: UpdateClientRequest = {
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
          complement: data.complement,
          neighborhood: data.neighborhood,
          city: data.city,
          state: data.state,
          zipCode: data.zipCode,
          country: 'Brasil',
        },
        notes: data.notes,
      };

      await updateClientMutation.mutateAsync(updateData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  };

  const formatZipCode = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/(\d{5})(\d{3})/, '$1-$2');
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setValue('phone', formatted);
  };

  const handleZipCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatZipCode(e.target.value);
    setValue('zipCode', formatted);
  };

  if (isLoadingClient) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">Cliente não encontrado</h2>
        <p className="text-gray-600 mt-2">O cliente solicitado não foi encontrado.</p>
        <Link to="/clients">
          <Button className="mt-4">Voltar para Lista</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/clients">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Editar Cliente</h1>
          <p className="text-gray-600">Edite as informações do cliente</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Informações Básicas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Informações Básicas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nome Completo *</Label>
                <Input
                  id="name"
                  {...register('name')}
                  placeholder="Nome completo do cliente"
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && (
                  <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="email">E-mail *</Label>
                <Input
                  id="email"
                  type="email"
                  {...register('email')}
                  placeholder="cliente@email.com"
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && (
                  <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="phone">Telefone *</Label>
                <Input
                  id="phone"
                  {...register('phone')}
                  onChange={handlePhoneChange}
                  placeholder="(11) 99999-9999"
                  className={errors.phone ? 'border-red-500' : ''}
                />
                {errors.phone && (
                  <p className="text-sm text-red-600 mt-1">{errors.phone.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="documentType">Tipo de Documento *</Label>
                <select
                  {...register('documentType')}
                  className={`w-full px-3 py-2 border rounded-md ${errors.documentType ? 'border-red-500' : 'border-gray-300'}`}
                >
                  <option value="cpf">CPF</option>
                  <option value="cnpj">CNPJ</option>
                </select>
                {errors.documentType && (
                  <p className="text-sm text-red-600 mt-1">{errors.documentType.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="document">Documento *</Label>
                <Input
                  id="document"
                  {...register('document')}
                  placeholder="000.000.000-00 ou 00.000.000/0001-00"
                  className={errors.document ? 'border-red-500' : ''}
                />
                {errors.document && (
                  <p className="text-sm text-red-600 mt-1">{errors.document.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="type">Tipo de Cliente *</Label>
                <select
                  {...register('type')}
                  className={`w-full px-3 py-2 border rounded-md ${errors.type ? 'border-red-500' : 'border-gray-300'}`}
                >
                  <option value="individual">Pessoa Física</option>
                  <option value="company">Pessoa Jurídica</option>
                </select>
                {errors.type && (
                  <p className="text-sm text-red-600 mt-1">{errors.type.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="classification">Classificação *</Label>
                <select
                  {...register('classification')}
                  className={`w-full px-3 py-2 border rounded-md ${errors.classification ? 'border-red-500' : 'border-gray-300'}`}
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
              <div className="md:col-span-2">
                <Label htmlFor="street">Logradouro *</Label>
                <Input
                  id="street"
                  {...register('street')}
                  placeholder="Rua, Avenida, etc."
                  className={errors.street ? 'border-red-500' : ''}
                />
                {errors.street && (
                  <p className="text-sm text-red-600 mt-1">{errors.street.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="number">Número *</Label>
                <Input
                  id="number"
                  {...register('number')}
                  placeholder="123"
                  className={errors.number ? 'border-red-500' : ''}
                />
                {errors.number && (
                  <p className="text-sm text-red-600 mt-1">{errors.number.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="complement">Complemento</Label>
                <Input
                  id="complement"
                  {...register('complement')}
                  placeholder="Apto, Sala, etc."
                />
              </div>

              <div>
                <Label htmlFor="neighborhood">Bairro *</Label>
                <Input
                  id="neighborhood"
                  {...register('neighborhood')}
                  placeholder="Nome do bairro"
                  className={errors.neighborhood ? 'border-red-500' : ''}
                />
                {errors.neighborhood && (
                  <p className="text-sm text-red-600 mt-1">{errors.neighborhood.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="city">Cidade *</Label>
                <Input
                  id="city"
                  {...register('city')}
                  placeholder="Nome da cidade"
                  className={errors.city ? 'border-red-500' : ''}
                />
                {errors.city && (
                  <p className="text-sm text-red-600 mt-1">{errors.city.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="state">Estado *</Label>
                <Input
                  id="state"
                  {...register('state')}
                  placeholder="SP"
                  maxLength={2}
                  className={errors.state ? 'border-red-500' : ''}
                />
                {errors.state && (
                  <p className="text-sm text-red-600 mt-1">{errors.state.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="zipCode">CEP *</Label>
                <Input
                  id="zipCode"
                  {...register('zipCode')}
                  onChange={handleZipCodeChange}
                  placeholder="12345-678"
                  className={errors.zipCode ? 'border-red-500' : ''}
                />
                {errors.zipCode && (
                  <p className="text-sm text-red-600 mt-1">{errors.zipCode.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Observações */}
        <Card>
          <CardHeader>
            <CardTitle>Observações</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <Label htmlFor="notes">Observações Gerais</Label>
              <textarea
                id="notes"
                {...register('notes')}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
                placeholder="Informações adicionais sobre o cliente..."
              />
              {errors.notes && (
                <p className="text-sm text-red-600 mt-1">{errors.notes.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Ações */}
        <div className="flex items-center justify-between">
          <Link to="/clients">
            <Button type="button" variant="outline">
              Cancelar
            </Button>
          </Link>

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Salvar Alterações
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EditClient;