import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { digitalSignatureService } from '../services/digitalSignature.service';
import { SignatureRequest } from '../types/digitalSignature';

export function useDigitalSignature() {
  const queryClient = useQueryClient();

  const signaturesQuery = useQuery({
    queryKey: ['signatures'],
    queryFn: () => digitalSignatureService.getSignatures(),
  });

  const signatureRequestsQuery = useQuery({
    queryKey: ['signature-requests'],
    queryFn: () => digitalSignatureService.getSignatureRequests(),
  });

  const createRequestMutation = useMutation({
    mutationFn: (request: Omit<SignatureRequest, 'id' | 'createdAt' | 'status'>) =>
      digitalSignatureService.createSignatureRequest(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['signature-requests'] });
    },
  });

  const sendRequestMutation = useMutation({
    mutationFn: (requestId: string) =>
      digitalSignatureService.sendSignatureRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['signature-requests'] });
    },
  });

  const signDocumentMutation = useMutation({
    mutationFn: ({ documentId, signerId, signatureData }: {
      documentId: string;
      signerId: string;
      signatureData: any;
    }) => digitalSignatureService.signDocument(documentId, signerId, signatureData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['signatures'] });
    },
  });

  const validateSignatureMutation = useMutation({
    mutationFn: (signatureId: string) =>
      digitalSignatureService.validateSignature(signatureId),
  });

  const deleteRequestMutation = useMutation({
    mutationFn: (requestId: string) =>
      digitalSignatureService.deleteSignatureRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['signature-requests'] });
    },
  });

  return {
    // Queries
    signatures: signaturesQuery.data || [],
    signatureRequests: signatureRequestsQuery.data || [],
    isLoading: signaturesQuery.isLoading || signatureRequestsQuery.isLoading,
    
    // Mutations
    createRequest: createRequestMutation.mutateAsync,
    sendRequest: sendRequestMutation.mutateAsync,
    signDocument: signDocumentMutation.mutateAsync,
    validateSignature: validateSignatureMutation.mutateAsync,
    deleteRequest: deleteRequestMutation.mutateAsync,
    
    // Loading states
    isCreatingRequest: createRequestMutation.isPending,
    isSendingRequest: sendRequestMutation.isPending,
    isSigningDocument: signDocumentMutation.isPending,
    isValidating: validateSignatureMutation.isPending,
    isDeleting: deleteRequestMutation.isPending,
  };
}

export function useDocumentSignatures(documentId: string) {
  return useQuery({
    queryKey: ['signatures', documentId],
    queryFn: () => digitalSignatureService.getSignatures(documentId),
    enabled: !!documentId,
  });
}