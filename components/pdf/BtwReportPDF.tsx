import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { formatBedrag } from "@/lib/utils";
import type { BtwReportData } from "@/lib/export-helpers";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 11,
    padding: 40,
    lineHeight: 1.5,
    backgroundColor: "#ffffff",
    color: "#0f172a",
  },
  header: {
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 4,
  },
  companyInfo: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: "#f9fafb",
    borderRadius: 8,
  },
  companyName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 6,
  },
  companyDetail: {
    fontSize: 10,
    color: "#4b5563",
    marginBottom: 2,
  },
  periodInfo: {
    marginBottom: 20,
    padding: 12,
    backgroundColor: "#eff6ff",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },
  periodText: {
    fontSize: 11,
    color: "#1e40af",
    fontWeight: "bold",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#374151",
    marginBottom: 12,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  table: {
    marginBottom: 16,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  tableHeaderRow: {
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "#f3f4f6",
    borderBottomWidth: 1,
    borderBottomColor: "#d1d5db",
  },
  tableHeader: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#374151",
    textTransform: "uppercase",
  },
  tableCell: {
    fontSize: 11,
    color: "#1f2937",
  },
  tableCellBold: {
    fontSize: 11,
    color: "#1f2937",
    fontWeight: "bold",
  },
  rubriekColumn: {
    flex: 3,
  },
  amountColumn: {
    flex: 2,
    textAlign: "right",
  },
  vatColumn: {
    flex: 2,
    textAlign: "right",
  },
  summarySection: {
    marginTop: 24,
    padding: 16,
    backgroundColor: "#f0fdf4",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#86efac",
  },
  warningSection: {
    marginTop: 24,
    padding: 16,
    backgroundColor: "#fef3c7",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#fcd34d",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 11,
    color: "#374151",
  },
  summaryValue: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#1f2937",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 12,
    marginTop: 8,
    borderTopWidth: 2,
    borderTopColor: "#16a34a",
  },
  totalRowWarning: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 12,
    marginTop: 8,
    borderTopWidth: 2,
    borderTopColor: "#d97706",
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#166534",
  },
  totalLabelWarning: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#92400e",
  },
  totalValue: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#166534",
  },
  totalValueWarning: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#92400e",
  },
  footer: {
    marginTop: 30,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  footerText: {
    fontSize: 9,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 4,
  },
  disclaimer: {
    marginTop: 20,
    padding: 12,
    backgroundColor: "#fefce8",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#fde047",
  },
  disclaimerText: {
    fontSize: 9,
    color: "#713f12",
  },
});

const quarterLabels: Record<number, string> = {
  1: "1e kwartaal (jan - mrt)",
  2: "2e kwartaal (apr - jun)",
  3: "3e kwartaal (jul - sep)",
  4: "4e kwartaal (okt - dec)",
};

export function BtwReportPDF({ report }: { report: BtwReportData }) {
  const isRefund = report.totalDue < 0;
  const finalLabel = isRefund ? "Terug te vragen" : "Te betalen";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>BTW-aangifte Rapport</Text>
          <Text style={styles.subtitle}>
            {quarterLabels[report.quarter]} {report.year}
          </Text>
        </View>

        {/* Company Info */}
        <View style={styles.companyInfo}>
          <Text style={styles.companyName}>{report.companyName}</Text>
          <Text style={styles.companyDetail}>{report.companyAddress}</Text>
          <Text style={styles.companyDetail}>
            {report.companyPostalCode} {report.companyCity}
          </Text>
          {report.kvkNumber && (
            <Text style={styles.companyDetail}>KVK: {report.kvkNumber}</Text>
          )}
          {report.btwNumber && (
            <Text style={styles.companyDetail}>BTW-nummer: {report.btwNumber}</Text>
          )}
        </View>

        {/* Period Info */}
        <View style={styles.periodInfo}>
          <Text style={styles.periodText}>
            Periode: {report.startDate} t/m {report.endDate}
          </Text>
        </View>

        {/* Omzet (Sales) Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Omzet (Prestaties)</Text>
          <View style={styles.table}>
            {/* Table Header */}
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.tableHeader, styles.rubriekColumn]}>Rubriek</Text>
              <Text style={[styles.tableHeader, styles.amountColumn]}>Omzet</Text>
              <Text style={[styles.tableHeader, styles.vatColumn]}>BTW</Text>
            </View>
            
            {/* Rubriek 1a */}
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.rubriekColumn]}>1a · Leveringen/diensten 21%</Text>
              <Text style={[styles.tableCell, styles.amountColumn]}>{formatBedrag(report.rubriek1a.base)}</Text>
              <Text style={[styles.tableCell, styles.vatColumn]}>{formatBedrag(report.rubriek1a.vat)}</Text>
            </View>
            
            {/* Rubriek 1b */}
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.rubriekColumn]}>1b · Leveringen/diensten 9%</Text>
              <Text style={[styles.tableCell, styles.amountColumn]}>{formatBedrag(report.rubriek1b.base)}</Text>
              <Text style={[styles.tableCell, styles.vatColumn]}>{formatBedrag(report.rubriek1b.vat)}</Text>
            </View>
            
            {/* Rubriek 1e */}
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.rubriekColumn]}>1e · Leveringen/diensten 0% of verlegd</Text>
              <Text style={[styles.tableCell, styles.amountColumn]}>{formatBedrag(report.rubriek1e.base)}</Text>
              <Text style={[styles.tableCell, styles.vatColumn]}>n.v.t.</Text>
            </View>
            
            {/* Total Row */}
            <View style={[styles.tableRow, { backgroundColor: "#f9fafb" }]}>
              <Text style={[styles.tableCellBold, styles.rubriekColumn]}>Totaal omzet</Text>
              <Text style={[styles.tableCellBold, styles.amountColumn]}>{formatBedrag(report.revenueTotal)}</Text>
              <Text style={[styles.tableCellBold, styles.vatColumn]}>{formatBedrag(report.totalSalesVat)}</Text>
            </View>
          </View>
        </View>

        {/* Voorbelasting (Input VAT) Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Voorbelasting (Aftrekbare BTW)</Text>
          <View style={styles.table}>
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.tableHeader, styles.rubriekColumn]}>Rubriek</Text>
              <Text style={[styles.tableHeader, styles.amountColumn]}>Kosten</Text>
              <Text style={[styles.tableHeader, styles.vatColumn]}>BTW</Text>
            </View>
            
            {/* Rubriek 5b */}
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.rubriekColumn]}>5b · Voorbelasting</Text>
              <Text style={[styles.tableCell, styles.amountColumn]}>{formatBedrag(report.expenseTotal)}</Text>
              <Text style={[styles.tableCell, styles.vatColumn]}>{formatBedrag(report.deductibleVat)}</Text>
            </View>
          </View>
        </View>

        {/* Summary Section */}
        <View style={isRefund ? styles.warningSection : styles.summarySection}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Verschuldigde BTW (1a + 1b)</Text>
            <Text style={styles.summaryValue}>{formatBedrag(report.totalSalesVat)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Af: Voorbelasting (5b)</Text>
            <Text style={styles.summaryValue}>- {formatBedrag(report.deductibleVat)}</Text>
          </View>
          <View style={isRefund ? styles.totalRowWarning : styles.totalRow}>
            <Text style={isRefund ? styles.totalLabelWarning : styles.totalLabel}>{finalLabel}</Text>
            <Text style={isRefund ? styles.totalValueWarning : styles.totalValue}>
              {formatBedrag(Math.abs(report.totalDue))}
            </Text>
          </View>
        </View>

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            Dit rapport is gebaseerd op de ingevoerde facturen en uitgaven in ZZP-HUB. 
            Controleer de bedragen voordat u aangifte doet bij de Belastingdienst. 
            Dit document dient ter ondersteuning en is geen officiële BTW-aangifte.
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Gegenereerd op {new Date().toLocaleDateString("nl-NL", { 
              day: "numeric", 
              month: "long", 
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit"
            })}
          </Text>
          <Text style={styles.footerText}>ZZP-HUB · BTW-aangifte Rapport</Text>
        </View>
      </Page>
    </Document>
  );
}
