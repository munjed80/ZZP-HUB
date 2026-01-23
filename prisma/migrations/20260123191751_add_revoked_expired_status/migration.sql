-- AlterEnum
-- Add REVOKED and EXPIRED values to CompanyUserStatus enum
ALTER TYPE "CompanyUserStatus" ADD VALUE 'REVOKED';
ALTER TYPE "CompanyUserStatus" ADD VALUE 'EXPIRED';
