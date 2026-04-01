"use client";

import { useState } from "react";

import {
  leadRequestTypeOptions,
  leadStageOptions,
  leadUseCaseOptions
} from "@/lib/lead-requests";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type BookDemoFormProps = {
  initialEmail?: string;
};

export function BookDemoForm({ initialEmail = "" }: BookDemoFormProps) {
  const [values, setValues] = useState({
    email: initialEmail,
    useCaseInterest: "",
    currentStage: "",
    requestType: "",
    note: ""
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "success">("idle");
  const [message, setMessage] = useState(
    "Use this form to request a walkthrough, signal early-access interest, or both."
  );

  function validate() {
    const nextErrors: Record<string, string> = {};

    if (!/^\S+@\S+\.\S+$/.test(values.email.trim())) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (!values.useCaseInterest) {
      nextErrors.useCaseInterest = "Select a use case.";
    }

    if (!values.currentStage) {
      nextErrors.currentStage = "Select the current stage.";
    }

    if (!values.requestType) {
      nextErrors.requestType = "Select a request type.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validate()) {
      setStatus("error");
      setMessage("Fix the highlighted fields before sending the request.");
      return;
    }

    setStatus("loading");
    setMessage("Sending request...");

    try {
      const response = await fetch("/api/lead-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(values)
      });

      const data = (await response.json().catch(() => null)) as { message?: string } | null;

      if (!response.ok) {
        throw new Error(data?.message || "Unable to send the request.");
      }

      setStatus("success");
      setMessage(data?.message || "Request received.");
      setValues((current) => ({
        ...current,
        note: "",
        requestType: current.requestType,
        useCaseInterest: current.useCaseInterest,
        currentStage: current.currentStage,
        email: current.email.trim()
      }));
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Unable to send the request.");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Book a demo or request early access</CardTitle>
        <CardDescription>
          Tideus is still intentionally narrow. This form helps route launch conversations toward the supported workflows only.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" noValidate onSubmit={handleSubmit}>
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="lead-email">Email</Label>
              <Input
                aria-invalid={Boolean(errors.email)}
                id="lead-email"
                onChange={(event) => setValues((current) => ({ ...current, email: event.target.value }))}
                placeholder="you@example.com"
                type="email"
                value={values.email}
              />
              {errors.email ? <p className="text-sm font-medium text-destructive">{errors.email}</p> : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lead-use-case">Use case of interest</Label>
              <Select
                aria-invalid={Boolean(errors.useCaseInterest)}
                id="lead-use-case"
                onChange={(event) => setValues((current) => ({ ...current, useCaseInterest: event.target.value }))}
                value={values.useCaseInterest}
              >
                <option value="">Select one</option>
                {leadUseCaseOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
              {errors.useCaseInterest ? <p className="text-sm font-medium text-destructive">{errors.useCaseInterest}</p> : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lead-stage">Current stage</Label>
              <Select
                aria-invalid={Boolean(errors.currentStage)}
                id="lead-stage"
                onChange={(event) => setValues((current) => ({ ...current, currentStage: event.target.value }))}
                value={values.currentStage}
              >
                <option value="">Select one</option>
                {leadStageOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
              {errors.currentStage ? <p className="text-sm font-medium text-destructive">{errors.currentStage}</p> : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lead-request-type">Request type</Label>
              <Select
                aria-invalid={Boolean(errors.requestType)}
                id="lead-request-type"
                onChange={(event) => setValues((current) => ({ ...current, requestType: event.target.value }))}
                value={values.requestType}
              >
                <option value="">Select one</option>
                {leadRequestTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
              {errors.requestType ? <p className="text-sm font-medium text-destructive">{errors.requestType}</p> : null}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="lead-note">Optional note</Label>
              <Textarea
                id="lead-note"
                onChange={(event) => setValues((current) => ({ ...current, note: event.target.value }))}
                placeholder="Share timing, the package problem you are trying to solve, or what you want to see in a demo."
                value={values.note}
              />
            </div>
          </div>

          <div
            className={cn("rounded-2xl border p-4 text-sm leading-6", {
              "border-slate-200 bg-slate-50 text-slate-700": status === "idle" || status === "loading",
              "border-emerald-200 bg-emerald-50 text-slate-900": status === "success",
              "border-red-200 bg-red-50 text-red-700": status === "error"
            })}
          >
            <p className="font-semibold uppercase tracking-[0.18em]">
              {status === "idle"
                ? "Ready"
                : status === "loading"
                  ? "Working"
                  : status === "success"
                    ? "Saved"
                    : "Error"}
            </p>
            <p className="mt-2">{message}</p>
          </div>

          <Button disabled={status === "loading"} type="submit">
            {status === "loading" ? "Sending..." : "Send request"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
