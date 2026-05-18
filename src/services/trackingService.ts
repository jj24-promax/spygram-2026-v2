import { supabase } from '../integrations/supabase/client';

export const trackLead = async (data: {
  username_searched?: string;
  full_name?: string;
  profile_pic?: string;
  email?: string;
  phone?: string;
  document?: string;
  status?: string;
  amount?: number; 
  city?: string;
  state?: string;
  ip_address?: string;
}) => {
  try {
    const userAgent = navigator.userAgent;
    
    // Tenta recuperar ID do lead da sessão para atualizar o mesmo registro
    const existingLeadId = sessionStorage.getItem('current_lead_id');

    const updateData: any = { ...data };
    
    // Mapeia 'amount' para 'total_amount' se presente
    if (data.amount !== undefined) {
      updateData.total_amount = data.amount;
      delete updateData.amount;
    }

    if (existingLeadId) {
      console.log(`[tracking] Atualizando lead existente: ${existingLeadId}`);
      const { error } = await supabase
        .from('leads')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingLeadId);
      
      if (error) {
        console.error('[tracking] Erro ao atualizar lead:', error.message);
        // Se falhar a atualização (ex: lead deletado no admin), tenta inserir um novo
        sessionStorage.removeItem('current_lead_id');
      } else {
        return; // Sucesso na atualização
      }
    }

    // Se não houver ID ou a atualização falhou, insere um novo registro
    console.log('[tracking] Criando novo registro de lead');
    const { data: newLead, error: insertError } = await supabase
      .from('leads')
      .insert([{
        ...updateData,
        user_agent: userAgent
      }])
      .select()
      .single();

    if (insertError) {
      console.error('[tracking] Erro ao criar lead:', insertError.message);
    } else if (newLead) {
      sessionStorage.setItem('current_lead_id', newLead.id);
    }
  } catch (err) {
    console.error('[tracking] Falha crítica no rastreamento:', err);
  }
};