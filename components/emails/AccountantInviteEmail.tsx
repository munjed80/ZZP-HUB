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

interface AccountantInviteEmailProps {
  acceptUrl: string;
  companyName: string;
  temporaryPassword?: string;
  isNewUser?: boolean;
}

export const AccountantInviteEmail = ({
  acceptUrl,
  companyName,
  temporaryPassword,
  isNewUser,
}: AccountantInviteEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Uitnodiging om toegang te krijgen tot {companyName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={box}>
            <Heading style={heading}>
              {isNewUser ? 'Welkom bij ZZP Hub!' : 'Uitnodiging ontvangen'}
            </Heading>
            <Text style={paragraph}>Hallo,</Text>
            <Text style={paragraph}>
              U bent uitgenodigd om als accountant toegang te krijgen tot{' '}
              <strong>{companyName}</strong> in ZZP Hub.
            </Text>
            {isNewUser && temporaryPassword && (
              <>
                <Text style={paragraph}>
                  Er is automatisch een account voor u aangemaakt. U kunt inloggen met het
                  volgende tijdelijke wachtwoord:
                </Text>
                <Section style={credentialsBox}>
                  <Text style={credentialsLabel}>Tijdelijk wachtwoord:</Text>
                  <Text style={credentialsValue}>{temporaryPassword}</Text>
                </Section>
                <Text style={warningText}>
                  We raden u aan om na uw eerste login uw wachtwoord direct te wijzigen.
                </Text>
              </>
            )}
            <Text style={paragraph}>
              Klik op onderstaande knop om de uitnodiging te accepteren
              {isNewUser ? ' en direct in te loggen' : ''}:
            </Text>
            <Button style={button} href={acceptUrl}>
              Uitnodiging accepteren
            </Button>
            <Text style={paragraph}>
              Of kopieer en plak deze link in je browser:
            </Text>
            <Link href={acceptUrl} style={anchor}>
              {acceptUrl}
            </Link>
            <Text style={paragraph}>
              Deze uitnodiging is 7 dagen geldig.
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

export default AccountantInviteEmail;

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

const credentialsBox = {
  backgroundColor: '#f4f4f5',
  borderRadius: '8px',
  padding: '16px',
  marginBottom: '16px',
};

const credentialsLabel = {
  fontSize: '14px',
  color: '#71717a',
  marginBottom: '4px',
};

const credentialsValue = {
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#18181b',
  fontFamily: 'monospace',
  marginTop: '0',
};

const warningText = {
  fontSize: '14px',
  color: '#f59e0b',
  marginBottom: '24px',
  fontStyle: 'italic',
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
