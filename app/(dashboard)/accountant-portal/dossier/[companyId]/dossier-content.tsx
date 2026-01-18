"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  FileText,
  Receipt,
  Users,
  ArrowLeft,
  Download,
  Check,
  Eye,
  Edit,
  TrendingUp,
  Euro,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import { BTWFocusWidget } from "@/components/btw-focus-widget";

interface Company {
  id: string;
  naam: string;
  email: string;
  companyName: string;
  kvkNumber: string;
  btwNumber: string;
}

interface Invoice {
  id: string;
  invoiceNum: string;
  date: string;
  dueDate: string;
  clientName: string;
  emailStatus: string;
  total: number;
  lines: Array<{
    description: string;
    quantity: number;
    price: number;
    amount: number;
    vatRate: string;
    unit: string;
  }>;
}

interface Expense {
  id: string;
  category: string;
  description: string;
  amountExcl: number;
  vatRate: string;
  date: string;
  receiptUrl: string | null;
}

interface Client {
  id: string;
  name: string;
  email: string;
  kvkNumber: string | null;
  btwId: string | null;
}

interface Permissions {
  read?: boolean;
  edit?: boolean;
  export?: boolean;
  btw?: boolean;
}

interface Props {
  company: Company;
  invoices: Invoice[];
  expenses: Expense[];
  clients: Client[];
  userRole: string;
  permissions: Permissions;
}

type Tab = "overview" | "invoices" | "expenses" | "clients" | "btw";

export function CompanyDossierContent({
  company,
  invoices,
  expenses,
  clients,
  userRole,
  permissions,
}: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (!permissions.export) {
      toast.error("U heeft geen exportrechten");
      return;
    }

    setExporting(true);
    try {
      const response = await fetch("/api/export/company-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId: company.id }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Data geëxporteerd");
        if (data.downloadUrl) {
          window.open(data.downloadUrl, "_blank");
        }
      } else {
        toast.error(data.message || "Fout bij exporteren");
      }
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Fout bij exporteren");
    } finally {
      setExporting(false);
    }
  };

  const handleMarkReviewed = async (type: string, id: string) => {
    try {
      const response = await fetch("/api/accountant/mark-reviewed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId: company.id, type, id }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Gemarkeerd als gecontroleerd");
      } else {
        toast.error(data.message || "Fout bij markeren");
      }
    } catch (error) {
      console.error("Mark reviewed error:", error);
      toast.error("Fout bij markeren");
    }
  };

  const canEdit = permissions.edit || userRole === "ACCOUNTANT_EDIT";
  const canExport = permissions.export || userRole === "ACCOUNTANT_EDIT" || userRole === "ACCOUNTANT_VIEW";
  const canViewBTW = permissions.btw || userRole === "ACCOUNTANT_EDIT";

  const totalRevenue = invoices.reduce((sum, inv) => sum + inv.total, 0);
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amountExcl, 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-muted border-b border-border px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => router.push("/accountant-portal")}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Terug naar overzicht
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-xl bg-primary/10 flex items-center justify-center">
                <Building2 className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-foreground">
                  {company.companyName}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  KVK: {company.kvkNumber} • BTW: {company.btwNumber}
                </p>
              </div>
            </div>

            {canExport && (
              <button
                onClick={handleExport}
                disabled={exporting}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {exporting ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"></div>
                    <span>Exporteren...</span>
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    <span>Exporteer alles</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-4 overflow-x-auto">
            {[
              { id: "overview" as Tab, label: "Overzicht", icon: TrendingUp },
              { id: "invoices" as Tab, label: "Facturen", icon: FileText },
              { id: "expenses" as Tab, label: "Uitgaven", icon: Receipt },
              { id: "clients" as Tab, label: "Relaties", icon: Users },
              ...(canViewBTW ? [{ id: "btw" as Tab, label: "BTW", icon: Euro }] : []),
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Facturen</p>
                    <p className="text-2xl font-semibold text-foreground">{invoices.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <Receipt className="h-8 w-8 text-amber-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Uitgaven</p>
                    <p className="text-2xl font-semibold text-foreground">{expenses.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Omzet</p>
                    <p className="text-2xl font-semibold text-foreground">
                      € {(totalRevenue / 100).toLocaleString('nl-NL', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <Users className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Relaties</p>
                    <p className="text-2xl font-semibold text-foreground">{clients.length}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* BTW Widget (if user has btw permissions) */}
            {canViewBTW && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <BTWFocusWidget companyId={company.id} companyName={company.companyName} />
                
                {/* Recent Activity */}
                <div className="bg-card border border-border rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Recente activiteit</h3>
                  <div className="space-y-3">
                    {invoices.slice(0, 5).map((invoice) => (
                      <div key={invoice.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                        <div className="flex items-center gap-3">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium text-foreground">{invoice.invoiceNum}</p>
                            <p className="text-xs text-muted-foreground">{invoice.clientName}</p>
                          </div>
                        </div>
                        <span className="text-sm font-medium text-foreground">
                          € {(invoice.total / 100).toLocaleString('nl-NL', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Invoices Tab */}
        {activeTab === "invoices" && (
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted border-b border-border">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Factuurnummer</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Klant</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Datum</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Bedrag</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Status</th>
                    {canEdit && (
                      <th className="px-6 py-3 text-right text-sm font-semibold text-foreground">Acties</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                      <td className="px-6 py-4 text-sm text-foreground">{invoice.invoiceNum}</td>
                      <td className="px-6 py-4 text-sm text-foreground">{invoice.clientName}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {new Date(invoice.date).toLocaleDateString('nl-NL')}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-foreground">
                        € {(invoice.total / 100).toLocaleString('nl-NL', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                          invoice.emailStatus === "BETAALD"
                            ? "bg-green-500/10 text-green-600"
                            : invoice.emailStatus === "VERZONDEN"
                            ? "bg-blue-500/10 text-blue-600"
                            : "bg-amber-500/10 text-amber-600"
                        }`}>
                          {invoice.emailStatus}
                        </span>
                      </td>
                      {canEdit && (
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleMarkReviewed("invoice", invoice.id)}
                            className="text-primary hover:text-primary/80"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Expenses Tab */}
        {activeTab === "expenses" && (
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted border-b border-border">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Categorie</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Beschrijving</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Datum</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Bedrag (excl.)</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">BTW</th>
                    {canEdit && (
                      <th className="px-6 py-3 text-right text-sm font-semibold text-foreground">Acties</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((expense) => (
                    <tr key={expense.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                      <td className="px-6 py-4 text-sm text-foreground">{expense.category}</td>
                      <td className="px-6 py-4 text-sm text-foreground">{expense.description}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {new Date(expense.date).toLocaleDateString('nl-NL')}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-foreground">
                        € {(expense.amountExcl / 100).toLocaleString('nl-NL', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{expense.vatRate}</td>
                      {canEdit && (
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleMarkReviewed("expense", expense.id)}
                            className="text-primary hover:text-primary/80"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Clients Tab */}
        {activeTab === "clients" && (
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted border-b border-border">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Naam</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Email</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">KVK</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">BTW-ID</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map((client) => (
                    <tr key={client.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                      <td className="px-6 py-4 text-sm font-medium text-foreground">{client.name}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{client.email}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{client.kvkNumber || "-"}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{client.btwId || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* BTW Tab */}
        {activeTab === "btw" && canViewBTW && (
          <div className="max-w-2xl mx-auto">
            <BTWFocusWidget companyId={company.id} companyName={company.companyName} />
          </div>
        )}
      </div>
    </div>
  );
}
