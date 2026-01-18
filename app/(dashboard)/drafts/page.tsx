import { getDrafts } from "./actions";
import { DraftsClient } from "./drafts-client";

export default async function DraftsPage() {
  let drafts = [];
  let errorMessage: string | undefined;

  try {
    drafts = await getDrafts();
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : "Concepten konden niet worden geladen.";
  }

  return <DraftsClient drafts={drafts} errorMessage={errorMessage} />;
}
