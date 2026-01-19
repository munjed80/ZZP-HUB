import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAccountantSession } from "@/lib/auth/accountant-session";
import { getServerAuthSession } from "@/lib/auth";

/**
 * Extract data from receipt image using OCR
 * This is a placeholder implementation - in production, you would integrate with:
 * - Google Vision API
 * - Amazon Textract
 * - Azure Computer Vision
 * - Tesseract.js (client-side)
 */
export async function POST(request: NextRequest) {
  try {
    const accountantSession = await getAccountantSession();
    const regularSession = await getServerAuthSession();
    const userId = accountantSession?.userId || regularSession?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Niet geauthenticeerd" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { expenseId, imageUrl } = body;

    if (!expenseId || !imageUrl) {
      return NextResponse.json(
        { success: false, message: "Ontbrekende vereiste velden" },
        { status: 400 }
      );
    }

    // Verify the expense exists and user has access
    const expense = await prisma.expense.findFirst({
      where: { id: expenseId },
      include: { user: true },
    });

    if (!expense) {
      return NextResponse.json(
        { success: false, message: "Uitgave niet gevonden" },
        { status: 404 }
      );
    }

    // Verify access
    if (expense.userId !== userId) {
      // Check if user is an accountant with access
      const hasAccess = await prisma.companyMember.findUnique({
        where: {
          companyId_userId: {
            companyId: expense.userId,
            userId,
          },
        },
      });

      if (!hasAccess) {
        return NextResponse.json(
          { success: false, message: "Geen toegang tot deze uitgave" },
          { status: 403 }
        );
      }
    }

    // Update expense status to indicate OCR is processing
    await prisma.expense.update({
      where: { id: expenseId },
      data: { ocrStatus: "pending" },
    });

    // PLACEHOLDER: Mock OCR extraction
    // In production, call your OCR service here
    // For now, we'll return a simulated result after a delay
    
    // Simulate OCR processing
    const mockOcrResult = await simulateOCR(imageUrl);

    // Update expense with OCR results
    await prisma.expense.update({
      where: { id: expenseId },
      data: {
        ocrStatus: "completed",
        ocrData: JSON.stringify(mockOcrResult),
        extractedData: JSON.stringify({
          rawText: mockOcrResult.rawText,
          confidence: mockOcrResult.confidence,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: "OCR verwerking voltooid",
      data: mockOcrResult,
    });
  } catch (error) {
    console.error("Error processing OCR:", error);
    
    // Update expense status to failed if we have the ID
    try {
      const body = await request.json();
      if (body.expenseId) {
        await prisma.expense.update({
          where: { id: body.expenseId },
          data: { ocrStatus: "failed" },
        });
      }
    } catch (e) {
      // Ignore error in error handler
    }

    return NextResponse.json(
      { success: false, message: "Fout bij OCR verwerking" },
      { status: 500 }
    );
  }
}

/**
 * Mock OCR function - replace with real OCR service integration
 */
async function simulateOCR(imageUrl: string) {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Return mock extracted data
  // In production, this would parse the actual image
  return {
    vendor: "Mock Supermarkt",
    amount: 45.99,
    date: new Date().toISOString().split("T")[0],
    category: "Kantoorbenodigdheden",
    rawText: "MOCK RECEIPT\n\nMock Supermarkt\nDate: " + new Date().toLocaleDateString("nl-NL") + "\nTotal: €45.99",
    confidence: 0.92,
    suggestions: {
      description: "Kantoorbenodigdheden - Mock Supermarkt",
      amountExcl: 38.00,
      vatRate: "HOOG_21",
    },
  };
}
