// Sentral inngang for alt skjema-relatert.
//
// react-hook-form skal kun bo i @poynt/ui (én fysisk instans). Hvis et app
// installerer sin egen kopi, får man to ulike `Control<T>`-typer som ikke er
// kompatible (TS2322 på `control={form.control}`). Alle apper importerer derfor
// react-hook-form og zodResolver HERFRA, ikke direkte.

export {
  Controller,
  FormProvider,
  useController,
  useFieldArray,
  useForm,
  useFormContext,
  useFormState,
  useWatch,
} from "react-hook-form";
export type {
  Control,
  DefaultValues,
  FieldErrors,
  FieldPath,
  FieldValues,
  Path,
  Resolver,
  SubmitHandler,
  UseFormProps,
  UseFormReturn,
} from "react-hook-form";

export { zodResolver } from "@hookform/resolvers/zod";

// shadcn-form-komponentene (bygget på samme react-hook-form-instans)
export {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  useFormField,
  Field,
  type FieldProps,
  Input,
  Textarea,
  Label,
} from "./components/form";
