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
import { Button } from "@poynt/ui";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@poynt/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@poynt/ui";
import { RadioGroup, RadioGroupItem } from "@poynt/ui";
import { Checkbox } from "@poynt/ui";
import { Textarea } from "@poynt/ui";
import { Label } from "@poynt/ui";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@poynt/ui";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@poynt/ui";
import { useForm, zodResolver } from "@poynt/ui/form";
import { useState } from "react";

interface DeclineFormProps {
  onSubmit: (data: DeclineRequest) => Promise<void>;
  isLoading: boolean;
}

export function DeclineForm({ onSubmit, isLoading }: DeclineFormProps) {
  const [mode, setMode] = useState<"quick" | "custom">("quick");

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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Tabs
          value={mode}
          onValueChange={(v) => setMode(v as "quick" | "custom")}
        >
          <TabsList className="w-full">
            <TabsTrigger value="quick" className="flex-1">
              Rask
            </TabsTrigger>
            <TabsTrigger value="custom" className="flex-1">
              Tilpasset
            </TabsTrigger>
          </TabsList>

          <TabsContent value="quick" className="mt-6 space-y-6">
            <FormField
              control={form.control}
              name="originalMessage"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      placeholder="Lim inn meldingen du vil si nei til, eller beskriv situasjonen..."
                      className="min-h-[180px] resize-none text-base"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>

          <TabsContent value="custom" className="mt-6 space-y-6">
            <FormField
              control={form.control}
              name="originalMessage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hva vil du si nei til?</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Lim inn meldingen du vil si nei til, eller beskriv situasjonen..."
                      className="min-h-[120px] resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="customize" className="border-none">
                <AccordionTrigger>
                  <span className="flex items-center gap-2">
                    <span>⚙️</span>
                    <span>Finjuster svaret ditt</span>
                  </span>
                </AccordionTrigger>
                <AccordionContent className="space-y-6 pt-2">
                  <FormField
                    control={form.control}
                    name="situationType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type situasjon</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value ?? ""}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="La AI analysere automatisk" />
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
                        <FormLabel>Relasjon</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex flex-col gap-2"
                          >
                            {relationshipTypes.map((type) => (
                              <div
                                key={type}
                                className="flex items-center gap-2"
                              >
                                <RadioGroupItem value={type} id={type} />
                                <Label
                                  htmlFor={type}
                                  className="font-normal cursor-pointer"
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
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex flex-col gap-2"
                          >
                            {toneTypes.map((type) => (
                              <div
                                key={type}
                                className="flex items-center gap-2"
                              >
                                <RadioGroupItem
                                  value={type}
                                  id={`tone-${type}`}
                                />
                                <Label
                                  htmlFor={`tone-${type}`}
                                  className="font-normal cursor-pointer"
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
                      <FormItem className="flex items-center gap-3">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="!mt-0 font-normal cursor-pointer">
                          Hold døren åpen for fremtidig kontakt
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>
        </Tabs>

        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? "Genererer..." : "Lag svar"}
        </Button>
      </form>
    </Form>
  );
}
