export async function onRequestGet(context) {
  // context.env.GEAR_DB is the KV namespace
  try {
    if (!context.env.GEAR_DB) {
      throw new Error("GEAR_DB KV Namespace is not bound.");
    }
    const data = await context.env.GEAR_DB.get("products", "json");
    if (!data) {
      // Fallback to local static file if KV is empty (useful for local dev or first run)
      const staticUrl = new URL("/database/products.json", context.request.url);
      const staticRes = await fetch(staticUrl);
      if (staticRes.ok) {
        const staticData = await staticRes.json();
        return new Response(JSON.stringify(staticData), {
          headers: { "Content-Type": "application/json" }
        });
      }
      return new Response("[]", {
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
    await context.env.GEAR_DB.put("products", JSON.stringify(body));
    return new Response(JSON.stringify({ status: "success" }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}
