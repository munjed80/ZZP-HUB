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
    marginBottom: 28,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    gap: 14,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  title: {
    fontSize: 24,
    fontWeight: 800,
    letterSpacing: 0.5,
  },
  invoiceNumberRow: {
    marginTop: 8,
    fontSize: 12,
    color: "#1f2937",
    fontWeight: 600,
  },
  invoiceNumberValue: {
    fontWeight: 800,
  },
  parties: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 18,
  },
  companyBlock: {
    flex: 1,
    alignItems: "flex-start",
    gap: 4,
  },
  clientBlock: {
    flex: 1,
    alignItems: "flex-start",
    gap: 4,
  },
  companyName: {
    fontSize: 16,
    fontWeight: 700,
    marginBottom: 2,
  },
  clientName: {
    fontSize: 14,
    fontWeight: 700,
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
    width: 140,
    height: 50,
  },
  label: {
    fontSize: 10,
    textTransform: "uppercase",
    color: "#475569",
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  text: {
    fontSize: 11,
  },
  meta: {
    marginBottom: 18,
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
  },
  metaItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    minWidth: 140,
    backgroundColor: "#f8fafc",
  },
  metaLabel: {
    fontSize: 9,
    color: "#64748b",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  metaValue: {
    fontSize: 12,
    fontWeight: 700,
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
    backgroundColor: "#f3f4f6",
    borderBottomWidth: 0.5,
    borderBottomColor: "#e5e7eb",
    paddingVertical: 9,
    paddingHorizontal: 10,
  },
  headerCell: {
    fontSize: 10,
    fontWeight: 700,
    color: primaryColor,
    textTransform: "uppercase",
  },
  row: {
    flexDirection: "row",
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderBottomWidth: 0.5,
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
    borderWidth: 0.5,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    padding: 14,
    backgroundColor: "#f9fafb",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 11,
    color: "#334155",
  },
  totalValue: {
    fontSize: 11,
    fontWeight: 700,
  },
  grandTotal: {
    fontSize: 15,
    fontWeight: 800,
    marginTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: "#e5e7eb",
    paddingTop: 10,
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
    gap: 10,
  },
  footerColumn: {
    flex: 1,
    gap: 2,
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

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.title}>{documentType}</Text>
              <Text style={styles.invoiceNumberRow}>
                Factuurnummer: <Text style={styles.invoiceNumberValue}>{invoice.invoiceNum}</Text>
              </Text>
            </View>
            {isTrustedLogo && logoUrl ? (
              /* eslint-disable-next-line jsx-a11y/alt-text */
              <Image src={logoUrl} style={styles.logo} />
            ) : (
              <Text style={styles.companyName}>{companyProfile?.companyName ?? "Bedrijfsnaam"}</Text>
            )}
          </View>

          <View style={styles.parties}>
            <View style={styles.companyBlock}>
              <Text style={styles.label}>Verzender</Text>
              <Text style={styles.companyName}>{companyProfile?.companyName ?? "Bedrijfsnaam"}</Text>
              <Text style={styles.text}>{companyProfile?.address ?? "Adres niet ingesteld"}</Text>
              <Text style={styles.text}>
                {companyProfile?.postalCode ?? ""} {companyProfile?.city ?? ""}
              </Text>
              {companyProfile?.kvkNumber ? <Text style={styles.text}>KVK: {companyProfile.kvkNumber}</Text> : null}
              {companyProfile?.iban ? <Text style={styles.text}>IBAN: {companyProfile.iban}</Text> : null}
            </View>

            <View style={styles.clientBlock}>
              <Text style={styles.label}>Ontvanger</Text>
              <Text style={styles.clientName}>{invoice.client.name}</Text>
              <Text style={styles.text}>{invoice.client.address}</Text>
              <Text style={styles.text}>
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
            <Text style={styles.totalLabel}>Totaal</Text>
            <Text style={styles.totalValue}>{formatBedrag(totals.total)}</Text>
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
