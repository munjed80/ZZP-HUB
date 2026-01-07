import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface VerificationEmailProps {
  verificationUrl: string;
  userName?: string;
}

export const VerificationEmail = ({
  verificationUrl,
  userName,
}: VerificationEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Verifieer je e-mailadres voor ZZP-HUB</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={box}>
            <Heading style={heading}>Welkom bij ZZP-HUB!</Heading>
            <Text style={paragraph}>
              Hallo {userName || 'daar'},
            </Text>
            <Text style={paragraph}>
              Bedankt voor je aanmelding bij ZZP-HUB. Om aan de slag te gaan,
              moeten we eerst je e-mailadres verifiëren.
            </Text>
            <Text style={paragraph}>
              Klik op onderstaande knop om je e-mailadres te verifiëren en je
              account te activeren:
            </Text>
            <Button style={button} href={verificationUrl}>
              E-mailadres verifiëren
            </Button>
            <Text style={paragraph}>
              Of kopieer en plak deze link in je browser:
            </Text>
            <Link href={verificationUrl} style={anchor}>
              {verificationUrl}
            </Link>
            <Text style={paragraph}>
              Deze verificatielink is 24 uur geldig.
            </Text>
            <Text style={footer}>
              Als je geen account hebt aangemaakt bij ZZP-HUB, kun je deze
              e-mail negeren.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default VerificationEmail;

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
};

const box = {
  padding: '0 48px',
};

const heading = {
  fontSize: '32px',
  lineHeight: '1.3',
  fontWeight: '700',
  color: '#484848',
  marginBottom: '24px',
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '1.5',
  color: '#484848',
  marginBottom: '16px',
};

const button = {
  backgroundColor: '#0A2E50',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  width: '100%',
  padding: '12px 24px',
  marginBottom: '24px',
};

const anchor = {
  color: '#0A2E50',
  fontSize: '14px',
  textDecoration: 'underline',
  wordBreak: 'break-all' as const,
};

const footer = {
  color: '#8898aa',
  fontSize: '14px',
  lineHeight: '24px',
  marginTop: '32px',
  borderTop: '1px solid #eaeaea',
  paddingTop: '24px',
};
