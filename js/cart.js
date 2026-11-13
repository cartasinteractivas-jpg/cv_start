/* WebPocket cv_start — carrito */
      const cartCount = () =>
        Object.values(state.cart || {}).reduce((n, q) => n + Number(q || 0), 0);

      // Limpiar restos viejos de carrito/chat en este navegador
      try {
        const _kill = [];
        for (let i = 0; i < sessionStorage.length; i++) {
          const k = sessionStorage.key(i);
          if (k && (k.startsWith("wp_cart_") || k.startsWith("wp_chat_"))) _kill.push(k);
        }
        _kill.forEach((k) => sessionStorage.removeItem(k));
      } catch (_) {}
      function cartStorageKey(p) {
        try {
          const c = String((p && (p.codigo_cliente || p.codigo)) || state.qr || "anon");
          return "wp_cart_" + c;
        } catch (_) {
          return "wp_cart_anon";
        }
      }
      function saveCartState(p) {
        // No guardar carrito entre recargas (evita pedidos fantasma al decir hola)
      }
      function loadCartState(p) {
        // NO vaciar el carrito en memoria (se llamaba al preguntar por el carrito y borraba ítems)
        state.cart = state.cart || {};
        state.cartMeta = state.cartMeta || {};
      }

      function mountCartFab(p) {
        // CV personal: sin carrito
        if (p && typeof isCV === "function" && isCV(p)) {
          const old = document.getElementById("cart-fab-global");
          if (old) old.remove();
          return;
        }
        let el = document.getElementById("cart-fab-global");
        if (!el) {
          el = document.createElement("button");
          el.id = "cart-fab-global";
          el.type = "button";
          el.title = "Carrito";
          el.setAttribute("aria-label", "Carrito");
          pocket.appendChild(el);
        }
        const n = cartCount();
        const has =
          (typeof products === "function" ? products(p) : []).length > 0 ||
          p.carrito_activo === true ||
          p.carrito_activo === "true";
        if (!has && !n) {
          el.style.display = "none";
          return;
        }
        el.style.display = "flex";
        el.className = "cart-fab " + (n ? "has-items" : "empty");
        // total acumulado + moneda
        let total = 0;
        let mon = "S/";
        try {
          const items = typeof products === "function" ? products(p) : [];
          Object.entries(state.cart || {}).forEach(function ([id, qty]) {
            let m = (state.cartMeta || {})[id];
            let precio = m && m.precio != null ? Number(m.precio) : null;
            let moneda = m && m.moneda ? m.moneda : null;
            if (precio == null) {
              const prod = items.find(function (x) {
                const meta = parseProductMeta(x);
                return meta.name === id || String(x.descripcion || "") === id;
              });
              if (prod) {
                precio = Number(prod.precio || 0);
                moneda = prod.moneda || "PEN";
                state.cartMeta = state.cartMeta || {};
                state.cartMeta[id] = { precio: precio, moneda: moneda, name: id };
              }
            }
            if (moneda === "USD" || moneda === "$") mon = "$";
            else if (moneda === "EUR" || moneda === "€") mon = "€";
            else mon = "S/";
            total += Number(precio || 0) * Number(qty || 0);
          });
        } catch (_) {}
        const totalLbl =
          '<span class="cart-fab-total">' + mon + " " + Number(total || 0).toFixed(2) + "</span>";
        el.innerHTML =
          (n ? '<span class="cart-fab-n">' + (n > 99 ? "99+" : n) + "</span>" : "") +
          '<img src="https://cartasinteractivas-jpg.github.io/cv_start/button_car.png" alt="Carrito" width="28" height="28">' +
          totalLbl;
        el.setAttribute("data-open-cart", "1");
        el.style.pointerEvents = "auto";
        el.style.zIndex = "300";
        el.style.cursor = "pointer";
      }
      // refresco visual del contador del carrito
      try {
        if (!window._cartFabTimer) {
          window._cartFabTimer = setInterval(() => {
            try {
              const pr = state.profiles && state.profiles[state.index];
              if (pr) mountCartFab(pr);
            } catch (_) {}
          }, 2000);
        }
      } catch (_) {}

