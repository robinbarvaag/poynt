"use client";

import {
  type DeclineRequest,
  declineRequestSchema,
  relationshipTypeLabels,
  relationshipTypes,
  situationTypeLabels,
  situationTypes,
  toneTypeLabels,
  toneTypes,
} from "@poynt/planner-validators";
import {
  Button,
  Checkbox,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Label,
  RadioGroup,
  RadioGroupItem,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@poynt/ui";
import { useForm, zodResolver } from "@poynt/ui/form";
import { Icon } from "@poynt/ui/icons";

interface DeclineFormProps {
  onSubmit: (data: DeclineRequest) => Promise<void>;
  isLoading: boolean;
}

export function DeclineForm({ onSubmit, isLoading }: DeclineFormProps) {
  const form = useForm<DeclineRequest>({
    resolver: zodResolver(declineRequestSchema),
    defaultValues: {
      situationType: undefined,
      relationship: "acquaintance",
      tone: "friendly",
      keepDoorOpen: true,
      additionalContext: "",
      originalMessage: "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="originalMessage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Hva vil du si nei til?</FormLabel>
              <FormDescription>
                Lim inn meldingen du har fått, eller beskriv kort hva noen har
                bedt deg om. Jo mer kontekst, jo bedre treffer svaret.
              </FormDescription>
              <FormControl>
                <Textarea
                  className="min-h-40 resize-none text-base"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-8 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="situationType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type situasjon</FormLabel>
                <FormDescription>
                  La stå tom, så kjenner AI-en igjen situasjonen ut fra
                  meldingen.
                </FormDescription>
                <Select
                  onValueChange={field.onChange}
                  value={field.value ?? ""}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Finn ut automatisk" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {situationTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {situationTypeLabels[type]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="relationship"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hvem er det til?</FormLabel>
                <FormDescription>
                  Bestemmer hvor formelt svaret blir.
                </FormDescription>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex flex-col gap-2 pt-1"
                  >
                    {relationshipTypes.map((type) => (
                      <div key={type} className="flex items-center gap-2">
                        <RadioGroupItem value={type} id={type} />
                        <Label
                          htmlFor={type}
                          className="cursor-pointer font-normal"
                        >
                          {relationshipTypeLabels[type]}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="tone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tone</FormLabel>
                <FormDescription>
                  Hvordan vil du at avslaget skal klinge?
                </FormDescription>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex flex-col gap-2 pt-1"
                  >
                    {toneTypes.map((type) => (
                      <div key={type} className="flex items-center gap-2">
                        <RadioGroupItem value={type} id={`tone-${type}`} />
                        <Label
                          htmlFor={`tone-${type}`}
                          className="cursor-pointer font-normal"
                        >
                          {toneTypeLabels[type]}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="keepDoorOpen"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-start gap-3">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="mt-0.5"
                    />
                  </FormControl>
                  <div className="space-y-1">
                    <FormLabel className="mt-0! cursor-pointer font-normal">
                      Hold døren åpen for senere
                    </FormLabel>
                    <FormDescription>
                      Avslaget avsluttes med en åpning for kontakt en annen
                      gang. Skru av for et tydelig, endelig nei.
                    </FormDescription>
                  </div>
                </div>
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="additionalContext"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ekstra kontekst (valgfritt)</FormLabel>
              <FormDescription>
                Noe AI-en bør vite? F.eks. «jeg er fullbooket ut året» eller «vi
                har samarbeidet før».
              </FormDescription>
              <FormControl>
                <Textarea
                  className="min-h-20 resize-none"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isLoading} className="w-full gap-2">
          {isLoading ? (
            "Skriver svar…"
          ) : (
            <>
              <Icon name="sparkles" className="size-4" />
              Lag svar
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}
