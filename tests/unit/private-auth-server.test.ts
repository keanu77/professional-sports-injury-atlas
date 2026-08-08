import { timingSafeEqual } from "node:crypto";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { request, type IncomingHttpHeaders } from "node:http";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import type { AddressInfo } from "node:net";

import { afterEach, describe, expect, it, vi } from "vitest";

import { canonicalJson, sha256Hex } from "../../src/lib/contracts/canonical";
import {
  buildArtifactManifest,
  PRIVATE_HTTP_HEADER_POLICY_SHA256,
  type ArtifactManifest,
} from "../../src/lib/governance/artifact-manifest";
import { DISALLOW_ALL_ROBOTS_TXT } from "../../src/lib/governance/build-mode";
import type { ReviewSetManifest } from "../../src/lib/governance/review-set";
import {
  assertExactTailscaleBindAddress,
  createScryptVerifierToken,
  encodeScryptVerifierToken,
  loadPrivateReviewSnapshot,
  parsePrivateHostingConfigBytes,
  parseScryptVerifierToken,
  PRIVATE_REVIEW_PORT,
  PRIVATE_REVIEW_TAILSCALE_IPV4,
  startPrivateReviewServer,
  type PrivateReviewGatewayDependencies,
  type RunningPrivateReviewServer,
  type ScryptVerifierV1,
} from "../../scripts/private-hosting/serve-private-review";

const PROJECT_ROOT = resolve(import.meta.dirname, "../..");
const HEADER_POLICY_BYTES = readFileSync(
  join(PROJECT_ROOT, "ops/http-header-policy.v1.json"),
);
const PASSWORD = "r7BFC0bUvZ9csx_kXSgHiopOjuTx-uI2VZZblflPvfU";
const WRONG_PASSWORD = "not-the-private-review-secret";
const REQUIRED_HEADERS = {
  "cache-control": "private, no-store, max-age=0",
  pragma: "no-cache",
  vary: "Authorization",
  "x-content-type-options": "nosniff",
  "x-robots-tag": "noindex, nofollow, noarchive, nosnippet, noimageindex",
} as const;
const FORBIDDEN_HEADERS = [
  "content-encoding",
  "etag",
  "last-modified",
  "location",
  "server",
  "set-cookie",
] as const;

const roots: string[] = [];
const runningServers: RunningPrivateReviewServer[] = [];

interface TestFixture {
  root: string;
  token: string;
  manifest: ArtifactManifest;
  reviewSet: ReviewSetManifest;
  indexBytes: Buffer;
}

interface HttpResult {
  status: number;
  headers: IncomingHttpHeaders;
  body: Buffer;
}

function fixedConfig(): Record<string, unknown> {
  return {
    schemaVersion: 1,
    serviceId: "tw.sportsmedicine.atlas.private-review",
    nodeVersion: "24.14.0",
    bind: {
      tailscaleCliPath: "/opt/homebrew/bin/tailscale",
      tailscaleDnsName: "mac-mini.tailbc16e9.ts.net",
      tailscaleIPv4: PRIVATE_REVIEW_TAILSCALE_IPV4,
      port: PRIVATE_REVIEW_PORT,
    },
    authentication: {
      method: "http-basic-scrypt-keychain-v1",
      username: "atlas-reviewer",
      realm: "Private review",
      keychainService: "tw.sportsmedicine.atlas.private-review.auth-v1",
      keychainAccount: "atlas-reviewer",
      scrypt: {
        algorithm: "scrypt-v1",
        N: 16_384,
        r: 8,
        p: 1,
        keyLength: 32,
        saltBytes: 32,
      },
    },
    artifact: {
      distDirectory: "dist",
      manifestPath: "review/private-dist-manifest.v1.json",
      reviewSetPath: "review/review-set.v1.json",
      headerPolicyPath: "ops/http-header-policy.v1.json",
    },
    launchd: {
      label: "tw.sportsmedicine.atlas.private-review.v1",
      templatePath:
        "ops/launchd/tw.sportsmedicine.atlas.private-review.plist.template",
      localStateDirectoryName: "tw.sportsmedicine.atlas.private-review",
      renderedPlistName: "tw.sportsmedicine.atlas.private-review.plist",
      serverScriptPath: "scripts/private-hosting/serve-private-review.ts",
      tsxCliPath: "node_modules/tsx/dist/cli.mjs",
    },
  };
}

function reviewSetFixture(
  supportingDataDigest = "d".repeat(64),
): ReviewSetManifest {
  return {
    schemaVersion: 1,
    manifestType: "review-set",
    contentCommit: "a".repeat(40),
    cases: [],
    sourceBatches: [],
    overviews: [],
    currentUpdate: null,
    contentAuthoritySnapshotDigest: "c".repeat(64),
    rendererTreeDigest: "b".repeat(64),
    supportingDataDigest,
  };
}

async function createFixture(): Promise<TestFixture> {
  const root = mkdtempSync(join(tmpdir(), "atlas-private-auth-"));
  roots.push(root);
  for (const directory of [
    "ops",
    "review",
    "dist",
    "dist/_astro",
    "dist/review",
  ]) {
    mkdirSync(join(root, directory), { recursive: true });
  }
  writeFileSync(
    join(root, "ops/private-hosting.v1.json"),
    `${JSON.stringify(fixedConfig(), null, 2)}\n`,
  );
  writeFileSync(
    join(root, "ops/http-header-policy.v1.json"),
    HEADER_POLICY_BYTES,
  );

  const reviewSet = reviewSetFixture();
  const reviewSetBytes = Buffer.from(canonicalJson(reviewSet));
  writeFileSync(join(root, "review/review-set.v1.json"), reviewSetBytes);
  writeFileSync(join(root, "dist/review/review-set.json"), reviewSetBytes);
  const indexBytes = Buffer.from(
    '<!doctype html><html><head><meta name="robots" content="noindex,nofollow,noarchive,nosnippet,noimageindex"></head><body>private atlas fixture</body></html>',
  );
  const javascriptBytes = Buffer.from("globalThis.__atlasFixture = true;\n");
  writeFileSync(join(root, "dist/index.html"), indexBytes);
  writeFileSync(join(root, "dist/robots.txt"), DISALLOW_ALL_ROBOTS_TXT);
  writeFileSync(join(root, "dist/_astro/app.js"), javascriptBytes);

  const manifest = buildArtifactManifest(
    "review",
    [
      {
        path: "index.html",
        bytes: indexBytes,
        contentType: "text/html; charset=utf-8",
      },
      {
        path: "robots.txt",
        bytes: DISALLOW_ALL_ROBOTS_TXT,
        contentType: "text/plain; charset=utf-8",
      },
      {
        path: "review/review-set.json",
        bytes: reviewSetBytes,
        contentType: "application/json",
      },
      {
        path: "_astro/app.js",
        bytes: javascriptBytes,
        contentType: "text/javascript; charset=utf-8",
      },
    ],
    {
      // Task 6 freezes the review set at implementation commit A, then builds
      // and manifests at clean artifact commit B. These identities differ.
      buildCommit: "f".repeat(40),
      reviewSetDigest: sha256Hex(reviewSetBytes),
      reviewSetResponseSha256: sha256Hex(reviewSetBytes),
      rendererTreeDigest: reviewSet.rendererTreeDigest,
      headerPolicyDigest: PRIVATE_HTTP_HEADER_POLICY_SHA256,
      generatedAt: "2026-08-08T14:00:00Z",
    },
  );
  writeFileSync(
    join(root, "review/private-dist-manifest.v1.json"),
    canonicalJson(manifest),
  );
  const token = await createScryptVerifierToken(
    PASSWORD,
    Buffer.alloc(32, 0x5a),
  );
  return { root, token, manifest, reviewSet, indexBytes };
}

function ephemeralListener(): NonNullable<
  PrivateReviewGatewayDependencies["listenServer"]
> {
  return async (server, target) => {
    expect(target).toEqual({
      host: PRIVATE_REVIEW_TAILSCALE_IPV4,
      port: PRIVATE_REVIEW_PORT,
    });
    await new Promise<void>((resolvePromise, rejectPromise) => {
      server.once("error", rejectPromise);
      server.listen({ host: "127.0.0.1", port: 0, exclusive: true }, () => {
        server.removeListener("error", rejectPromise);
        resolvePromise();
      });
    });
    const address = server.address() as AddressInfo;
    expect(address.address).toBe("127.0.0.1");
    expect(address.port).toBeGreaterThan(0);
    return { host: address.address, port: address.port };
  };
}

function dependencies(
  token: string,
  overrides: PrivateReviewGatewayDependencies = {},
): PrivateReviewGatewayDependencies {
  return {
    runtimeNodeVersion: "24.14.0",
    resolveTailscaleIPv4: () => PRIVATE_REVIEW_TAILSCALE_IPV4,
    loadTailscaleStatus: () => ({
      backendState: "Running",
      selfOnline: true,
      selfDnsName: "mac-mini.tailbc16e9.ts.net.",
      selfTailscaleIPs: [PRIVATE_REVIEW_TAILSCALE_IPV4, "fd7a:115c:a1e0::1"],
    }),
    loadCredentialVerifier: () => token,
    validateArtifactManifestSnapshot: () => undefined,
    listenServer: ephemeralListener(),
    ...overrides,
  };
}

async function startFixture(
  fixture: TestFixture,
  overrides: PrivateReviewGatewayDependencies = {},
): Promise<RunningPrivateReviewServer> {
  const running = await startPrivateReviewServer({
    root: fixture.root,
    dependencies: dependencies(fixture.token, overrides),
  });
  runningServers.push(running);
  return running;
}

function basic(password = PASSWORD, username = "atlas-reviewer"): string {
  return `Basic ${Buffer.from(`${username}:${password}`, "utf8").toString("base64")}`;
}

function send(
  running: RunningPrivateReviewServer,
  path: string,
  options: {
    method?: string;
    authorization?: string;
    headers?: Record<string, string>;
  } = {},
): Promise<HttpResult> {
  return new Promise((resolvePromise, rejectPromise) => {
    const headers = { ...options.headers };
    if (options.authorization !== undefined) {
      headers.Authorization = options.authorization;
    }
    const req = request(
      {
        host: running.address.host,
        port: running.address.port,
        method: options.method ?? "GET",
        path,
        headers,
        agent: false,
      },
      (response) => {
        const chunks: Buffer[] = [];
        response.on("data", (chunk: Buffer) => chunks.push(Buffer.from(chunk)));
        response.on("end", () => {
          resolvePromise({
            status: response.statusCode ?? 0,
            headers: response.headers,
            body: Buffer.concat(chunks),
          });
        });
      },
    );
    req.once("error", rejectPromise);
    req.end();
  });
}

function expectPolicyHeaders(result: HttpResult): void {
  for (const [name, value] of Object.entries(REQUIRED_HEADERS)) {
    expect(result.headers[name]).toBe(value);
  }
  for (const name of FORBIDDEN_HEADERS) {
    expect(result.headers[name]).toBeUndefined();
  }
}

afterEach(async () => {
  await Promise.all(
    runningServers
      .splice(0)
      .map((running) => running.close().catch(() => undefined)),
  );
  for (const root of roots.splice(0))
    rmSync(root, { recursive: true, force: true });
});

describe("private-review authentication gateway", () => {
  it("serves only manifest bytes for authenticated GET and HEAD with the exact policy", async () => {
    const fixture = await createFixture();
    const running = await startFixture(fixture);
    expect(fixture.manifest.buildCommit).not.toBe(
      fixture.reviewSet.contentCommit,
    );

    const get = await send(running, "/", {
      authorization: basic(),
      headers: { "Accept-Encoding": "br, gzip" },
    });
    expect(get.status).toBe(200);
    expect(get.body).toEqual(fixture.indexBytes);
    expect(get.headers["content-type"]).toBe("text/html; charset=utf-8");
    expect(get.headers["content-length"]).toBe(
      String(fixture.indexBytes.length),
    );
    expectPolicyHeaders(get);

    const head = await send(running, "/", {
      method: "HEAD",
      authorization: basic(),
    });
    expect(head.status).toBe(200);
    expect(head.body).toHaveLength(0);
    expect(head.headers["content-length"]).toBe(
      String(fixture.indexBytes.length),
    );
    expect(head.headers["content-type"]).toBe("text/html; charset=utf-8");
    expectPolicyHeaders(head);

    const reviewSet = await send(running, "/review/review-set.json", {
      authorization: basic(),
    });
    expect(reviewSet.status).toBe(200);
    expect(reviewSet.body.toString("utf8")).toBe(
      canonicalJson(fixture.reviewSet),
    );
    expect(reviewSet.headers["content-type"]).toBe("application/json");
    expectPolicyHeaders(reviewSet);
  });

  it("returns one identical empty generic 401 before route or method disclosure", async () => {
    const fixture = await createFixture();
    const running = await startFixture(fixture);
    const attempts = [
      await send(running, "/"),
      await send(running, "/does-not-exist"),
      await send(running, "/%2e%2e/review/review-set.json", {
        authorization: "Bearer definitely-not-basic",
      }),
      await send(running, "/", { authorization: basic(WRONG_PASSWORD) }),
      await send(running, "/private-unknown", {
        authorization: basic(PASSWORD, "wrong-user"),
      }),
      await send(running, "/", {
        method: "POST",
        authorization: "Basic not-canonical-base64",
      }),
    ];

    for (const result of attempts) {
      expect(result.status).toBe(401);
      expect(result.body).toHaveLength(0);
      expect(result.headers["content-length"]).toBe("0");
      expect(result.headers["content-type"]).toBeUndefined();
      expect(result.headers["www-authenticate"]).toBe(
        'Basic realm="Private review", charset="UTF-8"',
      );
      expectPolicyHeaders(result);
    }
    expect(
      attempts.map(({ status, body, headers }) => ({
        status,
        body: body.toString("hex"),
        contentLength: headers["content-length"],
        contentType: headers["content-type"] ?? null,
        challenge: headers["www-authenticate"],
      })),
    ).toEqual(
      Array(6).fill({
        status: 401,
        body: "",
        contentLength: "0",
        contentType: null,
        challenge: 'Basic realm="Private review", charset="UTF-8"',
      }),
    );
  });

  it("uses exact raw allowlisted targets and never redirects, decodes, indexes, or falls back", async () => {
    const fixture = await createFixture();
    const running = await startFixture(fixture);
    for (const path of [
      "/index.html",
      "//",
      "/?query=1",
      "/review",
      "/review/",
      "/%2e%2e/",
      "/.hidden",
      "/unknown",
    ]) {
      const result = await send(running, path, { authorization: basic() });
      expect(result.status, path).toBe(404);
      expect(result.body, path).toHaveLength(0);
      expect(result.headers.location, path).toBeUndefined();
      expect(result.headers["content-type"], path).toBeUndefined();
      expectPolicyHeaders(result);
    }
  });

  it("checks authentication before method policy and permits only GET/HEAD after auth", async () => {
    const fixture = await createFixture();
    const running = await startFixture(fixture);

    const unauthorized = await send(running, "/", { method: "POST" });
    expect(unauthorized.status).toBe(401);
    expect(unauthorized.headers.allow).toBeUndefined();

    const authorized = await send(running, "/", {
      method: "POST",
      authorization: basic(),
    });
    expect(authorized.status).toBe(405);
    expect(authorized.body).toHaveLength(0);
    expect(authorized.headers.allow).toBe("GET, HEAD");
    expectPolicyHeaders(authorized);
  });

  it("reloads Keychain state per decision, invalidates rotated sessions, and uses timingSafeEqual", async () => {
    const fixture = await createFixture();
    const nextPassword = "Fv8Lz6-MfWdXxMxmpzrMJBw4xIdT8O_DfR8G2zhjybc";
    const nextToken = await createScryptVerifierToken(
      nextPassword,
      Buffer.alloc(32, 0x6b),
      2,
    );
    let currentToken = fixture.token;
    const safeEqual = vi.fn((left: Uint8Array, right: Uint8Array) =>
      timingSafeEqual(left, right),
    );
    const running = await startFixture(fixture, {
      loadCredentialVerifier: () => currentToken,
      timingSafeEqual: safeEqual,
    });

    expect((await send(running, "/", { authorization: basic() })).status).toBe(
      200,
    );
    currentToken = nextToken;
    expect((await send(running, "/", { authorization: basic() })).status).toBe(
      401,
    );
    expect(
      (await send(running, "/", { authorization: basic(nextPassword) })).status,
    ).toBe(200);
    expect(safeEqual).toHaveBeenCalledTimes(3);
    for (const [candidate, expected] of safeEqual.mock.calls) {
      expect(candidate).toHaveLength(32);
      expect(expected).toHaveLength(32);
    }
  });

  it("rejects a verifier generation change during an in-flight scrypt decision", async () => {
    const fixture = await createFixture();
    const nextToken = await createScryptVerifierToken(
      PASSWORD,
      Buffer.alloc(32, 0x6c),
      2,
    );
    let calls = 0;
    const running = await startFixture(fixture, {
      loadCredentialVerifier: () => {
        calls += 1;
        // Startup and the request's pre-scrypt load see generation 1; the
        // post-scrypt reload sees generation 2.
        return calls < 3 ? fixture.token : nextToken;
      },
    });
    const result = await send(running, "/", { authorization: basic() });
    expect(result.status).toBe(401);
    expect(result.body).toHaveLength(0);
  });

  it("holds verified bytes privately so post-start disk drift cannot change responses", async () => {
    const fixture = await createFixture();
    const loaded = await loadPrivateReviewSnapshot({
      root: fixture.root,
      validateArtifactManifestSnapshot: () => undefined,
    });
    expect(loaded.manifest).toEqual(fixture.manifest);
    expect(loaded.entries.get("/")?.bytes).toEqual(fixture.indexBytes);
    expect(loaded.configDigest).toBe(
      sha256Hex(
        readFileSync(join(fixture.root, "ops/private-hosting.v1.json")),
      ),
    );
    const running = await startFixture(fixture);
    writeFileSync(
      join(fixture.root, "dist/index.html"),
      "changed after listen",
    );

    const result = await send(running, "/", { authorization: basic() });
    expect(result.status).toBe(200);
    expect(result.body).toEqual(fixture.indexBytes);
    expect(result.body.toString("utf8")).not.toContain("changed after listen");
  });

  it("checks the complete Tailscale self identity before and after listen", async () => {
    const fixture = await createFixture();
    const resolveIPv4 = vi.fn(() => PRIVATE_REVIEW_TAILSCALE_IPV4);
    const loadStatus = vi.fn(() => ({
      backendState: "Running",
      selfOnline: true,
      selfDnsName: "mac-mini.tailbc16e9.ts.net",
      selfTailscaleIPs: [PRIVATE_REVIEW_TAILSCALE_IPV4],
    }));
    await startFixture(fixture, {
      resolveTailscaleIPv4: resolveIPv4,
      loadTailscaleStatus: loadStatus,
    });
    expect(resolveIPv4).toHaveBeenCalledTimes(2);
    expect(loadStatus).toHaveBeenCalledTimes(2);

    for (const status of [
      {
        backendState: "Running",
        selfOnline: false,
        selfDnsName: "mac-mini.tailbc16e9.ts.net.",
        selfTailscaleIPs: [PRIVATE_REVIEW_TAILSCALE_IPV4],
      },
      {
        backendState: "Running",
        selfOnline: true,
        selfDnsName: "wrong-mini.tailbc16e9.ts.net.",
        selfTailscaleIPs: [PRIVATE_REVIEW_TAILSCALE_IPV4],
      },
    ]) {
      const invalidFixture = await createFixture();
      const listener = vi.fn(ephemeralListener());
      await expect(
        startPrivateReviewServer({
          root: invalidFixture.root,
          dependencies: dependencies(invalidFixture.token, {
            loadTailscaleStatus: () => status,
            listenServer: listener,
          }),
        }),
      ).rejects.toMatchObject({ code: "tailscale-unavailable" });
      expect(listener).not.toHaveBeenCalled();
    }
  });

  it("closes the new socket when the post-listen Tailscale identity recheck changes", async () => {
    const fixture = await createFixture();
    let statusChecks = 0;
    let openedServer: RunningPrivateReviewServer["server"] | undefined;
    const baseListener = ephemeralListener();
    const listener: NonNullable<
      PrivateReviewGatewayDependencies["listenServer"]
    > = async (server, target) => {
      openedServer = server;
      return baseListener(server, target);
    };
    await expect(
      startPrivateReviewServer({
        root: fixture.root,
        dependencies: dependencies(fixture.token, {
          loadTailscaleStatus: () => {
            statusChecks += 1;
            return {
              backendState: "Running",
              selfOnline: statusChecks === 1,
              selfDnsName: "mac-mini.tailbc16e9.ts.net.",
              selfTailscaleIPs: [PRIVATE_REVIEW_TAILSCALE_IPV4],
            };
          },
          listenServer: listener,
        }),
      }),
    ).rejects.toMatchObject({ code: "tailscale-unavailable" });
    expect(statusChecks).toBe(2);
    expect(openedServer?.listening).toBe(false);
  });

  it("fails before listen on Node, bind, resolver, or credential mismatch", async () => {
    for (const address of [
      "0.0.0.0",
      "127.0.0.1",
      "192.168.1.2",
      "10.0.0.2",
      "172.16.0.2",
      "::",
      "100.114.3.94",
    ]) {
      expect(() => assertExactTailscaleBindAddress(address)).toThrow(
        expect.objectContaining({ code: "bind-address-invalid" }),
      );
    }
    const fixture = await createFixture();
    const listener = vi.fn(ephemeralListener());
    await expect(
      startPrivateReviewServer({
        root: fixture.root,
        dependencies: dependencies(fixture.token, {
          runtimeNodeVersion: "24.13.0",
          listenServer: listener,
        }),
      }),
    ).rejects.toMatchObject({ code: "node-version-mismatch" });
    await expect(
      startPrivateReviewServer({
        root: fixture.root,
        dependencies: dependencies(fixture.token, {
          resolveTailscaleIPv4: () => "100.114.3.94",
          listenServer: listener,
        }),
      }),
    ).rejects.toMatchObject({ code: "bind-address-invalid" });
    await expect(
      startPrivateReviewServer({
        root: fixture.root,
        dependencies: dependencies(fixture.token, {
          loadCredentialVerifier: () => null,
          listenServer: listener,
        }),
      }),
    ).rejects.toMatchObject({ code: "credential-unavailable" });
    await expect(
      startPrivateReviewServer({
        root: fixture.root,
        dependencies: dependencies(fixture.token, {
          loadCredentialVerifier: () => "secret-in-malformed-verifier",
          listenServer: listener,
        }),
      }),
    ).rejects.toMatchObject({ code: "credential-invalid" });
    expect(listener).not.toHaveBeenCalled();
  });

  it("strictly rejects altered and duplicate-key config/verifier contracts", async () => {
    const config = fixedConfig();
    expect(parsePrivateHostingConfigBytes(JSON.stringify(config))).toEqual(
      config,
    );
    expect(() =>
      parsePrivateHostingConfigBytes('{"schemaVersion":1,"schemaVersion":1}'),
    ).toThrow(expect.objectContaining({ code: "config-invalid" }));
    const wildcard = fixedConfig();
    (wildcard.bind as Record<string, unknown>).tailscaleIPv4 = "0.0.0.0";
    expect(() =>
      parsePrivateHostingConfigBytes(JSON.stringify(wildcard)),
    ).toThrow(expect.objectContaining({ code: "config-invalid" }));

    const fixture = await createFixture();
    const parsed = parseScryptVerifierToken(fixture.token);
    expect(parseScryptVerifierToken(encodeScryptVerifierToken(parsed))).toEqual(
      parsed,
    );
    const badVerifier = {
      ...parsed,
      credentialGeneration: 0,
    } as ScryptVerifierV1;
    expect(() => encodeScryptVerifierToken(badVerifier)).toThrow(
      expect.objectContaining({ code: "credential-invalid" }),
    );
    expect(() => parseScryptVerifierToken(`${fixture.token}=`)).toThrow(
      expect.objectContaining({ code: "credential-invalid" }),
    );
  });

  it("rejects file drift, extra files, symlinks, stale review bytes, and noncanonical manifests before listen", async () => {
    const mutators: Array<(fixture: TestFixture) => void> = [
      (fixture) =>
        writeFileSync(join(fixture.root, "dist/index.html"), "drift"),
      (fixture) => writeFileSync(join(fixture.root, "dist/extra.txt"), "extra"),
      (fixture) =>
        symlinkSync(
          join(fixture.root, "dist/index.html"),
          join(fixture.root, "dist/symlink.html"),
        ),
      (fixture) =>
        writeFileSync(
          join(fixture.root, "review/review-set.v1.json"),
          canonicalJson(reviewSetFixture("e".repeat(64))),
        ),
      (fixture) =>
        writeFileSync(
          join(fixture.root, "review/private-dist-manifest.v1.json"),
          `${JSON.stringify(fixture.manifest, null, 2)}\n`,
        ),
    ];
    for (const mutate of mutators) {
      const fixture = await createFixture();
      mutate(fixture);
      const listener = vi.fn(ephemeralListener());
      await expect(
        startPrivateReviewServer({
          root: fixture.root,
          dependencies: dependencies(fixture.token, { listenServer: listener }),
        }),
      ).rejects.toMatchObject({
        code: expect.stringMatching(/^(artifact|manifest)-invalid$/u),
      });
      expect(listener).not.toHaveBeenCalled();
    }
  });

  it("rejects a canonical manifest whose declared MIME differs from its build path", async () => {
    const fixture = await createFixture();
    const asset = fixture.manifest.files.find(
      (file) => file.buildPath === "_astro/app.js",
    );
    expect(asset).toBeDefined();
    asset!.contentType = "text/css; charset=utf-8";
    writeFileSync(
      join(fixture.root, "review/private-dist-manifest.v1.json"),
      canonicalJson(fixture.manifest),
    );
    const listener = vi.fn(ephemeralListener());
    await expect(
      startPrivateReviewServer({
        root: fixture.root,
        dependencies: dependencies(fixture.token, { listenServer: listener }),
      }),
    ).rejects.toMatchObject({ code: "artifact-invalid" });
    expect(listener).not.toHaveBeenCalled();
  });

  it("rejects stale header policy and a production-validation failure without logging sensitive errors", async () => {
    const fixture = await createFixture();
    writeFileSync(
      join(fixture.root, "ops/http-header-policy.v1.json"),
      `${HEADER_POLICY_BYTES.toString("utf8")} `,
    );
    const listener = vi.fn(ephemeralListener());
    await expect(
      startPrivateReviewServer({
        root: fixture.root,
        dependencies: dependencies(fixture.token, { listenServer: listener }),
      }),
    ).rejects.toMatchObject({ code: "header-policy-invalid" });
    expect(listener).not.toHaveBeenCalled();

    const fresh = await createFixture();
    const logs: string[] = [];
    await expect(
      startPrivateReviewServer({
        root: fresh.root,
        dependencies: dependencies(fresh.token, {
          validateArtifactManifestSnapshot: () => {
            throw new Error(`must-not-log:${PASSWORD}:${fresh.root}`);
          },
          listenServer: listener,
          logger: (event) => logs.push(event),
        }),
      }),
    ).rejects.toMatchObject({ code: "artifact-invalid" });
    expect(logs.join("\n")).not.toContain(PASSWORD);
    expect(logs.join("\n")).not.toContain(fresh.root);
    expect(logs).toEqual([]);
    expect(listener).not.toHaveBeenCalled();
  });

  it("maps runtime Keychain failures to the same 401 and emits only fixed lifecycle logs", async () => {
    const fixture = await createFixture();
    const logs: string[] = [];
    let loads = 0;
    const running = await startFixture(fixture, {
      loadCredentialVerifier: () => {
        loads += 1;
        if (loads === 1) return fixture.token;
        throw new Error(`secret=${PASSWORD};path=${fixture.root}`);
      },
      logger: (event) => logs.push(event),
    });
    const result = await send(running, "/review/review-set.json", {
      authorization: basic(),
    });
    expect(result.status).toBe(401);
    expect(result.body).toHaveLength(0);
    expectPolicyHeaders(result);
    expect(logs).toEqual(["private-review-ready"]);
    expect(logs.join("\n")).not.toContain(PASSWORD);
    expect(logs.join("\n")).not.toContain(fixture.root);
  });
});
