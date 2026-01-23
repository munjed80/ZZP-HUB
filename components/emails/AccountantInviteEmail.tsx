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
  inviteUrl: string;
  companyName: string;
  inviterName?: string;
}

export const AccountantInviteEmail = ({
  inviteUrl,
  companyName,
  inviterName,
}: AccountantInviteEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Uitnodiging om accountant te worden voor {companyName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={box}>
            <Heading style={heading}>Accountant Uitnodiging</Heading>
            <Text style={paragraph}>
              Hallo,
            </Text>
            <Text style={paragraph}>
              {inviterName ? `${inviterName} heeft` : 'U bent'} uitgenodigd om als accountant toegang te krijgen tot de 
              administratie van <strong>{companyName}</strong> in ZZP Hub.
            </Text>
            <Text style={paragraph}>
              Klik op onderstaande knop om de uitnodiging te accepteren:
            </Text>
            <Button style={button} href={inviteUrl}>
              Uitnodiging accepteren
            </Button>
            <Text style={paragraph}>
              Of kopieer en plak deze link in je browser:
            </Text>
            <Link href={inviteUrl} style={anchor}>
              {inviteUrl}
            </Link>
            <Text style={paragraph}>
              <strong>Let op:</strong> Deze uitnodigingslink is 7 dagen geldig.
            </Text>
            <Text style={footer}>
              Als u deze uitnodiging niet verwacht, kunt u deze e-mail negeren.
              De link werkt alleen als u een ZZP Hub account heeft of aanmaakt.
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
