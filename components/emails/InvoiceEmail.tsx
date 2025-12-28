import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

type InvoiceEmailProps = {
  clientName: string;
  invoiceNumber: string;
  viewUrl: string;
  companyName?: string | null;
  companyDetails?: string;
  logoUrl?: string | null;
};

export default function InvoiceEmail({
  clientName,
  invoiceNumber,
  viewUrl,
  companyName = "ZZP HUB",
  companyDetails,
  logoUrl,
}: InvoiceEmailProps) {
  const buttonColor = "#1d4ed8";

  return (
    <Html>
      <Head />
      <Preview>{`Factuur ${invoiceNumber} van ${companyName}`}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={header}>
            {logoUrl ? (
              <Img src={logoUrl} alt={companyName ?? "Bedrijf"} width="140" height="48" style={logo} />
            ) : (
              <Text style={companyTitle}>{companyName}</Text>
            )}
          </Section>

          <Section style={card}>
            <Text style={greeting}>Beste {clientName},</Text>
            <Text style={paragraph}>
              Hierbij ontvangt u de factuur {invoiceNumber} voor de geleverde diensten.
            </Text>

            <Section style={ctaWrapper}>
              <Button style={{ ...button, backgroundColor: buttonColor }} href={viewUrl}>
                Bekijk Factuur online
              </Button>
            </Section>

            <Hr style={divider} />

            <Text style={paragraph}>
              Met vriendelijke groet,
              <br />
              {companyName}
            </Text>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>{companyDetails ?? companyName}</Text>
            <Text style={footerText}>Bedankt voor de samenwerking.</Text>
            <Link href={viewUrl} style={footerLink}>
              Factuur online bekijken
            </Link>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const body = {
  backgroundColor: "#f8fafc",
  padding: "24px 0",
  fontFamily: "Inter, Arial, sans-serif",
};

const container = {
  backgroundColor: "#ffffff",
  borderRadius: "12px",
  border: "1px solid #e2e8f0",
  margin: "0 auto",
  padding: "24px",
  maxWidth: "600px",
  boxShadow: "0 10px 25px rgba(15, 23, 42, 0.05)",
};

const header = {
  marginBottom: "12px",
};

const logo = {
  maxWidth: "180px",
  height: "auto",
};

const companyTitle = {
  fontSize: "20px",
  fontWeight: 700,
  color: "#0f172a",
};

const card = {
  backgroundColor: "#f8fafc",
  borderRadius: "10px",
  padding: "20px",
  border: "1px solid #e2e8f0",
};

const greeting = {
  fontSize: "16px",
  fontWeight: 600,
  color: "#0f172a",
  marginBottom: "12px",
};

const paragraph = {
  fontSize: "14px",
  color: "#0f172a",
  lineHeight: "22px",
};

const ctaWrapper = {
  marginTop: "18px",
  marginBottom: "12px",
};

const button = {
  display: "inline-block",
  padding: "12px 16px",
  color: "#ffffff",
  textDecoration: "none",
  borderRadius: "10px",
  fontWeight: 700,
  textAlign: "center" as const,
};

const divider = {
  borderColor: "#e2e8f0",
  margin: "16px 0",
};

const footer = {
  marginTop: "12px",
  textAlign: "left" as const,
};

const footerText = {
  color: "#475569",
  fontSize: "12px",
  margin: "0 0 4px",
  lineHeight: "18px",
};

const footerLink = {
  color: "#1d4ed8",
  fontSize: "12px",
};
