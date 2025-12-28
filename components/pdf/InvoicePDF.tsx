import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

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
  iban?: string;
  logoUrl?: string | null;
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

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 11,
    padding: 32,
    lineHeight: 1.5,
    backgroundColor: "#ffffff",
    color: "#0f172a",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingBottom: 12,
  },
  clientBlock: {
    width: "55%",
  },
  companyBlock: {
    width: "45%",
    alignItems: "flex-end",
  },
  companyNameFallback: {
    fontSize: 18,
    fontWeight: 700,
  },
  logo: {
    width: 120,
    height: 40,
    marginBottom: 6,
  },
  label: {
    fontSize: 10,
    textTransform: "uppercase",
    color: "#475569",
    letterSpacing: 0.6,
  },
  text: {
    fontSize: 11,
  },
  meta: {
    marginBottom: 16,
    flexDirection: "row",
  },
  metaItem: {
    padding: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 6,
    minWidth: 150,
    marginRight: 12,
  },
  metaLabel: {
    fontSize: 9,
    color: "#64748b",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  metaValue: {
    fontSize: 12,
    fontWeight: 700,
    color: "#0f172a",
  },
  table: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 6,
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f8fafc",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  headerCell: {
    fontSize: 10,
    fontWeight: 700,
    color: "#0f172a",
    textTransform: "uppercase",
  },
  row: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
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
    marginTop: 14,
    alignSelf: "flex-end",
    width: "60%",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
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
    fontSize: 13,
    fontWeight: 700,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 6,
  },
  legal: {
    marginTop: 18,
    fontSize: 10,
    color: "#475569",
  },
});

function formatCurrency(value: number) {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(value);
}

export function InvoicePDF({ invoice }: { invoice: InvoicePdfData }) {
  const { companyProfile, lines } = invoice;
  const totals = calculateInvoiceTotals(lines);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.clientBlock}>
            <Text style={styles.label}>Klant</Text>
            <Text style={styles.text}>{invoice.client.name}</Text>
            <Text style={styles.text}>{invoice.client.address}</Text>
            <Text style={styles.text}>
              {invoice.client.postalCode} {invoice.client.city}
            </Text>
          </View>

          <View style={styles.companyBlock}>
            {companyProfile?.logoUrl ? (
              <Image src={companyProfile.logoUrl} style={styles.logo} alt="Bedrijfslogo" />
            ) : (
              <Text style={styles.companyNameFallback}>
                {companyProfile?.companyName ?? "Bedrijfsnaam"}
              </Text>
            )}
            {!companyProfile?.logoUrl && <Text style={styles.text}>{companyProfile?.companyName ?? "—"}</Text>}
            <Text style={styles.text}>{companyProfile?.address ?? "Adres niet ingesteld"}</Text>
            <Text style={styles.text}>
              {companyProfile?.postalCode ?? ""} {companyProfile?.city ?? ""}
            </Text>
            {companyProfile?.kvkNumber ? <Text style={styles.text}>KVK: {companyProfile.kvkNumber}</Text> : null}
            {companyProfile?.iban ? <Text style={styles.text}>IBAN: {companyProfile.iban}</Text> : null}
          </View>
        </View>

        <View style={styles.meta}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Factuurnummer</Text>
            <Text style={styles.metaValue}>{invoice.invoiceNum}</Text>
          </View>
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
              <View
                key={`${line.description}-${line.unit}-${line.price}-${line.vatRate}-${index}`}
                style={[styles.row, isLast && styles.lastRow]}
              >
                <Text style={[styles.text, styles.description]}>{line.description}</Text>
                <Text style={[styles.text, styles.qty]}>{line.quantity}</Text>
                <Text style={[styles.text, styles.unit]}>{line.unit}</Text>
                <Text style={[styles.text, styles.price]}>{formatCurrency(line.price)}</Text>
                <Text style={[styles.text, styles.vat]}>{line.vatRate}%</Text>
                <Text style={[styles.text, styles.amount]}>{formatCurrency(amount)}</Text>
              </View>
            );
          })}
        </View>

        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotaal (excl. BTW)</Text>
            <Text style={styles.totalValue}>{formatCurrency(totals.subtotal)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>BTW Hoog (21%)</Text>
            <Text style={styles.totalValue}>{formatCurrency(totals.vatHigh)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>BTW Laag (9%)</Text>
            <Text style={styles.totalValue}>{formatCurrency(totals.vatLow)}</Text>
          </View>
          <View style={[styles.totalRow, styles.grandTotal]}>
            <Text style={styles.totalLabel}>Totaal</Text>
            <Text style={styles.totalValue}>{formatCurrency(totals.total)}</Text>
          </View>
        </View>

        <Text style={styles.legal}>
          {`Gelieve te betalen voor ${invoice.dueDate} op rekening ${
            companyProfile?.iban ?? "—"
          } t.n.v. ${companyProfile?.companyName ?? "uw bedrijfsnaam"}.`}
        </Text>
      </Page>
    </Document>
  );
}
