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

interface AccountantOTPEmailProps {
  accessUrl: string;
  companyName: string;
  otpCode: string;
  validityMinutes?: number;
}

export const AccountantOTPEmail = ({
  accessUrl,
  companyName,
  otpCode,
  validityMinutes = 10,
}: AccountantOTPEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Uw toegangscode voor {companyName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={box}>
            <Heading style={heading}>Accountant Toegang</Heading>
            <Text style={paragraph}>Hallo,</Text>
            <Text style={paragraph}>
              U bent uitgenodigd om als accountant toegang te krijgen tot{' '}
              <strong>{companyName}</strong> in Matrixtop.
            </Text>
            <Text style={paragraph}>
              Klik op onderstaande knop om naar de toegangspagina te gaan:
            </Text>
            <Button style={button} href={accessUrl}>
              Ga naar Toegangspagina
            </Button>
            <Text style={paragraph}>
              Of kopieer en plak deze link in uw browser:
            </Text>
            <Link href={accessUrl} style={anchor}>
              {accessUrl}
            </Link>
            <Text style={paragraph}>
              Voer vervolgens de onderstaande verificatiecode in:
            </Text>
            <Section style={otpBox}>
              <Text style={otpLabel}>Verificatiecode:</Text>
              <Text style={otpValue}>{otpCode}</Text>
            </Section>
            <Text style={warningText}>
              ⏱️ Deze code is {validityMinutes} minuten geldig.
            </Text>
            <Text style={paragraph}>
              <strong>Beveiligingstip:</strong> Deel deze code met niemand. Ons team zal nooit om uw code vragen.
            </Text>
            <Text style={footer}>
              Als u niet verwachtte deze uitnodiging te ontvangen, kunt u deze e-mail
              negeren.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default AccountantOTPEmail;

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

const otpBox = {
  backgroundColor: '#0A2E50',
  borderRadius: '8px',
  padding: '20px',
  marginBottom: '16px',
  textAlign: 'center' as const,
};

const otpLabel = {
  fontSize: '14px',
  color: '#ffffff',
  marginBottom: '8px',
  opacity: 0.8,
};

const otpValue = {
  fontSize: '36px',
  fontWeight: 'bold',
  color: '#ffffff',
  fontFamily: 'monospace',
  letterSpacing: '8px',
  marginTop: '0',
};

const warningText = {
  fontSize: '14px',
  color: '#f59e0b',
  marginBottom: '24px',
  fontStyle: 'italic',
  textAlign: 'center' as const,
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
