import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 9, fontFamily: "Helvetica" },
  header: { marginBottom: 20 },
  title: { fontSize: 18, fontWeight: "bold", fontFamily: "Helvetica-Bold" },
  subtitle: { fontSize: 10, color: "#6b7280", marginTop: 4 },
  orgName: { fontSize: 11, color: "#16a34a", fontFamily: "Helvetica-Bold", marginBottom: 2 },
  section: { marginTop: 16, marginBottom: 8 },
  sectionTitle: { fontSize: 12, fontFamily: "Helvetica-Bold", marginBottom: 8, borderBottomWidth: 1, borderBottomColor: "#e5e7eb", paddingBottom: 4 },
  table: { width: "100%" },
  tableHeader: { flexDirection: "row", backgroundColor: "#f3f4f6", borderBottomWidth: 1, borderBottomColor: "#d1d5db", paddingVertical: 4, paddingHorizontal: 4 },
  tableRow: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: "#e5e7eb", paddingVertical: 3, paddingHorizontal: 4 },
  tableRowAlt: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: "#e5e7eb", paddingVertical: 3, paddingHorizontal: 4, backgroundColor: "#fafafa" },
  th: { fontFamily: "Helvetica-Bold", fontSize: 8 },
  td: { fontSize: 8 },
  kpiRow: { flexDirection: "row", gap: 12, marginBottom: 12 },
  kpiCard: { flex: 1, borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 4, padding: 10 },
  kpiValue: { fontSize: 20, fontFamily: "Helvetica-Bold" },
  kpiLabel: { fontSize: 8, color: "#6b7280", marginTop: 2 },
  footer: { position: "absolute", bottom: 30, left: 40, right: 40, flexDirection: "row", justifyContent: "space-between", fontSize: 7, color: "#9ca3af" },
  badge: { paddingHorizontal: 4, paddingVertical: 1, borderRadius: 2, fontSize: 7 },
  greenBg: { backgroundColor: "#dcfce7", color: "#166534" },
  redBg: { backgroundColor: "#fef2f2", color: "#991b1b" },
  amberBg: { backgroundColor: "#fef9c3", color: "#854d0e" },
  grayBg: { backgroundColor: "#f3f4f6", color: "#374151" },
});

function PageFooter({ orgName, date }: { orgName: string; date: string }) {
  return (
    <View style={styles.footer} fixed>
      <Text>VitrOS — {orgName}</Text>
      <Text>Generated {date}</Text>
    </View>
  );
}

function Header({ orgName, title, date }: { orgName: string; title: string; date: string }) {
  return (
    <View style={styles.header}>
      <Text style={styles.orgName}>{orgName}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>Generated on {date}</Text>
    </View>
  );
}

// ---------- VESSEL REPORT ----------

interface VesselRow {
  barcode: string;
  cultivar: string;
  species: string;
  stage: string;
  status: string;
  health: string;
  location: string;
  explants: number;
  generation: number;
  subcultureNum: number;
  mediaRecipe: string;
  created: string;
}

export function VesselReport({ orgName, date, vessels }: { orgName: string; date: string; vessels: VesselRow[] }) {
  const cols = [
    { key: "barcode", label: "Barcode", width: "12%" },
    { key: "cultivar", label: "Cultivar", width: "12%" },
    { key: "stage", label: "Stage", width: "10%" },
    { key: "status", label: "Status", width: "9%" },
    { key: "health", label: "Health", width: "9%" },
    { key: "location", label: "Location", width: "11%" },
    { key: "explants", label: "Explants", width: "7%" },
    { key: "generation", label: "Gen", width: "5%" },
    { key: "subcultureNum", label: "Sub#", width: "5%" },
    { key: "mediaRecipe", label: "Media", width: "10%" },
    { key: "created", label: "Created", width: "10%" },
  ];

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <Header orgName={orgName} title="Vessel Inventory Report" date={date} />
        <Text style={{ fontSize: 9, marginBottom: 8 }}>{vessels.length} vessels total</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            {cols.map((col) => (
              <Text key={col.key} style={[styles.th, { width: col.width }]}>{col.label}</Text>
            ))}
          </View>
          {vessels.map((v, i) => (
            <View key={i} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
              {cols.map((col) => (
                <Text key={col.key} style={[styles.td, { width: col.width }]}>
                  {String(v[col.key as keyof VesselRow])}
                </Text>
              ))}
            </View>
          ))}
        </View>
        <PageFooter orgName={orgName} date={date} />
      </Page>
    </Document>
  );
}

// ---------- PRODUCTION REPORT ----------

interface ProductionData {
  orgName: string;
  date: string;
  totalVessels: number;
  activeVessels: number;
  totalExplants: number;
  contaminationRate: string;
  multiplicationRate: string;
  vesselsByStage: { stage: string; count: number }[];
  vesselsByCultivar: { cultivar: string; count: number; explants: number }[];
}

export function ProductionReport(data: ProductionData) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Header orgName={data.orgName} title="Production Summary Report" date={data.date} />

        <View style={styles.kpiRow}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiValue}>{data.activeVessels}</Text>
            <Text style={styles.kpiLabel}>Active Vessels</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiValue}>{data.totalExplants.toLocaleString()}</Text>
            <Text style={styles.kpiLabel}>Total Explants</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiValue}>{data.contaminationRate}</Text>
            <Text style={styles.kpiLabel}>Contamination Rate</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiValue}>{data.multiplicationRate}</Text>
            <Text style={styles.kpiLabel}>Multiplication Rate</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pipeline by Stage</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.th, { width: "60%" }]}>Stage</Text>
              <Text style={[styles.th, { width: "20%" }]}>Vessels</Text>
              <Text style={[styles.th, { width: "20%" }]}>% of Active</Text>
            </View>
            {data.vesselsByStage.map((s, i) => (
              <View key={i} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                <Text style={[styles.td, { width: "60%", textTransform: "capitalize" }]}>{s.stage.replace(/_/g, " ")}</Text>
                <Text style={[styles.td, { width: "20%" }]}>{s.count}</Text>
                <Text style={[styles.td, { width: "20%" }]}>
                  {data.activeVessels > 0 ? ((s.count / data.activeVessels) * 100).toFixed(1) : "0"}%
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>By Cultivar</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.th, { width: "40%" }]}>Cultivar</Text>
              <Text style={[styles.th, { width: "20%" }]}>Vessels</Text>
              <Text style={[styles.th, { width: "20%" }]}>Explants</Text>
              <Text style={[styles.th, { width: "20%" }]}>% of Active</Text>
            </View>
            {data.vesselsByCultivar.map((c, i) => (
              <View key={i} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                <Text style={[styles.td, { width: "40%" }]}>{c.cultivar}</Text>
                <Text style={[styles.td, { width: "20%" }]}>{c.count}</Text>
                <Text style={[styles.td, { width: "20%" }]}>{c.explants}</Text>
                <Text style={[styles.td, { width: "20%" }]}>
                  {data.activeVessels > 0 ? ((c.count / data.activeVessels) * 100).toFixed(1) : "0"}%
                </Text>
              </View>
            ))}
          </View>
        </View>

        <PageFooter orgName={data.orgName} date={data.date} />
      </Page>
    </Document>
  );
}

// ---------- CONTAMINATION REPORT ----------

interface ContaminationData {
  orgName: string;
  date: string;
  period: string;
  overallRate: string;
  totalContaminated: number;
  totalVessels: number;
  byType: { type: string; count: number }[];
  byCultivar: { cultivar: string; count: number }[];
}

export function ContaminationReport(data: ContaminationData) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Header orgName={data.orgName} title="Contamination Report" date={data.date} />
        <Text style={{ fontSize: 9, color: "#6b7280", marginBottom: 12 }}>Period: {data.period}</Text>

        <View style={styles.kpiRow}>
          <View style={styles.kpiCard}>
            <Text style={[styles.kpiValue, { color: "#dc2626" }]}>{data.overallRate}</Text>
            <Text style={styles.kpiLabel}>Contamination Rate</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiValue}>{data.totalContaminated}</Text>
            <Text style={styles.kpiLabel}>Contaminated Vessels</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiValue}>{data.totalVessels}</Text>
            <Text style={styles.kpiLabel}>Total Vessels (Period)</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>By Contamination Type</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.th, { width: "50%" }]}>Type</Text>
              <Text style={[styles.th, { width: "25%" }]}>Count</Text>
              <Text style={[styles.th, { width: "25%" }]}>% of Contaminated</Text>
            </View>
            {data.byType.map((t, i) => (
              <View key={i} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                <Text style={[styles.td, { width: "50%", textTransform: "capitalize" }]}>{t.type}</Text>
                <Text style={[styles.td, { width: "25%" }]}>{t.count}</Text>
                <Text style={[styles.td, { width: "25%" }]}>
                  {data.totalContaminated > 0 ? ((t.count / data.totalContaminated) * 100).toFixed(1) : "0"}%
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>By Cultivar</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.th, { width: "50%" }]}>Cultivar</Text>
              <Text style={[styles.th, { width: "25%" }]}>Count</Text>
              <Text style={[styles.th, { width: "25%" }]}>% of Contaminated</Text>
            </View>
            {data.byCultivar.map((c, i) => (
              <View key={i} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                <Text style={[styles.td, { width: "50%" }]}>{c.cultivar}</Text>
                <Text style={[styles.td, { width: "25%" }]}>{c.count}</Text>
                <Text style={[styles.td, { width: "25%" }]}>
                  {data.totalContaminated > 0 ? ((c.count / data.totalContaminated) * 100).toFixed(1) : "0"}%
                </Text>
              </View>
            ))}
          </View>
        </View>

        <PageFooter orgName={data.orgName} date={data.date} />
      </Page>
    </Document>
  );
}

// ---------- ACTIVITY REPORT ----------

interface ActivityRow {
  type: string;
  category: string;
  vessel: string;
  user: string;
  notes: string;
  date: string;
}

export function ActivityReport({ orgName, date, activities }: { orgName: string; date: string; activities: ActivityRow[] }) {
  const cols = [
    { key: "date", label: "Date", width: "15%" },
    { key: "type", label: "Action", width: "15%" },
    { key: "category", label: "Category", width: "12%" },
    { key: "vessel", label: "Vessel", width: "13%" },
    { key: "user", label: "User", width: "15%" },
    { key: "notes", label: "Notes", width: "30%" },
  ];

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <Header orgName={orgName} title="Activity Log Report" date={date} />
        <Text style={{ fontSize: 9, marginBottom: 8 }}>{activities.length} activities</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            {cols.map((col) => (
              <Text key={col.key} style={[styles.th, { width: col.width }]}>{col.label}</Text>
            ))}
          </View>
          {activities.map((a, i) => (
            <View key={i} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
              {cols.map((col) => (
                <Text key={col.key} style={[styles.td, { width: col.width }]}>
                  {col.key === "type"
                    ? a.type.replace(/_/g, " ")
                    : String(a[col.key as keyof ActivityRow] || "")}
                </Text>
              ))}
            </View>
          ))}
        </View>
        <PageFooter orgName={orgName} date={date} />
      </Page>
    </Document>
  );
}
