import unittest
from tools.code_index.parsers.ts_parser import TypeScriptParser
from tools.code_index.parsers.sql_parser import SqlParser
from tools.code_index.parsers.md_parser import MarkdownParser


class TestParsers(unittest.TestCase):
    def test_typescript_parser(self):
        code = """
        import { useState } from 'react';

        export interface Patient {
          id: string;
          name: string;
        }

        export type Status = 'ACTIVE' | 'INACTIVE';

        export function usePatient(id: string) {
          return store.getPatientById(id);
        }

        export function PatientDetails() {
          return <div>Patient</div>;
        }
        """
        parser = TypeScriptParser()
        parsed = parser.parse(code, "src/patient.tsx", "tsx")

        symbols_by_name = {s.name: s for s in parsed.symbols}
        self.assertIn("Patient", symbols_by_name)
        self.assertEqual(symbols_by_name["Patient"].symbol_type, "INTERFACE")

        self.assertIn("Status", symbols_by_name)
        self.assertEqual(symbols_by_name["Status"].symbol_type, "TYPE")

        self.assertIn("usePatient", symbols_by_name)
        self.assertEqual(symbols_by_name["usePatient"].symbol_type, "HOOK")

        self.assertIn("PatientDetails", symbols_by_name)
        self.assertEqual(symbols_by_name["PatientDetails"].symbol_type, "COMPONENT")

    def test_sql_parser(self):
        sql = """
        CREATE TABLE patients (
          id UUID PRIMARY KEY,
          full_name TEXT NOT NULL
        );

        CREATE OR REPLACE FUNCTION can_access_patient(p_patient_id UUID)
        RETURNS BOOLEAN AS $$
          SELECT EXISTS (SELECT 1 FROM patient_professional_assignments WHERE patient_id = p_patient_id);
        $$ LANGUAGE sql SECURITY DEFINER;

        CREATE POLICY "RLS Patients Select" ON patients
        FOR SELECT USING (can_access_patient(id));

        CREATE TRIGGER trg_audit_patient AFTER INSERT ON patients
        FOR EACH ROW EXECUTE FUNCTION record_audit_log();
        """
        parser = SqlParser()
        parsed = parser.parse(sql, "supabase/migrations/01_init.sql", "sql")

        symbols_by_name = {s.name: s for s in parsed.symbols}
        self.assertIn("patients", symbols_by_name)
        self.assertEqual(symbols_by_name["patients"].symbol_type, "TABLE")

        self.assertIn("can_access_patient", symbols_by_name)
        self.assertEqual(symbols_by_name["can_access_patient"].symbol_type, "RPC")

        self.assertIn("RLS Patients Select", symbols_by_name)
        self.assertEqual(symbols_by_name["RLS Patients Select"].symbol_type, "POLICY")

        self.assertIn("trg_audit_patient", symbols_by_name)
        self.assertEqual(symbols_by_name["trg_audit_patient"].symbol_type, "TRIGGER")

    def test_markdown_parser(self):
        doc = """
        # Regras de Negócio do HomeCare

        Visão geral do sistema.

        ## Vínculo Profissional Paciente

        O acesso ao prontuário exige vínculo explícito e ativo.

        ## Imutabilidade Clínica

        Evoluções finalizadas não podem ser alteradas.
        """
        parser = MarkdownParser()
        parsed = parser.parse(doc, "docs/REGRAS.md", "markdown")

        names = [s.name for s in parsed.symbols]
        self.assertIn("Regras de Negócio do HomeCare", names)
        self.assertIn("Vínculo Profissional Paciente", names)
        self.assertIn("Imutabilidade Clínica", names)


if __name__ == "__main__":
    unittest.main()
