import { AiWorkflow, type Workflow, type WorkflowIcon } from "@poynt/ui";
import { type VekstHeaderProps, headerProps, text } from "./vekst-palette";

interface AiWorkflowBlockProps extends VekstHeaderProps {
  workflows?:
    | {
        title?: string | null;
        description?: string | null;
        inputLabel?: string | null;
        inputIcon?: WorkflowIcon | null;
        outputLabel?: string | null;
        prompt?: string | null;
        exampleOutput?: string | null;
        style?: "standard" | "board" | null;
        id?: string | null;
      }[]
    | null;
}

/** Mapper Payload-blokken `aiWorkflow` til AiWorkflow i @poynt/ui. */
export function AiWorkflowBlock(props: AiWorkflowBlockProps) {
  const workflows: Workflow[] = (props.workflows ?? [])
    .filter((row) => text(row.title) && row.prompt?.trim())
    .map((row) => ({
      title: text(row.title) as string,
      description: text(row.description),
      inputLabel: text(row.inputLabel),
      inputIcon: row.inputIcon ?? undefined,
      outputLabel: text(row.outputLabel),
      // Prompt og eksempel beholder linjeskift og innrykk.
      prompt: row.prompt as string,
      exampleOutput: row.exampleOutput?.trim() ? row.exampleOutput : undefined,
      style: row.style ?? "standard",
    }));

  if (workflows.length === 0) return null;

  return <AiWorkflow {...headerProps(props)} workflows={workflows} />;
}
