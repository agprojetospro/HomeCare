"use client";

import { useState, useEffect } from "react";
import { store } from "@/services/store.service";
import {
  FamilyAccessGrant,
  FamilyFeedback,
  CareDailySummary,
  FamilyTimelineEvent,
} from "@/domain/family/family.schema";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  HeartHandshake,
  Heart,
  Smile,
  ShieldCheck,
  CalendarCheck,
  Clock,
  Pill,
  Utensils,
  MessageSquareHeart,
  Star,
  CheckCircle2,
  AlertCircle,
  PhoneCall,
  Lock,
  UserCheck,
} from "lucide-react";
import { formatDateTime, formatDate } from "@/lib/utils";

export default function FamilyPortalPage() {
  const [patients, setPatients] = useState(store.getPatients());
  const [selectedPatientId, setSelectedPatientId] = useState<string>(patients[0]?.id || "pat_antonio");
  const [grants, setGrants] = useState<FamilyAccessGrant[]>([]);
  const [timeline, setTimeline] = useState<FamilyTimelineEvent[]>([]);
  const [summary, setSummary] = useState<CareDailySummary | null>(null);
  const [feedbacks, setFeedbacks] = useState<FamilyFeedback[]>([]);

  // Modais
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [isGrantModalOpen, setIsGrantModalOpen] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  // Formulário de Feedback
  const [feedbackForm, setFeedbackForm] = useState({
    rating: 5,
    category: "ATENDIMENTO_EQUIPE" as FamilyFeedback["category"],
    comment: "",
  });

  // Formulário de Concessão de Acesso
  const [grantForm, setGrantForm] = useState({
    familyUserName: "",
    familyEmail: "",
    familyPhone: "",
    relationship: "FILHO_FILHA" as FamilyAccessGrant["relationship"],
    accessLevel: "VISAO_COMPLETA_LEIGA" as FamilyAccessGrant["accessLevel"],
    notes: "",
  });

  useEffect(() => {
    store.initClient();
    const pList = store.getPatients();
    setPatients(pList);
    const patId = selectedPatientId || pList[0]?.id || "pat_antonio";
    setSelectedPatientId(patId);
    setGrants(store.getFamilyAccessGrants(patId));
    setTimeline(store.getFamilyTimeline(patId));
    setSummary(store.getFamilyDailySummary(patId));
    setFeedbacks(store.getFamilyFeedbacks(patId));
  }, [selectedPatientId]);

  const handlePatientChange = (patId: string) => {
    setSelectedPatientId(patId);
    setGrants(store.getFamilyAccessGrants(patId));
    setTimeline(store.getFamilyTimeline(patId));
    setSummary(store.getFamilyDailySummary(patId));
    setFeedbacks(store.getFamilyFeedbacks(patId));
  };

  const handleSendFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackForm.comment.trim()) return;

    store.submitFamilyFeedback({
      patientId: selectedPatientId,
      familyUserId: "user_fam_clara",
      familyUserName: "Clara de Albuquerque (Familiar)",
      rating: feedbackForm.rating,
      category: feedbackForm.category,
      comment: feedbackForm.comment,
    });

    setFeedbacks(store.getFamilyFeedbacks(selectedPatientId));
    setIsFeedbackModalOpen(false);
    setFeedbackSuccess(true);
    setFeedbackForm({ rating: 5, category: "ATENDIMENTO_EQUIPE", comment: "" });
    setTimeout(() => setFeedbackSuccess(false), 5000);
  };

  const handleCreateGrant = (e: React.FormEvent) => {
    e.preventDefault();
    store.grantFamilyAccess({
      patientId: selectedPatientId,
      familyUserId: `user_fam_${Date.now()}`,
      familyUserName: grantForm.familyUserName,
      familyEmail: grantForm.familyEmail,
      familyPhone: grantForm.familyPhone,
      relationship: grantForm.relationship,
      accessLevel: grantForm.accessLevel,
      active: true,
      notes: grantForm.notes,
    });

    setGrants(store.getFamilyAccessGrants(selectedPatientId));
    setIsGrantModalOpen(false);
    setGrantForm({
      familyUserName: "",
      familyEmail: "",
      familyPhone: "",
      relationship: "FILHO_FILHA",
      accessLevel: "VISAO_COMPLETA_LEIGA",
      notes: "",
    });
  };

  const selectedPatient = store.getPatientById(selectedPatientId);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Acolhedor */}
      <div className="bg-gradient-to-r from-teal-800 via-emerald-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge className="bg-white/20 text-teal-200 border-white/20 text-xs px-3 py-1 backdrop-blur-md">
                <HeartHandshake className="h-3.5 w-3.5 mr-1.5" /> Portal da Família & Cuidador
              </Badge>
              <Badge variant="outline" className="text-white/80 border-white/20 text-[11px] gap-1">
                <ShieldCheck className="h-3 w-3 text-teal-300" /> Protegido por Sigilo & LGPD
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Acompanhamento de {selectedPatient?.fullName || "Seu Familiar"}
            </h1>
            <p className="text-sm text-teal-100/90 max-w-2xl leading-relaxed">
              Informações claras e transparentes sobre o bem-estar diário, horários da equipe e cuidados administrados.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {/* Seletor de Paciente para visualização */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-1.5 border border-white/20">
              <label className="block text-[10px] text-teal-200 uppercase font-bold px-2 pb-0.5">Paciente Vinculado</label>
              <select
                className="bg-transparent text-white font-semibold text-xs border-none focus:outline-none px-2 cursor-pointer"
                value={selectedPatientId}
                onChange={(e) => handlePatientChange(e.target.value)}
              >
                {patients.map((p) => (
                  <option key={p.id} value={p.id} className="text-slate-900">
                    {p.fullName}
                  </option>
                ))}
              </select>
            </div>

            <Button
              onClick={() => setIsFeedbackModalOpen(true)}
              className="bg-white text-teal-950 hover:bg-teal-50 font-bold gap-2 text-xs shadow-lg"
            >
              <MessageSquareHeart className="h-4 w-4 text-rose-600" />
              Avaliar Cuidado
            </Button>
          </div>
        </div>
      </div>

      {feedbackSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-3 text-xs animate-in fade-in">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <span>Muito obrigado pelo seu feedback! Sua avaliação foi enviada com sucesso à coordenação de enfermagem.</span>
        </div>
      )}

      {/* Cartão de Status Humanizado: "Como o paciente está hoje?" */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-teal-100 bg-gradient-to-br from-teal-50/60 to-white shadow-xs md:col-span-2">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-teal-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Smile className="h-4 w-4 text-teal-600" /> Estado Geral Hoje
                </span>
                <Badge variant="success" className="text-xs">
                  {summary.overallStatus === "ESTAVEL_CONFORTAVEL" ? "Estável & Confortável" : "Em Acompanhamento"}
                </Badge>
              </div>
              <CardTitle className="text-lg font-bold text-slate-900 mt-1">{summary.statusTitle}</CardTitle>
              <CardDescription className="text-xs text-slate-600 leading-relaxed">
                {summary.statusMessage}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="p-3 bg-white rounded-xl border border-teal-100 text-xs text-teal-900 font-medium">
                🩺 <strong>Sinais Vitais:</strong> {summary.latestVitalsFriendly}
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200/80 shadow-xs">
            <CardContent className="p-5 flex flex-col justify-between h-full space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">Visitas Assistenciais</span>
                <CalendarCheck className="h-5 w-5 text-teal-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">{summary.completedVisitsCount} Realizada(s)</div>
                <div className="text-xs text-slate-500 mt-0.5">{summary.upcomingVisitsCount} programada(s)</div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200/80 shadow-xs">
            <CardContent className="p-5 flex flex-col justify-between h-full space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">Conforto & Nutrição</span>
                <Utensils className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">{summary.nutritionStatus}</div>
                <div className="text-[11px] text-slate-500 mt-1">{summary.hygieneComfortStatus}</div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs Principais do Portal */}
      <Tabs defaultValue="diario" className="space-y-4">
        <TabsList className="bg-slate-100 p-1 border border-slate-200">
          <TabsTrigger value="diario" className="gap-2 text-xs">
            <Clock className="h-4 w-4 text-teal-600" />
            Diário de Cuidados & Visitas ({timeline.length})
          </TabsTrigger>
          <TabsTrigger value="contatos" className="gap-2 text-xs">
            <PhoneCall className="h-4 w-4 text-indigo-600" />
            Equipe de Referência & Contatos
          </TabsTrigger>
          <TabsTrigger value="permissoes" className="gap-2 text-xs">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            Familiares Autorizados ({grants.length})
          </TabsTrigger>
        </TabsList>

        {/* 1. ABA DIÁRIO DE CUIDADOS */}
        <TabsContent value="diario" className="space-y-4">
          <div className="space-y-3">
            {timeline.length > 0 ? (
              timeline.map((ev) => (
                <Card key={ev.id} className="border-slate-200/80 shadow-xs hover:border-teal-200 transition-colors">
                  <CardContent className="p-4 flex items-start gap-4">
                    <div className="p-3 bg-teal-50 text-teal-700 rounded-2xl shrink-0 mt-0.5">
                      {ev.category === "VISITA_EQUIPE" ? (
                        <UserCheck className="h-5 w-5" />
                      ) : ev.category === "MEDICACAO_MINISTRADA" ? (
                        <Pill className="h-5 w-5 text-emerald-600" />
                      ) : (
                        <Heart className="h-5 w-5 text-rose-500" />
                      )}
                    </div>

                    <div className="space-y-1 flex-1">
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-slate-900 text-sm">{ev.title}</div>
                        <Badge variant="secondary" className="text-[10px] font-mono">
                          {formatDateTime(ev.timestamp)}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{ev.description}</p>
                      <div className="flex items-center gap-2 pt-1">
                        <Badge variant="outline" className="text-[10px] text-teal-700 border-teal-200 bg-teal-50/40">
                          {ev.statusTag || "Confirmado"}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="border-slate-200 p-8 text-center text-slate-500">
                <p className="text-xs">Nenhum registro público no diário de hoje.</p>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* 2. ABA EQUIPE & CONTATOS */}
        <TabsContent value="contatos" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-slate-200/80 shadow-xs p-5 space-y-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-teal-600" /> Coordenação Clínica & Enfermagem
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Nossa equipe de enfermagem e médica está disponível para esclarecimento de dúvidas e alinhamento do plano terapêutico.
              </p>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                <div><strong>Central de Apoio 24h:</strong> (73) 3234-5678</div>
                <div><strong>Plantão de Enfermagem:</strong> (73) 99876-5432</div>
                <div><strong>E-mail:</strong> coordenacao@curahome.com.br</div>
              </div>
            </Card>

            <Card className="border-slate-200/80 shadow-xs p-5 space-y-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Star className="h-4 w-4 text-amber-500" /> Avaliações da Família ({feedbacks.length})
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {feedbacks.map((f) => (
                  <div key={f.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">{f.familyUserName}</span>
                      <div className="flex items-center gap-0.5 text-amber-500">
                        {Array.from({ length: f.rating }).map((_, i) => (
                          <Star key={i} className="h-3 w-3 fill-amber-500" />
                        ))}
                      </div>
                    </div>
                    <p className="text-slate-600 italic">{f.comment}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* 3. ABA FAMILIARES AUTORIZADOS */}
        <TabsContent value="permissoes" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Termos de Consentimento & Acessos Familiares (LGPD)</h3>
              <p className="text-xs text-slate-500">Familiares e cuidadores com autorização expressa para visualizar este portal</p>
            </div>
            <Button size="sm" onClick={() => setIsGrantModalOpen(true)} className="gap-1.5 text-xs bg-slate-900 text-white">
              <UserCheck className="h-3.5 w-3.5" /> Adicionar Familiar
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {grants.map((g) => (
              <Card key={g.id} className="border-slate-200/80 shadow-xs">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-bold text-slate-900">{g.familyUserName}</CardTitle>
                    <Badge variant="teal" className="text-[10px]">{g.relationship.replace(/_/g, " ")}</Badge>
                  </div>
                  <CardDescription className="text-xs font-mono">{g.familyEmail}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-500">
                    <span>Nível de Acesso:</span>
                    <strong className="text-slate-800">{g.accessLevel.replace(/_/g, " ")}</strong>
                  </div>
                  <div className="flex items-center justify-between text-slate-500">
                    <span>Consentimento Assinado:</span>
                    <span className="font-mono">{formatDate(g.consentSignedAt)}</span>
                  </div>
                  {g.notes && <p className="text-slate-600 italic bg-slate-50 p-2 rounded-lg">{g.notes}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal: Enviar Feedback */}
      <Dialog open={isFeedbackModalOpen} onOpenChange={setIsFeedbackModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquareHeart className="h-5 w-5 text-rose-600" />
              Avaliação do Atendimento da Equipe
            </DialogTitle>
            <DialogDescription className="text-xs">
              Sua opinião nos ajuda a aprimorar o carinho e a excelência no cuidado do seu familiar.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSendFeedback} className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Nota de Satisfação (1 a 5 estrelas) *</Label>
              <div className="flex items-center gap-2 pt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setFeedbackForm({ ...feedbackForm, rating: star })}
                    className="p-1.5 focus:outline-none"
                  >
                    <Star
                      className={`h-6 w-6 ${
                        star <= feedbackForm.rating ? "text-amber-500 fill-amber-500" : "text-slate-300"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Categoria *</Label>
              <select
                className="w-full h-9 rounded-md border border-slate-300 bg-white px-3 py-1 text-xs"
                value={feedbackForm.category}
                onChange={(e) => setFeedbackForm({ ...feedbackForm, category: e.target.value as any })}
              >
                <option value="ATENDIMENTO_EQUIPE">Atendimento & Carinho da Equipe</option>
                <option value="PONTUALIDADE">Pontualidade nas Visitas</option>
                <option value="COMUNICACAO">Comunicação e Orientações</option>
                <option value="CONFORTO_PACIENTE">Conforto do Paciente</option>
                <option value="GERAL">Avaliação Geral</option>
              </select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Comentários ou Sugestões *</Label>
              <Textarea
                required
                rows={3}
                value={feedbackForm.comment}
                onChange={(e) => setFeedbackForm({ ...feedbackForm, comment: e.target.value })}
                placeholder="Conte-nos como foi a experiência de atendimento..."
                className="text-xs"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsFeedbackModalOpen(false)}>Cancelar</Button>
              <Button type="submit" className="bg-rose-600 hover:bg-rose-700 text-white">Enviar Avaliação</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: Adicionar Familiar */}
      <Dialog open={isGrantModalOpen} onOpenChange={setIsGrantModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-teal-600" />
              Cadastrar Familiar / Cuidador (LGPD)
            </DialogTitle>
            <DialogDescription className="text-xs">
              Concede acesso ao Portal do Familiar com registro de consentimento expresso.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateGrant} className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Nome Completo do Familiar *</Label>
              <Input
                required
                value={grantForm.familyUserName}
                onChange={(e) => setGrantForm({ ...grantForm, familyUserName: e.target.value })}
                className="text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">E-mail *</Label>
                <Input
                  type="email"
                  required
                  value={grantForm.familyEmail}
                  onChange={(e) => setGrantForm({ ...grantForm, familyEmail: e.target.value })}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Telefone / WhatsApp</Label>
                <Input
                  value={grantForm.familyPhone}
                  onChange={(e) => setGrantForm({ ...grantForm, familyPhone: e.target.value })}
                  className="text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Grau de Parentesco *</Label>
              <select
                className="w-full h-9 rounded-md border border-slate-300 bg-white px-3 py-1 text-xs"
                value={grantForm.relationship}
                onChange={(e) => setGrantForm({ ...grantForm, relationship: e.target.value as any })}
              >
                <option value="FILHO_FILHA">Filho / Filha</option>
                <option value="CONJUGE">Cônjuge / Companheiro(a)</option>
                <option value="PAI_MAE">Pai / Mãe</option>
                <option value="IRMAO_IRMA">Irmão / Irmã</option>
                <option value="CUIDADOR_LEGAL">Cuidador Legal</option>
                <option value="RESPONSAVEL_LEGAL">Responsável Legal</option>
                <option value="OUTRO">Outro Vínculo</option>
              </select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Observações</Label>
              <Input
                value={grantForm.notes}
                onChange={(e) => setGrantForm({ ...grantForm, notes: e.target.value })}
                className="text-xs"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsGrantModalOpen(false)}>Cancelar</Button>
              <Button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white">Cadastrar com Consentimento</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
