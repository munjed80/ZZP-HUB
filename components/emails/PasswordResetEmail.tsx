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

interface PasswordResetEmailProps {
  resetUrl: string;
  userName?: string;
}

export const PasswordResetEmail = ({
  resetUrl,
  userName,
}: PasswordResetEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Reset je wachtwoord voor Matrixtop</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={box}>
            <Heading style={heading}>Wachtwoord resetten</Heading>
            <Text style={paragraph}>
              Hallo {userName || 'daar'},
            </Text>
            <Text style={paragraph}>
              We hebben een verzoek ontvangen om je wachtwoord te resetten voor je Matrixtop account.
            </Text>
            <Text style={paragraph}>
              Klik op onderstaande knop om een nieuw wachtwoord in te stellen:
            </Text>
            <Button style={button} href={resetUrl}>
              Wachtwoord resetten
            </Button>
            <Text style={paragraph}>
              Of kopieer en plak deze link in je browser:
            </Text>
            <Link href={resetUrl} style={anchor}>
              {resetUrl}
            </Link>
            <Text style={paragraph}>
              Deze resetlink is 60 minuten geldig.
            </Text>
            <Text style={footer}>
              Als je geen wachtwoordreset hebt aangevraagd, kun je deze e-mail negeren. 
              Je wachtwoord blijft ongewijzigd.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default PasswordResetEmail;

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
