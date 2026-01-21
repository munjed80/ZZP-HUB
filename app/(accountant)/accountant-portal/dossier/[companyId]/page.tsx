import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAccountantSession } from "@/lib/auth/accountant-session";
import { getServerAuthSession } from "@/lib/auth";
import { CompanyDossierContent } from "./dossier-content";

const maskId = (value?: string | null) => {
  if (!value) return null;
  if (value.length <= 6) return `${value[0]}***${value[value.length - 1]}`;
  return `${value.slice(0, 3)}***${value.slice(-2)}`;
};

const logDossierLoad = (payload: Record<string, unknown>) => {
  console.log("[ACCOUNTANT_DOSSIER_LOAD]", payload);
};

export const buildForbiddenDossierResponse = (message: string, companyId?: string) => {
  const body = `
    <!doctype html>
    <html lang="nl">
      <head><title>Geen toegang</title></head>
      <body style="font-family: system-ui; padding: 2rem; color: #111;">
        <h1>Geen toegang tot dossier</h1>
        <p>${message}</p>
        ${
          companyId
            ? `<p>Bedrijf: <code>${companyId}</code></p>`
            : ""
        }
        <p><a href="/accountant-portal">Terug naar Accountant Portal</a></p>
      </body>
    </html>
  `;
  return new Response(body, {
    status: 403,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
};

export const metadata: Metadata = {
  title: "Bedrijfsdossier",
  description: "Volledig overzicht van bedrijfsgegevens voor accountants",
};

export default async function CompanyDossierPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;

  // Check authentication - either accountant session or regular session with accountant role
  const accountantSession = await getAccountantSession();
  const regularSession = await getServerAuthSession();

  const userId = accountantSession?.userId || regularSession?.user?.id;
  const userRole = accountantSession?.role || regularSession?.user?.role;

  if (!userId) {
    logDossierLoad({
      hasSession: false,
      accountantUserIdMasked: maskId(userId),
      companyIdMasked: maskId(companyId),
      allowed: false,
      reason: "NO_SESSION",
    });
    redirect("/login?type=accountant");
  }

  // Verify access to this company
  const hasAccess = await prisma.companyMember.findUnique({
    where: {
      companyId_userId: {
        companyId,
        userId,
      },
    },
  });

  if (!hasAccess) {
    logDossierLoad({
      hasSession: true,
      accountantUserIdMasked: maskId(userId),
      companyIdMasked: maskId(companyId),
      allowed: false,
      reason: "NO_ACCESS",
    });
    return buildForbiddenDossierResponse("Je hebt geen toegang tot dit dossier.", maskId(companyId) ?? companyId);
  }

  // Get company details
  const company = await prisma.user.findUnique({
    where: { id: companyId },
    include: {
      companyProfile: true,
    },
  });

  if (!company) {
    logDossierLoad({
      hasSession: true,
      accountantUserIdMasked: maskId(userId),
      companyIdMasked: maskId(companyId),
      allowed: false,
      reason: "COMPANY_NOT_FOUND",
    });
    notFound();
  }

  logDossierLoad({
    hasSession: true,
    accountantUserIdMasked: maskId(userId),
    companyIdMasked: maskId(companyId),
    allowed: true,
    reason: "ALLOWED",
  });

  // Get invoices
  const invoices = await prisma.invoice.findMany({
    where: { userId: companyId },
    include: {
      client: true,
      lines: true,
    },
    orderBy: { date: "desc" },
    take: 100,
  });

  // Get expenses
  const expenses = await prisma.expense.findMany({
    where: { userId: companyId },
    orderBy: { date: "desc" },
    take: 100,
  });

  // Get clients
  const clients = await prisma.client.findMany({
    where: { userId: companyId },
    orderBy: { name: "asc" },
  });

  return (
    <CompanyDossierContent
      company={{
        id: company.id,
        naam: company.naam || "Onbekend",
        email: company.email,
        companyName: company.companyProfile?.companyName || "Onbekend",
        kvkNumber: company.companyProfile?.kvkNumber || "",
        btwNumber: company.companyProfile?.btwNumber || "",
      }}
      invoices={invoices.map((inv) => ({
        id: inv.id,
        invoiceNum: inv.invoiceNum,
        date: inv.date.toISOString(),
        dueDate: inv.dueDate.toISOString(),
        clientName: inv.client.name,
        emailStatus: inv.emailStatus,
        total: inv.lines.reduce((sum, line) => sum + Number(line.amount), 0),
        lines: inv.lines.map((line) => ({
          description: line.description,
          quantity: Number(line.quantity),
          price: Number(line.price),
          amount: Number(line.amount),
          vatRate: line.vatRate,
          unit: line.unit,
        })),
      }))}
      expenses={expenses.map((exp) => ({
        id: exp.id,
        category: exp.category,
        description: exp.description,
        amountExcl: Number(exp.amountExcl),
        vatRate: exp.vatRate,
        date: exp.date.toISOString(),
        receiptUrl: exp.receiptUrl,
      }))}
      clients={clients.map((client) => ({
        id: client.id,
        name: client.name,
        email: client.email,
        kvkNumber: client.kvkNumber,
        btwId: client.btwId,
      }))}
      userRole={userRole as string}
      permissions={JSON.parse(hasAccess.permissions || "{}")}
    />
  );
}
