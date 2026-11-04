import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Switch, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Action, Page } from '@/components/MobileUI';
import { apiRequest } from '@/lib/api';
import { useMobileSession } from '@/lib/session';
import { theme } from '@/lib/theme';

type Notice = { id:string; title:string; message:string; created_at:string; read_at:string|null };
export default function NotificationsScreen(){
  const {token,tenant}=useMobileSession(); const [rows,setRows]=useState<Notice[]>([]); const [silenced,setSilenced]=useState(false); const [loading,setLoading]=useState(true); const seen=useRef<Set<string>>(new Set());
  const refresh=useCallback(async()=>{if(!token)return;try{const [notices,prefs]=await Promise.all([apiRequest<Notice[]>('/notifications',token,tenant?.id),apiRequest<{silenced:boolean}>('/notifications/preferences',token,tenant?.id)]);const fresh=notices.filter(n=>!seen.current.has(n.id));if(seen.current.size>0&&fresh.length&&!prefs.silenced)Alert.alert('Nova notificação',fresh[0].title);seen.current=new Set(notices.map(n=>n.id));setRows(notices);setSilenced(prefs.silenced);}catch(e){Alert.alert('Falha ao carregar',e instanceof Error?e.message:'Tente novamente.');}finally{setLoading(false);}},[token,tenant]);
  useFocusEffect(useCallback(()=>{void refresh();const timer=setInterval(()=>void refresh(),5000);return()=>clearInterval(timer);},[refresh]));
  const markRead=async(id:string)=>{if(!token)return;try{await apiRequest(`/notifications/${id}/read`,token,tenant?.id,{method:'POST'});setRows(v=>v.map(n=>n.id===id?{...n,read_at:new Date().toISOString()}:n));}catch(e){Alert.alert('Falha',e instanceof Error?e.message:'Tente novamente.');}};
  const remove=async(id:string)=>{if(!token)return;try{await apiRequest(`/notifications/${id}`,token,tenant?.id,{method:'DELETE'});setRows(v=>v.filter(n=>n.id!==id));}catch(e){Alert.alert('Falha',e instanceof Error?e.message:'Tente novamente.');}};
  const toggle=async(value:boolean)=>{if(!token)return;try{await apiRequest('/notifications/preferences',token,tenant?.id,{method:'PUT',body:JSON.stringify({silenced:value})});setSilenced(value);}catch(e){Alert.alert('Falha ao salvar preferência',e instanceof Error?e.message:'Tente novamente.');}};
  return <Page title="Notificações" subtitle="O histórico fica guardado até você apagar as mensagens.">
    <View style={styles.preference}><Text style={styles.label}>Receber alertas</Text><Switch value={!silenced} onValueChange={value=>void toggle(!value)} trackColor={{true:theme.accent}}/></View>
    {loading?<ActivityIndicator color={theme.accent}/>:rows.length===0?<Text style={styles.empty}>Nenhuma notificação por enquanto.</Text>:rows.map(n=><View key={n.id} style={styles.card}><Text style={styles.title}>{n.title}</Text><Text style={styles.message}>{n.message}</Text><Text style={styles.date}>{new Date(n.created_at).toLocaleString('pt-BR')}</Text><View style={styles.actions}>{!n.read_at?<Action label="Marcar como lida" secondary onPress={()=>void markRead(n.id)}/>:null}<Action label="Apagar" secondary onPress={()=>void remove(n.id)}/></View></View>)}
  </Page>;
}
const styles=StyleSheet.create({preference:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',padding:14,borderRadius:14,backgroundColor:theme.surface,borderWidth:1,borderColor:theme.border},label:{color:theme.ink,fontWeight:'700'},card:{gap:8,padding:15,borderRadius:15,backgroundColor:theme.surface,borderWidth:1,borderColor:theme.border},title:{color:theme.ink,fontWeight:'800'},message:{color:theme.muted},date:{color:theme.muted,fontSize:12},actions:{gap:8},empty:{color:theme.muted}});
