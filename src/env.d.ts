/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    runtime?: {
      env: Env;
      ctx: ExecutionContext;
    };
  }
}
