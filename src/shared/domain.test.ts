import { expect, test } from "vite-plus/test";
import { domainOf, isOnDomain } from "./domain.ts";

test("a domain is read from links and from typed names alike", () => {
  expect(domainOf("https://www.Example.com/a?b")).toBe("example.com");
  expect(domainOf("docs.example.com/page")).toBe("docs.example.com");
  expect(domainOf("  example.com ")).toBe("example.com");
  expect(domainOf("localhost")).toBeNull();
  expect(domainOf("not a domain")).toBeNull();
  expect(domainOf("")).toBeNull();
});

test("a domain covers its subdomains but not lookalikes", () => {
  const domains = ["example.com"];
  expect(isOnDomain("https://example.com/x", domains)).toBe(true);
  expect(isOnDomain("https://cdn.example.com/x", domains)).toBe(true);
  expect(isOnDomain("https://badexample.com/x", domains)).toBe(false);
  expect(isOnDomain("https://example.com.evil.io/x", domains)).toBe(false);
});
