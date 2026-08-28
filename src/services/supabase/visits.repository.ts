import { store } from "../store.service";
import {
  Visit,
  VisitCheckin,
  evaluateGeofence,
  isValidVisitTransition,
  VisitStatus,
} from "@/domain/visit/visit.schema";

export class VisitsRepository {
  public async getVisits(filters?: {
    patientId?: string;
    professionalId?: string;
    status?: VisitStatus;
    date?: Date;
  }): Promise<Visit[]> {
    return store.getVisits(filters);
  }

  public async getVisitById(id: string): Promise<Visit | undefined> {
    return store.getVisitById(id);
  }

  public async getCheckinByVisitId(visitId: string): Promise<VisitCheckin | undefined> {
    return store.getCheckinByVisitId(visitId);
  }

  public async recordCheckin(data: {
    visitId: string;
    professionalId: string;
    latitude?: number | null;
    longitude?: number | null;
    accuracy?: number | null;
    overrideReason?: string | null;
  }): Promise<{ success: boolean; checkin?: VisitCheckin; error?: string }> {
    return store.recordVisitCheckin(data);
  }

  public async recordCheckout(data: {
    visitId: string;
    latitude?: number | null;
    longitude?: number | null;
    accuracy?: number | null;
    notes?: string | null;
  }): Promise<{ success: boolean; visit?: Visit; error?: string }> {
    return store.recordVisitCheckout(data);
  }
}

export const visitsRepository = new VisitsRepository();

