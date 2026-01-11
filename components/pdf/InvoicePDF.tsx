import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { formatBedrag } from "@/lib/utils";

export type InvoicePdfLine = {
  description: string;
  quantity: number;
  unit: string;
  price: number;
  vatRate: "21" | "9" | "0";
};

export type InvoicePdfCompany = {
  companyName: string;
  address: string;
  postalCode: string;
  city: string;
  kvkNumber?: string;
  btwNumber?: string;
  iban?: string;
  bankName?: string | null;
  logoUrl?: string | null;
  email?: string | null;
  website?: string | null;
};

export type InvoicePdfClient = {
  name: string;
  address: string;
  postalCode: string;
  city: string;
};

export type InvoicePdfData = {
  invoiceNum: string;
  date: string;
  dueDate: string;
  client: InvoicePdfClient;
  companyProfile: InvoicePdfCompany | null;
  lines: InvoicePdfLine[];
};

export function calculateInvoiceTotals(lines: InvoicePdfLine[]) {
  const subtotal = lines.reduce((sum, line) => sum + line.quantity * line.price, 0);
  const vatHigh = lines
    .filter((line) => line.vatRate === "21")
    .reduce((sum, line) => sum + line.quantity * line.price * 0.21, 0);
  const vatLow = lines
    .filter((line) => line.vatRate === "9")
    .reduce((sum, line) => sum + line.quantity * line.price * 0.09, 0);

  return {
    subtotal,
    vatHigh,
    vatLow,
    total: subtotal + vatHigh + vatLow,
  };
}

const primaryColor = "#111827";

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
    marginBottom: 26,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    gap: 16,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  title: {
    fontSize: 26,
    fontWeight: 800,
    letterSpacing: 0.8,
  },
  invoiceNumberRow: {
    marginTop: 8,
    fontSize: 11,
    color: "#334155",
    fontWeight: 600,
  },
  invoiceNumberValue: {
    fontWeight: 800,
  },
  brandCard: {
    minWidth: 180,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    backgroundColor: "#f8fafc",
    alignItems: "flex-end",
    gap: 6,
  },
  brandNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  brandBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center",
  },
  brandBadgeText: {
    fontSize: 12,
    fontWeight: 800,
    color: primaryColor,
  },
  brandLabel: {
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: 0.7,
    color: "#64748b",
    textAlign: "right",
  },
  brandName: {
    fontSize: 15,
    fontWeight: 800,
    color: primaryColor,
  },
  headerLeft: {
    gap: 4,
  },
  parties: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 18,
  },
  companyBlock: {
    flex: 1,
    alignItems: "flex-start",
    gap: 5,
  },
  clientBlock: {
    flex: 1,
    alignItems: "flex-start",
    gap: 5,
  },
  companyName: {
    fontSize: 14,
    fontWeight: 800,
    color: primaryColor,
    marginBottom: 3,
  },
  clientName: {
    fontSize: 13,
    fontWeight: 800,
    color: primaryColor,
    marginBottom: 4,
  },
  documentType: {
    fontSize: 11,
    fontWeight: 700,
    color: "#334155",
    marginTop: 6,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  logo: {
    width: 132,
    height: 46,
  },
  label: {
    fontSize: 9,
    textTransform: "uppercase",
    color: "#6b7280",
    letterSpacing: 0.8,
    marginBottom: 6,
    fontWeight: 700,
  },
  text: {
    fontSize: 11,
    color: "#334155",
  },
  mutedText: {
    fontSize: 11,
    color: "#475569",
  },
  keyValueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
  },
  keyValueLabel: {
    fontSize: 10,
    color: "#475569",
    fontWeight: 700,
  },
  keyValueValue: {
    fontSize: 10.5,
    color: "#0f172a",
    fontWeight: 600,
  },
  meta: {
    marginBottom: 18,
    flexDirection: "row",
    gap: 12,
    flexWrap: "wrap",
  },
  metaItem: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 0.8,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    minWidth: 150,
    backgroundColor: "#f9fafb",
  },
  metaLabel: {
    fontSize: 9,
    color: "#64748b",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  metaValue: {
    fontSize: 13,
    fontWeight: 800,
    color: "#0f172a",
  },
  table: {
    marginTop: 6,
    backgroundColor: "#fff",
    borderRadius: 8,
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    borderBottomWidth: 0.8,
    borderBottomColor: "#e5e7eb",
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  headerCell: {
    fontSize: 10,
    fontWeight: 800,
    color: primaryColor,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  row: {
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 0.6,
    borderBottomColor: "#e5e7eb",
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  description: {
    flex: 3,
    paddingRight: 8,
  },
  qty: {
    flex: 1,
    textAlign: "center",
  },
  unit: {
    flex: 1,
    textAlign: "center",
  },
  price: {
    flex: 1.4,
    textAlign: "right",
  },
  vat: {
    flex: 1,
    textAlign: "center",
  },
  amount: {
    flex: 1.4,
    textAlign: "right",
  },
  totals: {
    marginTop: 18,
    alignSelf: "flex-end",
    width: "55%",
    borderWidth: 0.8,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 14,
    backgroundColor: "#f8fafc",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 11,
    color: "#475569",
  },
  totalValue: {
    fontSize: 11,
    fontWeight: 700,
  },
  grandTotal: {
    fontSize: 15,
    fontWeight: 800,
    marginTop: 8,
    borderTopWidth: 0.8,
    borderTopColor: "#e5e7eb",
    paddingTop: 12,
    color: primaryColor,
  },
  grandTotalText: {
    fontSize: 13.5,
    fontWeight: 800,
    color: primaryColor,
  },
  legal: {
    marginTop: 18,
    fontSize: 10,
    color: "#475569",
  },
  footer: {
    marginTop: 30,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 14,
  },
  footerColumn: {
    flex: 1,
    gap: 3,
  },
  footerLabel: {
    fontSize: 9,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  footerValue: {
    fontSize: 11,
    fontWeight: 600,
    color: "#0f172a",
  },
});

type DocumentType = "FACTUUR" | "OFFERTE";

export function InvoicePDF({ invoice, documentType = "FACTUUR" }: { invoice: InvoicePdfData; documentType?: DocumentType }) {
  const { companyProfile, lines } = invoice;
  const totals = calculateInvoiceTotals(lines);
  const paymentText = `Gelieve te betalen voor ${invoice.dueDate} op rekening ${
    companyProfile?.iban ?? "—"
  } t.n.v. ${companyProfile?.companyName ?? "uw bedrijfsnaam"}.`;
  const logoUrl = companyProfile?.logoUrl;
  const isTrustedLogo = logoUrl?.startsWith("http");
  const brandInitials =
    companyProfile?.companyName
      ?.trim()
      .split(/\s+/)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "Z";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.headerLeft}>
              <Text style={styles.title}>{documentType}</Text>
              <Text style={styles.invoiceNumberRow}>
                Factuurnummer: <Text style={styles.invoiceNumberValue}>{invoice.invoiceNum}</Text>
              </Text>
            </View>
            <View style={styles.brandCard}>
              {isTrustedLogo && logoUrl ? (
                <View style={styles.brandNameRow}>
                  {/* eslint-disable-next-line jsx-a11y/alt-text */}
                  <Image src={logoUrl} style={styles.logo} />
                  <View>
                    <Text style={styles.brandLabel}>Verzender</Text>
                    <Text style={styles.brandName}>{companyProfile?.companyName ?? "Bedrijfsnaam"}</Text>
                  </View>
                </View>
              ) : (
                <View style={styles.brandNameRow}>
                  <View style={styles.brandBadge}>
                    <Text style={styles.brandBadgeText}>{brandInitials}</Text>
                  </View>
                  <View>
                    <Text style={styles.brandLabel}>Verzender</Text>
                    <Text style={styles.brandName}>{companyProfile?.companyName ?? "Bedrijfsnaam"}</Text>
                  </View>
                </View>
              )}
            </View>
          </View>

          <View style={styles.parties}>
            <View style={styles.companyBlock}>
              <Text style={styles.label}>Verzender</Text>
              <Text style={styles.companyName}>{companyProfile?.companyName ?? "Bedrijfsnaam"}</Text>
              <Text style={styles.mutedText}>{companyProfile?.address ?? "Adres niet ingesteld"}</Text>
              <Text style={styles.mutedText}>
                {companyProfile?.postalCode ?? ""} {companyProfile?.city ?? ""}
              </Text>
              {companyProfile?.kvkNumber ? (
                <View style={styles.keyValueRow}>
                  <Text style={styles.keyValueLabel}>KVK</Text>
                  <Text style={styles.keyValueValue}>{companyProfile.kvkNumber}</Text>
                </View>
              ) : null}
              {companyProfile?.iban ? (
                <View style={styles.keyValueRow}>
                  <Text style={styles.keyValueLabel}>IBAN</Text>
                  <Text style={styles.keyValueValue}>{companyProfile.iban}</Text>
                </View>
              ) : null}
            </View>

            <View style={styles.clientBlock}>
              <Text style={styles.label}>Ontvanger</Text>
              <Text style={styles.clientName}>{invoice.client.name}</Text>
              <Text style={styles.mutedText}>{invoice.client.address}</Text>
              <Text style={styles.mutedText}>
                {invoice.client.postalCode} {invoice.client.city}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.meta}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Datum</Text>
            <Text style={styles.metaValue}>{invoice.date}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Vervaldatum</Text>
            <Text style={styles.metaValue}>{invoice.dueDate}</Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.headerCell, styles.description]}>Omschrijving</Text>
            <Text style={[styles.headerCell, styles.qty]}>Aantal</Text>
            <Text style={[styles.headerCell, styles.unit]}>Eenheid</Text>
            <Text style={[styles.headerCell, styles.price]}>Prijs</Text>
            <Text style={[styles.headerCell, styles.vat]}>BTW%</Text>
            <Text style={[styles.headerCell, styles.amount]}>Bedrag</Text>
          </View>

          {lines.map((line, index) => {
            const amount = line.quantity * line.price;
            const isLast = index === lines.length - 1;
            return (
              <View key={index} style={[styles.row, isLast ? styles.lastRow : {}]}>
                <Text style={[styles.text, styles.description]}>{line.description}</Text>
                <Text style={[styles.text, styles.qty]}>{line.quantity}</Text>
                <Text style={[styles.text, styles.unit]}>{line.unit}</Text>
                <Text style={[styles.text, styles.price]}>{formatBedrag(line.price)}</Text>
                <Text style={[styles.text, styles.vat]}>{line.vatRate}%</Text>
                <Text style={[styles.text, styles.amount]}>{formatBedrag(amount)}</Text>
              </View>
            );
          })}
        </View>

        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotaal (excl. BTW)</Text>
            <Text style={styles.totalValue}>{formatBedrag(totals.subtotal)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>BTW Hoog (21%)</Text>
            <Text style={styles.totalValue}>{formatBedrag(totals.vatHigh)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>BTW Laag (9%)</Text>
            <Text style={styles.totalValue}>{formatBedrag(totals.vatLow)}</Text>
          </View>
          <View style={[styles.totalRow, styles.grandTotal]}>
            <Text style={[styles.totalLabel, styles.grandTotalText]}>Totaal</Text>
            <Text style={[styles.totalValue, styles.grandTotalText]}>{formatBedrag(totals.total)}</Text>
          </View>
        </View>

        <Text style={styles.legal}>{paymentText}</Text>

        <View style={styles.footer}>
          <View style={styles.footerColumn}>
            <Text style={styles.footerLabel}>IBAN</Text>
            <Text style={styles.footerValue}>{companyProfile?.iban ?? "—"}</Text>
            <Text style={styles.footerLabel}>BIC</Text>
            <Text style={styles.footerValue}>{companyProfile?.bankName ?? "—"}</Text>
          </View>
          <View style={styles.footerColumn}>
            <Text style={styles.footerLabel}>KVK</Text>
            <Text style={styles.footerValue}>{companyProfile?.kvkNumber ?? "—"}</Text>
            <Text style={styles.footerLabel}>BTW</Text>
            <Text style={styles.footerValue}>{companyProfile?.btwNumber ?? "—"}</Text>
          </View>
          <View style={styles.footerColumn}>
            <Text style={styles.footerLabel}>Email</Text>
            <Text style={styles.footerValue}>{companyProfile?.email ?? "—"}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
