import { store } from "../store.service";
import { evaluateVitalSignAlerts, VitalSigns } from "@/domain/pep/pep.schema";

export interface SystemAlert {
  id: string;
  patientId?: string;
  patientName: string;
  severity: "CRITICO" | "ALERTA" | "INFO";
  alertType: string;
  description: string;
  timestamp: string;
  status: "EM_ATENDIMENTO" | "RECONHECIDO" | "CONDUTA_REGISTRADA" | "RESOLVIDO";
  careLocation: string;
  doctorInCharge: string;
  notes?: string;
}

export class AlertsRepository {
  public async getActiveAlerts(): Promise<SystemAlert[]> {
    const patients = store.getPatients();
    const alerts: SystemAlert[] = [];

    // 1. Gerar alertas dinâmicos a partir de sinais vitais reais dos pacientes
    for (const patient of patients) {
      if (!patient.id) continue;
      const vitalsList = store.getVitals(patient.id);
      const latestVitals = vitalsList[0];
      const episode = store.getEpisodeByPatientId(patient.id);
      const doctor = episode?.doctorInChargeId ? store.getProfessionalById(episode.doctorInChargeId) : null;

      if (latestVitals) {
        const vitalAlerts = evaluateVitalSignAlerts(latestVitals);
        for (const va of vitalAlerts) {
          alerts.push({
            id: `alt_${patient.id}_${va.parameter}_${Date.now()}`,
            patientId: patient.id,
            patientName: patient.fullName,
            severity: va.severity === "CRITICO" ? "CRITICO" : "ALERTA",
            alertType: `${va.parameter}: ${va.message}`,
            description: `Alerta beira-leito: ${va.message}. Parâmetro clínico fora da faixa de normalidade.`,
            timestamp: "Aferição recente",
            status: "EM_ATENDIMENTO",
            careLocation: `${patient.addressStreet}, ${patient.addressNumber} - ${patient.addressCity} (${patient.addressState})`,
            doctorInCharge: doctor ? `${doctor.fullName} (${doctor.profession})` : "Equipe Médica Plantonista",
          });
        }
      }
    }

    // 2. Se nenhum sinal fora do padrão, incluir eventos informativos operacionais
    if (alerts.length === 0) {
      const firstPat = patients[0];
      if (firstPat) {
        alerts.push({
          id: "alt_shift_sync",
          patientId: firstPat.id,
          patientName: firstPat.fullName,
          severity: "INFO",
          alertType: "Escala & Plantão 12h Sincronizado",
          description: "Profissionais alocados em plantão ativo com registro de passagem de plantão validado.",
          timestamp: "Tempo Real",
          status: "RESOLVIDO",
          careLocation: `${firstPat.addressStreet}, ${firstPat.addressNumber} - ${firstPat.addressCity}`,
          doctorInCharge: "Dra. Roberta Mendes (MEDICO)",
        });
      }
    }

    return alerts;
  }
}

export const alertsRepository = new AlertsRepository();
