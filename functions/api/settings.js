export async function onRequestGet(context) {
  try {
    if (!context.env.GEAR_DB) {
      throw new Error("GEAR_DB KV Namespace is not bound.");
    }
    const data = await context.env.GEAR_DB.get("settings", "json");
    if (!data) {
      const staticUrl = new URL("/database/settings.json", context.request.url);
      const staticRes = await fetch(staticUrl);
      if (staticRes.ok) {
        const contentType = staticRes.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const staticData = await staticRes.json();
          return new Response(JSON.stringify(staticData), {
            headers: { "Content-Type": "application/json" }
          });
        }
      }
      return new Response(JSON.stringify({ bio: "", socials: {} }), {
        headers: { "Content-Type": "application/json" }
      });
    }
    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}

export async function onRequestPost(context) {
  try {
    if (!context.env.GEAR_DB) {
      throw new Error("GEAR_DB KV Namespace is not bound.");
    }
    const body = await context.request.json();
    await context.env.GEAR_DB.put("settings", JSON.stringify(body));
    return new Response(JSON.stringify({ status: "success" }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}
