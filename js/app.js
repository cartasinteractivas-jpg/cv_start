/* WebPocket cv_start — app principal */
      const state = {
        chatByCode: {},
        mockup: null,
        cartMeta: {},
        formats: [],
        profiles: [],
        products: [],
        questions: [],
        links: [],
        index: 0,
        panel: null,
        qr: Boolean(qrCode),
        cart: {},
        cartaCart: {},
        cartaMeta: {},
        service: false,
        soundOn: false,
        _userUnlockedSound: false,
        _soundArm: false,
        _globalSoundHook: false,
      };
      const app = document.querySelector("#app"),
        pocket = document.querySelector("#pocket"),
        loaderEl = document.querySelector("#loader");
      const esc = (v) =>
        String(v ?? "").replace(
          /[&<>'"]/g,
          (ch) =>
            ({
              "&": "&amp;",
              "<": "&lt;",
              ">": "&gt;",
              "'": "&#39;",
              '"': "&quot;",
            })[ch],
        );
      const showLoader = (t = "CARGANDO…") => {
        if (!loaderEl) return;
        const sub = loaderEl.querySelector(".loader-sub");
        if (sub) sub.textContent = t;
        loaderEl.classList.remove("fade-out");
      };
      const hideLoader = () => {
        if (!loaderEl) return;
        loaderEl.classList.add("fade-out");
        loaderEl.style.opacity = "0";
        loaderEl.style.visibility = "hidden";
        loaderEl.style.pointerEvents = "none";
      };
      const withTimeout = (p, ms = 12000) =>
        Promise.race([
          p,
          new Promise((_, rej) =>
            setTimeout(() => rej(new Error("Tiempo de espera agotado. Revisa tu conexión.")), ms),
          ),
        ]);
      const edge = async (body) => {
        const r = await withTimeout(
          fetch(EDGE, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          }),
          20000,
        );
        const d = await r
          .json()
          .catch(() => ({ error: "La función respondió sin JSON." }));
        if (!r.ok || d.error)
          throw Error(d.error || "No se pudo cargar el perfil.");
        return d;
      };
      // alias usado por el chat inline
      
      const ensureAppModal = () => {
        let modal = document.getElementById("app-modal");
        if (!modal) {
          modal = document.createElement("div");
          modal.id = "app-modal";
          modal.className = "app-modal hidden";
          (document.getElementById("pocket") || document.body).appendChild(modal);
        }
        modal.innerHTML =
          '<div class="app-modal-card">' +
          '<p id="app-modal-text"></p>' +
          '<div id="app-modal-actions" style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:14px;width:100%"></div>' +
          "</div>";
        return modal;
      };
      const appAlert = (msg, opts) =>
        new Promise((resolve) => {
          const modal = ensureAppModal();
          const text = document.getElementById("app-modal-text");
          const actions = document.getElementById("app-modal-actions");
          if (text) text.textContent = String(msg || "");
          if (actions) {
            actions.innerHTML =
              '<button type="button" class="submit" id="app-modal-ok" style="width:100%">Aceptar</button>';
          }
          modal.classList.remove("hidden");
          const done = () => {
            modal.classList.add("hidden");
            resolve(true);
          };
          document.getElementById("app-modal-ok")?.addEventListener("click", done, { once: true });
        });
      window.appAlert = appAlert;

      const send = edge;

      // Contar visita pública (una vez por código y sesión)
      function trackVisitaOnBoot() {
        try {
          const u = new URL(location.href);
          const code = String(
            u.searchParams.get("perfil") ||
              u.searchParams.get("codigo") ||
              u.searchParams.get("c") ||
              "",
          ).trim();
          if (code) void trackVisita({ codigo_cliente: code, codigo: code });
        } catch (_) {}
      }
      setTimeout(trackVisitaOnBoot, 800);
      async function trackVisita(p) {
        try {
          let code = String(
            (p && (p.codigo_cliente || p.codigo || p.codigoCliente)) || "",
          ).trim();
          if (!code) {
            try {
              const u = new URL(location.href);
              code = String(
                u.searchParams.get("perfil") ||
                  u.searchParams.get("codigo") ||
                  u.searchParams.get("c") ||
                  "",
              ).trim();
            } catch (_) {}
          }
          if (!code || code.startsWith("demo")) return;
          window._wpVisitaOnce = window._wpVisitaOnce || {};
          if (window._wpVisitaOnce[code]) return;
          window._wpVisitaOnce[code] = true;
          const r = await edge({
            action: "visita_registrar",
            codigo_cliente: code,
            codigo: code,
          });
          console.log("visita ok", code, r);
        } catch (e) {
          console.warn("visita", e);
        }
      }


      // delegación global carrito (una sola vez)
      if (!window.__wpCartDelegate) {
        window.__wpCartDelegate = true;
        document.addEventListener(
          "click",
          function (e) {
            const pedir = e.target.closest && e.target.closest("[data-pedir]");
            const quitar = e.target.closest && e.target.closest("[data-quitar]");
            if (!pedir && !quitar) return;
            // solo dentro del pocket
            const root = document.getElementById("pocket") || document.getElementById("app");
            if (root && !root.contains(e.target)) return;
            e.preventDefault();
            e.stopPropagation();
            const btn = pedir || quitar;
            if (pedir && btn.disabled) return;
            const id = btn.getAttribute(pedir ? "data-pedir" : "data-quitar");
            if (!id) return;
            // changeCartQty se redefine en cada bind; usar state directo aquí
            try {
              if (typeof window.__wpChangeCartQty === "function") {
                window.__wpChangeCartQty(id, pedir ? 1 : -1, {
                  precio: btn.getAttribute("data-precio"),
                  moneda: btn.getAttribute("data-moneda"),
                  stock: btn.getAttribute("data-stock"),
                });
              }
            } catch (err) {
              console.warn(err);
            }
          },
          true
        );
      }
      const title = (p) => p.negocio || p.nombre || "WebPocket";

      const normalizeVideoUrl = (raw) => {
        let u = String(raw || "").trim();
        if (!u) return "";
        u = u.replace(/^https?:\/\/\.*/i, (m) => m); // no-op keep
        // quitar espacios
        u = u.replace(/\s+/g, "");
        if (!/^https?:\/\//i.test(u)) {
          // youtube.com / youtu.be / vimeo sin esquema
          if (/^(www\.)?(youtube\.com|youtu\.be|vimeo\.com)/i.test(u)) {
            u = "https://" + u.replace(/^(https?:\/\/)?/i, "");
          } else if (/^[\w.-]+\.[a-z]{2,}/i.test(u)) {
            u = "https://" + u;
          }
        }
        // corregir http://.www -> https://www
        u = u.replace(/^https?:\/\/+\.?www\./i, "https://www.");
        u = u.replace(/^https?:\/\/www\./i, "https://www.");
        return u;
      };
      const code = (p) => p.codigo_cliente || `demo-${p.numero_perfil}`;
      

      const isCV = (p) => String(p.tipo_perfil || "").toUpperCase() === "CV";
      const format = (p) =>
        state.formats.find((f) => String(f.id) === String(p.formato_id)) ||
        FALLBACK.find((f) => String(f.id) === String(p.formato_id)) ||
        state.formats[(p.formatIndex || 0) % (state.formats.length || 1)] ||
        FALLBACK[(p.formatIndex || 0) % FALLBACK.length] ||
        FALLBACK[0];
      const menuClass = (p) => {
        const f = format(p) || {};
        const x = `${f.posicion_navegacion || ""} ${f.tipo_menu || ""} ${f.estilo_navegacion || ""} ${f.nombre || ""}`.toLowerCase();
        // derecha primero (Tik Pocket, Neon, etc.)
        if (/(lateral[_\s-]*derecha|derecha[_\s-]*lateral)/.test(x) || (x.includes("derecha") && x.includes("lateral")))
          return "side-right";
        if (x.includes("flotante") && x.includes("derecha")) return "floating-right";
        if (/(lateral[_\s-]*izquierda|izquierda[_\s-]*lateral)/.test(x) || (x.includes("izquierda") && x.includes("lateral")))
          return "side";
        if (x.includes("flotante") && x.includes("izquierda")) return "floating-left";
        if (x.includes("tik pocket") || x.includes("tikpocket")) return "side-right";
        if (x.includes("inferior")) return "bottom";
        // solo "derecha" / "right" sin lateral
        if (x.includes("derecha") || /right/.test(x)) return "side-right";
        if (x.includes("izquierda") || /left/.test(x)) return "side";
        return "";
      };
      const isVideoUrl = (u) => {
        const s = String(u || "");
        if (!s) return false;
        if (/\.(mp4|webm|mov|m4v|ogg)(\?|$)/i.test(s)) return true;
        // URLs de storage sin extensión clara
        if (/\/video/i.test(s) || /urlvideo/i.test(s) || /video\./i.test(s)) return true;
        return false;
      };
      const publicVideo = (p) => {
        const candidates = [
          p.urlvideo_aprobado,
          p.urlvideo,
          p.video,
          isVideoUrl(p.urlfoto) ? p.urlfoto : null,
          state.qr ? null : VIDEOS[((p.numero_perfil || 1) - 1) % VIDEOS.length],
        ];
        return candidates.find(Boolean) || "";
      };
      const publicPhoto = (p) => {
        const u = p.urlfoto_aprobado || p.urlfoto || p.foto || p.foto_perfil || "";
        if (isVideoUrl(u)) return "";
        return u;
      };
      const cvFile = (p) =>
        p.urlcv ||
        p.url_cv ||
        p.url_curriculum ||
        p.archivo_cv ||
        p.cv_url ||
        p.url_archivo ||
        "";
      
      
      const parseMapCoords = (mapsUrl, lat, lng) => {
        let la = lat != null && String(lat).trim() !== "" ? Number(lat) : null;
        let ln = lng != null && String(lng).trim() !== "" ? Number(lng) : null;
        if (la != null && ln != null && !Number.isNaN(la) && !Number.isNaN(ln)) {
          return { lat: la, lng: ln };
        }
        const s = String(mapsUrl || "");
        // @-12.046374,-77.042793,17z
        let m = s.match(/@(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/);
        if (m) return { lat: Number(m[1]), lng: Number(m[2]) };
        // q=-12.046,-77.042 or q=-12.046%2C-77.042
        m = s.match(/[?&]q=(-?\d+\.?\d*)[,+%20]+(-?\d+\.?\d*)/i);
        if (m) return { lat: Number(m[1]), lng: Number(m[2]) };
        // !3d-12.04!4d-77.04
        m = s.match(/!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/);
        if (m) return { lat: Number(m[1]), lng: Number(m[2]) };
        // plain " -12.046, -77.042 "
        m = s.match(/^\s*(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)\s*$/);
        if (m) return { lat: Number(m[1]), lng: Number(m[2]) };
        return null;
      };
      const mapsFromProfile = (p, styleExtra) => {
        const se = styleExtra || {};
        const maps = p.maps || se.maps || "";
        const lat = p.map_lat ?? p.mapLat ?? se.map_lat ?? se.mapLat;
        const lng = p.map_lng ?? p.mapLng ?? se.map_lng ?? se.mapLng;
        const dir = p.direccion || se.direccion || "";
        const coords = parseMapCoords(maps, lat, lng);
        let embedUrl = "";
        let openUrl = "";
        let coordText = "";
        if (coords) {
          coordText = coords.lat.toFixed(6) + ", " + coords.lng.toFixed(6);
          embedUrl =
            "https://maps.google.com/maps?q=" +
            encodeURIComponent(coords.lat + "," + coords.lng) +
            "&z=16&output=embed";
          openUrl =
            "https://www.google.com/maps?q=" +
            encodeURIComponent(coords.lat + "," + coords.lng);
        } else if (maps && /^https?:\/\//i.test(maps)) {
          openUrl = maps;
          // intentar embed genérico con la query del enlace
          try {
            const u = new URL(maps);
            const qq = u.searchParams.get("q") || dir;
            if (qq)
              embedUrl =
                "https://maps.google.com/maps?q=" +
                encodeURIComponent(qq) +
                "&z=15&output=embed";
          } catch (_) {}
        } else if (dir) {
          embedUrl =
            "https://maps.google.com/maps?q=" +
            encodeURIComponent(dir) +
            "&z=15&output=embed";
          openUrl =
            "https://www.google.com/maps/search/?api=1&query=" +
            encodeURIComponent(dir);
        }
        return { embedUrl, openUrl, coordText, coords, dir, maps };
      };

      const socialIcons = (p, styleExtra) => {
        const r = (styleExtra && styleExtra.redes) || {};
        const base = "https://cartasinteractivas-jpg.github.io/cv_start";
        const normWa = (v) => {
          const s = String(v || "").trim();
          if (!s) return "";
          if (/wa\.me\//i.test(s) || /api\.whatsapp\.com/i.test(s)) {
            if (/^https?:\/\//i.test(s)) return s;
            return "https://" + s.replace(/^\/\//, "");
          }
          if (/^https?:\/\//i.test(s)) return s;
          let digits = s.replace(/\D/g, "");
          if (!digits) return "";
          // Perú: 9 dígitos móviles → anteponer 51
          if (digits.length === 9 && digits.startsWith("9")) digits = "51" + digits;
          // si pegó 51 con espacios ya está en digits
          return "https://wa.me/" + digits;
        };
        const items = [
          { key: "facebook", url: r.facebook, img: base + "/face.png", alt: "Facebook" },
          { key: "instagram", url: r.instagram, img: base + "/inst.png", alt: "Instagram" },
          { key: "tiktok", url: r.tiktok, img: base + "/tik.png", alt: "TikTok" },
          { key: "whatsapp", url: normWa(r.whatsapp), img: base + "/wsp.png", alt: "WhatsApp" },
        ].filter((x) => x.url && String(x.url).trim());
        // whatsapp icon: if no dedicated png, use a simple emoji circle when face is wrong - prefer text if only wa
        if (!items.length) return "";
        return `<div class="social-float">${items
          .map((x) => {
            let href = String(x.url).trim();
            if (x.key !== "whatsapp" && !/^https?:\/\//i.test(href)) href = "https://" + href;
            const icon = `<img src="${esc(x.img)}" alt="${esc(x.alt)}" width="42" height="42" onerror="this.style.display='none';this.nextSibling&&(this.nextSibling.style.display='flex')"><span style="display:none;width:100%;height:100%;align-items:center;justify-content:center;background:#25D366;color:#fff;font-weight:900;font-size:12px;border-radius:50%">WA</span>`;
            return `<a href="${esc(href)}" target="_blank" rel="noopener noreferrer" title="${esc(x.alt)}" aria-label="${esc(x.alt)}">${icon}</a>`;
          })
          .join("")}</div>`;
      };

      const phoneOf = (p) =>
        String(p.telefono || p.celular || p.whatsapp || "").replace(/\D/g, "");
      const dniOf = (p) => p.dni || p.documento || p.nro_documento || "";
      
      function forceBgVideoPlay() {
        try {
          const v =
            document.querySelector("#wp-bg-video") ||
            document.querySelector("video.background") ||
            document.querySelector(".background video");
          if (!v) return;
          v.muted = true;
          v.defaultMuted = true;
          v.volume = 0;
          v.setAttribute("muted", "");
          v.setAttribute("playsinline", "");
          v.setAttribute("webkit-playsinline", "");
          v.playsInline = true;
          v.loop = true;
          v.autoplay = true;
          // si el src está solo en <source>, copiarlo al video
          try {
            if (!v.getAttribute("src") && v.querySelector("source")) {
              const s = v.querySelector("source");
              if (s && s.src) v.src = s.src;
            }
          } catch (_) {}
          const tryPlay = () => {
            try {
              const p = v.play();
              if (p && typeof p.then === "function") {
                p.then(function () {}).catch(function () {
                  // reintento con muted
                  v.muted = true;
                  v.play().catch(function () {});
                });
              }
            } catch (_) {}
          };
          tryPlay();
          if (v.readyState >= 2) tryPlay();
          v.addEventListener("canplay", tryPlay, { once: true });
          v.addEventListener("loadeddata", tryPlay, { once: true });
          v.addEventListener("loadedmetadata", tryPlay, { once: true });
          setTimeout(tryPlay, 100);
          setTimeout(tryPlay, 400);
          setTimeout(tryPlay, 1200);
        } catch (_) {}
      }


      const mediaBackground = (p) => {
        const v = publicVideo(p);
        const ph = publicPhoto(p);
        // Portada: solo video o foto. object-fit:contain (sin deformar). Avatar NO va aquí.
        if (v)
          return `<div class="background" style="overflow:hidden;background:#050914;display:flex;align-items:center;justify-content:center"><video id="wp-bg-video" src="${esc(v)}" autoplay muted loop playsinline webkit-playsinline preload="auto" poster="${esc(ph || "")}" style="width:100%;height:100%;object-fit:contain;object-position:center;background:#050914"></video></div>`;
        if (ph)
          return `<div class="background" style="background:#050914;display:flex;align-items:center;justify-content:center;overflow:hidden"><img src="${esc(ph)}" alt="" style="width:100%;height:100%;object-fit:contain;object-position:center"></div>`;
        return `<div class="background" style="display:grid;place-items:center;background:#050914"><p style="margin:0;padding:20px;text-align:center;font-size:13px;font-weight:800;color:#94a3b8;text-shadow:none">Sin foto ni video de perfil</p></div>`;
      };
      
      
      function detachLiveMedia() {
        const out = [];
        const v = app.querySelector("#wp-bg-video") || app.querySelector("video.background");
        const a = app.querySelector("#wp-audio");
        if (v) {
          out.push({
            kind: "video",
            el: v,
            time: v.currentTime || 0,
            muted: !!v.muted,
            paused: !!v.paused,
            src: (v.currentSrc || (v.querySelector("source") && v.querySelector("source").src) || "").split("?")[0],
          });
          v.remove();
        }
        if (a) {
          out.push({
            kind: "audio",
            el: a,
            time: a.currentTime || 0,
            muted: !!a.muted,
            paused: !!a.paused,
            src: (a.currentSrc || a.src || "").split("?")[0],
          });
          a.remove();
        }
        return out;
      }
      
      function isVideoAudible() {
        const bgv =
          app.querySelector("#wp-bg-video") ||
          app.querySelector("video.background") ||
          document.querySelector("#wp-bg-video");
        const aud = app.querySelector("#wp-audio");
        const vOk = !!(bgv && !bgv.muted && !bgv.paused && bgv.readyState >= 2);
        const aOk = !!(aud && !aud.muted && !aud.paused);
        return vOk || aOk;
      }

      function syncSoundBtn() {
        const btn = app.querySelector("[data-toggle-sound]");
        if (!btn) return;
        const ok = isVideoAudible();
        btn.textContent = ok || state._userUnlockedSound ? "🔊" : "🔇";
        btn.classList.toggle("needs-tap", !ok);
      }

      function enableSoundNow() {
        state._userUnlockedSound = true;
        state.soundOn = true;
        const bgv =
          app.querySelector("#wp-bg-video") ||
          app.querySelector("video.background") ||
          document.querySelector("#wp-bg-video") ||
          document.querySelector("video.background");
        const aud = app.querySelector("#wp-audio") || document.querySelector("#wp-audio");

        const unmute = function (el) {
          if (!el) return Promise.resolve(false);
          try {
            el.defaultMuted = false;
            el.muted = false;
            el.volume = 1;
            el.removeAttribute("muted");
          } catch (_) {}
          const p = el.play();
          if (p && p.then) {
            return p
              .then(function () {
                return !el.muted && !el.paused;
              })
              .catch(function () {
                return false;
              });
          }
          return Promise.resolve(!el.muted);
        };

        const jobs = [];
        if (bgv) jobs.push(unmute(bgv));
        if (aud) jobs.push(unmute(aud));
        if (!jobs.length) {
          syncSoundBtn();
          return;
        }
        Promise.all(jobs).then(function (rs) {
          if (rs.some(Boolean)) {
            syncSoundBtn();
            return;
          }
          if (bgv) {
            const once = function () {
              bgv.removeEventListener("canplay", once);
              bgv.removeEventListener("playing", once);
              unmute(bgv).then(syncSoundBtn);
            };
            bgv.addEventListener("canplay", once);
            bgv.addEventListener("playing", once);
            [400, 1200, 2500].forEach(function (ms) {
              setTimeout(function () {
                unmute(bgv).then(syncSoundBtn);
              }, ms);
            });
          }
          syncSoundBtn();
        });
      }

      function armUnlockSound() {
        // desactivado: el audio SOLO se enciende con el icono 🔊
        return;
      }

      function finishMedia(live) {
        const restored = restoreLiveMedia(live || []);
        try { forceBgVideoPlay(); } catch (_) {}
        setTimeout(function(){ try { forceBgVideoPlay(); } catch(_){} }, 300);
        const bgv = app.querySelector("#wp-bg-video") || app.querySelector("video.background");
        const aud = app.querySelector("#wp-audio");
        const btn = app.querySelector("[data-toggle-sound]");
        const want =
          state.soundOn === true && state._userUnlockedSound === true;

        const setIcon = function (on) {
          if (!btn) return;
          btn.textContent = on ? "🔊" : "🔇";
          btn.classList.toggle("needs-tap", !on);
        };

        if (bgv) {
          bgv.setAttribute("playsinline", "");
          bgv.setAttribute("webkit-playsinline", "");
          bgv.setAttribute("preload", "auto");
          bgv.volume = 1;
          if (want) {
            bgv.muted = false;
            bgv.removeAttribute("muted");
            bgv.play().catch(function () {});
            setIcon(true);
          } else {
            bgv.muted = true;
            bgv.setAttribute("muted", "");
            bgv.defaultMuted = true;
            bgv.play().catch(function () {});
            setIcon(false);
          }
        }

        if (aud) {
          aud.volume = 1;
          if (want) {
            aud.muted = false;
            aud.removeAttribute("muted");
            aud.play().catch(function () {});
          } else {
            aud.muted = true;
            aud.setAttribute("muted", "");
            try {
              aud.pause();
            } catch (_) {}
          }
        }

        // Nunca reactivar por canplay / gesto / sección
      }

      function restoreLiveMedia(live) {
        if (!live || !live.length) return false;
        let restoredVideo = false;
        live.forEach((n) => {
          if (!n.el) return;
          if (n.kind === "video") {
            const neu = app.querySelector("#wp-bg-video") || app.querySelector("video.background");
            if (!neu) return;
            const neuSrc = (neu.currentSrc || (neu.querySelector("source") && neu.querySelector("source").src) || "").split("?")[0];
            if (!n.src || !neuSrc || neuSrc === n.src || neuSrc.endsWith(n.src.slice(-30)) || n.src.endsWith(neuSrc.slice(-30))) {
              neu.replaceWith(n.el);
              n.el.id = "wp-bg-video";
              n.el.classList.add("background");
              try {
                if (Math.abs((n.el.currentTime || 0) - n.time) > 0.35) n.el.currentTime = n.time;
              } catch (_) {}
              const wantR = state.soundOn === true && state._userUnlockedSound === true;
              n.el.muted = !wantR;
              if (wantR) {
                n.el.removeAttribute("muted");
                n.el.volume = 1;
              } else {
                n.el.setAttribute("muted", "");
              }
              if (!n.paused || wantR) {
                const pr = n.el.play();
                if (pr && pr.catch) pr.catch(() => {});
              }
              restoredVideo = true;
            }
          } else if (n.kind === "audio") {
            const neu = app.querySelector("#wp-audio");
            if (neu) neu.replaceWith(n.el);
            else app.appendChild(n.el);
            try { n.el.currentTime = n.time; } catch (_) {}
            if (!n.paused) {
              const pr = n.el.play();
              if (pr && pr.catch) pr.catch(() => {});
            }
          }
        });
        return restoredVideo;
      }

      const parseExperiencia = (raw) => {
        if (!raw) return [];
        if (typeof raw === "string") {
          const t = raw.trim();
          if (t.startsWith("[") || t.startsWith("{")) {
            try {
              const j = JSON.parse(t);
              return parseExperiencia(j);
            } catch (_) {}
          }
        }
        if (Array.isArray(raw)) {
          return raw.map((e) => {
            if (typeof e === "string") {
              const [t, ...rest] = e.split("||");
              return { cargo: (t || e).trim(), titulo: (t || e).trim(), detalle: rest.join("||").trim(), empresa: "", periodo: "" };
            }
            return {
              cargo: e.cargo || e.titulo || "",
              titulo: e.titulo || e.cargo || "",
              detalle: e.detalle || e.descripcion || "",
              empresa: e.empresa || "",
              periodo: e.periodo || "",
            };
          }).filter((e) => e.titulo || e.cargo || e.detalle);
        }
        return String(raw).split("\n").map((l) => l.trim()).filter(Boolean).map((line) => {
          if (line.includes("||")) {
            const [t, ...rest] = line.split("||");
            return { cargo: t.trim(), titulo: t.trim(), detalle: rest.join("||").trim(), empresa: "", periodo: "" };
          }
          return { cargo: line, titulo: line, detalle: "", empresa: "", periodo: "" };
        });
      };
      const expFor = (p) => {
        const parsed = parseExperiencia(p.experiencia);
        if (parsed.length) return parsed;
        return [];
      };

      const normalizeQuestions = (list) => {
        if (!list) return [];
        if (typeof list === "string") {
          return list
            .split("\n")
            .map((l) => l.trim())
            .filter(Boolean)
            .map((line) => {
              const [pregunta, respuesta] = line.split("|");
              return {
                pregunta: (pregunta || "").trim(),
                respuesta: (respuesta || "").trim(),
              };
            })
            .filter((x) => x.pregunta);
        }
        if (!Array.isArray(list)) return [];
        return list
          .map((q) => {
            if (Array.isArray(q))
              return { pregunta: q[0], respuesta: q[1] || "" };
            return {
              pregunta: q.pregunta || q.question || q[0] || "",
              respuesta: q.respuesta || q.answer || q[1] || "",
            };
          })
          .filter((x) => x.pregunta);
      };
      const questions = (p) => {
        const local = normalizeQuestions(p.preguntas || p.questions);
        if (local.length) return local;
        return normalizeQuestions(
          state.questions.filter((x) => x.codigo_cliente === code(p)),
        );
      };
      
      const isPerfilCV = (p) => {
        const t = String(
          (p && (p.tipo_perfil || p.tipo || p.categoria || p.modo)) || "",
        )
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");
        if (/negocio|business|tienda|restaurant|restobar/.test(t)) return false;
        if (/cv|curriculum|curriculo|personal|profesional/.test(t)) return true;
        // si no tiene carrito activo y no es negocio → CV
        if (p && p.carrito_activo === false) return true;
        return !/negocio/.test(t);
      };
      const isServicioItem = (x) => {
        const t = String(
          (x && (x.tipo || x.modo || x.tipo_item || x.categoria)) || "",
        ).toLowerCase();
        return t === "servicio" || t === "service" || t === "servicios";
      };
      const servicesOf = (p) => {
        try {
          return (products(p) || []).filter(isServicioItem);
        } catch (_) {
          return [];
        }
      };
const products = (p) => {
        const local = p.products || p.productos || p.productos_list;
        if (Array.isArray(local) && local.length) return local;
        const c = String(code(p) || "").trim();
        const all = Array.isArray(state.products) ? state.products : [];
        let list = all.filter((x) => {
          const xc = String(x.codigo_cliente || x.codigo || "").trim();
          return xc && c && xc === c;
        });
        // perfil QR único: usar catálogo cargado aunque falte codigo en filas
        if (!list.length && all.length && (state.qr || (state.profiles || []).length === 1)) {
          list = all.slice();
        }
        return list;
      };
      const ensureProductsLoaded = async (p) => {
        const codigo = String(code(p) || state.qr || "").trim();
        if (!codigo || codigo.startsWith("demo")) return products(p);
        try {
          const one = await edge({
            action: "public_profile",
            codigo_cliente: codigo,
            perfil: codigo,
          });
          const prods = one?.products || one?.productos || [];
          if (Array.isArray(prods)) {
            state.products = prods;
            if (state.profiles[state.index]) {
              state.profiles[state.index].productos = prods;
              state.profiles[state.index].products = prods;
            }
            return prods;
          }
        } catch (e) {
          console.warn("ensureProductsLoaded", e);
        }
        return products(p);
      };
      const links = (p) => {
        if (Array.isArray(p.gallery) && p.gallery.length)
          return p.gallery.filter(Boolean);
        if (typeof p.videos === "string" && p.videos.trim())
          return p.videos
            .split("\n")
            .map((l) => l.trim())
            .filter(Boolean);
        return state.links
          .filter((x) => x.codigo_cliente === code(p))
          .map((x) => normalizeVideoUrl(x.url || x.valor_enlace || x.link))
          .filter(Boolean);
      };
      /* Unifica campos del cliente público (cualquier nombre de columna) */
      const normalizePublicProfile = (raw, bag = {}) => {
        if (!raw) return null;
        const p = { ...raw };
        p.nombre = p.nombre || p.name || "";
        p.negocio = p.negocio || p.empresa || p.business || "";
        p.categoria = p.categoria || p.giro || p.cargo || p.ocupacion || "";
        p.perfil =
          p.perfil ||
          p.descripcion ||
          p.about ||
          p.bio ||
          p.descripcion_perfil ||
          "";
        p.descripcion = p.perfil;
        p.tipo_perfil = (
          p.tipo_perfil ||
          p.tipo ||
          (p.negocio ? "NEGOCIO" : "CV")
        ).toUpperCase();
        p.direccion = p.direccion || p.ubicacion || p.address || "";
        try {
          if (!p.direccion && String(p.estilo_marco||"").startsWith("{")) {
            const j = JSON.parse(p.estilo_marco);
            if (j.direccion) p.direccion = j.direccion;
            if (j.maps && !p.maps) p.maps = j.maps;
            if (j.map_lat) p.map_lat = j.map_lat;
            if (j.map_lng) p.map_lng = j.map_lng;
            if (j.pausa_url && !p.pausa_url) p.pausa_url = j.pausa_url;
            if (j.pausa_modo && !p.pausa_modo) p.pausa_modo = j.pausa_modo;
            if (j.pausa_activa != null && p.pausa_activa == null) p.pausa_activa = j.pausa_activa;
            if (j.pausa_texto && !p.pausa_texto) p.pausa_texto = j.pausa_texto;
          }
        } catch (_) {}
        p.maps = p.maps || "";
        p.telefono = p.telefono || p.celular || p.whatsapp || p.phone || "";
        p.dni = p.dni || p.documento || p.nro_documento || p.document || "";
        p.color_principal =
          p.color_principal || p.colorPrincipal || p.color1 || "";
        p.color_secundario =
          p.color_secundario || p.colorSecundario || p.color2 || "";
        p.formato_id = p.formato_id || p.formatoId || p.format_id || "";
        p.urlvideo =
          p.urlvideo_aprobado ||
          p.urlvideo ||
          p.video_url ||
          p.video ||
          "";
        p.urlvideo_aprobado = p.urlvideo_aprobado || p.urlvideo;
        p.urlfoto =
          p.urlfoto_aprobado ||
          p.urlfoto ||
          p.foto_url ||
          p.foto ||
          p.foto_perfil ||
          "";
        p.url_cv =
          p.url_cv ||
          p.url_curriculum ||
          p.archivo_cv ||
          p.cv_url ||
          p.url_archivo ||
          "";
        p.products =
          p.products ||
          p.productos ||
          (bag.productos || []).filter(
            (x) => String(x.codigo_cliente) === String(p.codigo_cliente),
          );
        p.preguntas = normalizeQuestions(
          p.preguntas ||
            p.questions ||
            (bag.preguntas || []).filter(
              (x) => String(x.codigo_cliente) === String(p.codigo_cliente),
            ),
        );
        p.gallery =
          p.gallery ||
          (typeof p.videos === "string"
            ? p.videos.split("\n").map((l) => l.trim()).filter(Boolean)
            : null) ||
          (bag.enlaces || [])
            .filter((x) => String(x.codigo_cliente) === String(p.codigo_cliente))
            .map((x) => x.url || x.valor_enlace)
            .filter(Boolean);
        p.experiencia = parseExperiencia(p.experiencia || p.experiencias || p.trayectoria);
        if (!Array.isArray(p.experiencia)) p.experiencia = parseExperiencia(p.experiencia);
        try {
          const j = String(p.estilo_marco || "").startsWith("{") ? JSON.parse(p.estilo_marco) : {};
          // columna manda: si está false, no reactivar por estilo_marco
          if (p.carta_diaria_activa === false || p.carta_diaria_activa === "false" || p.carta_diaria_activa === 0) {
            p.carta_diaria_activa = false;
          } else {
            p.carta_diaria_activa = !!(p.carta_diaria_activa === true || p.carta_diaria_activa === "true" || p.carta_diaria_activa === 1 || j.carta_diaria === true);
          }
          p.carta_diaria_texto = p.carta_diaria_texto || j.carta_texto || "";
          p.carta_diaria_fondo = p.carta_diaria_fondo || j.carta_fondo || "";
          p.carta_mensaje = p.carta_mensaje || j.carta_mensaje || "";
          if (!p.url_carta && j.url_carta) p.url_carta = j.url_carta;
        } catch (_) {
          p.carta_diaria_activa = !!p.carta_diaria_activa;
        }
        p.chat =
          p.chat ||
          String(p.modalidad || "").toUpperCase() === "IA" ||
          p.modo_ia === "IA" ||
          p.modo_preguntas === "IA" ||
          p.ia_activa === true ||
          String(p.tipo_chat || "").toUpperCase() === "IA";
        p.estilo_tarjetas =
          p.estilo_tarjetas ||
          (state.formats.find((f) => String(f.id) === String(p.formato_id)) ||
            {}).estilo_tarjetas ||
          "";
        return p;
      };
      
      const videoEmbedHtml = (url) => {
        url = normalizeVideoUrl(url);
        const raw = String(url || "").trim();
        if (!raw) return "";
        try {
          const u = new URL(raw.startsWith("http") ? raw : "https://" + raw);
          const host = u.hostname.replace(/^www\./, "").toLowerCase();
          if (host.includes("youtube.com") || host === "youtu.be") {
            const id =
              u.searchParams.get("v") ||
              u.pathname.split("/").filter(Boolean).pop();
            if (!id)
              return `<p class="message">Esta página no se puede acceder al video.</p>`;
            return `<iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}" allowfullscreen loading="lazy" title="Video"></iframe>`;
          }
          if (host.includes("vimeo.com")) {
            const id = u.pathname.split("/").filter(Boolean).pop();
            if (!id)
              return `<p class="message">Esta página no se puede acceder al video.</p>`;
            return `<iframe src="https://player.vimeo.com/video/${encodeURIComponent(id)}" allowfullscreen loading="lazy" title="Video"></iframe>`;
          }
          if (/\.(mp4|webm|ogg)(\?|$)/i.test(u.pathname)) {
            return `<video controls playsinline src="${esc(raw)}" style="width:100%;border-radius:13px;background:#000"></video>`;
          }
          return `<iframe src="${esc(raw)}" loading="lazy" title="Video"></iframe><p class="message">Si no se ve el video, esta página no permite incrustarlo o el formato no es compatible.</p>`;
        } catch {
          return `<p class="message">Esta página no se puede acceder al video.</p>`;
        }
      };
      
      const resolveProductFoto = (foto) => {
        let f = String(foto || "").trim();
        if (!f) return "";
        if (f.startsWith("data:") || /^https?:\/\//i.test(f)) return f;
        if (f.startsWith("//")) return "https:" + f;
        // rutas relativas del repo cv_start
        if (!f.includes("/")) {
          return "https://cartasinteractivas-jpg.github.io/cv_start/" + f.replace(/^\.\//, "");
        }
        if (f.startsWith("/")) {
          return "https://cartasinteractivas-jpg.github.io/cv_start" + f;
        }
        // supabase storage path
        if (f.includes("storage/v1") || f.includes("supabase")) return f.startsWith("http") ? f : "https://" + f.replace(/^\/+/, "");
        return "https://cartasinteractivas-jpg.github.io/cv_start/" + f;
      };
      const parseProductMeta = (raw) => {
        const obj = typeof raw === "string" ? { descripcion: raw } : raw || {};
        let d = String(obj.descripcion || obj.nombre || "");
        // soporta salto de línea o espacio antes de @@MOCKUP@@
        const marker = "@@MOCKUP@@";
        const ix = d.indexOf(marker);
        let mockup = null;
        let name = d.trim();
        if (ix >= 0) {
          name = d.slice(0, ix).replace(/\s+$/g, "").trim() || "Producto";
          try {
            mockup = JSON.parse(d.slice(ix + marker.length).trim());
          } catch (_) {
            try {
              // a veces el JSON viene con entidades o recortes
              const j = d.slice(ix + marker.length).trim();
              mockup = JSON.parse(j.replace(/&quot;/g, '"'));
            } catch {
              mockup = null;
            }
          }
        }
        let foto =
          obj.foto ||
          obj.url_foto ||
          obj.urlfoto ||
          obj.image ||
          obj.imagen ||
          obj.photo ||
          obj.url_imagen ||
          obj.media_url ||
          "";
        if (!foto && mockup && Array.isArray(mockup.bases) && mockup.bases[0]) {
          foto = mockup.bases[0].foto || mockup.bases[0].url || "";
        }
        if (foto && typeof foto === "string") {
          foto = resolveProductFoto(foto);
        }
        return {
          name,
          mockup,
          foto: foto || "",
          precio: Number(obj.precio || 0),
          moneda: obj.moneda || "PEN",
          stock: obj.stock,
        };
      };
      const loadImg = (src) =>
        new Promise((resolve, reject) => {
          const im = new Image();
          im.crossOrigin = "anonymous";
          im.onload = () => resolve(im);
          im.onerror = () => reject(new Error("No se pudo cargar imagen"));
          im.src = src;
        });
      const renderMockupCanvas = async () => {
        const m = state.mockup;
        if (!m) return;
        const canvas = document.getElementById("mockup-canvas");
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        const base = m.bases[m.baseIndex] || m.bases[0];
        try {
          const shirt = await loadImg(base.foto);
          canvas.width = 600;
          canvas.height = 600;
          ctx.fillStyle = "#111";
          ctx.fillRect(0, 0, 600, 600);
          const scale = Math.max(600 / shirt.width, 600 / shirt.height);
          const sw = shirt.width * scale;
          const sh = shirt.height * scale;
          ctx.drawImage(shirt, (600 - sw) / 2, (600 - sh) / 2, sw, sh);
          if (m.designUrl) {
            const design = await loadImg(m.designUrl);
            const dw = 180 * (m.scale || 1);
            const dh = (design.height / design.width) * dw;
            ctx.globalAlpha = 0.95;
            ctx.drawImage(design, (600 - dw) / 2, 200 * (m.offsetY || 1), dw, dh);
            ctx.globalAlpha = 1;
          }
        } catch (e) {
          ctx.fillStyle = "#fff";
          ctx.font = "16px sans-serif";
          ctx.fillText("No se pudo cargar la plantilla", 20, 40);
        }
      };

      const cartClass = (p) => {
        let cartFmt = "";
        try {
          if (String(p.estilo_marco || "").startsWith("{"))
            cartFmt = JSON.parse(p.estilo_marco).cart_formato || "";
        } catch (_) {}
        const s = (
          cartFmt ||
          p.estilo_tarjetas ||
          format(p).estilo_tarjetas ||
          ""
        ).toLowerCase();
        if (s.includes("swipe") || s.includes("carrusel")) return "cart-swipe";
        if (s.includes("hero")) return "cart-hero";
        if (s.includes("grilla")) return "cart-grid";
        if (s.includes("lista")) return "cart-lista";
        if (s.includes("vitrina")) return "cart-vitrina";
        if (s.includes("market")) return "cart-market";
        return "cart-hero";
      };
      const cartHint = (cls) =>
        ({
          "cart-swipe": "Desliza la foto · cantidad y pedir abajo",
          "cart-hero": "Foto grande · descripción y stock",
          "cart-grid": "Grilla 2 columnas",
          "cart-lista": "Lista con foto grande",
          "cart-vitrina": "Vitrina horizontal",
          "cart-market": "Market · pedido rápido",
        })[cls] || "Productos";
      const showStock = (p) => {
        try {
          if (String(p.estilo_marco || "").startsWith("{")) {
            const j = JSON.parse(p.estilo_marco);
            if (j.mostrar_stock === true || j.mostrar_stock === "true" || j.mostrar_stock === 1 || j.mostrar_stock === "1") return true;
          }
        } catch (_) {}
        return p.mostrar_stock === true || p.mostrar_stock === "true";
      };
      function panel(p) {
        if (!state.panel) return "";
        const close =
          '<button type="button" class="close" data-close>×</button>';
        if (state.panel === "chat") {
          // El chat IA unificado es el de portada (inline). No usar el panel viejo.
          return "";
        }
        if (state.panel === "questions") {
          let _sx = {};
          try { if (String(p.estilo_marco||"").startsWith("{")) _sx = JSON.parse(p.estilo_marco); } catch(_){}
          const bodySz = Number(_sx.pregSize || _sx.secSize || 18);
          const titleSz = Math.max(bodySz + 2, Number(_sx.secTitleSize || bodySz + 4));
          const col = _sx.pregColor || _sx.secColor || p.color_texto || "#f8fafc";
          const glow = _sx.pregGlow || _sx.secGlow || "#38bdf8";
          const glowOn = _sx.pregGlowOn !== false && _sx.pregGlowOn !== "false";
          const font = _sx.pregFont || _sx.secFont || "inherit";
          const secBg = _sx.secBg || "#0b1220";
          const secBorder = _sx.secBorder || glow || "#38bdf8";
          const tShadow = glowOn
            ? "text-shadow:0 0 14px " + glow + "cc,0 0 6px " + glow + "99;"
            : "";
          const secStyle = [
            "font-family:" + font,
            "color:" + col,
          ].join(";");
          const qs = questions(p);
          return `<aside class="overlay open"><section class="sheet" style="${secStyle}"><div class="sheet-head"><div><span class="eyebrow">PREGUNTAS</span><h3 style="color:${col};${tShadow}">Preguntas</h3></div>${close}</div><div class="card-list">${
            qs
              .map(
                (q, i) =>
                  `<article class="faq-item" style="background:${secBg};border:1px solid ${secBorder}55"><button type="button" data-faq-toggle="${i}" style="font-size:${titleSz}px;color:${col};${tShadow}font-weight:800;width:100%;text-align:left;background:transparent;border:0;padding:12px;display:flex;justify-content:space-between;align-items:center;gap:8px"><b style="font-size:inherit;color:inherit;font-family:inherit">${esc(q.pregunta || q[0])}</b><span>+</span></button><div class="faq-body" style="font-size:${bodySz}px;line-height:1.45;color:${col};${tShadow}padding:0 12px 14px;font-family:inherit">${esc(q.respuesta || q[1] || "")}</div></article>`,
              )
              .join("") || "<p>No hay preguntas públicas.</p>"
          }</div></section></aside>`;
        }
        if (state.panel === "experience") {
          let _sx = {};
          try { if (String(p.estilo_marco||"").startsWith("{")) _sx = JSON.parse(p.estilo_marco); } catch(_){}
          const titleSz = Number(_sx.secTitleSize || 22);
          const bodySz = Number(_sx.secSize || 18);
          const secBg = _sx.secBg || "#0b1220";
          const secBorder = _sx.secBorder || _sx.secGlow || "#38bdf8";
          const secStyle = [
            "--sec-title-size:" + titleSz + "px",
            "--sec-body-size:" + bodySz + "px",
            "--sec-color:" + (_sx.secColor || p.color_texto || "#f8fafc"),
            "--sec-glow:" + (_sx.secGlow || "#38bdf8"),
            "font-family:" + (_sx.secFont || "inherit"),
          ].join(";");
          let ex = expFor(p);
          if (!ex.length && p.experiencia) {
            const raw = typeof p.experiencia === "string" ? p.experiencia : JSON.stringify(p.experiencia);
            ex = String(raw).split(/\n+/).map((l) => l.trim()).filter(Boolean).map((l) => ({ titulo: l.split("||")[0], detalle: l.split("||").slice(1).join("||") }));
          }
          return `<aside class="overlay open"><section class="sheet" style="${secStyle}"><div class="sheet-head"><div><span class="eyebrow">TRAYECTORIA</span><h3>Experiencia</h3></div>${close}</div><div class="card-list">${
            ex.length
              ? ex.map((e, i) =>
                  `<article class="exp-item" style="background:${secBg};border:1px solid ${secBorder}55"><button type="button" data-exp-toggle="${i}"><b>${esc(e.titulo || e.cargo || "Experiencia")}${e.empresa ? " · " + esc(e.empresa) : ""}</b><span>+</span></button><div class="exp-body"><p>${e.periodo ? `<b>${esc(e.periodo)}</b><br>` : ""}${esc(e.detalle || e.descripcion || "—")}</p></div></article>`
                ).join("")
              : "<p>Sin experiencia cargada.</p>"
          }</div></section></aside>`;
        }
        if (state.panel === "maps") {
          let styleExtra = {};
          try {
            if (String(p.estilo_marco || "").startsWith("{")) styleExtra = JSON.parse(p.estilo_marco);
          } catch (_) {}
          const m = mapsFromProfile(p, styleExtra);
          return `<aside class="overlay open"><section class="sheet"><div class="sheet-head"><div><span class="eyebrow">UBICACIÓN</span><h3>${esc(title(p))}</h3></div>${close}</div>
            ${m.dir ? `<p style="margin:0 0 10px;font-size:15px;font-weight:800">⌖ ${esc(m.dir)}</p>` : ""}
            ${m.coordText ? `<p style="margin:0 0 10px;font-size:13px;opacity:.9">Coordenadas: <b id="map-coords-text">${esc(m.coordText)}</b></p>
              <button type="button" class="action" data-copy-coords style="width:100%;margin-bottom:10px">Copiar coordenadas</button>` : ""}
            ${m.openUrl ? `<a class="action primary" href="${esc(m.openUrl)}" target="_blank" rel="noreferrer" style="display:flex;align-items:center;justify-content:center;text-decoration:none;margin-bottom:12px">Abrir en Google Maps</a>` : ""}
            ${m.embedUrl ? `<div class="gallery"><iframe src="${esc(m.embedUrl)}" title="Mapa" loading="lazy" style="width:100%;aspect-ratio:1/1;border:0;border-radius:14px;background:#0a1020"></iframe></div>` : `<p class="message">Sin ubicación configurada.</p>`}
            <p class="message" style="margin-top:10px">Si el mapa no centra bien, usa coordenadas (lat, lng) en tu perfil.</p>
          </section></aside>`;
        }

        if (state.panel === "info") {
          const tel = phoneOf(p);
          const isCv = String(p.tipo_perfil || p.tipo || "").toUpperCase() !== "NEGOCIO";
          // En CV no se muestra DNI/documento
          const dni = isCv ? "" : dniOf(p);
          const dir = isCv ? "" : (p.direccion || "");
          const wa = tel ? `https://wa.me/51${tel.replace(/^51/, "")}` : "";
          const call = tel ? `tel:+${tel.startsWith("51") ? tel : "51" + tel}` : "";
          let _si = {};
          try { if (String(p.estilo_marco || "").startsWith("{")) _si = JSON.parse(p.estilo_marco); } catch (_) {}
          const iSz = _si.secSize || 20;
          const iBg = _si.secBg || "#0b1220";
          const iBorder = _si.secBorder || _si.secGlow || "#38bdf8";
          const iColor = _si.secColor || p.color_texto || "#f8fafc";
          const iGlow = _si.secGlow || "#38bdf8";
          return `<aside class="overlay open"><section class="sheet" style="font-family:${_si.secFont || "inherit"}"><div class="sheet-head"><div><span class="eyebrow">CONTACTO</span><h3>Información</h3></div>${close}</div>
            <div class="info-hero" style="background:${iBg};border:1px solid ${iBorder}66;border-radius:16px;padding:16px;color:${iColor};text-shadow:0 0 12px ${iGlow}88;font-size:${iSz}px">
              ${dni ? `<p class="info-label">DNI / Documento</p><p class="info-value">${esc(dni)}</p>` : ""}
              ${tel ? `<p class="info-label">Teléfono</p><p class="info-value">${esc(p.telefono || p.celular || tel)}</p>
                <div class="profile-tools" style="justify-content:center;margin-bottom:16px">
                  <a class="action primary" style="text-decoration:none" href="${esc(wa)}" target="_blank" rel="noreferrer">WhatsApp</a>
                  <a class="action" style="text-decoration:none" href="${esc(call)}">Llamar</a>
                </div>` : ""}
              ${dir ? `<p class="info-label">Dirección</p><p class="info-value">${esc(dir)}</p>` : ""}
              ${!dni && !tel && !dir ? "<p>Sin datos de contacto públicos.</p>" : ""}
            </div></section></aside>`;
        }
        if (state.panel === "carta") {
          const texto = p.carta_diaria_texto || (() => { try { return JSON.parse(p.estilo_marco||"").carta_texto||""; } catch { return ""; } })();
          const msg = p.carta_mensaje || (() => { try { return JSON.parse(p.estilo_marco||"").carta_mensaje||""; } catch { return ""; } })();
          const fondo = p.carta_diaria_fondo || (() => { try { return JSON.parse(p.estilo_marco||"").carta_fondo||""; } catch { return ""; } })();

          // Separar ENTRADAS y SEGUNDOS (o FONDOS)
          const parseSecciones = (raw) => {
            const t = String(raw || "").replace(/\r/g, "");
            if (!t.trim()) return { entradas: [], segundos: [], otros: [] };
            const lower = t.toLowerCase();
            const hasE = /entrada/.test(lower);
            const hasS = /segundo|fondo[s]?/.test(lower);
            if (hasE || hasS) {
              const parts = t.split(/\n(?=\s*(entradas?|segundos?|fondos?)\s*:?\s*$)/im);
              let entradas = [], segundos = [], otros = [];
              let cur = "otros";
              for (const part of parts) {
                const lines = part.split("\n").map((l) => l.trim()).filter(Boolean);
                if (!lines.length) continue;
                const head = lines[0].toLowerCase().replace(/:$/, "").trim();
                if (/^entradas?$/.test(head)) cur = "entradas";
                else if (/^(segundos?|fondos?)$/.test(head)) cur = "segundos";
                const items = lines
                  .slice(/^entradas?$|^(segundos?|fondos?)$/.test(head) ? 1 : 0)
                  .map((l) => l.replace(/^[-•*\d.)\s]+/, "").trim())
                  .filter((l) => l && !/^(entradas?|segundos?|fondos?|menu):?$/i.test(l));
                if (cur === "entradas") entradas = entradas.concat(items);
                else if (cur === "segundos") segundos = segundos.concat(items);
                else otros = otros.concat(items);
              }
              return { entradas, segundos, otros };
            }
            // sin encabezados: primera mitad entradas, resto segundos si hay muchas líneas
            const all = t
              .split("\n")
              .map((l) => l.replace(/^[-•*\d.)\s]+/, "").trim())
              .filter((l) => l);
            if (all.length <= 2) return { entradas: all, segundos: [], otros: [] };
            const mid = Math.ceil(all.length / 2);
            return { entradas: all.slice(0, mid), segundos: all.slice(mid), otros: [] };
          };

          const sec = parseSecciones(texto);
          let _cartaSt = {};
          try {
            const j = JSON.parse(p.estilo_marco || "{}");
            _cartaSt = j.opcion_extra || j;
          } catch (_) {}
          const cartaColor = _cartaSt.carta_color || _cartaSt.color || "#1a1a1a";
          const cartaGlow = _cartaSt.carta_glow || "#fbbf24";
          const cartaGlowOn = _cartaSt.carta_glow_on !== false && _cartaSt.carta_glow_on !== "false";
          const nameStyle =
            "color:" +
            cartaColor +
            ";font-family:Georgia,serif;font-size:16px;font-weight:600;" +
            (cartaGlowOn
              ? "text-shadow:0 0 10px " + cartaGlow + "cc,0 0 4px " + cartaGlow + "88;"
              : "text-shadow:0 1px 2px #fff8;");
          const priceStyle =
            "color:" +
            cartaColor +
            ";font-weight:900;font-size:13px;opacity:.9;" +
            (cartaGlowOn ? "text-shadow:0 0 8px " + cartaGlow + "99;" : "");
          const parsePlato = (line) => {
            const s = String(line || "").trim();
            // "Sopa de casa - 8" | "Sopa | S/ 8" | "Sopa · 8.50"
            const m = s.match(/^(.*?)\s*[-–—|·]\s*(?:S\/?\s*)?(\d+(?:[.,]\d{1,2})?)\s*$/i);
            if (m) return { name: m[1].trim(), precio: Number(String(m[2]).replace(",", ".")) };
            return { name: s, precio: null };
          };
          const itemRow = (line) => {
            const { name, precio } = parsePlato(line);
            const qty = (state.cartaCart || {})[name] || 0;
            const priceHtml =
              precio != null
                ? '<span class="carta-price">S/ ' + Number(precio).toFixed(2) + "</span>"
                : "";
            // guardar meta precio para WhatsApp
            state.cartaMeta = state.cartaMeta || {};
            if (precio != null) state.cartaMeta[name] = { precio };
            return (
              '<div class="carta-item elegant">' +
              '<span class="carta-name" style="' +
              nameStyle +
              '">' +
              esc(name) +
              "</span>" +
              (precio != null
                ? '<span class="carta-price" style="' + priceStyle + '">S/ ' + Number(precio).toFixed(2) + "</span>"
                : "") +
              '<div class="carta-actions">' +
              (qty ? '<span class="qty-mini">×' + qty + "</span>" : "") +
              '<button type="button" class="btn-pedir" data-carta-qty="+" data-id="' +
              esc(name) +
              '" data-precio="' +
              (precio != null ? precio : "") +
              '">Pedir</button>' +
              '<button type="button" class="btn-quitar" data-carta-qty="-" data-id="' +
              esc(name) +
              '">Quitar</button></div></div>'
            );
          };

          let bodyHtml = "";
          if (sec.entradas.length) {
            bodyHtml += '<p class="carta-sec-title">Entradas</p>' + sec.entradas.map(itemRow).join("");
          }
          if (sec.segundos.length) {
            bodyHtml += '<p class="carta-sec-title">Segundos</p>' + sec.segundos.map(itemRow).join("");
          }
          if (!sec.entradas.length && !sec.segundos.length) {
            if (sec.otros.length) bodyHtml = sec.otros.map(itemRow).join("");
            else bodyHtml = '<p class="carta-msg">Sin menú del día aún.</p>';
          }
          bodyHtml = '<div class="carta-menu-elegant">' + bodyHtml + '</div>';

          const fondoStyle = fondo
            ? "background-image:url('" + String(fondo).replace(/'/g, "%27") + "')"
            : "";
          // total pedido carta
          const cartaTotal = Object.entries(state.cartaCart || {}).reduce((n, [nm, q]) => {
            const pr = (state.cartaMeta || {})[nm]?.precio;
            return n + (pr != null ? Number(pr) * q : 0);
          }, 0);
          const cartaN = Object.values(state.cartaCart || {}).reduce((a, b) => a + b, 0);
          const totalBar =
            '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;font-weight:900">' +
            "<span>Total" + (cartaN ? " (" + cartaN + ")" : "") + "</span>" +
            '<span style="color:#fde68a">S/ ' + cartaTotal.toFixed(2) + "</span></div>";

          return (
            '<aside class="overlay open"><section class="sheet carta-sheet full">' +
            (fondo ? '<div class="carta-bg" style="' + fondoStyle + '"></div>' : "") +
            '<div class="carta-inner">' +
            '<div class="sheet-head"><div><span class="eyebrow">HOY</span><h3>Carta diaria</h3></div><button class="close" data-close>×</button></div>' +
            bodyHtml +
            (msg ? '<p class="carta-msg">' + esc(msg) + "</p>" : "") +
            '<div class="order-box" style="margin-top:auto;padding-top:14px">' +
            totalBar +
            (phoneOf(p)
              ? '<button type="button" class="btn-wa" data-wa-carta>📱 Pedir por WhatsApp</button>'
              : '<p class="message">Sin número de WhatsApp configurado.</p>') +
            "</div></div></section></aside>"
          );
        }
        if (state.panel === "cart") {
          try {
            const entries = Object.entries(state.cart || {}).filter(([, q]) => Number(q) > 0);
            const monOf = (m) => (m === "USD" || m === "$" ? "$" : m === "EUR" ? "€" : "S/");
            let total = 0;
            let mon = "S/";
            const lines = entries
              .map(([id, q]) => {
                const meta = (state.cartMeta || {})[id] || {};
                const precio = Number(meta.precio || 0);
                mon = monOf(meta.moneda || "PEN");
                total += precio * Number(q);
                return (
                  '<div style="display:flex;justify-content:space-between;gap:8px;padding:12px;margin:0 0 8px;border-radius:12px;background:#ffffff12;border:1px solid #ffffff22">' +
                  "<div><b>" +
                  esc(id) +
                  "</b><br><span style=\"opacity:.9\">" +
                  mon +
                  " " +
                  precio.toFixed(2) +
                  " × " +
                  q +
                  " = " +
                  mon +
                  " " +
                  (precio * q).toFixed(2) +
                  '</span></div><div style="display:flex;gap:6px;align-items:center">' +
                  '<button type="button" class="btn-pedir" data-pedir="' +
                  esc(id) +
                  '" data-precio="' +
                  precio +
                  '" style="min-width:40px">＋</button>' +
                  "<b>" +
                  q +
                  "</b>" +
                  '<button type="button" class="btn-quitar" data-quitar="' +
                  esc(id) +
                  '" data-precio="' +
                  precio +
                  '" style="min-width:40px">−</button></div></div>'
                );
              })
              .join("");
            return (
              '<aside class="overlay open" style="display:flex!important;z-index:150!important">' +
              '<section class="sheet sheet-cart" style="height:100%;display:flex;flex-direction:column">' +
              '<div class="sheet-head"><div><span class="eyebrow">MI PEDIDO</span></div>' +
              close +
              "</div>" +
              '<div class="cart-scroll" style="flex:1;overflow:auto;padding:12px">' +
              (lines ||
                '<p style="text-align:center;padding:24px">Tu carrito está vacío.<br><button type="button" class="action" data-panel="products" style="margin-top:12px;width:100%">Sala de productos</button></p>') +
              "</div>" +
              '<div class="cart-footer" style="padding:12px;border-top:1px solid #ffffff22">' +
              '<div style="display:flex;justify-content:space-between;font-weight:900;margin-bottom:10px"><span>Total</span><span>' +
              mon +
              " " +
              total.toFixed(2) +
              "</span></div>" +
              (entries.length
                ? '<button type="button" class="action" data-cart-pagar style="width:100%;background:linear-gradient(135deg,#16a34a,#4ade80);color:#052e16;font-weight:900;margin-bottom:8px">Confirmar pago</button>'
                : "") +
              '<button type="button" class="action" data-panel="products" style="width:100%;margin-bottom:8px">Sala de productos</button>' +
              '<button type="button" class="action" data-close style="width:100%;background:#334155">Cerrar</button>' +
              "</div></section>" +
              (state.showNamePay
                ? '<div class="name-pay-modal" role="dialog" aria-modal="true">' +
                  '<div class="name-pay-card">' +
                  "<h3>Identifica tu pedido</h3>" +
                  "<p>Nombre y, si quieres, una nota para el negocio.</p>" +
                  '<input id="name-pay-input" type="text" maxlength="80" placeholder="Tu nombre" autocomplete="name" value="' +
                  (function(){ try { return esc(localStorage.getItem("wp_buyer_name")||""); } catch(_){ return ""; } })() +
                  '" />' +
                  '<textarea id="name-pay-notes" maxlength="300" rows="3" placeholder="Nota u observación (opcional)" style="width:100%;box-sizing:border-box;margin:0 0 12px;padding:10px 12px;border-radius:12px;border:1px solid #ffffff22;background:#06101b;color:#fff;font-size:14px;resize:vertical"></textarea>' +
                  '<div class="name-pay-actions">' +
                  '<button type="button" class="name-pay-send" data-name-pay-send>Enviar</button>' +
                  '<button type="button" class="name-pay-cancel" data-name-pay-cancel>Cancelar</button>' +
                  "</div></div></div>"
                : "") +
              "</aside>"
            );
          } catch (err) {
            console.error("cart panel", err);
            return (
              '<aside class="overlay open"><section class="sheet"><div class="sheet-head"><h3>Carrito</h3>' +
              close +
              '</div><p class="message">Error al mostrar el carrito. Cierra e intenta de nuevo.</p></section></aside>'
            );
          }
        }
        if (state.panel === "products") {
          // SALA DE PRODUCTOS: catálogo completo + buscador + flotante "Ir a pagar"
          let rawItems = [];
          try {
            rawItems = products(p) || [];
          } catch (_) {
            rawItems = state.products || [];
          }
          if (!rawItems.length && Array.isArray(state.products)) rawItems = state.products;
          const items = (rawItems || []).map((x, i) =>
            typeof x === "string" ? { descripcion: x, precio: 0, stock: "" } : x || {}
          );
          const monSymbol = (m) =>
            m === "USD" || m === "$" ? "$" : m === "EUR" || m === "€" ? "€" : "S/";
          const total = (() => {
            let t = 0,
              mon = "S/";
            Object.entries(state.cart || {}).forEach(([id, q]) => {
              const meta = (state.cartMeta || {})[id] || {};
              let precio = meta.precio != null ? Number(meta.precio) : null;
              if (precio == null) {
                const prod = items.find((x) => {
                  const m = parseProductMeta(x);
                  return m.name === id || (x.descripcion || "") === id;
                });
                precio = Number(prod?.precio || 0);
                if (prod) mon = monSymbol(prod.moneda);
              } else mon = monSymbol(meta.moneda);
              t += precio * Number(q || 0);
            });
            return { t, mon };
          })();
          const nCart = cartCount();
          let cartFmt = "carrito_lista";
          try {
            let se = {};
            try {
              if (String(p.estilo_marco || "").startsWith("{")) se = JSON.parse(p.estilo_marco);
            } catch (_) {}
            cartFmt = String(
              se.cart_formato ||
                se.estilo_tarjetas ||
                p.estilo_tarjetas ||
                p.cart_formato ||
                (typeof format === "function" ? (format(p).estilo_tarjetas || "") : "") ||
                "carrito_lista",
            ).toLowerCase();
          } catch (_) {}
          if (cartFmt.includes("swipe") || cartFmt.includes("carrusel")) cartFmt = "carrito_swipe";
          else if (cartFmt.includes("hero")) cartFmt = "carrito_hero";
          else if (cartFmt.includes("vitrina")) cartFmt = "carrito_vitrina";
          else if (cartFmt.includes("market")) cartFmt = "carrito_market";
          else if (cartFmt.includes("grilla") || cartFmt.includes("grid")) cartFmt = "carrito_grilla";
          else cartFmt = "carrito_lista";

          const layoutClass =
            cartFmt === "carrito_grilla" || cartFmt === "carrito_vitrina" ? "cart-layout-grilla"
            : cartFmt === "carrito_swipe" || cartFmt === "carrito_hero" ? "cart-layout-swipe"
            : cartFmt === "carrito_market" ? "cart-layout-market"
            : "cart-layout-lista";

          const canShowStock = showStock(p);
          const listaCols = canShowStock
            ? "44px minmax(0,1.4fr) 72px 52px 110px"
            : "44px minmax(0,1.6fr) 72px 110px";
          const headerRow =
            cartFmt === "carrito_lista"
              ? `<div class="prod-excel-head" style="display:grid;grid-template-columns:${listaCols};gap:6px;align-items:center;padding:8px 10px;margin:0 8px 4px;font-size:10px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;opacity:.7;border-bottom:1px solid #ffffff22">
              <span>Foto</span><span>Producto</span><span style="text-align:right">Precio</span>${canShowStock ? '<span style="text-align:center">Stock</span>' : ""}<span style="text-align:center">Cant.</span>
            </div>`
              : "";

          const qtyBtns = (id, precio, moneda, stockNum, qty, atMax) =>
            `<div class="prod-actions">
              <button type="button" class="btn-pedir" data-pedir="${esc(id)}" data-precio="${precio}" data-moneda="${esc(moneda)}" data-stock="${stockNum != null ? stockNum : ""}" ${atMax ? "disabled" : ""} style="width:40px;height:40px;border-radius:50%;font-weight:900;background:linear-gradient(145deg,#4ade80,#16a34a);color:#052e16;border:0;padding:0;display:inline-flex;align-items:center;justify-content:center;font-size:22px;line-height:1;box-shadow:0 4px 12px #22c55e66">+</button>
              <span class="cart-qty-n" data-qty-label="${esc(id)}">${qty}</span>
              <button type="button" class="btn-quitar" data-quitar="${esc(id)}" data-precio="${precio}" data-moneda="${esc(moneda)}" style="width:40px;height:40px;border-radius:50%;font-weight:900;background:linear-gradient(145deg,#f87171,#dc2626);color:#fff;border:0;padding:0;display:inline-flex;align-items:center;justify-content:center;font-size:22px;line-height:1;box-shadow:0 4px 12px #ef444466">−</button>
            </div>`;

          const cards = items
            .map((x) => {
              const meta = parseProductMeta(x);
              const id = meta.name || x.descripcion || x.nombre || "Producto";
              const qty = Number(state.cart[id] || 0);
              const precio = Number(x.precio || meta.precio || 0);
              const moneda = x.moneda || meta.moneda || "PEN";
              const mon = monSymbol(moneda);
              const foto = resolveProductFoto(meta.foto || x.foto || x.url_foto || "");
              const stockNum = x.stock != null && x.stock !== "" ? Number(x.stock) : null;
              const atMax = stockNum != null && qty >= stockNum;
              const stockTxt = canShowStock && stockNum != null ? `<span style="font-size:11px;opacity:.75">Stock ${stockNum}</span>` : "";

              if (cartFmt === "carrito_lista") {
                const img = foto
                  ? `<img src="${esc(foto)}" alt="${esc(id)}" data-zoom-src="${esc(foto)}" style="width:40px;height:40px;object-fit:cover;border-radius:8px;display:block">`
                  : `<div style="width:40px;height:40px;border-radius:8px;background:#ffffff14;display:grid;place-items:center;font-size:9px;opacity:.6">—</div>`;
                return `<article class="card product prod-excel-row" data-prod-id="${esc(id)}" style="display:grid;grid-template-columns:${listaCols};gap:6px;align-items:center;margin:0 8px;padding:8px 10px;border-bottom:1px solid #ffffff14;background:transparent;border-radius:0;box-shadow:none">
                ${img}
                <div style="min-width:0;overflow:hidden"><div style="font-size:13px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(id)}</div></div>
                <div style="text-align:right;font-weight:800;color:#fbbf24;font-size:12px;white-space:nowrap">${mon}&nbsp;${precio.toFixed(2)}</div>
                ${canShowStock ? `<div style="text-align:center;font-size:12px;opacity:.9">${stockNum != null ? stockNum : "—"}</div>` : ""}
                ${qtyBtns(id, precio, moneda, stockNum, qty, atMax)}
              </article>`;
              }

              if (cartFmt === "carrito_market") {
                const img = foto
                  ? `<img src="${esc(foto)}" alt="${esc(id)}" data-zoom-src="${esc(foto)}">`
                  : `<div class="prod-ph">—</div>`;
                return `<article class="card product" data-prod-id="${esc(id)}">${img}<div class="prod-body" style="min-width:0"><div style="font-weight:900;font-size:14px">${esc(id)}</div><div style="color:#fbbf24;font-weight:800">${mon} ${precio.toFixed(2)}</div>${stockTxt}</div>${qtyBtns(id, precio, moneda, stockNum, qty, atMax)}</article>`;
              }

              if (cartFmt === "carrito_swipe" || cartFmt === "carrito_hero") {
                const img = foto
                  ? `<img src="${esc(foto)}" alt="${esc(id)}" data-zoom-src="${esc(foto)}" class="prod-swipe-img" data-zoom-src="${esc(foto)}" style="width:100%;height:min(58vh,420px);object-fit:cover;display:block;cursor:pointer">`
                  : `<div class="prod-ph" style="display:grid;place-items:center;background:#ffffff10;color:#94a3b8;height:min(50vh,360px)">Sin foto</div>`;
                return `<article class="card product prod-swipe-card" data-prod-id="${esc(id)}" style="margin:0 0 12px;padding:0;overflow:hidden;border-radius:16px;position:relative">
                  ${img}
                  <div style="position:absolute;left:0;right:0;bottom:0;padding:14px;background:linear-gradient(transparent,#000c);color:#fff">
                    <div style="font-weight:900;font-size:20px;text-shadow:0 2px 8px #000">${esc(id)}</div>
                    <div style="color:#fbbf24;font-weight:900;font-size:16px;margin:4px 0">${mon} ${precio.toFixed(2)}</div>
                    ${stockTxt}
                    <div style="margin-top:8px">${qtyBtns(id, precio, moneda, stockNum, qty, atMax)}</div>
                  </div>
                </article>`;
              }
              if (cartFmt === "carrito_vitrina" || cartFmt === "carrito_grilla") {
                const img = foto
                  ? `<img src="${esc(foto)}" alt="${esc(id)}" data-zoom-src="${esc(foto)}" style="width:100%;height:140px;object-fit:cover;display:block">`
                  : `<div class="prod-ph" style="height:140px;display:grid;place-items:center;background:#ffffff10">Sin foto</div>`;
                return `<article class="card product" data-prod-id="${esc(id)}" style="padding:0;overflow:hidden;border-radius:14px">
                  ${img}
                  <div class="prod-body" style="padding:10px">
                    <div style="font-weight:900;font-size:14px">${esc(id)}</div>
                    <div style="color:#fbbf24;font-weight:800">${mon} ${precio.toFixed(2)}</div>
                    ${stockTxt}
                    <div style="margin-top:6px">${qtyBtns(id, precio, moneda, stockNum, qty, atMax)}</div>
                  </div>
                </article>`;
              }
              const img = foto
                ? `<img src="${esc(foto)}" alt="${esc(id)}" data-zoom-src="${esc(foto)}">`
                : `<div class="prod-ph" style="display:grid;place-items:center;background:#ffffff10;color:#94a3b8;height:110px">Sin foto</div>`;
              return `<article class="card product" data-prod-id="${esc(id)}">${img}<div class="prod-body"><div style="font-weight:900;font-size:15px">${esc(id)}</div><div style="color:#fbbf24;font-weight:800;margin-top:2px">${mon} ${precio.toFixed(2)}</div>${stockTxt}${qtyBtns(id, precio, moneda, stockNum, qty, atMax)}</div></article>`;
            })
            .join("");

          const bodyList = items.length
            ? headerRow + `<div class="${layoutClass}" style="padding-bottom:8px">${cards}</div>`
            : `<div style="padding:28px 16px;text-align:center;color:#fff"><p style="font-weight:900;font-size:16px;margin:0 0 8px">No hay productos publicados</p><p style="opacity:.85;margin:0;font-size:13px">El negocio debe cargarlos en login → Carrito → Productos y guardar.</p></div>`;

          return `<aside class="overlay open" style="display:flex!important;z-index:150!important;flex-direction:column">
            <section class="sheet sheet-cart" style="height:100%;display:flex;flex-direction:column;padding:0;border:0;border-radius:0;background:#020617">
              <div style="height:52px;flex-shrink:0;display:flex;align-items:center;justify-content:flex-end;padding:0 12px;border-bottom:1px solid #ffffff12">
                ${close}
              </div>
              <div class="cart-search-wrap cart-search-row" style="padding:10px 12px;display:flex;gap:8px;align-items:center">
                <input type="search" id="cart-search" placeholder="Buscar producto…" autocomplete="off" enterkeyhint="search" style="flex:1">
                <button type="button" class="cart-mic-btn" id="cart-search-btn" title="Hablar o enviar" style="min-width:48px;height:48px;border-radius:50%;border:0;background:#14b8a6;color:#052e16;font-weight:900;font-size:18px">🎙️</button>
              </div>
              <div class="cart-scroll" id="cart-scroll" style="flex:1;overflow:auto;padding-bottom:90px">${bodyList}</div>
              <div class="cart-fab-pay" style="position:absolute;left:12px;right:12px;bottom:14px;z-index:20;display:flex;gap:8px">
                <button type="button" class="action" data-panel="cart" style="flex:1;min-height:52px;font-weight:900;background:linear-gradient(135deg,#16a34a,#4ade80);color:#052e16;border:0;border-radius:14px">
                  ${nCart ? "Ir a pagar · " + total.mon + " " + total.t.toFixed(2) + " (" + nCart + ")" : "Ir a pagar · " + total.mon + " 0.00"}
                </button>
                <button type="button" class="action" data-close style="min-width:72px;background:#334155;border:0;border-radius:14px;font-weight:800">Cerrar</button>
              </div>
            </section>
          </aside>`;
        }

        if (state.panel === "services") {
          let rawItems = [];
          try {
            rawItems = typeof servicesOf === "function" ? servicesOf(p) : [];
          } catch (_) {
            rawItems = [];
          }
          const items = (rawItems || []).map((x) =>
            typeof x === "string" ? { descripcion: x, nombre: x } : x || {},
          );
          const close =
            '<button type="button" class="close" data-close aria-label="Cerrar">✕</button>';
          const cards = items
            .map((x, idx) => {
              const meta =
                typeof parseProductMeta === "function" ? parseProductMeta(x) : {};
              const name =
                meta.name || x.descripcion || x.nombre || "Servicio " + (idx + 1);
              const foto = resolveProductFoto(meta.foto || x.foto || "");
              const desc = String(
                x.detalle || x.descripcion_larga || x.notas || x.descripcion || "",
              ).slice(0, 220);
              const precio =
                x.precio != null && x.precio !== ""
                  ? "S/ " + Number(x.precio || 0).toFixed(2)
                  : "";
              return (
                '<article class="svc-card" data-svc-idx="' +
                idx +
                '">' +
                (foto
                  ? '<img class="svc-photo" src="' +
                    esc(foto) +
                    '" alt="" loading="lazy"/>'
                  : '<div class="svc-photo svc-ph">Sin foto</div>') +
                '<div class="svc-body"><b>' +
                esc(name) +
                "</b>" +
                (precio
                  ? '<span class="svc-price">' + precio + "</span>"
                  : "") +
                (desc
                  ? '<p class="svc-desc">' + esc(desc) + "</p>"
                  : '<p class="svc-desc">Servicio profesional. Consulta por el chat.</p>') +
                '<button type="button" class="svc-ask" data-svc-name="' +
                esc(name) +
                '">Preguntar por este servicio</button></div></article>'
              );
            })
            .join("");
          return (
            '<aside class="overlay open"><section class="sheet sheet-cart" style="height:100%;display:flex;flex-direction:column">' +
            '<div class="sheet-head"><div><span class="eyebrow">SERVICIOS</span></div>' +
            close +
            "</div>" +
            '<div class="cart-scroll" style="flex:1;overflow:auto;padding:12px">' +
            (cards ||
              '<p style="text-align:center;padding:24px;opacity:.8">Aún no hay servicios cargados. En el panel del cliente, en Productos, elige tipo <b>Servicio</b>.</p>') +
            "</div></section></aside>"
          );
        }

        if (state.panel === "calendario") {
          let cal = p.calendario || {};
          let calMes = p.calendario_mes || {};
          try {
            if (String(p.estilo_marco || "").startsWith("{")) {
              const j = JSON.parse(p.estilo_marco);
              if (!Object.keys(cal).length) cal = j.calendario || {};
              if (!Object.keys(calMes).length) calMes = j.calendario_mes || {};
            }
          } catch (_) {}
          const ym =
            state.calMonth ||
            (() => {
              const n = new Date();
              return n.getFullYear() + "-" + String(n.getMonth() + 1).padStart(2, "0");
            })();
          state.calMonth = ym;
          const [yy, mm] = ym.split("-").map(Number);
          const monthNames = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
          const first = new Date(yy, mm - 1, 1);
          const startDow = first.getDay();
          const daysInMonth = new Date(yy, mm, 0).getDate();
          const monthData = calMes[ym] || {};
          const today = new Date();
          const todayKey =
            today.getFullYear() === yy && today.getMonth() + 1 === mm
              ? String(today.getDate())
              : "";
          const dows = ["D","L","M","X","J","V","S"].map((d) => `<div class="cal-dow">${d}</div>`).join("");
          let cells = "";
          for (let i = 0; i < startDow; i++) cells += `<div class="cal-day muted"></div>`;
          for (let d = 1; d <= daysInMonth; d++) {
            const key = String(d);
            const info = monthData[key] || {};
            // si no hay marca del mes, usar horario semanal
            let st = info.estado;
            if (!st) {
              const dow = new Date(yy, mm - 1, d).getDay();
              const sem = cal[String(dow)] || cal[dow];
              st = sem && sem.abierto === false ? "ocupado" : "libre";
            }
            const cls =
              (st === "ocupado" ? "ocupado" : st === "parcial" ? "parcial" : "libre") +
              (String(d) === todayKey ? " today" : "");
            const tip = [
              info.nota || "",
              (info.horas || []).join(", "),
            ]
              .filter(Boolean)
              .join(" · ");
            cells += `<button type="button" class="cal-day ${cls}" data-pub-day="${key}" title="${esc(tip || st)}"><span>${d}</span></button>`;
          }
          const pick = state.calDayPick;
          const pickInfo = pick ? monthData[pick] || {} : null;
          const diasSem = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
          const rowsSem = diasSem
            .map((lab, idx) => {
              const d = cal[String(idx)] || cal[idx] || null;
              if (!d) return "";
              if (d.abierto === false)
                return `<div class="card"><b>${lab}</b><p style="color:#f87171;font-weight:800">Cerrado</p></div>`;
              return `<div class="card"><b>${lab}</b><p style="font-weight:800;color:#4ade80">${esc(d.inicio || "09:00")} – ${esc(d.fin || "18:00")}</p>${d.nota ? `<p style="font-size:12px;opacity:.85">${esc(d.nota)}</p>` : ""}</div>`;
            })
            .join("");
          return `<aside class="overlay open"><section class="sheet"><div class="sheet-head"><div><span class="eyebrow">DISPONIBILIDAD</span><h3>Calendario</h3></div>${close}</div>
            <div class="cal-month-nav">
              <button type="button" class="action" data-cal-nav="-1">‹</button>
              <b>${monthNames[mm - 1]} ${yy}</b>
              <button type="button" class="action" data-cal-nav="1">›</button>
            </div>
            <div class="cal-legend">
              <span><i style="background:#22c55e"></i> Libre</span>
              <span><i style="background:#fbbf24"></i> Parcial</span>
              <span><i style="background:#f87171"></i> Ocupado</span>
            </div>
            <div class="cal-grid">${dows}${cells}</div>
            ${
              pick
                ? `<div class="card" style="margin-bottom:12px"><b>Día ${esc(pick)}</b>
                <p style="margin:6px 0;font-weight:800">${
                  (pickInfo.estado || "libre") === "ocupado"
                    ? "Ocupado todo el día"
                    : (pickInfo.estado || "") === "parcial"
                      ? "Parcialmente ocupado"
                      : "Disponible"
                }</p>
                ${pickInfo.horas && pickInfo.horas.length ? `<p style="font-size:13px">Horas: ${esc(pickInfo.horas.join(", "))}</p>` : ""}
                ${pickInfo.nota ? `<p style="font-size:12px;opacity:.85">${esc(pickInfo.nota)}</p>` : ""}
              </div>`
                : `<p class="message" style="margin-bottom:12px">Toca un día para ver el detalle.</p>`
            }
            <h4 style="margin:8px 0;font-size:14px">Horario semanal</h4>
            <div class="card-list">${rowsSem || "<p>Sin horario semanal configurado.</p>"}</div>
          </section></aside>`;
        }
        
        if (state.panel === "opcion") {
          let o = {};
          try {
            o = JSON.parse(p.estilo_marco || "{}").opcion_extra || {};
          } catch (_) {}
          // Carta de menú dentro de "Añadir opción" → UI completa con Pedir/Quitar + WhatsApp
          if (String(o.tipo || "").toLowerCase() === "carta") {
            const texto =
              o.carta_texto ||
              p.carta_diaria_texto ||
              (() => {
                try {
                  return JSON.parse(p.estilo_marco || "{}").carta_texto || "";
                } catch {
                  return "";
                }
              })();
            const msg =
              p.carta_mensaje ||
              (() => {
                try {
                  return JSON.parse(p.estilo_marco || "{}").carta_mensaje || "";
                } catch {
                  return "";
                }
              })() ||
              "";
            const fondo =
              p.carta_diaria_fondo ||
              o.imagen ||
              (() => {
                try {
                  return JSON.parse(p.estilo_marco || "{}").carta_fondo || "";
                } catch {
                  return "";
                }
              })();
            const tituloCarta = o.titulo || "Menú del día";
            const cartaColor = o.carta_color || o.color || "#1a1a1a";
            const cartaGlow = o.carta_glow || "#fbbf24";
            const cartaGlowOn = o.carta_glow_on !== false && o.carta_glow_on !== "false";
            const nameStyle =
              "color:" +
              cartaColor +
              ";font-family:Georgia,serif;font-size:16px;font-weight:600;" +
              (cartaGlowOn
                ? "text-shadow:0 0 10px " + cartaGlow + "cc,0 0 4px " + cartaGlow + "88;"
                : "text-shadow:0 1px 2px #fff8;");
            const priceStyle =
              "color:" +
              cartaColor +
              ";font-weight:900;font-size:13px;opacity:.9;" +
              (cartaGlowOn ? "text-shadow:0 0 8px " + cartaGlow + "99;" : "");
            const parseLines = (raw) => {
              const lines = String(raw || "")
                .replace(/\r/g, "")
                .split("\n")
                .map((l) => l.replace(/^[-•*]\s*/, "").trim())
                .filter(Boolean)
                .filter((l) => !/^(entradas?|segundos?|fondos?|menu|menú)/i.test(l));
              return lines;
            };
            const platos = parseLines(texto);
            const items = platos.length ? platos : ["Consulta el menú del día"];
            const parsePlato = (line) => {
                const s = String(line || "").trim();
                const m = s.match(/^(.*?)\s*[-–—|·]\s*(?:S\/?\s*)?(\d+(?:[.,]\d{1,2})?)\s*$/i);
                if (m) return { name: m[1].trim(), precio: Number(String(m[2]).replace(",", ".")) };
                return { name: s, precio: null };
              };
              const itemRows = items
              .map((line) => {
                const { name, precio } = parsePlato(line);
                const qty = (state.cartaCart || {})[name] || 0;
                state.cartaMeta = state.cartaMeta || {};
                if (precio != null) state.cartaMeta[name] = { precio };
                return (
                  '<div class="carta-item elegant">' +
                  '<span class="carta-name" style="' +
                  nameStyle +
                  '">' +
                  esc(name) +
                  "</span>" +
                  (precio != null
                    ? '<span class="carta-price" style="' + priceStyle + '">S/ ' + Number(precio).toFixed(2) + "</span>"
                    : "") +
                  '<div class="carta-actions">' +
                  (qty ? '<span class="qty-mini">×' + qty + "</span>" : "") +
                  '<button type="button" class="btn-pedir" data-carta-qty="+" data-id="' +
                  esc(name) +
                  '" data-precio="' +
                  (precio != null ? precio : "") +
                  '">Pedir</button>' +
                  '<button type="button" class="btn-quitar" data-carta-qty="-" data-id="' +
                  esc(name) +
                  '">Quitar</button></div></div>'
                );
              })
              .join("");
            const fondoStyle = fondo
              ? "background-image:url('" + String(fondo).replace(/'/g, "%27") + "');background-size:cover;background-position:center"
              : "";
            const cartaTotal = Object.entries(state.cartaCart || {}).reduce((n, [nm, q]) => {
              const pr = (state.cartaMeta || {})[nm]?.precio;
              return n + (pr != null ? Number(pr) * q : 0);
            }, 0);
            const cartaN = Object.values(state.cartaCart || {}).reduce((a, b) => a + b, 0);
            const totalBar =
              '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;font-weight:900">' +
              "<span>Total" + (cartaN ? " (" + cartaN + ")" : "") + "</span>" +
              '<span style="color:#fde68a">S/ ' + cartaTotal.toFixed(2) + "</span></div>";
            return (
              '<aside class="overlay open"><section class="sheet carta-sheet full" style="min-height:100%;height:100%;max-height:100%;display:flex;flex-direction:column">' +
              (fondo ? '<div class="carta-bg" style="' + fondoStyle + '"></div>' : "") +
              '<div class="carta-inner" style="flex:1;display:flex;flex-direction:column;min-height:0;padding:64px 12px 12px">' +
              '<div class="sheet-head"><div><span class="eyebrow">EXTRA · CARTA</span><h3>' +
              esc(tituloCarta) +
              "</h3></div><button class=\"close\" data-close>×</button></div>" +
              '<div style="flex:1;overflow:auto;padding:8px 0" class="carta-menu-elegant">' +
              itemRows +
              (msg ? '<p class="carta-msg">' + esc(msg) + "</p>" : "") +
              "</div>" +
              '<div class="order-box" style="flex-shrink:0;padding-top:12px;border-top:1px solid #fff2">' +
              totalBar +
              (phoneOf(p)
                ? '<button type="button" class="btn-wa" data-wa-carta style="width:100%">📱 Pedir por WhatsApp</button>'
                : '<p class="message">Sin número de WhatsApp configurado.</p>') +
              "</div></div></section></aside>"
            );
          }
          const color = o.color || "#38bdf8";
          const size = Number(o.size || 16);
          const glow = o.glow !== false;
          const styleTxt =
            "color:" +
            color +
            ";font-size:" +
            size +
            "px;font-weight:800;line-height:1.35;" +
            (glow ? "text-shadow:0 0 12px " + color + "99,0 2px 8px #000a;" : "");
          let body = "";
          if (o.tipo === "imagen" && o.imagen) {
            body =
              '<img src="' +
              esc(o.imagen) +
              '" alt="" style="width:100%;border-radius:14px;margin-bottom:12px">';
          }
          if (o.titulo) {
            body +=
              '<h3 style="' +
              styleTxt +
              "font-size:" +
              Math.min(size + 6, 28) +
              'px;margin:0 0 10px">' +
              esc(o.titulo) +
              "</h3>";
          }
          if (o.texto) {
            body +=
              '<p style="' + styleTxt + 'white-space:pre-wrap">' + esc(o.texto) + "</p>";
          }
          if (Array.isArray(o.items) && o.items.length) {
            if (o.tipo === "giras") {
              const cartOn = products(p).length > 0;
              // ordenar por fecha si existe
              const sorted = o.items.slice().sort((a, b) => {
                const da = Date.parse(a.fecha || a.titulo || "") || 0;
                const db = Date.parse(b.fecha || b.titulo || "") || 0;
                return da - db;
              });
              body +=
                '<div class="giras-list" style="display:flex;flex-direction:column;gap:12px;margin-top:12px">' +
                sorted
                  .map((it) => {
                    const fecha = it.fecha || it.titulo || "";
                    const lugar = it.lugar || it.detalle || "";
                    const extra = it.hora ? String(it.hora) : "";
                    const nota = it.nota || it.texto || (it.detalle && it.lugar ? it.detalle : "");
                    const tieneEntrada =
                      it.entrada === true ||
                      it.entrada === "true" ||
                      it.entrada === 1 ||
                      it.entrada === "1" ||
                      String(it.entrada || "").toLowerCase() === "si" ||
                      String(it.entrada || "").toLowerCase() === "sí";
                    const prodName = String(it.producto || it.product || "").trim();
                    let fechaHtml = "";
                    if (fecha) {
                      const d = new Date(fecha);
                      if (!Number.isNaN(d.getTime())) {
                        const dias = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
                        const meses = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
                        fechaHtml =
                          '<div class="gira-date"><span class="gira-day">' +
                          dias[d.getDay()] +
                          '</span><span class="gira-num">' +
                          d.getDate() +
                          '</span><span class="gira-mon">' +
                          meses[d.getMonth()] +
                          " " +
                          d.getFullYear() +
                          "</span></div>";
                      } else {
                        fechaHtml = '<div class="gira-date"><span class="gira-num" style="font-size:14px">' + esc(String(fecha)) + "</span></div>";
                      }
                    }
                    const btnEntrada =
                      cartOn && (tieneEntrada || prodName)
                        ? '<button type="button" class="chat-prod-btn" data-panel="products" data-product-hint="' +
                          esc(prodName || it.titulo || "entrada") +
                          '" style="margin-top:8px">Comprar entrada</button>'
                        : tieneEntrada && !cartOn
                          ? '<p style="margin:8px 0 0;font-size:12px;opacity:.75">Entradas próximamente</p>'
                          : "";
                    return (
                      '<article class="gira-card" style="display:flex;gap:12px;padding:12px;border-radius:14px;border:1px solid ' +
                      color +
                      '44;background:#0b1220cc">' +
                      fechaHtml +
                      '<div style="flex:1;min-width:0">' +
                      (it.titulo && it.fecha
                        ? '<b style="' + styleTxt + "font-size:" + size + 'px">' + esc(it.titulo) + "</b>"
                        : it.titulo && !it.fecha
                          ? '<b style="' + styleTxt + "font-size:" + size + 'px">' + esc(it.titulo) + "</b>"
                          : "") +
                      (lugar
                        ? '<p style="margin:4px 0 0;font-size:13px;opacity:.95">📍 ' + esc(lugar) + "</p>"
                        : "") +
                      (extra
                        ? '<p style="margin:2px 0 0;font-size:12px;opacity:.8">🕒 ' + esc(extra) + "</p>"
                        : "") +
                      (nota && nota !== lugar
                        ? '<p style="margin:6px 0 0;font-size:12px;opacity:.85">' + esc(nota) + "</p>"
                        : "") +
                      btnEntrada +
                      "</div></article>"
                    );
                  })
                  .join("") +
                "</div>";
            }
            const asGraph =
              o.tipo !== "giras" &&
              o.tipo !== "carta" &&
              (o.tipo === "graficos" ||
              o.tipo === "stats" ||
              (Array.isArray(o.items) && o.items.some((it) => it && (it.estilo === "redondo" || it.estilo === "barra" || it.estilo === "vertical"))));
            if (asGraph) {
              body +=
                '<div style="display:flex;flex-direction:column;gap:16px;margin-top:14px">' +
                o.items
                  .map((it) => {
                    const raw = String(it.valor ?? "").replace("%", "").trim();
                    let v = Number(raw);
                    if (Number.isNaN(v)) v = 0;
                    // si >100, mostrar valor real y barra relativa (max 100 visual)
                    const bar = Math.max(0, Math.min(100, v > 100 ? 100 : v));
                    const labelVal = raw.includes("%") || v <= 100 ? bar + "%" : String(it.valor ?? v);
                    const estilo = it.estilo || (o.tipo === "graficos" ? "barra" : "barra");
                    let viz = "";
                    if (estilo === "redondo") {
                      viz =
                        '<div style="width:88px;height:88px;border-radius:50%;margin:8px auto 0;background:conic-gradient(' +
                        color +
                        " 0 " +
                        bar +
                        "%,#ffffff18 " +
                        bar +
                        '%);display:flex;align-items:center;justify-content:center;box-shadow:0 0 16px ' +
                        color +
                        '55"><span style="font-weight:950;font-size:16px;color:#fff">' +
                        esc(labelVal) +
                        "</span></div>";
                    } else if (estilo === "vertical") {
                      viz =
                        '<div style="height:120px;display:flex;align-items:flex-end;justify-content:center;margin-top:8px">' +
                        '<div style="width:36px;height:' +
                        Math.max(8, bar) +
                        "%;min-height:8px;border-radius:10px 10px 4px 4px;background:linear-gradient(180deg," +
                        color +
                        ",#fff3);box-shadow:0 0 14px " +
                        color +
                        '66"></div></div>' +
                        '<p style="text-align:center;margin:6px 0 0;font-weight:900;color:' +
                        color +
                        '">' +
                        esc(labelVal) +
                        "</p>";
                    } else {
                      // barra horizontal
                      viz =
                        '<div style="height:14px;border-radius:999px;background:#ffffff18;overflow:hidden;margin-top:8px">' +
                        '<div style="height:100%;width:' +
                        bar +
                        "%;border-radius:999px;background:linear-gradient(90deg," +
                        color +
                        ",#fff6);box-shadow:0 0 12px " +
                        color +
                        '88"></div></div>' +
                        '<p style="margin:6px 0 0;font-weight:900;color:' +
                        color +
                        ';font-size:14px">' +
                        esc(labelVal) +
                        "</p>";
                    }
                    return (
                      '<div style="padding:12px;border-radius:14px;border:1px solid #ffffff18;background:#0b1220cc">' +
                      '<div style="font-size:14px;font-weight:900;margin-bottom:2px;color:#f8fafc">' +
                      esc(it.titulo || "Ítem") +
                      "</div>" +
                      (it.detalle
                        ? '<p style="margin:0 0 4px;font-size:12px;opacity:.85">' +
                          esc(it.detalle) +
                          "</p>"
                        : "") +
                      viz +
                      "</div>"
                    );
                  })
                  .join("") +
                "</div>";
            } else {
              body +=
                '<div class="card-list" style="margin-top:12px">' +
                o.items
                  .map(
                    (it) =>
                      '<article class="card"><b style="' +
                      styleTxt +
                      "font-size:" +
                      size +
                      'px">' +
                      esc(it.titulo || "") +
                      "</b>" +
                      (it.detalle
                        ? '<p style="margin:6px 0 0;opacity:.9">' +
                          esc(it.detalle) +
                          "</p>"
                        : "") +
                      (it.valor != null && it.valor !== ""
                        ? '<p style="margin:6px 0 0;font-weight:900;color:' +
                          color +
                          '">' +
                          esc(String(it.valor)) +
                          "</p>"
                        : "") +
                      "</article>",
                  )
                  .join("") +
                "</div>";
            }
          }
          if (!body) body = '<p class="message">Sin contenido configurado.</p>';
          return (
            '<aside class="overlay open"><section class="sheet"><div class="sheet-head"><div><span class="eyebrow">EXTRA</span><h3>' +
            esc(o.titulo || o.boton || "Opción") +
            "</h3></div>" +
            close +
            '</div><div style="padding:4px 0 20px">' +
            body +
            "</div></section></aside>"
          );
        }
        if (state.panel === "valoraciones") {
          const list = state.valoraciones || p.valoraciones || [];
          const avg = list.length
            ? list.reduce((s, x) => s + Number(x.puntaje || 0), 0) / list.length
            : 0;
          const stars = (n) => {
            const r = Math.round(Number(n) || 0);
            return "★".repeat(Math.max(0, Math.min(5, r))) + "☆".repeat(Math.max(0, 5 - Math.max(0, Math.min(5, r))));
          };
          const starBtns = [1, 2, 3, 4, 5]
            .map(
              (n) =>
                `<button type="button" data-rate-star="${n}" class="${n === 5 ? "on" : ""}" aria-label="${n} estrellas">★</button>`,
            )
            .join("");
          return `<aside class="overlay open"><section class="sheet rate-panel"><div class="sheet-head"><div><span class="eyebrow">OPINIONES</span><h3>Valoraciones</h3></div>${close}</div>
            <div class="rate-summary">
              ${
                list.length
                  ? `<div class="stars-big">${stars(avg)}</div>
                <div class="rate-meta">${avg.toFixed(1)} de 5 · ${list.length} ${list.length === 1 ? "opinión" : "opiniones"}</div>`
                  : `<div class="stars-big">☆☆☆☆☆</div><div class="rate-meta">Sé el primero en opinar</div>`
              }
            </div>
            <form id="valoracion-form" class="rate-form">
              <div>
                <label for="rate-nombre">Tu nombre</label>
                <input id="rate-nombre" name="nombre" required maxlength="80" placeholder="Escribe tu nombre" autocomplete="name">
              </div>
              <div>
                <label>Tu puntaje</label>
                <input type="hidden" name="puntaje" id="rate-puntaje" value="5">
                <div class="rate-stars-pick">${starBtns}</div>
              </div>
              <div>
                <label for="rate-comentario">Comentario (opcional)</label>
                <textarea id="rate-comentario" name="comentario" rows="3" maxlength="500" placeholder="Cuéntanos qué te pareció el servicio…"></textarea>
              </div>
              <button type="submit" class="rate-submit">Enviar valoración</button>
            </form>
            <div class="rate-list">${
              list.length
                ? list
                    .map(
                      (v) => `<article class="rate-item">
                  <div class="rate-item-top">
                    <b>${esc(v.nombre || "Anónimo")}</b>
                    <span class="stars-sm">${stars(Number(v.puntaje || 0))}</span>
                  </div>
                  ${v.comentario ? `<p>${esc(v.comentario)}</p>` : ""}
                </article>`,
                    )
                    .join("")
                : `<p class="rate-empty">Aún no hay opiniones publicadas.</p>`
            }</div>
          </section></aside>`;
        }
        if (state.panel === "gallery")
          return `<aside class="overlay open"><section class="sheet"><div class="sheet-head"><div><span class="eyebrow">GALERÍA</span><h3>Videos</h3></div>${close}</div><div class="gallery">${
            links(p).map(normalizeVideoUrl).map(videoEmbedHtml).join("") || "<p>No hay videos públicos.</p>"
          }</div></section></aside>`;
        return "";
      }
      function render() {
        const p = state.profiles[state.index];
        try { if (p) void trackVisita(p); } catch (_tv) {};
        const __liveMedia = detachLiveMedia();
        // QR dinámico / redirección a otra URL
        {
          let styleEx = {};
          try {
            if (String(p.estilo_marco || "").startsWith("{")) styleEx = JSON.parse(p.estilo_marco);
          } catch (_) {}
          const modo = String(p.pausa_modo || styleEx.pausa_modo || "").toLowerCase();
          let redir = String(p.pausa_url || styleEx.pausa_url || "").trim();
          // Si modo es redirigir y hay URL → salir a esa dirección (si no hay URL, perfil normal)
          if (modo === "redirigir" && redir) {
            if (!/^https?:\/\//i.test(redir)) redir = "https://" + redir.replace(/^\/+/, "");
            window.location.replace(redir);
            return;
          }
        }
        if (!p) {
          app.innerHTML =
            '<p class="message">No se encontró el perfil solicitado.</p>';
          finishMedia(__liveMedia);
          return;
        }
        const f = format(p),
          main = p.color_principal || f.color_principal || "#38bdf8",
          second = p.color_secundario || f.color_secundario || "#a78bfa",
          menu = menuClass(p),
          q = questions(p).length,
          pro = products(p).length,
          gal = links(p).length,
          exp = expFor(p).length,
          cv = isCV(p),
          src = publicVideo(p);
        pocket.style.setProperty("--main", main);
        pocket.style.setProperty("--second", second);
        let styleExtra = {};
        try {
          if (String(p.estilo_marco || "").startsWith("{"))
            styleExtra = JSON.parse(p.estilo_marco);
        } catch (_) {}
        pocket.style.setProperty("--text", p.color_texto || "#f8fafc");
        pocket.style.setProperty("--text2", styleExtra.tituloFondo || p.color_texto || "#f8fafc");
        pocket.style.setProperty("--btn-sel", styleExtra.btnSel || p.color_botones || main);
        pocket.style.setProperty("--btn-letra", styleExtra.btnLetra || "#ffffff");
        pocket.style.setProperty("--btn-letra2", styleExtra.letra2 || styleExtra.btnLetra || "#e2e8f0");
        // combinar colores: solo si btn_blend explícito
        const blendOn =
          styleExtra.btn_blend === true ||
          styleExtra.btn_blend === "true" ||
          styleExtra.btn_blend === 1 ||
          styleExtra.btn_blend === "1";
        pocket.setAttribute("data-btn-blend", blendOn ? "1" : "0");
        if (styleExtra.chat_band_bg)
          pocket.style.setProperty("--chat-band-bg", styleExtra.chat_band_bg);
        if (styleExtra.chat_band_text)
          pocket.style.setProperty("--chat-band-text", styleExtra.chat_band_text);
        if (styleExtra.chat_band_sub)
          pocket.style.setProperty("--chat-band-sub", styleExtra.chat_band_sub);
        if (styleExtra.chat_band_size)
          pocket.style.setProperty("--chat-band-size", Number(styleExtra.chat_band_size) + "px");
        if (styleExtra.chat_band_border)
          pocket.style.setProperty("--chat-band-border", styleExtra.chat_band_border);
        if (styleExtra.chat_band_border_w != null && styleExtra.chat_band_border_w !== "")
          pocket.style.setProperty("--chat-band-border-w", Number(styleExtra.chat_band_border_w) + "px");
        if (styleExtra.chat_band_title_color)
          pocket.style.setProperty("--chat-band-title-color", styleExtra.chat_band_title_color);
        if (styleExtra.chat_band_opacity != null && styleExtra.chat_band_opacity !== "")
          pocket.style.setProperty("--chat-band-opacity", String(styleExtra.chat_band_opacity));
        if (styleExtra.chat_band_radius != null && styleExtra.chat_band_radius !== "")
          pocket.style.setProperty("--chat-band-radius", Number(styleExtra.chat_band_radius) + "px");
        if (styleExtra.chat_input_bg)
          pocket.style.setProperty("--chat-input-bg", styleExtra.chat_input_bg);
        // también en documentElement para el float
        try {
          if (styleExtra.chat_band_bg)
            document.documentElement.style.setProperty("--chat-band-bg", styleExtra.chat_band_bg);
          if (styleExtra.chat_band_text)
            document.documentElement.style.setProperty("--chat-band-text", styleExtra.chat_band_text);
          if (styleExtra.chat_band_sub)
            document.documentElement.style.setProperty("--chat-band-sub", styleExtra.chat_band_sub);
          if (styleExtra.chat_band_size)
            document.documentElement.style.setProperty("--chat-band-size", Number(styleExtra.chat_band_size) + "px");
          if (styleExtra.chat_band_border)
            document.documentElement.style.setProperty("--chat-band-border", styleExtra.chat_band_border);
          if (styleExtra.chat_band_border_w != null && styleExtra.chat_band_border_w !== "")
            document.documentElement.style.setProperty(
              "--chat-band-border-w",
              Number(styleExtra.chat_band_border_w) + "px",
            );
          if (styleExtra.chat_band_title_color)
            document.documentElement.style.setProperty(
              "--chat-band-title-color",
              styleExtra.chat_band_title_color,
            );
          if (styleExtra.chat_band_opacity != null && styleExtra.chat_band_opacity !== "")
            document.documentElement.style.setProperty(
              "--chat-band-opacity",
              String(styleExtra.chat_band_opacity),
            );
          if (styleExtra.chat_band_radius != null && styleExtra.chat_band_radius !== "")
            document.documentElement.style.setProperty(
              "--chat-band-radius",
              Number(styleExtra.chat_band_radius) + "px",
            );
          if (styleExtra.chat_input_bg)
            document.documentElement.style.setProperty("--chat-input-bg", styleExtra.chat_input_bg);
          const chatInp = document.getElementById("inline-chat-input");
          if (chatInp && styleExtra.chat_input_bg)
            chatInp.style.background = styleExtra.chat_input_bg;
        } catch (_) {}
        pocket.style.setProperty("--menu-sel", styleExtra.menuSel || "#ffffff");
        pocket.style.setProperty("--menu-no", styleExtra.menuNo || "#f8fafc");
        pocket.style.setProperty("--menu-bg", (styleExtra.menuBg || "#06101b") + "d9");
        if (styleExtra.menuSize) pocket.style.setProperty("--menu-size", styleExtra.menuSize + "px");
        if (styleExtra.font) pocket.style.setProperty("--font", styleExtra.font);
        else if (String(p.estilo_marco || "").startsWith("font|"))
          pocket.style.setProperty("--font", String(p.estilo_marco).slice(5));
        const btnOrder = styleExtra.btnOrder || {};
        let labelsMenu = styleExtra.labelsMenu || styleExtra.labels_menu || {};
        let labelsBtn = styleExtra.labelsBtn || styleExtra.labels_btn || {};
        let menuShow = styleExtra.menuShow || styleExtra.menu_show || {};
        // respaldo si vinieron como string JSON
        try {
          if (typeof labelsMenu === "string") labelsMenu = JSON.parse(labelsMenu);
          if (typeof labelsBtn === "string") labelsBtn = JSON.parse(labelsBtn);
          if (typeof menuShow === "string") menuShow = JSON.parse(menuShow);
        } catch (_) {}
        if (!labelsMenu || typeof labelsMenu !== "object") labelsMenu = {};
        if (!labelsBtn || typeof labelsBtn !== "object") labelsBtn = {};
        if (!menuShow || typeof menuShow !== "object") menuShow = {};
        const apertura = styleExtra.apertura || {};
        const apShowMenu = (apertura.showMenu !== false && apertura.showMenu !== "false") && state.panel !== "chat";
        const apShowChat = !!(apertura.showChat === true || apertura.showChat === "true" || apertura.showChat === 1) || state.panel === "chat";
        const apChatFirst = apertura.chatFirst !== false && apertura.chatFirst !== "false";
        // Botones: si el usuario marcó "mostrar botones" O "chat arriba + botones abajo"
        const apShowBotones =
          (
            (apertura.showBotones !== false && apertura.showBotones !== "false") ||
            (!!(apertura.showChat === true || apertura.showChat === "true" || apertura.showChat === 1) &&
              apertura.chatFirst !== false &&
              apertura.chatFirst !== "false")
          ) &&
          state.panel !== "chat";
        const apHideVideo = !!(apertura.hideVideo === true || apertura.hideVideo === "true");
        const apMenuSlot = String(apertura.menuSlot || "menu");
        const apVideoMins = Number(apertura.videoMins || 0) || 0;
        // temporizador video: si videoMins > 0 y ya pasó, ocultar
        if (apVideoMins > 0 && !state._videoShownAt) state._videoShownAt = Date.now();
        const videoExpired = apVideoMins > 0 && state._videoShownAt && (Date.now() - state._videoShownAt > apVideoMins * 60 * 1000);
        const labM = (k, d) => {
          const v = String(labelsMenu[k] || "").trim();
          return v || d;
        };
        const labB = (k, d) => {
          const v = String(labelsBtn[k] || "").trim();
          return v || d;
        };
        const showM = (k, has) => {
          if (menuShow[k] === false || menuShow[k] === "false" || menuShow[k] === 0) return false;
          return !!has;
        };
        const opExtra = styleExtra.opcion_extra || {};
        const opActiva =
          opExtra.activa === true ||
          opExtra.activa === "true" ||
          opExtra.activa === 1 ||
          opExtra.activa === "1";
        const opBtnName = (
          labelsMenu.opcion ||
          labelsBtn.opcion ||
          opExtra.boton ||
          "EXTRA"
        )
          .toString()
          .slice(0, 24);
        const cartaOn =
          p.carta_diaria_activa === true ||
          p.carta_diaria_activa === "true" ||
          p.carta_diaria_activa === 1 ||
          (opActiva && opExtra.tipo === "carta");
        const primaryKey =
          btnOrder.primary ||
          (pro
            ? "products"
            : p.chat
              ? "chat"
              : q
                ? "questions"
                : exp
                  ? "experience"
                  : cartaOn
                    ? "carta"
                    : opActiva
                      ? "opcion"
                      : "none");
        const primaryMap = {
          products: { panel: "products", label: labB("products", pro ? "Ver carrito" : "Ver productos") },
          chat: { panel: "chat", label: labB("chat", "Preguntar") },
          questions: { panel: "questions", label: labB("questions", "Preguntas") },
          experience: { panel: "experience", label: labB("experience", "Ver experiencia") },
          carta: { panel: "carta", label: labB("carta", "Carta del día") },
          opcion: { panel: "opcion", label: labB("opcion", opBtnName) },
          info: { panel: "info", label: labB("info", "Información") },
          gallery: { panel: "gallery", label: labB("gallery", "Videos") },
          calendario: { panel: "calendario", label: labB("calendario", "Horario") },
          valoraciones: { panel: "valoraciones", label: labB("valoraciones", "Valorar") },
          share_cv: { action: "share_cv", label: labB("share_cv", "Compartir CV") },
          download_cv: { action: "download_cv", label: labB("download_cv", "Bajar CV") },
          share_carta: { action: "share_carta", label: labB("share_carta", "Compartir carta") },
          download_carta: { action: "download_carta", label: labB("download_carta", "Bajar carta") },
        };
        const primaryPanel = (primaryMap[primaryKey] || {}).panel || "none";
        const primaryLabel = (primaryMap[primaryKey] || {}).label || "Ver perfil";
        const secondaryKeys = Array.isArray(btnOrder.secondary) ? btnOrder.secondary : [];
        let btnLayout = btnOrder.layout || (secondaryKeys.length ? "1g2p" : "1g");
        {
          const rawLay = String(btnLayout || "").toLowerCase().trim();
          if (
            rawLay === "2g" ||
            rawLay === "2" ||
            rawLay.includes("2 grande") ||
            rawLay.includes("dos grande") ||
            rawLay.includes("2 botones grande") ||
            rawLay === "ambos grandes"
          ) {
            btnLayout = "2g";
          }
        }
        const btnSlots = (
          Array.isArray(btnOrder.slots) && btnOrder.slots.length
            ? btnOrder.slots
            : [primaryKey].concat(secondaryKeys)
        ).filter((k) => k && k !== "none");
        const slotLabel = (k, idx) => {
          const custom = (labelsBtn && (labelsBtn["slot" + idx] || labelsBtn[k])) || "";
          if (custom && String(custom).trim()) return String(custom).trim();
          return (primaryMap[k] || {}).label || String(k || "");
        };
        const slotPanel = (k) => (primaryMap[k] || {}).panel || k;
        const paused = p.pausa_activa === true || p.pausa_activa === "true" || styleExtra.pausa_activa;
        const hideData =
          p.ocultar_datos === true ||
          p.ocultar_datos === "true" ||
          styleExtra.sin_titulo === true ||
          p.sin_titulo === true ||
          p.sin_titulo === "true";
        const pausaModo = p.pausa_modo || styleExtra.pausa_modo || "foto_video";
        
        let titleStyle = "";
        {
          const bw = Math.min(4, Math.max(0, Number(styleExtra.tituloBordeW || 0)));
          const bc = styleExtra.tituloBorde || styleExtra.tituloSombra || "#38bdf8";
          const fill =
            styleExtra.tituloFondo && styleExtra.tituloFondo !== "#000000"
              ? styleExtra.tituloFondo
              : p.color_texto || "#ffffff";
          const parts = ["color:" + fill];
          if (bw > 0) {
            parts.push("-webkit-text-stroke:" + bw + "px " + bc);
            parts.push("text-shadow:0 0 " + (4 + bw * 2) + "px " + bc + "99, 0 2px 8px #000a");
          } else {
            parts.push("text-shadow:0 0 16px " + bc + "77, 0 2px 8px #0009");
          }
          titleStyle = parts.join(";");
        }
        const roleLine = (p.categoria || p.giro || "").trim();
        // Con chat en portada: ocultar título y subtítulo; si se desactiva, vuelven
        const contentBlock =
          hideData || (apShowChat && (!state.panel || state.panel === "chat"))
            ? ""
            : '<h2 class="title-styled" style="font-family:var(--font,inherit);' +
              titleStyle +
              '">' +
              esc(title(p)) +
              "</h2>" +
              (roleLine
                ? '<p class="role">' + esc(roleLine) + "</p>"
                : "") +
              (p.perfil || p.descripcion
                ? '<p class="desc">' + esc(p.perfil || p.descripcion || "") + "</p>"
                : "") +
              (!cv && p.direccion ? '<p class="location">⌖ ' + esc(p.direccion) + "</p>" : "");

        if (paused) {
          const modo = pausaModo;
          const showMedia = modo === "foto_video" || modo === "foto" || modo === "video";
          const onlyTxt = modo === "texto";
          app.innerHTML = (showMedia ? mediaBackground(p) : "") + '<div class="shade"></div><section class="content" style="text-align:center;padding-top:30%"><h2>' + esc(title(p)) + '</h2>' +
            (p.pausa_texto || onlyTxt ? '<p class="desc" style="font-size:16px;margin-top:12px">' + esc(p.pausa_texto || "Perfil en pausa") + '</p>' : '<p class="desc">Perfil en pausa</p>') +
            '</section>';
          finishMedia(__liveMedia);
        try {
          const _em = p && p.estilo_marco;
          if (_em && String(_em).startsWith("{")) {
            const _ex = JSON.parse(_em);
            if (_ex.btn_font_size)
              document.documentElement.style.setProperty("--btn-font-size", Number(_ex.btn_font_size) + "px");
            if (_ex.chat_band_bg)
              document.documentElement.style.setProperty("--chat-band-bg", _ex.chat_band_bg);
            if (_ex.chat_band_text)
              document.documentElement.style.setProperty("--chat-band-text", _ex.chat_band_text);
            if (_ex.chat_input_bg)
              document.documentElement.style.setProperty("--chat-input-bg", _ex.chat_input_bg);
          }
        } catch (_) {}
        try { mountCartFab(p); } catch (_) {}
          bind();
          return;
        }
        // Chat en portada (apertura) o al abrir panel chat por botón
        const showInlineChat =
          !!apShowChat && (!state.panel || state.panel === "chat");
        // Video solo portada (sin chat). Con chat: fondo oscuro + avatar a tamaño app detrás del UI.
        let bgHtml = (apHideVideo || videoExpired)
          ? `<div class="background" style="background:#050914"></div>`
          : mediaBackground(p);
        let avatarLayerHtml = "";
        if (showInlineChat) {
          bgHtml = `<div class="background" style="background:#050914"></div>`;
          try {
            avatarLayerHtml = avatarHtml(p) || "";
          } catch (_) {
            avatarLayerHtml = "";
          }
        }
        const inlineChatHtml = showInlineChat
          ? `
          <div class="inline-chat ${state.panel === "chat" ? "inline-chat-full" : ""}" id="inline-chat">
            <div class="inline-chat-log" id="inline-chat-log"></div>
            <div class="inline-chat-row">
              <input type="text" id="inline-chat-input" placeholder="Escribe o toca el micrófono…" autocomplete="off">
              <button type="button" class="inline-chat-action" id="inline-chat-action" data-inline-action title="Hablar">
                <span class="ica-icon ica-mic" aria-hidden="true">🎙️</span>
                <span class="ica-icon ica-send" aria-hidden="true" hidden>➤</span>
                <span class="ica-waves" aria-hidden="true"><i></i><i></i><i></i></span>
              </button>
            </div>
          </div>`
          : "";
        try {
          const roots = [app, pocket, document.getElementById("pocket"), document.getElementById("app")].filter(Boolean);
          roots.forEach((el) => {
            if (state.panel) {
              el.setAttribute("data-has-panel", "1");
              el.setAttribute("data-panel", String(state.panel));
              try {
                el.setAttribute(
                  "data-profile-type",
                  isCV(p) ? "cv" : "negocio",
                );
              } catch (_) {}
            } else {
              el.removeAttribute("data-has-panel");
              el.removeAttribute("data-panel");
            }
          });
        } catch (_) {}
        app.innerHTML = `${bgHtml}${avatarLayerHtml || ""}<div class="shade"></div>
        ${state.panel
          ? '<button type="button" class="volver-fab" data-go-home title="Volver al inicio" aria-label="Volver">Volver</button>'
          : '<button type="button" class="sound-fab" data-toggle-sound title="Sonido on/off" aria-label="Sonido">' + (state.soundOn === true && state._userUnlockedSound ? "🔊" : "🔇") + '</button>'}
        
        ${!state.panel ? socialIcons(p, (() => { try { return String(p.estilo_marco||"").startsWith("{") ? JSON.parse(p.estilo_marco) : {}; } catch(_){ return {}; } })()) : ""}<header class="head compact"><div class="brand"></div><span class="counter">${state.qr ? "" : `${String(state.index + 1).padStart(2, "0")}/${String(state.profiles.length).padStart(2, "0")}`}</span></header>${apShowMenu ? `<nav class="menu ${menu}">${(() => {
          const items = [];
          items.push(`<button type="button" class="active" data-close>${esc(labM("perfil", "PERFIL"))}</button>`);
          if (showM("chat", p.chat)) items.push(`<button type="button" data-panel="chat">${esc(labM("chat", "PREGUNTAR"))}</button>`);
          if (showM("questions", q)) items.push(`<button type="button" data-panel="questions">${esc(labM("questions", "PREGUNTAS"))}</button>`);
          if (showM("experience", exp)) items.push(`<button type="button" data-panel="experience">${esc(labM("experience", "EXPERIENCIA"))}</button>`);
          if (showM("info", state.qr || phoneOf(p) || (!cv && p.direccion))) items.push(`<button type="button" data-panel="info">${esc(labM("info", "INFORMACIÓN"))}</button>`);
          if (showM("maps", !cv && (p.direccion || p.maps || p.map_lat || (()=>{try{const j=JSON.parse(p.estilo_marco||"{}");return j.map_lat||j.maps;}catch{return 0;}})()))) items.push(`<button type="button" data-panel="maps">${esc(labM("maps", "UBICACIÓN"))}</button>`);
          if (showM("products", pro && !cv)) items.push(`<button type="button" data-panel="products">${esc(labM("products", "PRODUCTOS"))}</button>`);
          if (showM("services", cv && (typeof servicesOf === "function" ? servicesOf(p).length : 0))) items.push(`<button type="button" data-panel="services">${esc(labM("services", "SERVICIOS"))}</button>`);
          if (showM("carta", cartaOn)) items.push(`<button type="button" data-panel="carta">${esc(labM("carta", "CARTA"))}</button>`);
          if (showM("opcion", opActiva && opExtra.tipo !== "carta")) items.push(`<button type="button" data-panel="opcion">${esc(opBtnName)}</button>`);
          if (showM("calendario", p.calendario_activo === true || p.calendario_activo === "true" || styleExtra.calendario_activo)) items.push(`<button type="button" data-panel="calendario">${esc(labM("calendario", "HORARIO"))}</button>`);
          if (showM("valoraciones", p.valoraciones_activo === true || p.valoraciones_activo === "true" || styleExtra.valoraciones_activo)) items.push(`<button type="button" data-panel="valoraciones">${esc(labM("valoraciones", "VALORAR"))}</button>`);
          if (showM("gallery", gal)) items.push(`<button type="button" data-panel="gallery">${esc(labM("gallery", "VIDEOS"))}</button>`);
          // máximo 6 pestañas (perfil + 5) → en total 6 incluyendo PERFIL
          const perfil = items[0];
          const rest = items.slice(1).slice(0, 5);
          return [perfil].concat(rest).join("");
        })()}</nav>` : (apMenuSlot === "chat" ? `<div class="menu-slot-chat" data-panel="chat">💬 Chat</div>` : "")}<section class="content ${menu === "side" ? "shifted" : menu === "side-right" ? "shifted-right" : ""}">${contentBlock}</section>${showInlineChat ? inlineChatHtml : ""}${apShowBotones ? (() => {
          let keys = (btnSlots && btnSlots.length ? btnSlots.slice() : [primaryKey].filter(Boolean)).filter((k) => k && k !== "none" && primaryMap[k]);
          let lay = String(btnLayout || "1g2p").toLowerCase().trim();
          if (lay.includes("2 grande") || lay.includes("dos grande") || lay === "2" || lay === "2g") lay = "2g";
          if (lay.includes("3 grande") || lay === "3" || lay === "3g") lay = "3g";
          // 2 botones visibles → ambos grandes (salvo 1g1p explícito)
          if (keys.length === 2 && lay !== "1g1p") lay = "2g";
          if (keys.length === 3 && (lay === "3g" || lay.includes("3"))) lay = "3g";
          // Solo defaults si el usuario aún no configuró slots en login
          const hasConfiguredSlots = Array.isArray(btnOrder.slots) && btnOrder.slots.length > 0;
          if (!hasConfiguredSlots) {
            if (cv) {
              if (!keys.includes("share_cv")) keys.push("share_cv");
              if (!keys.includes("download_cv")) keys.push("download_cv");
            } else {
              const hasCartaFile = !!(p.url_carta || styleExtra.url_carta);
              if (hasCartaFile) {
                if (!keys.includes("share_carta")) keys.push("share_carta");
                if (!keys.includes("download_carta")) keys.push("download_carta");
              }
            }
          }
          // si carrito activo y no está en slots, no auto-meter (el usuario lo elige en login)
          if (state.qr && !keys.length) return "";
          if (!keys.length) {
            return state.qr ? "" : '<div class="actions"><button type="button" class="action" data-next>Otro perfil</button></div>';
          }
          const btn = (k, idx, isPrimary) => {
            const meta = primaryMap[k] || {};
            const lab = esc(slotLabel(k, idx));
            const cls = "action" + (isPrimary ? " primary" : "");
            if (meta.action === "share_cv")
              return '<button type="button" class="' + cls + '" data-share-cv>' + lab + "</button>";
            if (meta.action === "download_cv")
              return '<button type="button" class="' + cls + '" data-download-cv>' + lab + "</button>";
            if (meta.action === "share_carta")
              return '<button type="button" class="' + cls + '" data-share-carta>' + lab + "</button>";
            if (meta.action === "download_carta")
              return '<button type="button" class="' + cls + '" data-download-carta>' + lab + "</button>";
            const panel = meta.panel || slotPanel(k);
            return (
              '<button type="button" class="' +
              cls +
              '" data-panel="' +
              panel +
              '">' +
              lab +
              "</button>"
            );
          };
          // 1 botón grande = solo el principal a todo el ancho
          if (lay === "1g") {
            return keys[0]
              ? '<div class="actions single">' + btn(keys[0], 0, true) + "</div>"
              : "";
          }
          // 3 botones grandes = 3 botones a todo el ancho, uno debajo del otro
          if (lay === "3g") {
            return (
              '<div class="actions layout-3g single">' +
              keys.slice(0, 3).map((k, i) => btn(k, i, true)).join("") +
              "</div>"
            );
          }
          // 1 grande + 2 pequeños (mitad)
          if (lay === "1g2p") {
            const row = keys.slice(1, 3).map((k, i) => btn(k, i + 1, false)).join("");
            return (
              '<div class="actions layout-1g2p">' +
              (keys[0] ? btn(keys[0], 0, true) : "") +
              (row ? '<div class="actions-row">' + row + "</div>" : "") +
              "</div>"
            );
          }
          // 2 botones grandes apilados
          if (lay === "2g") {
            return (
              '<div class="actions layout-2g" style="display:flex;flex-direction:column;gap:10px;width:100%">' +
              keys
                .slice(0, 2)
                .map((k, i) => {
                  const meta = primaryMap[k] || {};
                  const lab = esc(slotLabel(k, i));
                  if (meta.action === "share_cv")
                    return '<button type="button" class="action primary" style="width:100%;min-height:52px" data-share-cv>' + lab + "</button>";
                  if (meta.action === "download_cv")
                    return '<button type="button" class="action primary" style="width:100%;min-height:52px" data-download-cv>' + lab + "</button>";
                  if (meta.action === "share_carta")
                    return '<button type="button" class="action primary" style="width:100%;min-height:52px" data-share-carta>' + lab + "</button>";
                  if (meta.action === "download_carta")
                    return '<button type="button" class="action primary" style="width:100%;min-height:52px" data-download-carta>' + lab + "</button>";
                  const panel = meta.panel || "none";
                  return (
                    '<button type="button" class="action primary" style="width:100%;min-height:52px" data-panel="' +
                    panel +
                    '">' +
                    lab +
                    "</button>"
                  );
                })
                .join("") +
              "</div>"
            );
          }
          if (lay === "1g1p") {
            return (
              '<div class="actions layout-1g1p">' +
              (keys[0] ? btn(keys[0], 0, true) : "") +
              (keys[1] ? btn(keys[1], 1, false) : "") +
              "</div>"
            );
          }
          if (lay === "2g2p") {
            return (
              '<div class="actions layout-2g2p">' +
              keys.slice(0, 2).map((k, i) => btn(k, i, true)).join("") +
              '<div class="actions-row">' +
              keys.slice(2, 4).map((k, i) => btn(k, i + 2, false)).join("") +
              "</div></div>"
            );
          }
          return (
            '<div class="actions layout-1g2p">' +
            (keys[0] ? btn(keys[0], 0, true) : "") +
            '<div class="actions-row">' +
            keys.slice(1, 3).map((k, i) => btn(k, i + 1, false)).join("") +
            "</div></div>"
          );
        })() : ""}${p.url_audio ? `<audio id="wp-audio" src="${esc(p.url_audio)}" loop preload="auto"  muted></audio>` : ""}<div class="footer">${
          state.qr
            ? ""
            : `<div class="dots">${state.profiles
                .map(
                  (_, i) =>
                    `<button type="button" class="dot ${i === state.index ? "active" : ""}" data-profile="${i}"></button>`,
                )
                .join("")}</div>`
        }<span class="foot-note"></span></div>${
          state.qr
            ? ""
            : `<div class="join"><a href="${REGISTRO_URL}">Registrar</a></div>`
        }${panel(p)}${state.mockup ? `<div class="mockup-modal" id="mockup-ui">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:8px">
            <h3 style="margin:0;font-size:17px">Pon tu diseño</h3>
            <button type="button" class="close" data-close-mockup>×</button>
          </div>
          <p style="font-size:13px;opacity:.9;margin:8px 0 4px"><b>${esc(state.mockup.name)}</b></p>
          <p style="font-size:12px;opacity:.8;margin:0 0 10px">Elige el color del polo, sube tu imagen y mira cómo queda estampado.</p>
          <div class="mockup-colors">${state.mockup.bases.map((b,i) => `<button type="button" class="${i===state.mockup.baseIndex?"on":""}" data-mock-base="${i}">${esc(b.color||("Opción "+(i+1)))}</button>`).join("")}</div>
          <div class="field"><label>Tu diseño (PNG/JPG)</label><input type="file" accept="image/*" id="mockup-design-file"></div>
          <div class="field"><label>Tamaño del estampado</label><input type="range" id="mockup-scale" min="0.5" max="1.8" step="0.05" value="${state.mockup.scale||1}"></div>
          <canvas id="mockup-canvas" width="600" height="600"></canvas>
          <button type="button" class="submit" id="mockup-add-cart" style="margin-top:10px">Añadir al carrito</button>
        </div>` : ""}`;
        finishMedia(__liveMedia);
        try { mountCartFab(p); } catch (_) {}
        bind();
        // Saludo IA al entrar al chat (antes de que escriba el usuario)
        try {
          const _ck = String(p.codigo_cliente || p.codigo || p.id || "x");
          if (!state._saludoDone) state._saludoDone = {};
          let _se = {};
          try {
            if (String(p.estilo_marco || "").startsWith("{")) _se = JSON.parse(p.estilo_marco);
          } catch (_) {}
          const want =
            _se.ia_saludo === true ||
            _se.ia_saludo === "true" ||
            _se.ia_saludo === 1;
          const chatOpen =
            state.panel === "chat" ||
            (!!document.getElementById("inline-chat") &&
              (state.panel === "chat" ||
                (_se.apertura &&
                  (_se.apertura.showChat === true ||
                    _se.apertura.showChat === "true"))));
          if (want && chatOpen && !state._saludoDone[_ck]) {
            state._saludoDone[_ck] = true;
            const nombre = (p.nombre || p.negocio || "").trim() || "nosotros";
            const msg =
              "¡Hola! Bienvenido a " +
              nombre +
              ". ¿En qué te puedo ayudar hoy?";
            setTimeout(() => {
              try {
                const log = document.getElementById("inline-chat-log");
                if (log) {
                  const b = document.createElement("div");
                  b.className = "bubble";
                  b.textContent = msg;
                  log.appendChild(b);
                  log.scrollTop = log.scrollHeight;
                }
                if (window.speechSynthesis && state.soundOn !== false) {
                  const u = new SpeechSynthesisUtterance(msg);
                  u.lang = "es-PE";
                  window.speechSynthesis.speak(u);
                }
                if (!state.chatByCode) state.chatByCode = {};
                if (!state.chatByCode[_ck]) state.chatByCode[_ck] = [];
                state.chatByCode[_ck].push({ role: "assistant", content: msg });
              } catch (_) {}
            }, 500);
          }
        } catch (_) {}
      }
      function bind() {

        // Botón 🛒 global (pedido)
        const openCartBtn = document.getElementById("cart-fab-global");
        if (openCartBtn) {
          openCartBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            state.panel = state.panel === "cart" ? null : "cart";
            state.cartView = "checkout";
            render();
          };
        }
        document.querySelectorAll("[data-open-cart]").forEach((x) => {
          x.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            state.panel = state.panel === "cart" ? null : "cart";
            state.cartView = "checkout";
            render();
          };
        });

        app.querySelectorAll("[data-cal-nav]").forEach((btn) => {
          btn.addEventListener("click", () => {
            const dir = Number(btn.getAttribute("data-cal-nav") || 0);
            const ym = state.calMonth || "";
            const [y, m] = ym.split("-").map(Number);
            const dt = new Date(y, m - 1 + dir, 1);
            state.calMonth =
              dt.getFullYear() + "-" + String(dt.getMonth() + 1).padStart(2, "0");
            state.calDayPick = null;
            render();
          });
        });
        app.querySelectorAll("[data-pub-day]").forEach((btn) => {
          btn.addEventListener("click", () => {
            state.calDayPick = btn.getAttribute("data-pub-day");
            render();
          });
        });

        app.querySelectorAll("[data-rate-star]").forEach((btn) => {
          btn.addEventListener("click", () => {
            const n = Number(btn.getAttribute("data-rate-star") || 5);
            const hid = app.querySelector("#rate-puntaje");
            if (hid) hid.value = String(n);
            app.querySelectorAll("[data-rate-star]").forEach((b) => {
              const v = Number(b.getAttribute("data-rate-star") || 0);
              b.classList.toggle("on", v <= n);
            });
          });
        });
        app.querySelector("#valoracion-form")?.addEventListener("submit", async (e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          const p = state.profiles[state.index];
          try {
            const res = await fetch(EDGE, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "public_add_valoracion",
                codigo_cliente: p.codigo_cliente,
                nombre: fd.get("nombre"),
                puntaje: Number(fd.get("puntaje") || 5),
                comentario: fd.get("comentario") || "",
              }),
            }).then((r) => r.json());
            if (res.error) throw new Error(res.error);
            alert("¡Gracias por tu valoración!");
            // recargar lista
            const again = await fetch(EDGE, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "public_profile", codigo_cliente: p.codigo_cliente }),
            }).then((r) => r.json());
            state.valoraciones = again.valoraciones || [];
            if (again.profile) {
              state.profiles[state.index] = { ...state.profiles[state.index], ...again.profile };
            }
            render();
          } catch (err) {
            alert(err.message || "No se pudo enviar");
          }
        });

        (pocket || app).querySelector("[data-copy-coords]")?.addEventListener("click", async () => {
          const t = (document.getElementById("map-coords-text")?.textContent || "").trim();
          if (!t) return;
          try {
            await navigator.clipboard.writeText(t);
            alert("Coordenadas copiadas: " + t);
          } catch (_) {
            alert(t);
          }
        });

        // delegated-carta
        if (!pocket._cartaBound) {
          pocket._cartaBound = true;
          pocket.addEventListener("click", async (ev) => {
            const dlC = ev.target.closest("[data-download-carta]");
            const shC = ev.target.closest("[data-share-carta]");
            const dlV = ev.target.closest("[data-download-cv]");
            const shV = ev.target.closest("[data-share-cv]");
            const p = state.profiles[state.index] || {};
            const cartaUrl = p.url_carta || (() => { try { return JSON.parse(p.estilo_marco||"{}").url_carta; } catch { return ""; } })();
            const cvUrl = p.url_cv || p.urlcv || p.cv_url || "";
            if (dlC) {
              ev.preventDefault();
              if (!cartaUrl) return alert("No hay carta subida. En Medios elige tipo Carta y sube JPG/PNG/PDF.");
              try {
                const res = await fetch(cartaUrl, { mode: "cors" });
                const blob = await res.blob();
                const a = document.createElement("a");
                a.href = URL.createObjectURL(blob);
                a.download = "carta." + ((cartaUrl.split(".").pop() || "jpg").split("?")[0]);
                document.body.appendChild(a);
                a.click();
                a.remove();
              } catch (_) {
                const a = document.createElement("a");
                a.href = cartaUrl;
                a.target = "_blank";
                a.rel = "noopener";
                a.download = "carta";
                a.click();
              }
              return;
            }
            if (shC) {
              ev.preventDefault();
              if (!cartaUrl) return alert("No hay carta subida");
              try { await navigator.share({ title: "Carta", url: cartaUrl }); }
              catch { try { await navigator.clipboard.writeText(cartaUrl); alert("Enlace copiado"); } catch { window.open(cartaUrl, "_blank"); } }
              return;
            }
            if (dlV) {
              ev.preventDefault();
              if (!cvUrl) return alert("No hay curriculum");
              window.open(cvUrl, "_blank");
              return;
            }
            if (shV) {
              ev.preventDefault();
              if (!cvUrl) {
                if (typeof appAlert === "function") void appAlert("No hay curriculum para compartir");
                else alert("No hay curriculum");
                return;
              }
              try {
                const res = await fetch(cvUrl);
                const blob = await res.blob();
                const name =
                  (cvUrl.split("/").pop() || "curriculum.pdf").split("?")[0] ||
                  "curriculum.pdf";
                const file = new File([blob], name, {
                  type: blob.type || "application/pdf",
                });
                if (navigator.canShare && navigator.canShare({ files: [file] })) {
                  await navigator.share({
                    title: "Curriculum",
                    files: [file],
                  });
                } else if (navigator.share) {
                  await navigator.share({ title: "Curriculum", url: cvUrl });
                } else {
                  const a = document.createElement("a");
                  a.href = URL.createObjectURL(blob);
                  a.download = name;
                  a.click();
                  if (typeof appAlert === "function")
                    void appAlert("Archivo listo para guardar/compartir");
                }
              } catch (err) {
                try {
                  await navigator.clipboard.writeText(cvUrl);
                  if (typeof appAlert === "function")
                    void appAlert("No se pudo compartir el archivo. Enlace copiado.");
                  else alert("Enlace copiado");
                } catch {
                  window.open(cvUrl, "_blank");
                }
              }
            }
          });
        }

        // Sonido: no silenciar en bind (finishMedia controla autoplay)
        const syncSoundIcon = () => {
          const v = app.querySelector("#wp-bg-video") || app.querySelector("video.background");
          const a = app.querySelector("#wp-audio");
          const btn = app.querySelector("[data-toggle-sound]");
          const playingLoud =
            (v && !v.muted && !v.paused) || (a && !a.muted && !a.paused);
          const on = state.soundOn === true || playingLoud;
          if (btn) {
            btn.textContent = on ? "🔊" : "🔇";
            btn.classList.toggle("needs-tap", !on);
          }
        };
        const applySound = (force) => {
          const v = app.querySelector("#wp-bg-video") || app.querySelector("video.background") || pocket.querySelector("video");
          const a = app.querySelector("#wp-audio");
          const on = state.soundOn === true;
          if (v) {
            v.muted = !on;
            v.volume = 1;
            if (on) {
              const pr = v.play();
              if (pr && pr.catch) pr.catch(function () {});
            }
          }
          if (a) {
            a.muted = !on;
            a.volume = 1;
            if (on) {
              const pr = a.play();
              if (pr && pr.catch) pr.catch(function () {});
            } else a.pause();
          }
          syncSoundIcon();
        };
        // solo icono; NO mutear aquí (evita apagar el audio que finishMedia activó)
        syncSoundIcon();
        setTimeout(syncSoundIcon, 400);
        setTimeout(syncSoundIcon, 1200);
        const hideUnlockOverlay = () => {
          const ov = app.querySelector("[data-unlock-sound]");
          if (ov) ov.remove();
        };
        app.querySelector("[data-unlock-sound]")?.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          enableSoundNow();
          hideUnlockOverlay();
          setTimeout(syncSoundBtn, 200);
          setTimeout(syncSoundBtn, 1000);
        });
        app.querySelector("[data-toggle-sound]")?.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (isVideoAudible() || (state.soundOn === true && state._userUnlockedSound)) {
            // apagar
            state.soundOn = false;
            state._userUnlockedSound = false;
            const v = app.querySelector("#wp-bg-video") || app.querySelector("video.background");
            const a = app.querySelector("#wp-audio");
            if (v) {
              v.muted = true;
              v.setAttribute("muted", "");
            }
            if (a) {
              a.muted = true;
              a.pause();
            }
            syncSoundBtn();
            armUnlockSound();
          } else {
            enableSoundNow();
            hideUnlockOverlay();
            setTimeout(syncSoundBtn, 200);
            setTimeout(syncSoundBtn, 1000);
          }
        });

        app.querySelectorAll("[data-carta-qty]").forEach((btn) => {
          btn.onclick = () => {
            const id = btn.getAttribute("data-id");
            const dir = btn.getAttribute("data-carta-qty");
            if (!id) return;
            state.cartaCart = state.cartaCart || {};
            state.cartaMeta = state.cartaMeta || {};
            const prAttr = btn.getAttribute("data-precio");
            if (prAttr !== null && prAttr !== "" && !Number.isNaN(Number(prAttr))) {
              state.cartaMeta[id] = { precio: Number(prAttr) };
            }
            const cur = state.cartaCart[id] || 0;
            state.cartaCart[id] = Math.max(0, cur + (dir === "+" ? 1 : -1));
            if (state.cartaCart[id] === 0) delete state.cartaCart[id];
            render();
          };
        });
        app.querySelector("[data-wa-carta]")?.addEventListener("click", () => {
          const p = state.profiles[state.index];
          const tel = phoneOf(p);
          if (!tel) return alert("Sin WhatsApp");
          const entries = Object.entries(state.cartaCart || {}).filter(([, q]) => q > 0);
          let body;
          if (entries.length) {
            const meta = state.cartaMeta || {};
            let total = 0;
            const lines = entries.map(([n, q]) => {
              const pr = meta[n] && meta[n].precio != null ? Number(meta[n].precio) : null;
              if (pr != null) total += pr * q;
              return pr != null
                ? "• " + n + " × " + q + " = S/ " + (pr * q).toFixed(2)
                : "• " + n + " × " + q;
            });
            body =
              "Hola, quiero de la carta del día:\n" +
              lines.join("\n") +
              (total > 0 ? "\n\nTOTAL: S/ " + total.toFixed(2) : "") +
              "\n\n(Adjunto comprobante de pago si aplica)";
          } else {
            body = "Hola, quiero pedir de la carta del día:\n" + (p.carta_diaria_texto || "") + "\n\n(Adjunto comprobante de pago si aplica)";
          }
          const text = encodeURIComponent(body);
          window.open("https://wa.me/" + (tel.startsWith("51") ? tel : "51" + tel) + "?text=" + text, "_blank");
        });

        const refreshCartUI = () => {
          const p = state.profiles[state.index] || {};
          const items = typeof products === "function" ? products(p) : [];
          const monSymbol = (m) => (m === "USD" || m === "$" ? "$" : m === "EUR" || m === "€" ? "€" : "S/");
          let mainMon = "PEN";
          const total = Object.entries(state.cart || {}).reduce((n, [id, qty]) => {
            const meta = (state.cartMeta || {})[id];
            let precio = meta && meta.precio != null ? Number(meta.precio) : null;
            let mon = meta && meta.moneda ? meta.moneda : null;
            if (precio == null || !mon) {
              const prod = items.find((x) => {
                const m = parseProductMeta(x);
                return m.name === id || (x.descripcion || "") === id || (x.nombre || "") === id;
              });
              if (prod) {
                if (precio == null) precio = Number(prod.precio || 0);
                if (!mon) mon = prod.moneda || "PEN";
                state.cartMeta = state.cartMeta || {};
                state.cartMeta[id] = {
                  ...(state.cartMeta[id] || {}),
                  precio: precio,
                  moneda: mon,
                  name: id,
                };
              }
            }
            if (mon) mainMon = mon;
            return n + Number(qty || 0) * Number(precio || 0);
          }, 0);
          const n = cartCount();
          const mon = monSymbol(mainMon);
          const tot = app.querySelector("#cart-total-label");
          if (tot) tot.textContent = mon + " " + total.toFixed(2);
          const lines = app.querySelector("#cart-lines");
          if (lines) {
            lines.innerHTML = n
              ? Object.entries(state.cart || {})
                  .map(([id, q]) => "<div>• " + esc(id) + " × " + q + "</div>")
                  .join("")
              : '<span style="opacity:.7">Toca Pedir en un producto</span>';
          }
          const wa = app.querySelector("[data-order]");
          if (wa) wa.textContent = "📱 Pedir por WhatsApp" + (n ? " (" + n + ")" : "");
          app.querySelectorAll("[data-qty-label]").forEach((el) => {
            const id = el.getAttribute("data-qty-label");
            const q = state.cart[id] || 0;
            if (el.tagName === "SPAN" && !el.classList.contains("prod-qty-badge"))
              el.textContent = String(q);
            else el.textContent = q ? "En pedido: " + q : "Toca Pedir para agregar";
          });
          try { mountCartFab(p); } catch (_) {}
        };
        const changeCartQty = (window.__wpChangeCartQty = (id, delta, opts) => {
          opts = opts || {};
          if (!id) return;
          id = String(id).trim();
          const sc = app.querySelector("#cart-scroll");
          const top = sc ? sc.scrollTop : 0;
          state.cart = state.cart || {};
          state.cartMeta = state.cartMeta || {};
          const p = state.profiles[state.index] || {};
          const prod = (typeof products === "function" ? products(p) : []).find((x) => {
            const m = parseProductMeta(x);
            return m.name === id || String(x.descripcion || "").split("@@MOCKUP@@")[0].trim() === id || String(x.nombre || "") === id;
          });
          let precio = opts.precio != null && opts.precio !== "" ? Number(opts.precio) : null;
          let moneda = opts.moneda || null;
          let stock = opts.stock != null && opts.stock !== "" ? Number(opts.stock) : null;
          if (prod) {
            const m = parseProductMeta(prod);
            if (precio == null) precio = Number(prod.precio != null ? prod.precio : m.precio || 0);
            if (!moneda) moneda = prod.moneda || m.moneda || "PEN";
            if (stock == null && prod.stock != null && prod.stock !== "") stock = Number(prod.stock);
          }
          if (precio == null) precio = (state.cartMeta[id] && state.cartMeta[id].precio) || 0;
          if (!moneda) moneda = (state.cartMeta[id] && state.cartMeta[id].moneda) || "PEN";
          const cur = Number(state.cart[id] || 0);
          let next = cur + Number(delta || 0);
          if (next < 0) next = 0;
          if (stock != null && !Number.isNaN(stock) && next > stock) {
            next = stock;
            try {
              if (window.appAlert) appAlert("Solo hay " + stock + " en stock.");
              else alert("Solo hay " + stock + " en stock.");
            } catch (_) {
              alert("Solo hay " + stock + " en stock.");
            }
          }
          if (next === 0) delete state.cart[id];
          else state.cart[id] = next;
          let costo = opts.costo != null && opts.costo !== "" ? Number(opts.costo) : null;
          if (costo == null && prod) {
            costo = Number(prod.precio_compra != null ? prod.precio_compra : 0);
          }
          state.cartMeta[id] = {
            ...(state.cartMeta[id] || {}),
            precio: Number(precio || 0),
            moneda: moneda,
            name: id,
            stock: stock,
            precio_compra: Number(costo || 0),
            costo: Number(costo || 0),
          };
          // re-render panel para desactivar botones y total real
          state.cartSnapTop = top;
          render();
        });
        // Click en Pedir / Quitar (por botón, siempre re-asignado tras render)
        app.querySelectorAll("[data-pedir]").forEach((btn) => {
          btn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (btn.disabled) return;
            const id = btn.getAttribute("data-pedir");
            changeCartQty(id, 1, {
              precio: btn.getAttribute("data-precio"),
              moneda: btn.getAttribute("data-moneda"),
              stock: btn.getAttribute("data-stock"),
            });
          };
        });
        app.querySelectorAll("[data-quitar]").forEach((btn) => {
          btn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            const id = btn.getAttribute("data-quitar");
            changeCartQty(id, -1, {
              precio: btn.getAttribute("data-precio"),
              moneda: btn.getAttribute("data-moneda"),
              stock: btn.getAttribute("data-stock"),
            });
          };
        });
        app.querySelectorAll("[data-qty]").forEach((btn) => {
          btn.onclick = () => {
            const id = btn.getAttribute("data-id");
            const dir = btn.getAttribute("data-qty");
            changeCartQty(id, dir === "+" ? 1 : -1);
          };
        });
        // restaurar posición vertical tipo TikTok
        {
          const sc = app.querySelector("#cart-scroll");
          if (sc && state.cartSnapTop) {
            sc.scrollTop = state.cartSnapTop;
          }
          sc?.addEventListener(
            "scroll",
            () => {
              state.cartSnapTop = sc.scrollTop;
            },
            { passive: true },
          );
        }

        // Buscador sala de productos: 1 botón (🎙️ vacío / ➤ con texto)
        {
          const inp = app.querySelector("#cart-search");
          const btn = app.querySelector("#cart-search-btn");
          const sc = app.querySelector("#cart-scroll");
          const norm = (s) =>
            String(s || "")
              .trim()
              .toLowerCase()
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "");
          const applyFilter = () => {
            if (!sc) return;
            const q = norm(inp && inp.value);
            sc.querySelectorAll(
              "article.card.product, article.product, .card.product, [data-product-name], .cart-line-row, .product-row",
            ).forEach((el) => {
              const t = norm(el.getAttribute("data-product-name") || el.textContent || "");
              const show = !q || t.includes(q);
              el.classList.toggle("cart-hidden", !show);
              el.style.display = show ? "" : "none";
            });
          };
          const syncBtn = () => {
            if (!btn) return;
            const v = ((inp && inp.value) || "").trim();
            if (v) {
              btn.textContent = "➤";
              btn.title = "Buscar";
              btn.classList.add("is-send");
              btn.style.background = "#38bdf8";
              btn.style.color = "#0f172a";
            } else {
              btn.textContent = "🎙️";
              btn.title = "Hablar";
              btn.classList.remove("is-send");
              btn.style.background = "#14b8a6";
              btn.style.color = "#052e16";
            }
          };
          if (inp) {
            inp.addEventListener("input", () => {
              syncBtn();
              applyFilter();
            });
            inp.addEventListener("search", applyFilter);
            inp.addEventListener("keydown", (e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                applyFilter();
              }
            });
            inp.addEventListener("click", (e) => e.stopPropagation());
            syncBtn();
          }
          btn?.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            const v = ((inp && inp.value) || "").trim();
            if (v) {
              applyFilter();
              return;
            }
            const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!SR) {
              alert("Tu navegador no soporta dictado de voz.");
              return;
            }
            try {
              const rec = new SR();
              rec.lang = "es-PE";
              rec.interimResults = false;
              btn.textContent = "…";
              btn.style.background = "#f59e0b";
              rec.onresult = (ev) => {
                const t =
                  (ev.results &&
                    ev.results[0] &&
                    ev.results[0][0] &&
                    ev.results[0][0].transcript) ||
                  "";
                if (inp && t) {
                  inp.value = t;
                  syncBtn();
                  // al segundo se filtra / "envía"
                  setTimeout(() => applyFilter(), 1000);
                }
              };
              rec.onerror = () => {
                syncBtn();
              };
              rec.onend = () => {
                syncBtn();
              };
              rec.start();
            } catch (err) {
              alert(err.message || String(err));
              syncBtn();
            }
          });
        }
        // rueda del mouse: un producto por vez
        {
          const sc = app.querySelector("#cart-scroll");
          if (sc && !sc._wheelBound) {
            sc._wheelBound = true;
            let lock = false;
            sc.addEventListener(
              "wheel",
              (ev) => {
                if (lock) return;
                const h = sc.clientHeight || 1;
                if (Math.abs(ev.deltaY) < 8) return;
                ev.preventDefault();
                lock = true;
                const dir = ev.deltaY > 0 ? 1 : -1;
                const next = Math.round(sc.scrollTop / h) * h + dir * h;
                sc.scrollTo({ top: Math.max(0, next), behavior: "smooth" });
                state.cartSnapTop = next;
                setTimeout(() => { lock = false; }, 420);
              },
              { passive: false },
            );
          }
        }

        app.querySelectorAll("img[data-zoom-src]").forEach((img) => {
          img.style.cursor = "zoom-in";
          img.style.pointerEvents = "auto";
          img.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            const src = img.getAttribute("data-zoom-src");
            if (!src) return;
            const old = document.querySelector("#pocket .lightbox");
            if (old) old.remove();
            const box = document.createElement("div");
            box.className = "lightbox";
            box.setAttribute("role", "dialog");
            const im = document.createElement("img");
            im.src = src;
            im.alt = "Producto";
            box.appendChild(im);
            box.onclick = () => box.remove();
            (document.getElementById("pocket") || document.body).appendChild(box);
          };
        });
        app.querySelectorAll("[data-open-mockup]").forEach((btn) => {
          btn.addEventListener("click", () => {
            const p = state.profiles[state.index];
            const items = products(p).map((x, i) =>
              typeof x === "string" ? { descripcion: x, precio: 15 } : x,
            );
            const idx = Number(btn.getAttribute("data-open-mockup"));
            const raw = items[idx];
            const meta = parseProductMeta(raw);
            if (!meta.mockup || !meta.mockup.bases || !meta.mockup.bases.length) {
              alert("Este producto no tiene plantillas de mockup");
              return;
            }
            state.mockup = {
              name: meta.name,
              precio: Number(raw.precio || 0),
              moneda: raw.moneda || "PEN",
              bases: meta.mockup.bases,
              baseIndex: 0,
              designUrl: null,
              scale: 1,
              offsetY: 1,
            };
            render();
            setTimeout(() => renderMockupCanvas(), 50);
          });
        });

        app.querySelector("[data-close-mockup]")?.addEventListener("click", () => {
          state.mockup = null;
          render();
        });
        app.querySelectorAll("[data-mock-base]").forEach((b) => {
          b.addEventListener("click", () => {
            if (!state.mockup) return;
            state.mockup.baseIndex = Number(b.getAttribute("data-mock-base")) || 0;
            render();
            setTimeout(() => renderMockupCanvas(), 50);
          });
        });
        app.querySelector("#mockup-design-file")?.addEventListener("change", (ev) => {
          const f = ev.target.files?.[0];
          if (!f || !state.mockup) return;
          state.mockup.designUrl = URL.createObjectURL(f);
          state.mockup.designFile = f;
          renderMockupCanvas();
        });
        app.querySelector("#mockup-scale")?.addEventListener("input", (ev) => {
          if (!state.mockup) return;
          state.mockup.scale = Number(ev.target.value) || 1;
          renderMockupCanvas();
        });
        app.querySelector("#mockup-add-cart")?.addEventListener("click", async () => {
          const m = state.mockup;
          if (!m) return;
          if (!m.designUrl) {
            alert("Sube tu diseño primero");
            return;
          }
          const canvas = document.getElementById("mockup-canvas");
          if (!canvas) return;
          try {
            const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
            let mockupUrl = dataUrl;
            const API = (typeof EDGE !== "undefined" && EDGE) || window.WEBPOCKET_API || "";
            if (API) {
              const up = await fetch(API, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  action: "upload_mockup",
                  fileData: dataUrl,
                  fileName: "mockup-" + Date.now() + ".jpg",
                }),
              }).then((r) => r.json());
              if (up.url || up.publicUrl) mockupUrl = up.url || up.publicUrl;
            }
            const color = (m.bases[m.baseIndex] || {}).color || "";
            const lineId = m.name + (color ? " · " + color : "") + " · custom";
            state.cart = state.cart || {};
            state.cartMeta = state.cartMeta || {};
            state.cart[lineId] = (state.cart[lineId] || 0) + 1;
            state.cartMeta[lineId] = {
              precio: m.precio,
              moneda: m.moneda,
              color,
              mockupUrl,
              name: m.name,
            };
            state.mockup = null;
            alert("Mockup añadido al carrito");
            render();
          } catch (e) {
            alert(e.message || "No se pudo generar el mockup");
          }
        });

        app.querySelector("[data-order]")?.addEventListener("click", async () => {
          const p = state.profiles[state.index];
          const tel = phoneOf(p);
          const entries = Object.entries(state.cart || {}).filter(([, q]) => q > 0);
          if (!entries.length) return alert("Elige cantidad de al menos un producto");
          if (!tel) return alert("Sin WhatsApp");
          const items = products(p);
          const monSym = (m) => (m === "USD" ? "$" : m === "EUR" ? "€" : "S/");
          const lines = entries.map(([n, q]) => {
            const meta = (state.cartMeta || {})[n];
            const prod = items.find((x) => parseProductMeta(x).name === n || x.descripcion === n);
            const precio = meta?.precio != null ? meta.precio : Number(prod?.precio || 0);
            const mon = monSym(meta?.moneda || prod?.moneda);
            let line = `• ${n} × ${q} (${mon}${Number(precio).toFixed(2)})`;
            if (meta?.mockupUrl && String(meta.mockupUrl).startsWith("http")) {
              line += `\n  Foto mockup: ${meta.mockupUrl}`;
            } else if (prod?.foto && String(prod.foto).startsWith("http")) {
              line += `\n  Foto: ${prod.foto}`;
            }
            return line;
          });
          const text = encodeURIComponent(
            `Hola, quiero este pedido desde WebPocket (%0A${title(p)}):%0A%0A` +
              lines.join("%0A") +
              `%0A%0A(Abre los enlaces de foto para ver el diseño)`,
          );
          // encodeURIComponent already on full text - fix double encoding
          const body =
            "Hola, quiero este pedido desde WebPocket (" +
            title(p) +
            "):\n\n" +
            lines.join("\n") +
            "\n\n(Abre los enlaces de foto para ver el diseño)";
          window.open(
            "https://wa.me/" +
              (tel.startsWith("51") ? tel : "51" + tel) +
              "?text=" +
              encodeURIComponent(body),
            "_blank",
          );
          try {
            if (typeof send === "function") {
              const items = entries.map(([n, q]) => {
                const meta = (state.cartMeta || {})[n] || {};
                return {
                  producto: n,
                  cantidad: q,
                  precio: Number(meta.precio || 0),
                  total: Number(meta.precio || 0) * q,
                };
              });
              send({
                action: "pedido_registrar",
                codigo: p.codigo_cliente || p.codigo,
                canal: "whatsapp",
                nombre_cliente: (typeof nombreCliente !== "undefined" ? nombreCliente : "") || "",
                items,
              }).catch(function () {});
            }
          } catch (_) {}
        });

        // Confirmar pago + formulario nombre (delegación: siempre funciona)
        const bindCartPayOnce = () => {
          if (window._wpCartPayBound) return;
          window._wpCartPayBound = true;
          document.addEventListener(
            "click",
            async (e) => {
              const t = e.target;
              if (!t || !t.closest) return;

              const btnPagar = t.closest("[data-cart-pagar]");
              if (btnPagar) {
                e.preventDefault();
                e.stopPropagation();
                const entries = Object.entries(state.cart || {}).filter(([, q]) => q > 0);
                if (!entries.length) {
                  if (typeof appAlert === "function") void appAlert("El carrito está vacío"); else alert("El carrito está vacío");
                  return;
                }
                state.showNamePay = true;
                state.panel = "cart";
                state.cartView = "checkout";
                render();
                setTimeout(() => {
                  try {
                    const inp = document.getElementById("name-pay-input");
                    if (inp) inp.focus();
                  } catch (_) {}
                }, 80);
                return;
              }

              const btnCancel = t.closest("[data-name-pay-cancel]");
              if (btnCancel) {
                e.preventDefault();
                e.stopPropagation();
                state.showNamePay = false;
                render();
                return;
              }

              const btnSend = t.closest("[data-name-pay-send]");
              if (!btnSend) return;
              e.preventDefault();
              e.stopPropagation();
              const p = state.profiles[state.index] || {};
              const input = document.getElementById("name-pay-input");
              const nombreCliente = String((input && input.value) || "").trim();
              if (nombreCliente) {
                try { localStorage.setItem("wp_buyer_name", nombreCliente); } catch (_) {}
              }
              if (!nombreCliente) {
                if (typeof appAlert === "function")
                  void appAlert("Escribe tu nombre para identificar el pedido.");
                else alert("Escribe tu nombre para identificar el pedido.");
                return;
              }
              const entries = Object.entries(state.cart || {}).filter(([, q]) => q > 0);
              if (!entries.length) {
                state.showNamePay = false;
                render();
                return;
              }
              try {
                btnSend.disabled = true;
                btnSend.textContent = "Enviando…";
                const items = entries.map(([n, q]) => {
                  const meta = (state.cartMeta || {})[n] || {};
                  const precio = Number(meta.precio || 0);
                  return {
                    producto: n,
                    cantidad: q,
                    precio: precio,
                    total: precio * q,
                    moneda: meta.moneda || "PEN",
                    costo: Number(meta.costo != null ? meta.costo : meta.precio_compra || 0),
                  };
                });
                if (typeof send !== "function") throw new Error("Sin conexión al servidor");
                const codigo = String(p.codigo_cliente || p.codigo || "").trim();
                if (!codigo || codigo.startsWith("demo-")) {
                  throw new Error("Este perfil de ejemplo no guarda ventas reales.");
                }
                const notasPedido = String(
                  (document.getElementById("name-pay-notes") || {}).value || "",
                ).trim();
                const r = await send({
                  action: "pedido_registrar",
                  codigo: codigo,
                  codigo_cliente: codigo,
                  canal: "carrito",
                  nombre_cliente: nombreCliente,
                  notas: notasPedido,
                  descripcion_pedido: notasPedido,
                  items,
                });
                if (r && r.ok === false) {
                  throw new Error(r.error || "No se pudo guardar el pedido");
                }
                state.cart = {};
                state.cartMeta = {};
                window.__wpSessionCart = {};
                window.__wpSessionCartMeta = {};
                state.showNamePay = false;
                state.cartView = "cart";
                try {
                  mountCartFab(p);
                  saveCartState(p);
                } catch (_) {}
                void appAlert("Pedido enviado. El negocio lo verá en Pedidos.");
                state.panel = null;
                render();
              } catch (err) {
                console.error("pagar", err);
                if (typeof appAlert === "function") void appAlert(err.message || "No se pudo registrar el pedido");
                try {
                  btnSend.disabled = false;
                  btnSend.textContent = "Enviar";
                } catch (_) {}
              }
            },
            true,
          );
        };
        bindCartPayOnce();

        app.querySelector("[data-seguir-comprando]")?.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          state.panel = null;
          state.cartView = "cart";
          try { mountCartFab(state.profiles[state.index]); } catch (_) {}
          render();
        });
        app.querySelectorAll("[data-cart-view]").forEach((b) => {
          b.addEventListener("click", (e) => {
            e.preventDefault();
            state.cartView = b.getAttribute("data-cart-view") || "cart";
            state.panel = "products";
            render();
          });
        });
        app.querySelectorAll("[data-pay]").forEach((btn) => {
          btn.addEventListener("click", () => {
            const modo = btn.getAttribute("data-pay") || "yape";
            const p = state.profiles[state.index];
            const tel = phoneOf(p);
            const entries = Object.entries(state.cart || {}).filter(([, q]) => q > 0);
            if (!entries.length) {
                  if (typeof appAlert === "function") void appAlert("El carrito está vacío");
                  else alert("El carrito está vacío");
                  return;
                }
            let total = 0;
            const lines = entries.map(([n, q]) => {
              const meta = (state.cartMeta || {})[n];
              const precio = meta && meta.precio != null ? Number(meta.precio) : 0;
              total += precio * q;
              return "• " + n + " × " + q + " (S/ " + precio.toFixed(2) + ")";
            });
            const payLabel = modo === "yape" ? "YAPE" : "EFECTIVO";
            const msg =
              "Pedido WebPocket (" +
              title(p) +
              ")\nPago: " +
              payLabel +
              "\n\n" +
              lines.join("\n") +
              "\n\nTOTAL: S/ " +
              total.toFixed(2);
            // msg uses JS escaped newlines
            const msg2 =
              "Pedido WebPocket (" +
              title(p) +
              ")\nPago: " +
              payLabel +
              "\n\n" +
              lines.join("\n") +
              "\n\nTOTAL: S/ " +
              total.toFixed(2);
            if (tel) {
              window.open(
                "https://wa.me/" +
                  (tel.startsWith("51") ? tel : "51" + tel) +
                  "?text=" +
                  encodeURIComponent(
                    [
                      "Pedido WebPocket (" + title(p) + ")",
                      "Pago: " + payLabel,
                      "",
                      lines.join("\n"),
                      "",
                      "TOTAL: S/ " + total.toFixed(2),
                    ].join("\n")
                  ),
                "_blank",
              );
            } else alert("Sin WhatsApp en el perfil");
          });
        });

        const showTypingDots = () => {
          try {
            const log = app.querySelector("#inline-chat-log") || app.querySelector(".inline-chat-log") || app.querySelector(".chat-log");
            if (!log) return;
            let el = document.getElementById("chat-typing");
            if (el) el.remove();
            el = document.createElement("div");
            el.id = "chat-typing";
            el.className = "typing-dots";
            el.setAttribute("aria-label", "Escribiendo");
            el.innerHTML = "<span></span><span></span><span></span>";
            // chat log is prepend style sometimes
            if (log.firstChild) log.insertBefore(el, log.firstChild);
            else log.appendChild(el);
            try { log.scrollTop = 0; } catch (_) {}
          } catch (_) {}
        };
        const hideTypingDots = () => {
          try {
            const el = document.getElementById("chat-typing");
            if (el) el.remove();
          } catch (_) {}
        };
        const pushInline = (role, text) => {
          if (role === "me" || role === "user") {
            try {
              if (window.speechSynthesis) window.speechSynthesis.cancel();
            } catch (_) {}
          } else {
            try { hideTypingDots(); } catch (_) {}
            try {
              if (text) avatarOnReply(text, state._ttsAudio || null);
            } catch (_) {}
          }
          const log =
            app.querySelector("#inline-chat-log") ||
            app.querySelector(".inline-chat-log") ||
            app.querySelector(".chat-log");
          if (!log) return;
          const div = document.createElement("div");
          div.className = "bubble" + (role === "user" ? " me" : "");
          div.textContent = text;
          log.prepend(div);
        };
        
                const cleanForSpeech = (t) =>
          String(t || "")
            .replace(/[✔️☑️☑✓✔]/g, "")
            .replace(/[🛒🏠🎙️🔊🔇📷📸🎥▶◄►●■□→←↑↓]/g, "")
            .replace(/[\u{1F300}-\u{1FAFF}]/gu, "")
            .replace(/S\/\s*/g, "soles ")
            .replace(/\s+/g, " ")
            .trim();


            
        const speakBrowser = (text, voicePref) => {
          try {
            if (!window.speechSynthesis) return;
            const u = new SpeechSynthesisUtterance(cleanForSpeech(text));
            u.lang = "es-PE";
            try {
              avatarOnReply(text, null);
            } catch (_) {}
            u.onend = function () {
              try {
                stopAvatarAnim();
                setAvatarFrame(AVATAR_FILES.idle);
              } catch (_) {}
            };
            u.onerror = function () {
              try {
                stopAvatarAnim();
                setAvatarFrame(AVATAR_FILES.idle);
              } catch (_) {}
            };
            const voices = window.speechSynthesis.getVoices() || [];
            const isFemale =
              /mujer|female|woman|nova|shimmer|alloy|fable/i.test(voicePref || "");
            const isAlegre = /alegre|happy|cheerful/i.test(voicePref || "");
            const isProf = /profesional|pro|onyx/i.test(voicePref || "");
            let pick =
              voices.find((v) => {
                const n = (v.name + " " + v.lang).toLowerCase();
                if (!/es/.test(v.lang || "")) return false;
                if (isFemale)
                  return /female|woman|samantha|paulina|monica|zira|mujer/.test(n);
                return /male|man|jorge|diego|pablo|hombre/.test(n);
              }) ||
              voices.find((v) => /es/.test(v.lang || "")) ||
              voices[0];
            if (pick) u.voice = pick;
            u.pitch = isAlegre ? 1.25 : isProf ? 0.95 : 1.05;
            u.rate = isAlegre ? 1.08 : isProf ? 0.92 : 1;
            window.speechSynthesis.cancel();
            window.speechSynthesis.speak(u);
          } catch (_) {}
        };

                const speakReply = async (text) => {
          try {
            try {
              if (window.speechSynthesis) window.speechSynthesis.cancel();
            } catch (_) {}
            if (state._ttsAudio) {
              try { state._ttsAudio.pause(); } catch (_) {}
              state._ttsAudio = null;
            }
            try {
              stopAvatarAnim();
              setAvatarFrame(AVATAR_FILES.idle);
            } catch (_) {}
            const clean = cleanForSpeech(text);
            if (!clean) return;

            try {
              let vozCfg = "";
              const em = String((p && p.estilo_marco) || "");
              if (em.startsWith("{")) {
                const j = JSON.parse(em);
                vozCfg = String(j.ia_voz || "");
                if (j.ia_sin_voz === true || j.ia_sin_voz === "true") vozCfg = "silencio";
              }
              if (p && p.ia_voz) vozCfg = String(p.ia_voz);
              if (vozCfg === "silencio" || vozCfg === "mute" || vozCfg === "sin_voz") {
                try { avatarOnReply(text, null); } catch (_) {}
                return;
              }
            } catch (_) {}
            
            let voicePref = "nova";
            try {
              const j = JSON.parse(
                (state.profiles[state.index] || {}).estilo_marco || "{}",
              );
              voicePref = j.ia_voz || j.ia_voice || (state.profiles[state.index] || {}).ia_voz || "nova";
            } catch (_) {}
            
            const voiceMap = {
              mujer: "nova", mujer_alegre: "shimmer", mujer_profesional: "nova",
              hombre: "echo", hombre_alegre: "echo", hombre_profesional: "onyx",
              nova: "nova", shimmer: "shimmer", alloy: "alloy", echo: "echo", onyx: "onyx", fable: "fable",
            };
            const vKey = String(voicePref || "nova").toLowerCase().trim();
            const voiceId = voiceMap[vKey] || voiceMap[vKey.replace(/\s+/g, "_")] || "nova";
            
            if (typeof send === "function") {
              try {
                const r = await send({
                  action: "tts_speak",
                  text: clean,
                  voice: voiceId,
                  ia_voz: voiceId,
                });
                if (r && r.ok && r.audio_base64) {
                  const src = "data:" + (r.mime || "audio/mpeg") + ";base64," + r.audio_base64;
                  
                  // Guardamos el audio pendiente por si el móvil bloquea
                  state._pendingAudioSrc = src;
                  
                  const audio = new Audio(src);
                  audio.setAttribute("playsinline", "true");
                  audio.setAttribute("webkit-playsinline", "true");
                  state._ttsAudio = audio;
                  try { avatarOnReply(text, audio); } catch (_) {}
                  
                  audio.play().catch(() => {
                    console.warn("Audio bloqueado. Sonará en el próximo toque.");
                  });
                  return;
                }
              } catch (e) {
                console.warn("tts_speak", e);
              }
            }
            speakBrowser(clean, voiceId || voicePref);
          } catch (_) {}
        };

        // Escucha global para reproducir el audio pendiente en móviles
        if (!window._wpAudioUnlockerBound) {
          window._wpAudioUnlockerBound = true;
          document.addEventListener("touchstart", function () {
            if (state._pendingAudioSrc && state._ttsAudio) {
              const audio = state._ttsAudio;
              state._pendingAudioSrc = null;
              audio.play().catch(e => console.warn("No se pudo reproducir audio pendiente", e));
            }
          }, { passive: true });
          
          document.addEventListener("click", function () {
            if (state._pendingAudioSrc && state._ttsAudio) {
              const audio = state._ttsAudio;
              state._pendingAudioSrc = null;
              audio.play().catch(e => console.warn("No se pudo reproducir audio pendiente", e));
            }
          }, { passive: true });
        }


            

            
const getStockOf = (pr, p) => {
          const all = typeof products === "function" ? products(p) : [];
          const found = all.find((x) => {
            const meta = parseProductMeta(x);
            return meta.name === pr.id || x.descripcion === pr.id;
          });
          if (!found) return null;
          if (found.stock == null || found.stock === "") return null;
          return Number(found.stock);
        };

        const addToCartSafe = (pr, qty, p) => {
          qty = Math.max(1, Number(qty) || 1);
          state.cart = state.cart || {};
          state.cartMeta = state.cartMeta || {};
          const stock = getStockOf(pr, p);
          const displayName = String(pr.id || pr.nombre || "Producto").trim();
          // clave estable (minúsculas) para que "Pizza" y "pizza" sumen, no reemplacen
          const id =
            displayName
              .toLowerCase()
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "") || displayName;
          const current = Number(state.cart[id] || 0);
          if (stock != null && stock >= 0) {
            const maxAdd = Math.max(0, stock - current);
            if (maxAdd <= 0) {
              return {
                ok: false,
                msg:
                  "No hay más stock de " +
                  id +
                  ". Solo hay " +
                  stock +
                  " disponible" +
                  (stock === 1 ? " (ya está en tu carrito)." : "."),
              };
            }
            qty = Math.min(qty, maxAdd);
          }
          state.cart[id] = current + qty;
          const mon = pr.moneda || "PEN";
          const precio = Number(pr.precio || 0);
          const costo = Number(pr.precio_compra != null ? pr.precio_compra : pr.costo || 0);
          state.cartMeta[id] = {
            precio: precio,
            name: displayName || id,
            moneda: mon,
            stock: stock,
            precio_compra: costo,
            costo: costo,
            foto: pr.foto || "",
          };
          window.__wpSessionCart = state.cart;
          window.__wpSessionCartMeta = state.cartMeta;
          try {
            mountCartFab(p);
            saveCartState(p);
          } catch (_) {}
          // refresco extra por si el DOM del fab se recrea
          setTimeout(() => {
            try {
              mountCartFab(p);
              saveCartState(p);
            } catch (_) {}
          }, 50);
          const monS = mon === "USD" || mon === "$" ? "$" : mon === "EUR" ? "€" : "S/";
          const lineTotal = (precio * state.cart[id]).toFixed(2);
          const entries = Object.entries(state.cart || {}).filter(([, q]) => Number(q) > 0);
          const nItems = entries.reduce((a, [, q]) => a + Number(q || 0), 0);
          let tot = 0;
          const names = entries.map(([k, q]) => {
            const m = (state.cartMeta || {})[k] || {};
            const pr = Number(m.precio != null ? m.precio : 0);
            tot += pr * Number(q || 0);
            return k + (Number(q) > 1 ? " ×" + q : "");
          });
          return {
            ok: true,
            msg:
              id +
              " × " +
              state.cart[id] +
              " — " +
              monS +
              " " +
              lineTotal +
              ". Tu pedido: " +
              names.join(" + ") +
              ". Total " +
              monS +
              " " +
              tot.toFixed(2) +
              " (" +
              nItems +
              ")",
          };
        };

        const openProdZoom = (pr, p) => {
          const layer = document.createElement("div");
          layer.className = "prod-zoom-layer";
          layer.innerHTML =
            (pr.foto
              ? '<img src="' + esc(pr.foto) + '" alt="">'
              : '<div style="color:#fff">Sin foto</div>') +
            '<div class="prod-zoom-actions">' +
            '<button type="button" class="prod-zoom-pedir">Pedir</button>' +
            '<button type="button" class="prod-zoom-cancel">Cancelar</button>' +
            "</div>";
          document.body.appendChild(layer);
          layer.querySelector(".prod-zoom-cancel").onclick = () => layer.remove();
          layer.querySelector(".prod-zoom-pedir").onclick = () => {
            const r = addToCartSafe(pr, 1, p);
            pushInline("bot", r.msg);
            speakReply(r.msg);
            layer.remove();
            try { clearProdFloat(); } catch (_) {}
          };
          layer.onclick = (e) => {
            if (e.target === layer) layer.remove();
          };
        };

        const clearProdFloat = () => {
          const old = document.getElementById("chat-prod-float");
          if (old) old.remove();
        };

        const renderProductCards = (list, p, opts) => {
          clearProdFloat();
          opts = opts || {};
          const primary = (list || []).filter(Boolean);
          if (!primary.length && !opts.forceAll) return;

          const allRaw = (typeof products === "function" ? products(p) : []) || [];
          const all = allRaw.map((x) => {
            const meta = typeof parseProductMeta === "function" ? parseProductMeta(x) : {};
            return {
              id: meta.name || x.descripcion || x.nombre || "Producto",
              precio: Number(x.precio || 0),
              foto: resolveProductFoto(meta.foto || x.foto || ""),
              stock: x.stock != null && x.stock !== "" ? Number(x.stock) : null,
              moneda: x.moneda || "PEN",
              raw: x,
            };
          });

          // Sugerencias: otros productos que no están en la búsqueda principal
          const primaryNames = new Set(
            primary.map((pr) =>
              String(pr.id || pr.descripcion || "")
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .trim(),
            ),
          );
          let suggestions = [];
          // Solo extras si opts.withSuggestions (ej. después de agregar un producto)
          if (opts.withSuggestions) {
            const inCart = new Set(
              Object.keys(state.cart || {})
                .filter((k) => Number(state.cart[k] || 0) > 0)
                .map((k) =>
                  String(k)
                    .toLowerCase()
                    .normalize("NFD")
                    .replace(/[̀-ͯ]/g, "")
                    .trim(),
                ),
            );
            suggestions = all.filter((pr) => {
              const n = String(pr.id || "")
                .toLowerCase()
                .normalize("NFD")
                .replace(/[̀-ͯ]/g, "")
                .trim();
              return n && !primaryNames.has(n) && !inCart.has(n);
            });
            if (primary.length >= all.length) suggestions = [];
            suggestions = suggestions.slice(
              0,
              opts.suggestLimit != null ? Number(opts.suggestLimit) : 2,
            );
          }

          const combined = [
            ...primary.map((pr) => ({ ...pr, _kind: "match" })),
            ...suggestions.map((pr) => ({ ...pr, _kind: "sug" })),
          ];
          if (!combined.length) return;

          const host =
            app.querySelector(".inline-chat") ||
            app.querySelector("#pocket") ||
            app.querySelector(".phone") ||
            app;
          try {
            if (host && host.classList && host.classList.contains("inline-chat")) {
              host.style.position = host.style.position || "relative";
            }
          } catch (_) {}
          const box = document.createElement("div");
          box.id = "chat-prod-float";
          box.className = "chat-prod-float";
          try {
            let j = {};
            if (p && p.estilo_marco && String(p.estilo_marco).startsWith("{")) {
              try { j = JSON.parse(p.estilo_marco); } catch (_) {}
            }
            let bandBg =
              j.chat_band_bg ||
              getComputedStyle(document.documentElement).getPropertyValue("--chat-band-bg").trim() ||
              "#e8eef5";
            let bandTxt = j.chat_band_text || "#0f172a";
            let bandSub = j.chat_band_sub || bandTxt;
            let bandSize = j.chat_band_size ? Number(j.chat_band_size) + "px" : "13px";
            let bandTitle = j.chat_band_title || "Productos";
            let bandTitleC = j.chat_band_title_color || "#ffffff";
            let bandOp = j.chat_band_opacity != null ? String(j.chat_band_opacity) : "0.95";
            let bandRad = j.chat_band_radius != null ? Number(j.chat_band_radius) + "px" : "0px";
            let bandStyle = j.chat_band_style || "solid";
            box.classList.toggle("is-glass", bandStyle === "glass");
            box.classList.toggle("is-gradient", bandStyle === "gradient");
            box.style.setProperty("background", bandBg, "important");
            box.style.setProperty("background-color", bandBg, "important");
            if (bandStyle !== "gradient")
              box.style.setProperty("background-image", "none", "important");
            box.style.setProperty("opacity", bandOp, "important");
            box.style.setProperty("border-radius", bandRad, "important");
            box.style.setProperty("--chat-band-text", bandTxt);
            box.style.setProperty("--chat-band-sub", bandSub);
            box.style.setProperty("--chat-band-size", bandSize);
            box.style.setProperty("--chat-band-title-color", bandTitleC);
            box.style.color = bandTxt;
            box._bandTitle = bandTitle;
          } catch (_) {}

          const head = document.createElement("div");
          head.className = "chat-prod-head";
          const title = document.createElement("span");
          title.className = "chat-prod-strip-label";
          title.textContent = (box._bandTitle || "Productos");
          const xbtn = document.createElement("button");
          xbtn.type = "button";
          xbtn.className = "chat-prod-x";
          xbtn.textContent = "×";
          xbtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            clearProdFloat();
          };
          head.appendChild(title);
          head.appendChild(xbtn);

          // etiqueta secundaria solo si hay sugerencias
          let label = null;
          if (suggestions.length) {
            label = document.createElement("div");
            label.style.cssText = "font-size:11px;opacity:.85;margin:0 0 4px;padding:0 2px";
            label.textContent =
              primary.length +
              " coincidencia(s) · " +
              suggestions.length +
              " sugerencia(s)";
          }

          
          // Modelo de franja: carousel | lista | compacta
          let franjaModelo = "carousel";
          try {
            if (p && String(p.estilo_marco || "").startsWith("{")) {
              const jj = JSON.parse(p.estilo_marco);
              franjaModelo = String(jj.chat_franja_modelo || jj.franja_modelo || "carousel").toLowerCase();
            }
          } catch (_) {}
          if (franjaModelo.includes("list") || franjaModelo === "2") franjaModelo = "lista";
          else if (franjaModelo.includes("compact") || franjaModelo === "3") franjaModelo = "compacta";
          else franjaModelo = "carousel";
          box.setAttribute("data-franja-modelo", franjaModelo);

          const nMatch = primary.length;
          const nSug = suggestions.length;
          try {
            const countEl = document.createElement("div");
            countEl.className = "panel-count";
            countEl.textContent =
              nMatch +
              " coincidencia(s)" +
              (nSug ? " · " + nSug + " sugerencia(s)" : "");
            // insert after head if present
            if (head && head.parentNode === null) {
              /* head not attached yet */
            }
            box._countEl = countEl;
          } catch (_) {}

          const wrap = document.createElement("div");
          if (franjaModelo === "lista") wrap.className = "list-products franja-lista";
          else if (franjaModelo === "compacta") wrap.className = "compact-products franja-compacta";
          else wrap.className = "carousel franja-carousel chat-prod-carousel";

          try {
            state.lastChatProducts = (combined || []).slice(0, 12);
          } catch (_) {}

          combined.forEach((pr) => {
            const foto = resolveProductFoto(pr.foto || "");
            const mon =
              pr.moneda === "USD" || pr.moneda === "$"
                ? "$"
                : pr.moneda === "EUR" || pr.moneda === "€"
                  ? "€"
                  : "S/";
            const name = pr.id || "Producto";
            const isSug = pr._kind === "sug";

            const openDetail = (e) => {
              if (e) {
                e.preventDefault();
                e.stopPropagation();
              }
              // modal Pedir / Cancelar
              let ov = document.getElementById("prod-detail-overlay");
              if (ov) ov.remove();
              ov = document.createElement("div");
              ov.id = "prod-detail-overlay";
              ov.className = "prod-detail-overlay";
              ov.innerHTML =
                '<div class="prod-detail-card">' +
                (foto
                  ? '<img src="' + foto + '" alt="" style="width:100%;max-height:220px;object-fit:cover;border-radius:12px"/>'
                  : '<div class="chat-prod-ph" style="height:160px">Sin foto</div>') +
                '<div style="font-weight:900;font-size:18px;margin:10px 0 4px">' +
                name +
                "</div>" +
                '<div style="color:#fbbf24;font-weight:800;margin-bottom:12px">' +
                mon +
                " " +
                Number(pr.precio || 0).toFixed(2) +
                "</div>" +
                '<div style="display:flex;gap:8px">' +
                '<button type="button" class="pd-pedir" style="flex:1;padding:12px;border:0;border-radius:12px;background:#22c55e;color:#052e16;font-weight:900">Pedir</button>' +
                '<button type="button" class="pd-cancel" style="flex:1;padding:12px;border:0;border-radius:12px;background:#334155;color:#fff;font-weight:800">Cancelar</button>' +
                "</div></div>";
              ov.onclick = (ev) => {
                if (ev.target === ov) ov.remove();
              };
              ov.querySelector(".pd-cancel").onclick = () => ov.remove();
              const pedirBtn = ov.querySelector(".pd-pedir");
              if (pedirBtn) {
                const cvMode =
                  (typeof isCV === "function" && isCV(p)) ||
                  (typeof isPerfilCV === "function" && isPerfilCV(p)) ||
                  isServicioItem(pr.raw || pr);
                if (cvMode) {
                  pedirBtn.textContent = "Cerrar";
                  pedirBtn.style.background = "#334155";
                  pedirBtn.onclick = () => ov.remove();
                } else {
                  pedirBtn.onclick = () => {
                    try {
                      const r = addToCartSafe(pr, 1, p);
                      mountCartFab(p);
                      saveCartState(p);
                      pushInline(
                        "bot",
                        r.msg + " Usa el carrito para «Ir a pagar».",
                      );
                      speakReply(r.msg);
                    } catch (err) {
                      console.error(err);
                    }
                    ov.remove();
                  };
                }
              }
              (app.querySelector(".phone") || app || document.body).appendChild(ov);
            };

            if (franjaModelo === "lista") {
              const art = document.createElement("article");
              art.className = "list-card" + (isSug ? " is-sug" : "");
              const ph = document.createElement("div");
              ph.className = "photo-wrap";
              if (foto) {
                const img = document.createElement("img");
                img.className = "product-photo";
                img.src = foto;
                img.alt = name;
                ph.appendChild(img);
              }
              const nm = document.createElement("p");
              nm.className = "product-name";
              nm.textContent = name;
              const btn = document.createElement("button");
              btn.type = "button";
              btn.className = "action";
              btn.textContent = "Ver ›";
              btn.onclick = openDetail;
              art.appendChild(ph);
              art.appendChild(nm);
              art.appendChild(btn);
              art.onclick = (e) => {
                if (e.target === btn) return;
                openDetail(e);
              };
              wrap.appendChild(art);
            } else if (franjaModelo === "compacta") {
              const art = document.createElement("article");
              art.className = "compact-card" + (isSug ? " is-sug" : "");
              const ph = document.createElement("div");
              ph.className = "photo-wrap";
              if (foto) {
                const img = document.createElement("img");
                img.className = "product-photo";
                img.src = foto;
                img.alt = name;
                ph.appendChild(img);
              }
              const nm = document.createElement("p");
              nm.className = "product-name";
              nm.textContent = name;
              const dot = document.createElement("span");
              dot.className = "status-dot";
              art.appendChild(ph);
              art.appendChild(nm);
              art.appendChild(dot);
              art.onclick = openDetail;
              wrap.appendChild(art);
            } else {
              // carousel
              const art = document.createElement("article");
              art.className = "carousel-card" + (isSug ? " is-sug" : "");
              const ph = document.createElement("div");
              ph.className = "photo-wrap";
              if (foto) {
                const img = document.createElement("img");
                img.className = "product-photo";
                img.src = foto;
                img.alt = name;
                ph.appendChild(img);
              } else {
                ph.innerHTML = '<div class="chat-prod-ph">Sin foto</div>';
              }
              const info = document.createElement("div");
              info.className = "carousel-info";
              const nm = document.createElement("p");
              nm.className = "product-name";
              nm.textContent = name;
              const btn = document.createElement("button");
              btn.type = "button";
              btn.className = "action";
              btn.textContent = "Ver producto";
              btn.onclick = openDetail;
              info.appendChild(nm);
              info.appendChild(btn);
              art.appendChild(ph);
              art.appendChild(info);
              art.onclick = (e) => {
                if (e.target === btn) return;
                openDetail(e);
              };
              wrap.appendChild(art);
            }
          });

          // head count
          try {
            if (box._countEl && head) head.appendChild(box._countEl);
          } catch (_) {}
          if (head) box.appendChild(head);
          box.appendChild(wrap);

          host.appendChild(box);

          try {
            const track = box.querySelector(".chat-prod-carousel");
            if (track && !track._auto) {
              track._auto = null; // setInterval disabled - scroll libre
              void 0 && setInterval(() => {
                if (!document.body.contains(track)) {
                  clearInterval(track._auto);
                  return;
                }
                const max = track.scrollWidth - track.clientWidth;
                if (max <= 0) return;
                if (track.scrollLeft >= max - 4) track.scrollLeft = 0;
                else track.scrollLeft += 1.2;
              }, 35);
            }
          } catch (_) {}

          // voz con sugerencias
          if (opts.speak !== false && suggestions.length) {
            const names = suggestions
              .slice(0, 3)
              .map((s) => s.id)
              .filter(Boolean);
            const speakTxt =
              primary.length === 1
                ? "Aquí tienes " +
                  (primary[0].id || "el producto") +
                  ". También te sugiero " +
                  names.join(", ") +
                  "."
                : primary.length > 1
                  ? "Estos son los productos que pediste. También te sugiero " +
                    names.join(", ") +
                    "."
                  : "También te sugiero " + names.join(", ") + ".";
            try {
              if (typeof speakReply === "function") speakReply(speakTxt);
            } catch (_) {}
          }
        };


        // Saludo automático al abrir el chat (si está activado)
        try {
          const _ck = String((p && (p.codigo_cliente || p.codigo || p.id)) || "x");
          if (!state._saludoDone) state._saludoDone = {};
          let _se = {};
          try {
            if (p && String(p.estilo_marco || "").startsWith("{")) _se = JSON.parse(p.estilo_marco);
          } catch (_) {}
          const wantSaludo =
            _se.ia_saludo === true ||
            _se.ia_saludo === "true" ||
            _se.ia_saludo === 1 ||
            p.ia_saludo === true;
          if (
            wantSaludo &&
            (state.panel === "chat" || document.querySelector(".inline-chat")) &&
            !state._saludoDone[_ck]
          ) {
            state._saludoDone[_ck] = true;
            const nombre = (p.nombre || p.negocio || "").trim() || "nosotros";
            const msg =
              "¡Hola! Bienvenido a " +
              nombre +
              ". ¿En qué te puedo ayudar hoy?";
            setTimeout(() => {
              try {
                if (typeof pushInline === "function") pushInline("bot", msg);
                if (typeof speakReply === "function") speakReply(msg);
                if (!state.chatByCode) state.chatByCode = {};
                if (!state.chatByCode[_ck]) state.chatByCode[_ck] = [];
                state.chatByCode[_ck].push({ role: "assistant", content: msg });
              } catch (_) {}
            }, 400);
          }
        } catch (_) {}

        const wantsCatalog = (msg) => {
          const q = String(msg || "").toLowerCase();
          // Solo catálogo explícito; NO preguntas de ingredientes / de qué está hecha
          if (/de que|de qué|esta hecha|está hecha|ingrediente|contiene|como se hace|cómo se hace/.test(q))
            return false;
          return /vendes|vende|productos?|cat[aá]logo|qu[eé] tienes|que tienes|qu[eé] hay|que hay|mostrar|muestra|opciones|lista de|ofrecen|ofreces|que venden|qué venden/.test(
            q
          );
        };
        const rememberProductTopic = (msg, list) => {
            try {
              const q = String(msg || "")
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "");
              const stop = new Set(
                "hola,que,qué,me,las,los,una,uno,por,para,con,del,de,el,la,en,y,o,a,un,es,si,sí,no,ok,puedes,quiero,ver,mostrar,muestra,muestramelas,muestralas,mirar,lista,productos,producto,opciones,tienen,tienes,hay".split(
                  ",",
                ),
              );
              const words = q
                .split(/[^a-z0-9áéíóúñ]+/i)
                .filter((w) => w.length > 2 && !stop.has(w));
              if (words.length) state._lastProductTopic = words.join(" ");
              else if (list && list.length) {
                // infer from first product name token
                const n = String(list[0].id || "")
                  .toLowerCase()
                  .split(/\s+/)[0];
                if (n) state._lastProductTopic = n;
              }
            } catch (_) {}
          };
        const filterProductsByTopic = (list, msg) => {
            const q = String(msg || "")
              .toLowerCase()
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "");
            const stop = new Set(
              "hola,que,qué,me,las,los,una,uno,unos,unas,por,para,con,del,de,el,la,en,mi,tu,su,al,lo,y,o,a,un,es,si,sí,no,ok,hola,puedes,podrias,podrías,quiero,quisiera,ver,mostrar,muestra,muestrame,muestreme,mirar,observar,lista,catalogo,catálogo,productos,producto,opciones,tienen,tienes,hay,algo,mas,más,detalle,detalles,info,sobre,alguna,alguno,por,favor,please".split(","),
            );
            const words = q
              .split(/[^a-z0-9áéíóúñ]+/i)
              .map((w) => w.trim())
              .filter((w) => w.length > 2 && !stop.has(w));
            if (!words.length && state._lastProductTopic) {
              String(state._lastProductTopic)
                .split(/\s+/)
                .forEach((w) => {
                  if (w.length > 2) words.push(w);
                });
            }
            if (!words.length) return (list || []).slice(0, 8);
            const scored = (list || [])
              .map((pr) => {
                const n = String(pr.id || pr.descripcion || "")
                  .toLowerCase()
                  .normalize("NFD")
                  .replace(/[\u0300-\u036f]/g, "");
                let score = 0;
                words.forEach((w) => {
                  if (n.includes(w)) score += 3;
                  else if (n.split(/\s+/).some((t) => t.startsWith(w.slice(0, 4)) || w.startsWith(t.slice(0, 4))))
                    score += 1;
                });
                return { pr, score };
              })
              .filter((x) => x.score > 0)
              .sort((a, b) => b.score - a.score);
            // si hay tema (pizza) y hay matches, solo esos; si no, no inventar todo el catálogo
            if (scored.length) return scored.map((x) => x.pr).slice(0, 8);
            return [];
          };
        const isShowOnlyIntent = (msg) => {
            const q = String(msg || "")
              .toLowerCase()
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "");
            // comprar explícito sin ver
            if (
              /\b(dame|agrega|agregala|agregalo|añade|anade|pido|pedido|compro|mandame|mándame)\b/.test(q) &&
              !/\b(ver|mostrar|muestra|mirar|observ)/.test(q)
            )
              return false;
            // muestramelas / muestralas / muéstrame las / enseñaselas (pronominal)
            if (
              /muestrame|muestreme|muestramela|muestramelo|muestramelas|muestramelos|muestrala|muestralo|muestralas|muestralos|mostrarmelas|mostrarmelos|ensename|ensenaselas|enseñaselas|enseñamelas/.test(
                q.replace(/\s+/g, ""),
              ) ||
              /muestra\s*me\s*las|muestra\s*me\s*los|muestra\s*las|muestra\s*los|me\s*las\s*muestra|me\s*las\s*puedes\s*mostrar/.test(q)
            )
              return true;
            if (
              /\b(mostrar|muestra|muestrame|muestreme|muéstrame|muéstreme|ensena|enseña|ver|mirar|observa|observar)\b/.test(q)
            )
              return true;
            if (/quiero que me (muestre|muestres|enseño|enseñe|enseña)/.test(q)) return true;
            if (/me (puedes|podrias|podrías) (mostrar|ver|enseña)/.test(q)) return true;
            if (/\b(quiero|quisiera)\s+(ver|mirar)\b/.test(q)) return true;
            if (/\b(lista|catalogo|catálogo)\b/.test(q) && !/\b(dame|agrega|pido)\b/.test(q)) return true;
            return false;
          };

        const wantsBuy = (msg) => {
          const q = String(msg || "")
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");
          if (typeof isShowOnlyIntent === "function" && isShowOnlyIntent(msg)) return false;
          if (/no quiero|ya no quiero|quita|sacar|sacalo|sacala|saca |elimina|borra|cancel/.test(q))
            return false;
          // solo mirar / listar → NO comprar
          if (/\b(ver|mostrar|muestra|ensename|ensena|lista|cuales|cuáles|que pizza|que pizzas|que gaseosa)\b/.test(q) &&
              !/\b(dame|pido|agrega|compro)\b/.test(q))
            return false;
          // Preguntas / info: NUNCA comprar
          if (
            /\?/.test(q) ||
            /\b(de que|de que esta|esta hecha|esta hecho|ingrediente|contiene|como se|informacion|explica|descri|sabor|alergia|alergico)\b/.test(q) ||
            /\bhecha\b|\bhecho\b/.test(q) ||
            /\b(que|como|cual|porque|por que)\b/.test(q)
          )
            return false;
          if (/^(efectivo|tarjeta|yape|plin|transferencia|visa)\s*[.?]?$/.test(q.trim()))
            return false;
          if (
            /\bquiero\b|lo quiero|la quiero|esta bien|ya agrega|agregala|agregalo|agregame|anade|añade|\bdame\b|\bpido\b|pedir|agrega|compro|me lo llevo|me la llevo|confirmo|ok agrega|si quiero|\d+\s*unidades?|ya dame|dame una|dame un|me das|pasame|pásame|esa misma|ese mismo|la misma|el mismo/.test(
              q,
            )
          )
            return true;
          if (
            /\by su\b|\by la\b|\by el\b|\btambien\b|\bademas\b|sumale|ponle|uno de cada|una de cada|de cada uno|los dos|las dos|ambos|ambas|todo eso/.test(
              q,
            )
          )
            return true;
          // "una X y una Y" / "X y Y" con nombres de producto → pedido
          if (/\buna\b|\bun\b|\by\b/.test(q) && q.length >= 6) return true;
          // deseo / comprar / quiero / pedir variantes
          if (/\b(deseo|deseaba|compra|comprar|pedido|orden|ordenar)\b/.test(q)) return true;
          return false;
        };

        const matchProducts = (msg, p) => {
          const all = (typeof products === "function" ? products(p) : []).map((x) => {
            const meta = parseProductMeta(x);
            let foto =
              meta.foto ||
              x.foto ||
              x.url_foto ||
              x.urlfoto ||
              x.image ||
              x.imagen ||
              x.photo ||
              x.url_imagen ||
              x.media_url ||
              x.img ||
              "";
            // buscar cualquier campo que parezca URL de imagen
            if (!foto && x && typeof x === "object") {
              for (const k of Object.keys(x)) {
                const v = x[k];
                if (typeof v === "string" && /\.(png|jpe?g|webp|gif)(\?|$)/i.test(v)) {
                  foto = v;
                  break;
                }
                if (typeof v === "string" && /supabase\.co\/storage/i.test(v)) {
                  foto = v;
                  break;
                }
              }
            }
            foto = resolveProductFoto(foto);
            return {
              id: meta.name || x.descripcion || x.nombre || "Producto",
              precio: Number(x.precio || meta.precio || 0),
              foto: foto,
              stock: x.stock != null && x.stock !== "" ? Number(x.stock) : null,
              moneda: x.moneda || meta.moneda || "PEN",
              raw: x,
            };
          });
          if (!all.length) return { empty: true, list: [] };
          const q = String(msg || "")
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");
          const words = q.split(/\s+/).filter((w) => w.length > 2);
          const scored = all
            .map((pr) => {
              const n = String(pr.id || "")
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "");
              if (!n) return { pr, score: 0 };
              let score = 0;
              if (n === q) score = 100;
              else if (n.includes(q) && q.length >= 3) score = 90;
              else if (q.includes(n) && n.length >= 3) score = 75;
              else {
                const tokens = n.split(/\s+/).filter((t) => t.length > 2);
                const hits = tokens.filter((t) =>
                  words.some((w) => t.includes(w) || w.includes(t)),
                );
                score = hits.length * 15;
                if (words.length && words.every((w) => n.includes(w))) score += 45;
                // token suelto tipo "hawaiana" dentro de "pizza hawaiana"
                if (words.some((w) => w.length >= 4 && n.includes(w))) score += 30;
              }
              return { pr, score };
            })
            .filter((x) => x.score > 0)
            .sort((a, b) => b.score - a.score);
          let hit = scored.map((x) => x.pr);
          // Si hay "y" / "con", conservar todos los que matchean bien (multi-pedido)
          if (!/\s+y\s+|\s+con\s+|,\s*/.test(q) && scored.length > 1) {
            if (scored[0].score >= (scored[1].score || 0) + 25) hit = [scored[0].pr];
          }
          let qty = 1;
          const m = q.match(/\b(\d+)\b/);
          if (m) qty = Math.max(1, parseInt(m[1], 10) || 1);
          return { empty: !hit.length, list: hit, all, qty };
        };

        
        const isBroadCatalogAsk = (msg) => {
          const q = String(msg || "")
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");
          return /que venden|que vendes|que ofrecen|que ofreces|que hay|que tienes|catalogo|todo lo que|productos en general/.test(q);
        };
        const isWhatElseAsk = (msg) => {
          const q = String(msg || "")
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");
          return /que mas|que mas tienes|que mas hay|algo mas|otra cosa|otros productos|ademas de/.test(q);
        };
        const filterProductsByMsg = (msg, allList) => {
          const q = String(msg || "")
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");
          // palabras de producto típicas en el mensaje
          const stop = new Set(["que","que","vendes","venden","tienen","tiene","hay","mostrar","muestra","precio","cuanto","cuanto","dame","quiero","una","un","los","las","del","de","la","el","me","por","favor","esta","hecha","hecho"]);
          const words = q.split(/\s+/).filter((w) => w.length > 2 && !stop.has(w));
          if (!words.length) return allList.slice();
          const hit = allList.filter((pr) => {
            const n = String(pr.id || "")
              .toLowerCase()
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "");
            return words.some((w) => n.includes(w) || w.includes(n.split(" ")[0]));
          });
          return hit.length ? hit : [];
        };

        const buildChatPayload = (p, msg, extra) => {
          const ck = String(
            (p && (p.codigo_cliente || p.codigo)) || state.qr || "anon",
          ).trim();
          let iaPrompt = "";
          let iaKnow = "";
          try {
            iaPrompt = String(p.ia_prompt || "").trim();
            iaKnow = String(p.ia_conocimiento || "").trim();
          } catch (_) {}
          try {
            const em = String((p && p.estilo_marco) || "");
            if (em.startsWith("{")) {
              const j = JSON.parse(em);
              if (!iaPrompt) iaPrompt = String(j.ia_prompt || "").trim();
              if (!iaKnow) iaKnow = String(j.ia_conocimiento || j.conocimiento || "").trim();
            }
          } catch (_) {}
          return Object.assign(
            {
              action: "chat",
              message: msg,
              codigo: ck,
              codigoCliente: ck,
              codigo_cliente: ck,
              prompt: iaPrompt,
              knowledge: iaKnow,
              conocimiento: iaKnow,
              historial: (state.chatByCode && state.chatByCode[ck]
                ? state.chatByCode[ck]
                : []
              ).slice(-12),
              history: (state.chatByCode && state.chatByCode[ck]
                ? state.chatByCode[ck]
                : []
              ).slice(-12),
            },
            extra || {},
          );
        };

        const sendInline = async () => {
          if (state._sendingInline) return;
          state._sendingInline = true;
          const _clearSend = () => {
            setTimeout(() => {
              state._sendingInline = false;
            }, 600);
          };
          try { if (window.speechSynthesis) window.speechSynthesis.cancel(); } catch (_) {}
          const input = app.querySelector("#inline-chat-input");
          const msg = ((input && input.value) || "").trim();
          if (!msg) {
            state._sendingInline = false;
            return;
          }
          _clearSend();
          pushInline("user", msg);
          if (input) input.value = "";
          try { clearProdFloat(); } catch (_) {}
          try { showTypingDots(); } catch (_) {}
          const p = state.profiles[state.index] || {};
          const ck = String(p.codigo_cliente || p.codigo || state.qr || "anon");
          if (!state.chatByCode) state.chatByCode = {};
          if (!state.chatByCode[ck]) state.chatByCode[ck] = [];
          state.chatByCode[ck].push({ role: "user", content: msg });
          // Aprendizaje: si el usuario corrige a la IA, guardar en ia_aprendizaje
          try {
            const qn = msg
              .toLowerCase()
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "");
            const isCorr =
              /\b(no es|no es asi|esta mal|te equivoc|corrige|en realidad|mejor dicho|quise decir|no dije|mal interpret)\b/.test(
                qn,
              );
            if (isCorr && typeof send === "function") {
              const hist = state.chatByCode[ck] || [];
              let lastBot = "";
              let lastUserPrev = "";
              for (let i = hist.length - 1; i >= 0; i--) {
                if (!lastBot && hist[i].role === "assistant") lastBot = hist[i].content || "";
                if (lastBot && hist[i].role === "user" && hist[i].content !== msg) {
                  lastUserPrev = hist[i].content || "";
                  break;
                }
              }
              send({
                action: "ia_aprendizaje_save",
                frase: String(lastUserPrev || msg).slice(0, 200),
                intencion: "correccion_lenguaje",
                significado: String(msg).slice(0, 500),
                contexto_ejemplo: String(lastBot).slice(0, 400),
                correccion: String(msg).slice(0, 500),
                respuesta_correcta: String(msg).slice(0, 500),
              }).catch(function () {});
            }
          } catch (_) {}

          // ¿Quiere QUITAR del carrito? (prioridad sobre pedir/stock)
          const qNormRm = String(msg || "")
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");
          // Instrucción / memoria / corrección de lenguaje → NO borrar ahora
          const isTeachLang =
            /cada vez que|guardatelo|guardalo en|en tu memoria|aprende que|cuando diga|significa que|quiero que entiendas|para futuros|en el futuro|recuerda que|guardatelo en tu memoria/.test(
              qNormRm,
            );
          const isRemove =
            !isTeachLang &&
            (/\b(quitalo|quitala|quitelo|quitela|quitar|sacalo|sacala|sacar|ya no quiero|no lo quiero|no la quiero|elimina|eliminar|borra|borrar|remueve)\b/i.test(
              msg,
            ) ||
              /sacar del carrito|quita del carrito|quitar del carrito|saca del carrito|fuera del carrito/i.test(
                msg,
              ) ||
              (/\b(quita|saca)\b/i.test(msg) &&
                (/\bcarrito\b/i.test(msg) || Object.keys(state.cart || {}).length > 0)));
          // Enseñar lenguaje → guardar en ia_aprendizaje para próximas charlas
          if (isTeachLang && typeof send === "function") {
            try {
              const p0 = state.profiles[state.index] || {};
              const ck0 = String(p0.codigo_cliente || p0.codigo || state.qr || "anon");
              send({
                action: "ia_aprendizaje_save",
                frase: "quítalo / quita / sácalo",
                intencion: "quitar_del_carrito",
                significado:
                  "Quitar del carrito el producto referido; si no nombra y hay uno solo, quitar ese; 'quitar todo' vacía el carrito.",
                contexto_ejemplo: String(msg).slice(0, 400),
                correccion: String(msg).slice(0, 600),
                respuesta_correcta:
                  "Si dice quítalo/quita/sácalo = sacar del carrito.",
              }).catch(function () {});
            } catch (_) {}
          }
          if (isTeachLang && !isRemove) {
            const ack = "Entendido.";
            pushInline("bot", ack);
            speakReply(ack);
            try {
              const pT = state.profiles[state.index] || {};
              const ckT = String(pT.codigo_cliente || pT.codigo || state.qr || "anon");
              if (!state.chatByCode) state.chatByCode = {};
              if (!state.chatByCode[ckT]) state.chatByCode[ckT] = [];
              state.chatByCode[ckT].push({ role: "user", content: msg });
              state.chatByCode[ckT].push({ role: "assistant", content: ack });
              /* chat no se guarda */;
            } catch (_) {}
            return;
          }
          if (isRemove) {
            state.cart = state.cart || {};
            const keys = Object.keys(state.cart);
            let removed = [];
            const norm = (s) =>
              String(s || "")
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "");
            const q = norm(msg);
            if (/\btodo\b|\btodos\b|vaciar/i.test(msg) || keys.length === 1) {
              // un solo ítem o "todo" → vaciar carrito
              if (/\btodo\b|\btodos\b|vaciar/i.test(msg) || keys.length === 1) {
                removed = keys.slice();
                state.cart = {};
              }
            }
            if (!removed.length) {
              // matchear por palabras del mensaje vs nombres en carrito
              keys.forEach((id) => {
                const nid = norm(id);
                const words = q.split(/\s+/).filter((w) => w.length > 2);
                if (words.some((w) => nid.includes(w) || w.includes(nid.split(" ")[0]))) {
                  delete state.cart[id];
                  removed.push(id);
                }
              });
            }
            // si dijo "moto" y hay un producto con moto
            if (!removed.length) {
              keys.forEach((id) => {
                if (norm(id).includes("moto") && /moto/.test(q)) {
                  delete state.cart[id];
                  removed.push(id);
                }
              });
            }
            // fallback: si hay productos en carrito y mensaje de rechazo, quitar el primero
            if (
              !removed.length &&
              keys.length &&
              /no quiero|sacalo|sacala|quitar|quitalo|quitala|saca|quita/.test(q)
            ) {
              // sin nombre: si hay 1 producto o dijo "quita(lo)" → ese / el primero
              removed = [keys[0]];
              delete state.cart[keys[0]];
            }
            const reply = removed.length
              ? "Listo, lo saqué del carrito: " + removed.join(", ") + "."
              : keys.length
                ? "Tu carrito tiene: " + keys.join(", ") + ". Di el nombre para quitarlo o “quitar todo”."
                : "Tu carrito ya está vacío.";
            pushInline("bot", reply);
            speakReply(reply);
            try {
              mountCartFab(p);
              saveCartState(p);
            } catch (_) {}
            state.chatByCode[ck].push({ role: "assistant", content: reply });
            return;
          }

          // Comandos de carrito con estado REAL (no inventa la IA)
          {
            const qCart = String(msg || "")
              .toLowerCase()
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "");
            const wantsOpenCart =
              /\b(abre|abrir|ver|muestra|mostrar)\b.*\bcarrito\b|\bcarrito\b.*\b(abre|abrir|ver)\b|\bmi carrito\b/.test(
                qCart,
              );
            const wantsCartInfo =
              /\b(que tengo|qué tengo|cuanto tengo|cuánto tengo|cuanto es|cuánto es|total del carrito|que hay en el carrito|qué hay en el carrito)\b/.test(
                qCart,
              );
            try {
              loadCartState(p);
            } catch (_) {}
            const keysNow = Object.keys(state.cart || {}).filter(
              (k) => Number(state.cart[k] || 0) > 0,
            );
            if ((wantsOpenCart || wantsCartInfo) && isCV(p)) {
              const reply =
                "En este perfil profesional no hay carrito. Puedes ver mis servicios en el menú SERVICIOS o preguntarme por el chat.";
              pushInline("bot", reply);
              speakReply(reply);
              return;
            }
            if (wantsOpenCart || wantsCartInfo) {
              let total = 0;
              const lines = keysNow.map((n) => {
                const q = Number(state.cart[n] || 0);
                const meta = (state.cartMeta || {})[n] || {};
                const pr = Number(meta.precio || 0);
                total += pr * q;
                return (
                  n + (q > 1 ? " x" + q : "") + " · S/ " + (pr * q).toFixed(2)
                );
              });
              const reply = !keysNow.length
                ? "Tu carrito está vacío."
                : "En tu carrito: " +
                  lines.join("; ") +
                  ". Total S/ " +
                  total.toFixed(2) +
                  ".";
              pushInline("bot", reply);
              speakReply(reply);
              try {
                state.chatByCode[ck].push({ role: "assistant", content: reply });
              /* chat no se guarda */;
              } catch (_) {}
              try {
                mountCartFab(p);
              } catch (_) {}
              if (wantsOpenCart) {
                state.panel = "cart";
                state.cartView = "cart";
                state.showNamePay = false;
                render();
              }
              return;
            }
          }

          
          // CV: mostrar servicios de la tabla productos (solo explicativo)
          if (isCV(p)) {
            const qSvc = String(msg || "")
              .toLowerCase()
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "");
            const askSvc =
              /\b(servicio|servicios|que ofreces|que haces|en que trabajas|trabajo|asesoria|consulta|puedes hacer|que puedes)\b/.test(
                qSvc,
              ) || wantsCatalog(msg);
            if (askSvc) {
              try {
                const serv = typeof servicesOf === "function" ? servicesOf(p) : [];
                const allP = serv.length
                  ? serv
                  : typeof products === "function"
                    ? products(p) || []
                    : [];
                if (allP.length) {
                  const list = allP.map((x) => {
                    const meta =
                      typeof parseProductMeta === "function"
                        ? parseProductMeta(x)
                        : {};
                    return {
                      id: meta.name || x.descripcion || x.nombre || "Servicio",
                      precio: Number(x.precio || 0),
                      foto: resolveProductFoto(meta.foto || x.foto || ""),
                      stock: null,
                      moneda: x.moneda || "PEN",
                      raw: x,
                      _kind: "match",
                    };
                  });
                  renderProductCards(list.slice(0, 10), p, {
                    withSuggestions: false,
                  });
                }
              } catch (_) {}
            }
          }

          const matched = matchProducts(msg, p);
          try {
            if (typeof rememberProductTopic === "function")
              rememberProductTopic(msg, (matched && matched.list) || []);
          } catch (_) {}
          // si pregunta "qué pizza..." dejar solo esas coincidencias
          if (matched && matched.list && matched.list.length && !isBroadCatalogAsk(msg)) {
            const filtered = filterProductsByMsg(msg, matched.list);
            if (filtered.length) matched.list = filtered;
          }
          if (isWhatElseAsk(msg) && matched) {
            const last = (state.lastChatProducts || []).map((x) =>
              String(x.id || "").toLowerCase()
            );
            const allP = matchProducts(" ", p).all || matched.all || [];
            matched.list = allP.filter(
              (pr) => !last.includes(String(pr.id || "").toLowerCase()),
            );
            matched.empty = !matched.list.length;
          }
          const catalog = wantsCatalog(msg);
          
          // Silenciar chat si el usuario lo pide expresamente
          {
            const qs = String(msg || "")
              .toLowerCase()
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "");
            if (
              /\b(callate|cállate|calla|silencio|deja de hablar|no hables|no hables mas|no hables más|estate quieto|estate quieta|shut up|basta de hablar|para de hablar)\b/.test(
                qs,
              )
            ) {
              state.chatMuted = true;
              pushInline("bot", "De acuerdo, me quedo en silencio. Si quieres hablar de nuevo, dime «puedes hablar» o «activa el chat».");
              try {
                speakReply("De acuerdo, me quedo en silencio.");
              } catch (_) {}
              return;
            }
            if (
              state.chatMuted &&
              /\b(puedes hablar|activa el chat|habla|ya puedes hablar|desilencia|despierta)\b/.test(qs)
            ) {
              state.chatMuted = false;
              pushInline("bot", "Listo, ya puedo responderte otra vez.");
              try {
                speakReply("Listo, ya puedo responderte.");
              } catch (_) {}
              // continue to normal flow
            } else if (state.chatMuted) {
              // no responder
              return;
            }
          }

          
          
          // Limpiar solo la caja de chat (no carrito / no pedidos)
          {
            const qc = String(msg || "")
              .toLowerCase()
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "");
            if (
              /\b(borra|borrar|limpia|limpiar|vaciar|eliminar)\b/.test(qc) &&
              /\b(conversacion|conversación|chat|mensajes)\b/.test(qc)
            ) {
              try {
                if (state.chatByCode) state.chatByCode[ck] = [];
              } catch (_) {}
              try {
                const roots = document.querySelectorAll(
                  "#chat-log, #chat-messages, [data-chat-log], .chat-messages, .ia-chat-log",
                );
                roots.forEach((box) => {
                  try {
                    box.innerHTML = "";
                  } catch (_) {}
                });
              } catch (_) {}
              const reply = "Listo, conversación limpia. ¿En qué te ayudo?";
              try {
                pushInline("bot", reply);
              } catch (_) {}
              try {
                speakReply(reply);
              } catch (_) {}
              try {
                if (state.chatByCode) state.chatByCode[ck] = [{ role: "assistant", content: reply }];
              } catch (_) {}
              return;
            }
          }

          // "pagar" / "cómo pago" → orientar y abrir carrito
          const wantsPayIntent = (m) => {
            const q = String(m || "")
              .toLowerCase()
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "");
            return /\b(pagar|pago|como pago|cómo pago|como puedo pagar|quiero pagar|ir a pagar|finalizar|checkout|ya quiero pagar|pasar a caja)\b/.test(
              q,
            );
          };
          if (wantsPayIntent(msg)) {
            const cartKeys = Object.keys(state.cart || {});
            const hasItems = cartKeys.some((k) => Number(state.cart[k] || 0) > 0);
            if (!hasItems) {
              const reply =
                "Aún no tienes productos en el carrito. Dime qué deseas (por ejemplo una pizza) y lo agregamos; después puedes pagar.";
              pushInline("bot", reply);
              try {
                speakReply(reply);
              } catch (_) {}
              try {
                state.chatByCode[ck].push({ role: "assistant", content: reply });
              } catch (_) {}
              return;
            }
            const reply =
              "Perfecto. Te abro el carrito para que revises tu pedido y pagues. Ahí verás el total y podrás confirmar.";
            pushInline("bot", reply);
            try {
              speakReply(reply);
            } catch (_) {}
            try {
              state.chatByCode[ck].push({ role: "assistant", content: reply });
            } catch (_) {}
            try {
              state.showNamePay = true;
              state.panel = "cart";
              state.cartView = "checkout";
              render();
            } catch (_) {
              try {
                state.panel = "cart";
                render();
              } catch (_) {}
            }
            return;
          }

          let buy = wantsBuy(msg);
          // Forzar NO compra si solo pide ver/mostrar catálogo
          if (typeof isShowOnlyIntent === "function" && isShowOnlyIntent(msg)) {
            buy = false;
          }
          // Si el mensaje nombra producto(s) del catálogo (mayúsc/minúsc da igual) → pedido
          // Ej: "hawaiana y una gaseosa" / "PIZZA HAWAIANA"
          if (
            !buy &&
            matched &&
            !matched.empty &&
            matched.list &&
            matched.list.length &&
            !(typeof isShowOnlyIntent === "function" && isShowOnlyIntent(msg))
          ) {
            const qn = String(msg || "")
              .toLowerCase()
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "")
              .trim();
            const isGreet =
              /^(hola+|holi|buenas|buenos dias|buenas tardes|buenas noches|hey|hi|hello|gracias|ok+|dale)[\s!.?]*$/i.test(
                qn,
              );
            const isQ =
              /\?/.test(qn) ||
              /\b(que|qué|como|cómo|cual|cuál|porque|por que|cuanto|cuánto|precio)\b/.test(
                qn,
              );
            if (!isGreet && !isQ) {
              buy = true;
            }
          }
          // Aprendizaje de intenciones
          try {
            const _ql = String(msg || "").toLowerCase();
            if (buy) {
              edge({
                action: "ia_aprendizaje_save",
                frase: String(msg || "").slice(0, 160),
                intencion: "agregar_carrito",
                significado:
                  "Agregar producto(s) al carrito (dame/agrega/quiero pedir/añade)",
                contexto_ejemplo: "dame una pizza / agrega gaseosa / quiero 2 pan al ajo",
              }).catch(function () {});
            } else if (typeof isShowOnlyIntent === "function" && isShowOnlyIntent(msg)) {
              edge({
                action: "ia_aprendizaje_save",
                frase: String(msg || "").slice(0, 160),
                intencion: "mostrar_catalogo",
                significado: "Solo mostrar productos filtrados; no agregar al carrito",
                contexto_ejemplo: "muestra las pizzas / quiero ver gaseosas / me las puedes mostrar",
              }).catch(function () {});
            }
          } catch (_) {}

          // Correcciones del usuario → ia_aprendizaje (global)
          {
            const qc = String(msg || "")
              .toLowerCase()
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "");
            if (
              /\b(no (me )?agregues|no agregues|no debias|no debiste|solo (queria|quería) ver|no compre|no es (asi|así)|te equivo|mal entend|no pidas|no lo agregues|no anadas|no añadas)\b/.test(qc) ||
              (typeof isShowOnlyIntent === "function" && isShowOnlyIntent(msg))
            ) {
              try {
                edge({
                  action: "ia_aprendizaje_save",
                  frase: String(msg || "").slice(0, 160),
                  intencion: "mostrar_catalogo",
                  significado:
                    "El usuario quiere VER productos, no agregarlos al carrito. Solo mostrar franja.",
                  contexto_ejemplo: "quiero ver las pizzas / muestra las gaseosas / no agregues",
                }).catch(function () {});
              } catch (_) {}
            }
          }

          // CV: nunca carrito; solo mostrar servicios
          if (isCV(p) && buy) {
            buy = false;
            try {
              const serv = typeof servicesOf === "function" ? servicesOf(p) : [];
              if (serv.length) {
                const list = serv.map((x) => {
                  const meta = parseProductMeta(x);
                  return {
                    id: meta.name || x.descripcion || x.nombre || "Servicio",
                    precio: Number(x.precio || 0),
                    foto: resolveProductFoto(meta.foto || x.foto || ""),
                    stock: null,
                    moneda: x.moneda || "PEN",
                    raw: x,
                    _kind: "match",
                  };
                });
                // filtrar por palabras del mensaje si hay
                const qn = String(msg || "")
                  .toLowerCase()
                  .normalize("NFD")
                  .replace(/[\u0300-\u036f]/g, "");
                let show = list.filter((pr) => {
                  const n = String(pr.id || "")
                    .toLowerCase()
                    .normalize("NFD")
                    .replace(/[\u0300-\u036f]/g, "");
                  return !qn || n.split(/\s+/).some((t) => t.length > 2 && qn.includes(t));
                });
                if (!show.length) show = list.slice(0, 8);
                renderProductCards(show, p, { withSuggestions: false });
              }
            } catch (_) {}
          }
          // red de seguridad: frases informativas nunca compran
          {
            const qn0 = String(msg || "")
              .toLowerCase()
              .normalize("NFD")
              .replace(/[̀-ͯ]/g, "");
            if (
              /\?/.test(qn0) ||
              /(de que|esta hecha|esta hecho|ingrediente|contiene|como se|hecha|hecho|informa|explica|descri|sabor)/.test(qn0) ||
              /(que|como|cual|porque|por que)/.test(qn0)
            )
              buy = false;
          }
          // Solo convertir mención de producto en pedido si NO es pregunta informativa
          if (
            !buy &&
            matched &&
            !matched.empty &&
            matched.list &&
            matched.list.length >= 1
          ) {
            const qn = String(msg || "")
              .toLowerCase()
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "");
            const isInfoQuestion =
              /\?|precio|cuanto|cuánto|vale|horario|abre|atienden|donde|dónde|llama|de que|de qué|esta hecha|está hecha|hecha|hecho|ingrediente|contiene|llevar|llevan|como se|cómo se|informacion|información|explica|descri|detall|sabor|tamaño|tamano|caliente|fria|fría|picante|vegetari|alerg|muestra|mostrar|muestrame|muéstrame|ensena|enseña|ensename|enséñame|ver las|ver los|lista|cuales|cuáles|que tienes|qué tienes|que venden|qué venden|las pizzas|solo ver|quiero ver/.test(
                qn,
              );
            // Guardar aprendizaje si el usuario pidió ver/mostrar (no comprar)
            if (isInfoQuestion && /muestra|mostrar|ver |lista|ensena|enseña/.test(qn)) {
              try {
                edge({
                  action: "ia_aprendizaje_save",
                  frase: String(msg || "").slice(0, 120),
                  intencion: "mostrar_catalogo",
                  significado: "Solo mostrar productos en franja, NO agregar al carrito",
                  contexto_ejemplo: "muestra las pizzas / ver gaseosas / lista de productos",
                }).catch(function () {});
              } catch (_) {}
            }
            if (
              typeof isShowOnlyIntent === "function" &&
              isShowOnlyIntent(msg)
            ) {
              /* no comprar */
            } else if (
              !isInfoQuestion &&
              (qn.length <= 28 || Object.keys(state.cart || {}).length > 0) &&
              !/\b(que|qué|como|cómo|cual|cuál|porque|por que|por qué)\b/.test(qn)
            )
              buy = true;
          }

          // Pago solo por carrito
          {
            const qPay = String(msg || "")
              .toLowerCase()
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "")
              .trim();
            if (
              /^(efectivo|tarjeta|yape|plin|transferencia|con efectivo|con tarjeta)\s*[.?]?$/.test(qPay) ||
              (/\b(efectivo|tarjeta|yape|plin)\b/.test(qPay) && /pagar|pago|cobr/.test(qPay))
            ) {
              const n = typeof cartCount === "function" ? cartCount() : Object.keys(state.cart || {}).length;
              const reply = n
                ? "El pago se hace desde el carrito. Toca el ícono del carrito arriba y luego «Ir a pagar»."
                : "Aún no hay productos en tu carrito. Dime qué quieres (ej. una pizza y una gaseosa) o elige en el carrito.";
              pushInline("bot", reply);
              speakReply(reply);
              state.chatByCode[ck].push({ role: "assistant", content: reply });
              return;
            }
          }
          
          const wantsPrice = /precio|vale|valor|cuesta|cu[aá]nto|costo|tarifa/.test(
            String(msg || "").toLowerCase()
          );

          // Precios desde tabla productos (local, exacto)
          if (wantsPrice && !matched.empty) {
            const list = matched.list.length ? matched.list : matched.all;
            if (list.length === 1) {
              const pr = list[0];
              const mon =
                pr.moneda === "USD" || pr.moneda === "$"
                  ? "$"
                  : pr.moneda === "EUR" || pr.moneda === "€"
                    ? "€"
                    : "S/";
              const reply =
                pr.id +
                " cuesta " +
                mon +
                " " +
                Number(pr.precio || 0).toFixed(2) +
                (pr.stock != null ? " (stock: " + pr.stock + ")" : "") +
                (mon === "S/"
                  ? " (soles peruanos)"
                  : mon === "$"
                    ? " (dólares americanos)"
                    : "") +
                ".";
              pushInline("bot", reply);
              speakReply(reply);
              state.chatByCode[ck].push({ role: "assistant", content: reply });
              renderProductCards([pr], p);
              return;
            }
            if (list.length > 1) {
              let reply = "Estos son los precios:\n";
              list.slice(0, 12).forEach((pr) => {
                reply +=
                  "• " +
                  pr.id +
                  ": S/ " +
                  Number(pr.precio || 0).toFixed(2) +
                  "\n";
              });
              pushInline("bot", reply.trim());
              speakReply("Te paso los precios de los productos.");
              state.chatByCode[ck].push({ role: "assistant", content: reply.trim() });
              {
                let showList = list.slice(0, 10);
                if (typeof filterProductsByTopic === "function")
                  showList = filterProductsByTopic(list, msg).slice(0, 8);
                if (showList.length) renderProductCards(showList, p, { withSuggestions: false });
              }
              return;
            }
          }

          // Conversación normal: NO mostrar fotos salvo que pida catálogo o un producto
          if (buy) {
            const qnBuy = String(msg || "")
              .toLowerCase()
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "");
            const wantsAll =
              /uno de cada|una de cada|de cada uno|los dos|las dos|ambos|ambas|todo eso|todas esas|los dos uno|uno y uno/.test(
                qnBuy,
              );

            // lista candidata: matches del mensaje o últimos productos mostrados en el chat
            let candidates = [];
            if (!matched.empty && matched.list && matched.list.length) candidates = matched.list.slice();
            else if (Array.isArray(state.lastChatProducts) && state.lastChatProducts.length)
              candidates = state.lastChatProducts.slice();
            // "dame una" / "ya dame" sin nombre → último producto hablado
            if (
              !candidates.length &&
              /ya dame|dame una|dame un|esa misma|ese mismo|me la llevo|me lo llevo/.test(qnBuy) &&
              Array.isArray(state.lastChatProducts) &&
              state.lastChatProducts.length
            ) {
              candidates = [state.lastChatProducts[0]];
            }
            // ampliar candidatos si el mensaje pide varios (y / con)
            try {
              if (/\s+y\s+|\s+con\s+|uno de cada|los dos/.test(qnBuy)) {
                const pool =
                  (matched.all && matched.all.length
                    ? matched.all
                    : typeof products === "function"
                      ? (products(p) || []).map((x) => {
                          const meta = parseProductMeta(x);
                          return {
                            id: meta.name || x.descripcion || x.nombre || "Producto",
                            precio: Number(x.precio || 0),
                            foto: resolveProductFoto(meta.foto || x.foto || ""),
                            stock:
                              x.stock != null && x.stock !== "" ? Number(x.stock) : null,
                            moneda: x.moneda || "PEN",
                            raw: x,
                          };
                        })
                      : []) || [];
                const seen = new Set(
                  candidates.map((c) => String(c.id || "").toLowerCase()),
                );
                pool.forEach((pr) => {
                  const id = String(pr.id || "").toLowerCase();
                  if (id && !seen.has(id)) {
                    candidates.push(pr);
                    seen.add(id);
                  }
                });
              }
            } catch (_) {}

            // "uno de cada uno" sin nombres: usar últimos mostrados o todos si son pocos
            if (wantsAll && candidates.length < 2) {
              const allP = (typeof products === "function" ? products(p) : []).map((x) => {
                const meta = parseProductMeta(x);
                return {
                  id: meta.name || x.descripcion || x.nombre || "Producto",
                  precio: Number(x.precio || meta.precio || 0),
                  foto: resolveProductFoto(meta.foto || x.foto || ""),
                  stock: x.stock != null && x.stock !== "" ? Number(x.stock) : null,
                  moneda: x.moneda || meta.moneda || "PEN",
                  raw: x,
                };
              });
              if (allP.length && allP.length <= 6) candidates = allP;
            }

            // Productos cuyo nombre aparece en el mensaje (gaseosa + pan al ajo, etc.)
            const normId = (s) =>
              String(s || "")
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "");
            const namedInMsg = (candidates.length ? candidates : []).filter((pr) => {
              const n = normId(pr.id);
              if (!n || n.length < 2) return false;
              if (qnBuy.includes(n)) return true;
              const tokens = n.split(/\s+/).filter((t) => t.length > 2);
              // al menos un token significativo del nombre en el mensaje
              const hits = tokens.filter((t) => qnBuy.includes(t));
              return hits.length >= 1 && (tokens.length === 1 || hits.length >= Math.min(2, tokens.length) || hits.some((t) => t.length >= 4));
            });
            // "y" / "con" entre varios → pedido múltiple
            const multiIntent =
              wantsAll ||
              namedInMsg.length >= 2 ||
              (/\s+y\s+|\s+con\s+|,\s*/.test(qnBuy) && namedInMsg.length >= 2);

            const addMany = (list) => {
              const added = [];
              (list || []).slice(0, 10).forEach((pr) => {
                const r = addToCartSafe(pr, 1, p);
                if (r && !r.error) added.push(pr.id || "Producto");
                else if (r && r.msg) added.push(pr.id || "Producto");
                else added.push(pr.id || "Producto");
              });
              try {
                mountCartFab(p);
                saveCartState(p);
              } catch (_) {}
              const names = added.join(" y ");
              const reply =
                "Listo: agregué al carrito " +
                names +
                ". Revisa el carrito (ícono arriba) y toca «Ir a pagar» cuando quieras confirmar.";
              pushInline("bot", reply);
              speakReply("Listo, agregué " + names + " al carrito.");
              try {
                state.chatByCode[ck].push({ role: "assistant", content: reply });
              /* chat no se guarda */;
              } catch (_) {}
              renderProductCards(list.slice(0, 10), p, { withSuggestions: false });
            };

            // Pedido compuesto: "una gaseosa y una pizza" → 1 por tramo; si hay 2+ pizzas, preguntar
            if (buy && !wantsAll && (/\s+y\s+|\s+con\s+|,\s*/i.test(String(msg || "")))) {
              const segs = String(msg || "")
                .split(/\s+y\s+|\s+con\s+|,/i)
                .map((s) => s.trim())
                .filter((s) => s.length > 1);
              const pool =
                (matched && matched.all && matched.all.length
                  ? matched.all
                  : typeof products === "function"
                    ? (products(p) || []).map((x) => {
                        const meta = parseProductMeta(x);
                        return {
                          id: meta.name || x.descripcion || x.nombre || "Producto",
                          precio: Number(x.precio || 0),
                          foto: resolveProductFoto(meta.foto || x.foto || ""),
                          stock: x.stock != null && x.stock !== "" ? Number(x.stock) : null,
                          moneda: x.moneda || "PEN",
                          raw: x,
                        };
                      })
                    : []) || [];
              const matchSeg = (seg) => {
                const qs = normId(seg);
                const stop = new Set(
                  "quiero,quisiera,dame,una,un,unas,unos,me,la,el,los,las,por,favor,pido,agrega,anade,añade".split(
                    ",",
                  ),
                );
                const words = qs.split(/\s+/).filter((w) => w.length > 2 && !stop.has(w));
                if (!words.length) return [];
                return pool.filter((pr) => {
                  const n = normId(pr.id);
                  return words.some((w) => n.includes(w));
                });
              };
              if (segs.length >= 2) {
                const toAddList = [];
                const ambiguous = [];
                segs.forEach((seg) => {
                  const hits = matchSeg(seg);
                  if (hits.length === 1) toAddList.push(hits[0]);
                  else if (hits.length > 1) ambiguous.push({ seg: seg, hits: hits });
                });
                if (ambiguous.length) {
                  let reply = "";
                  if (toAddList.length) {
                    toAddList.forEach((pr) => {
                      try {
                        addToCartSafe(pr, 1, p);
                      } catch (_) {}
                    });
                    try {
                      mountCartFab(p);
                      saveCartState(p);
                    } catch (_) {}
                    reply =
                      "Agregué: " +
                      toAddList.map((x) => x.id).join(", ") +
                      ".\n";
                  }
                  ambiguous.forEach((a) => {
                    reply +=
                      "Para «" +
                      a.seg +
                      "» tengo varias opciones. ¿Cuál quieres?\n" +
                      a.hits
                        .slice(0, 8)
                        .map(
                          (pr) =>
                            "• " +
                            pr.id +
                            " — S/ " +
                            Number(pr.precio || 0).toFixed(2),
                        )
                        .join("\n") +
                      "\n";
                  });
                  pushInline("bot", reply.trim());
                  speakReply("Dime cuál de las opciones quieres.");
                  try {
                    state.chatByCode[ck].push({
                      role: "assistant",
                      content: reply.trim(),
                    });
                  } catch (_) {}
                  const show = ambiguous.flatMap((a) => a.hits).slice(0, 10);
                  if (show.length)
                    renderProductCards(show, p, { withSuggestions: false });
                  return;
                }
                if (toAddList.length) {
                  addMany(toAddList);
                  return;
                }
              }
            }

            // Solo "uno de cada" agrega varios del mismo tipo
            if (multiIntent && wantsAll && candidates.length >= 2) {
              addMany(candidates.slice(0, 8));
              return;
            }

            // Varias coincidencias de la misma familia (ej. 2 pizzas) → preguntar
            if (namedInMsg.length >= 2 && !wantsAll) {
              const words = qnBuy
                .split(/\s+/)
                .filter(
                  (w) =>
                    w.length > 3 &&
                    !/quiero|dame|unas|unos|agrega|anade|añade|pedido/.test(w),
                );
              const family = words.find((w) =>
                namedInMsg.every((pr) => normId(pr.id).includes(w)),
              );
              if (family) {
                const reply =
                  "Tengo varias opciones de " +
                  family +
                  ". ¿Cuál deseas?\n" +
                  namedInMsg
                    .slice(0, 8)
                    .map(
                      (pr) =>
                        "• " +
                        pr.id +
                        " — S/ " +
                        Number(pr.precio || 0).toFixed(2),
                    )
                    .join("\n");
                pushInline("bot", reply);
                speakReply("¿Cuál de estas opciones quieres?");
                try {
                  state.chatByCode[ck].push({ role: "assistant", content: reply });
                } catch (_) {}
                renderProductCards(namedInMsg.slice(0, 8), p, {
                  withSuggestions: false,
                });
                return;
              }
              if (multiIntent) {
                addMany(namedInMsg);
                return;
              }
            }

            let toAdd = null;
            if (namedInMsg.length === 1) toAdd = namedInMsg[0];
            else if (candidates.length === 1) toAdd = candidates[0];
            else if (candidates.length > 1) {
              const words = qnBuy.split(/\s+/).filter((w) => w.length > 2);
              let best = null;
              let bestScore = 0;
              candidates.forEach((pr) => {
                const n = normId(pr.id);
                let sc = 0;
                words.forEach((w) => {
                  if (n.includes(w)) sc += w.length;
                });
                if (sc > bestScore) {
                  bestScore = sc;
                  best = pr;
                }
              });
              toAdd = bestScore > 0 ? best : null;
              if (!toAdd) {
                pushInline(
                  "bot",
                  "¿Cuál agrego al carrito? Toca uno o dime el nombre:\n" +
                    candidates
                      .slice(0, 8)
                      .map((pr) => "• " + pr.id + " — S/ " + Number(pr.precio || 0).toFixed(2))
                      .join("\n"),
                );
                renderProductCards(candidates.slice(0, 8), p, { withSuggestions: false });
                return;
              }
            } else {
              const allP = (typeof products === "function" ? products(p) : []).map((x) => {
                const meta = parseProductMeta(x);
                return {
                  id: meta.name || x.descripcion || x.nombre || "Producto",
                  precio: Number(x.precio || 0),
                  foto: resolveProductFoto(meta.foto || x.foto || ""),
                  stock: x.stock != null && x.stock !== "" ? Number(x.stock) : null,
                  moneda: x.moneda || "PEN",
                  raw: x,
                };
              });
              if (allP.length === 1) toAdd = allP[0];
            }
            if (toAdd) {
              const r = addToCartSafe(toAdd, matched.qty || 1, p);
              try { mountCartFab(p); saveCartState(p); } catch (_) {}
              const replyAdd =
                r.msg +
                " Usa el carrito (ícono arriba) para ver el total e «Ir a pagar». ¿Te sugiero algo más?";
              pushInline("bot", replyAdd);
              speakReply(r.msg);
              state.chatByCode[ck].push({ role: "assistant", content: replyAdd });
              // Producto pedido + hasta 2 sugerencias (ej. gaseosas)
              renderProductCards([toAdd], p, { withSuggestions: true, suggestLimit: 2 });
              return;
            }
            if (!matched.empty && matched.list.length > 1) {
              // mostrar opciones para elegir
              const list = matched.list.slice(0, 8);
              pushInline(
                "bot",
                "¿Cuál agrego? Toca uno o dime el nombre:\n" +
                  list.map((pr) => "• " + pr.id + " — S/ " + Number(pr.precio || 0).toFixed(2)).join("\n"),
              );
              renderProductCards(list, p);
              return;
            }
            // sin productos en BD
            const allP2 = typeof products === "function" ? products(p) : [];
            if (!allP2.length) {
              const reply =
                "Aún no hay productos cargados en la sala de productos de este WebPocket. El negocio debe agregarlos en su panel (Carrito → Productos).";
              pushInline("bot", reply);
              speakReply(reply);
              state.chatByCode[ck].push({ role: "assistant", content: reply });
              return;
            }
          }

          if (!matched.empty && (catalog || (buy && matched.list.length > 1) || /detalle|detalles|info|informaci[oó]n|caracter/.test(String(msg||"").toLowerCase()))) {
            const list = (matched.list.length ? matched.list : matched.all).slice(0, 12);
            // Respuesta local con datos reales de la tabla productos (siempre disponible)
            const localDetail = list
              .map((pr) => {
                let line = "• " + pr.id + " — S/ " + Number(pr.precio || 0).toFixed(2);
                if (pr.stock != null) line += " (stock: " + pr.stock + ")";
                return line;
              })
              .join("\n");
            let reply =
              list.length === 1
                ? ("Vendemos " + list[0].id + " a S/ " + Number(list[0].precio || 0).toFixed(2) +
                  (list[0].stock != null ? ". Stock disponible: " + list[0].stock + "." : ".") +
                  " Si quieres, te la agrego al carrito.")
                : ("Esto es lo que tenemos:\n" + localDetail + "\n¿Cuál te interesa?");
            try {
              if (typeof send === "function") {
                const cat = list.map((x) => ({
                  nombre: x.id,
                  precio: x.precio,
                  stock: x.stock,
                  descripcion: x.id,
                }));
                // enriquecer el mensaje para que la IA use catálogo + prompt + conocimiento
                const enriched =
                  msg +
                  "\n\n[DATOS REALES DEL CATÁLOGO]\n" +
                  localDetail +
                  "\nResponde con detalle usando el prompt y el conocimiento del negocio, en español, como vendedor humano. No digas solo 'toca una foto'.";
                try { avatarOnThinking(); } catch (_) {}
                const r = await send(
                  buildChatPayload(p, enriched, {
                    products: cat,
                    productos: cat,
                    carrito_activo: true,
                  }),
                );
                const ai = (r && (r.reply || r.respuesta || r.message) || "").trim();
                // si la IA contestó algo útil (no genérico vacío), usarla
                if (ai && ai.length > 20 && !/toca una foto/i.test(ai)) {
                  reply = ai;
                } else if (ai && ai.length > 8) {
                  reply = ai + "\n\n" + localDetail;
                }
              }
            } catch (_) {}
            pushInline("bot", reply);
            speakReply(reply);
            {
              let showList = list || [];
              if (typeof isShowOnlyIntent === "function" && isShowOnlyIntent(msg)) {
                // si dice "muéstramelas" sin tema, usar último tema (ej. pizzas)
                let topicMsg = msg;
                if (
                  /muestramelas|muestralas|muestremelas|mostrarmelas|muestramelos|muestralos/i.test(
                    String(msg || "").replace(/\s+/g, ""),
                  ) &&
                  state._lastProductTopic
                ) {
                  topicMsg = state._lastProductTopic + " " + msg;
                }
                showList =
                  typeof filterProductsByTopic === "function"
                    ? filterProductsByTopic(showList, topicMsg)
                    : showList;
                if (!showList.length && state._lastProductTopic && typeof matchProducts === "function") {
                  const m2 = matchProducts(state._lastProductTopic, p);
                  showList = (m2 && m2.list) || [];
                }
                // guardar aprendizaje mostrar
                try {
                  edge({
                    action: "ia_aprendizaje_save",
                    frase: String(msg || "").slice(0, 160),
                    intencion: "mostrar_catalogo",
                    significado:
                      "Mostrar solo productos filtrados por tema de la frase; NO agregar al carrito",
                    contexto_ejemplo: "quiero que me muestres pizzas / ver gaseosas",
                  }).catch(function () {});
                } catch (_) {}
              }
              if (showList && showList.length)
                renderProductCards(showList.slice(0, 8), p, { withSuggestions: false });
            }
            state.chatByCode[ck].push({ role: "assistant", content: reply });
            return;
          }

          if (matched.empty && (catalog || buy)) {
            const reply = "Por ahora no hay productos cargados en este WebPocket.";
            pushInline("bot", reply);
            speakReply(reply);
            state.chatByCode[ck].push({ role: "assistant", content: reply });
            return;
          }

          // Solo conversar (sin carrusel) — pero la IA recibe el catálogo de productos
          let reply = "Cuéntame en qué te ayudo.";
          try {
            if (typeof send === "function") {
              const cat = (matched.all || []).map((x) => ({
                nombre: x.id,
                precio: x.precio,
                stock: x.stock,
              }));
              try { avatarOnThinking(); } catch (_) {}
              const r = await send(
                buildChatPayload(p, msg, {
                  products: cat,
                  productos: cat,
                  carrito_activo: cat.length > 0,
                }),
              );
              reply = (r && (r.reply || r.respuesta || r.message)) || reply;
            } else {
              const names = (matched.all || []).slice(0, 3).map((x) => x.id);
              reply = names.length
                ? ("¡Hola! Vendo " + names.join(", ") +
                   (names.length === 1 && matched.all[0]
                     ? (" a S/ " + Number(matched.all[0].precio || 0).toFixed(2))
                     : "") +
                   ". ¿Te cuento más?")
                : "¡Hola! ¿En qué te ayudo?";
            }
          } catch (err) {
            const names = (matched.all || []).slice(0, 3).map((x) => x.id);
            reply = names.length
              ? ("¡Hola! Vendo " + names.join(", ") + ". ¿Qué te gustaría saber?")
              : "¡Hola! ¿En qué te ayudo?";
            console.warn("chat error", err);
          }
          pushInline("bot", reply);
          speakReply(reply);
          state.chatByCode[ck].push({ role: "assistant", content: reply });
        };

        const syncChatAction = () => {
          const inp = app.querySelector("#inline-chat-input");
          const btn = app.querySelector("[data-inline-action]");
          if (!btn) return;
          const has = !!(inp && String(inp.value || "").trim());
          btn.classList.toggle("is-send", has);
          btn.classList.toggle("is-mic", !has);
          const micI = btn.querySelector(".ica-mic");
          const sendI = btn.querySelector(".ica-send");
          if (micI) micI.hidden = has;
          if (sendI) sendI.hidden = !has;
          btn.title = has ? "Enviar" : "Hablar";
        };
        app.querySelector("#inline-chat-input")?.addEventListener("input", syncChatAction);
        app.querySelector("#inline-chat-input")?.addEventListener("keyup", syncChatAction);
        syncChatAction();

        // Restaurar conversación del dispositivo (no se borra al cambiar de sección)
        try {
          const pR = state.profiles[state.index] || {};
          const ckR = String(pR.codigo_cliente || pR.codigo || state.qr || "anon");
          if (!state.chatByCode) state.chatByCode = {};
          if (!state.chatByCode[ckR] || !state.chatByCode[ckR].length) {
            const raw = null;
            if (raw) state.chatByCode[ckR] = JSON.parse(raw) || [];
          }
          const logEl = app.querySelector("#inline-chat-log");
          const histR = state.chatByCode[ckR] || [];
          if (logEl && histR.length && !logEl.dataset.restored) {
            logEl.innerHTML = "";
            histR.slice(-40).forEach((m) => {
              const role = m.role === "assistant" || m.role === "bot" ? "bot" : "user";
              const div = document.createElement("div");
              div.className = "bubble " + role;
              div.textContent = m.content || "";
              logEl.appendChild(div);
            });
            logEl.dataset.restored = "1";
            logEl.scrollTop = logEl.scrollHeight;
          }
        } catch (_) {}

        app.querySelector("[data-chat-open-cart]")?.addEventListener("click", () => {
          state.panel = "cart";
          state.cartView = "cart";
          state.showNamePay = false;
          render();
        });
        app.querySelector("[data-chat-clear]")?.addEventListener("click", () => {
          try {
            const pC = state.profiles[state.index] || {};
            const ckC = String(pC.codigo_cliente || pC.codigo || state.qr || "anon");
            if (state.chatByCode) state.chatByCode[ckC] = [];
            sessionStorage.removeItem("wp_chat_" + ckC);
            const logEl = app.querySelector("#inline-chat-log");
            if (logEl) {
              logEl.innerHTML = "";
              delete logEl.dataset.restored;
            }
            if (typeof appAlert === "function") void appAlert("Chat limpiado. La conversación empezó de cero.");
          } catch (_) {}
        });

        app.querySelectorAll("[data-svc-ask], .svc-ask").forEach((btn) => {
          btn.addEventListener("click", () => {
            const name = btn.getAttribute("data-svc-name") || "este servicio";
            state.panel = "chat";
            render();
            setTimeout(() => {
              try {
                const inp = document.getElementById("inline-chat-input");
                if (inp) {
                  inp.value = "Cuéntame sobre " + name;
                  inp.focus();
                }
              } catch (_) {}
            }, 120);
          });
        });

        app.querySelector("[data-inline-action]")?.addEventListener("click", () => {
          const inp = app.querySelector("#inline-chat-input");
          if (inp && String(inp.value || "").trim()) sendInline();
          else if (typeof window.startMicInline === "function") window.startMicInline();
        });
        app.querySelector("#inline-chat-input")?.addEventListener("keydown", (e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            sendInline();
          }
        });

        window.startMicInline = () => {
          const micBtn = app.querySelector("[data-inline-action]") || app.querySelector("[data-inline-mic]");
          const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
          if (!SR) {
            alert("Tu navegador no soporta dictado por voz. Escribe el mensaje.");
            return;
          }
          try {
            if (!state._audioUnlocked && window.speechSynthesis) {
              const u = new SpeechSynthesisUtterance(" ");
              u.volume = 0;
              window.speechSynthesis.speak(u);
              window.speechSynthesis.cancel();
              state._audioUnlocked = true;
            }
          } catch (_) {}
          if (state._micRec) {
            try {
              state._micRec.onresult = null;
              state._micRec.onend = null;
              state._micRec.stop();
            } catch (_) {}
            state._micRec = null;
            if (state._micTimer) {
              clearTimeout(state._micTimer);
              state._micTimer = null;
            }
            if (micBtn) micBtn.classList.remove("is-recording", "recording");
            return;
          }
          const isMobile =
            /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) ||
            (navigator.maxTouchPoints > 1 && /Mac/i.test(navigator.platform));
          const rec = new SR();
          rec.lang = "es-PE";
          rec.continuous = isMobile ? false : true;
          rec.interimResults = true;
          state._micRec = rec;
          state._micText = "";
          state._micSent = false;
          if (state._micTimer) {
            clearTimeout(state._micTimer);
            state._micTimer = null;
          }
          if (micBtn) micBtn.classList.add("is-recording", "recording");
          const finishSend = () => {
            if (state._micSent) return;
            state._micSent = true;
            if (state._micTimer) {
              clearTimeout(state._micTimer);
              state._micTimer = null;
            }
            try {
              rec.onresult = null;
              rec.onend = null;
              rec.stop();
            } catch (_) {}
            state._micRec = null;
            if (micBtn) micBtn.classList.remove("is-recording", "recording");
            const input = app.querySelector("#inline-chat-input");
            const t = (state._micText || (input && input.value) || "").trim();
            if (input) input.value = t;
            state._micText = "";
            if (t) {
              try {
                sendInline();
              } finally {
                if (input) input.value = "";
                try {
                  const b = app.querySelector("[data-inline-action]");
                  if (b) {
                    b.classList.remove("is-send");
                    const micI = b.querySelector(".ica-mic");
                    const sendI = b.querySelector(".ica-send");
                    if (micI) micI.hidden = false;
                    if (sendI) sendI.hidden = true;
                  }
                } catch (_) {}
              }
            }
          };
          rec.onresult = (ev) => {
            let interim = "";
            let finalChunk = "";
            for (let k = 0; k < ev.results.length; k++) {
              const r = ev.results[k];
              const tr = (r[0] && r[0].transcript) || "";
              if (r.isFinal) finalChunk += tr;
              else interim += tr;
            }
            if (finalChunk) {
              if (isMobile) state._micText = finalChunk.trim();
              else state._micText = (state._micText + " " + finalChunk).trim();
            }
            const shown = (state._micText + (interim ? " " + interim : "")).trim();
            const input = app.querySelector("#inline-chat-input");
            if (input) input.value = shown;
            if (state._micTimer) clearTimeout(state._micTimer);
            const wait = isMobile ? (finalChunk ? 900 : 1500) : 1500;
            state._micTimer = setTimeout(finishSend, wait);
          };
          rec.onerror = () => {
            if (state._micTimer) clearTimeout(state._micTimer);
            state._micTimer = null;
            if (micBtn) micBtn.classList.remove("is-recording", "recording");
            state._micRec = null;
          };
          rec.onend = () => {
            if (!state._micSent && (state._micText || "").trim()) {
              if (state._micTimer) clearTimeout(state._micTimer);
              state._micTimer = setTimeout(finishSend, 200);
            } else {
              if (micBtn) micBtn.classList.remove("is-recording", "recording");
              state._micRec = null;
            }
          };
          try {
            rec.start();
          } catch (_) {
            if (micBtn) micBtn.classList.remove("is-recording", "recording");
            state._micRec = null;
          }
        };
        app.querySelector("[data-inline-action]")?.addEventListener("wp-mic", startMicInline);
        // click del botón unificado ya maneja envío; mic vía wp-mic cuando vacío
        // por si quedó data-inline-mic
        app.querySelector("[data-inline-mic]")?.addEventListener("click", startMicInline);
app.querySelectorAll(".menu-slot-cart, .menu-slot-chat").forEach((el) => {
          el.addEventListener("click", () => {
            state.panel = el.getAttribute("data-panel") || "products";
            render();
          });
        });

        app.querySelector("#chat-form")?.addEventListener("submit", async (e) => {
          e.preventDefault();
          const input = e.currentTarget.querySelector('[name="msg"]');
          const msg = (input?.value || "").trim();
          if (!msg) return;
          const p = state.profiles[state.index] || {};
          const ck = String(p.codigo_cliente || p.codigo || state.qr || code(p) || "anon");
          if (!state.chatByCode) state.chatByCode = {};
          if (!state.chatByCode[ck]) {
            try {
              const raw = null;
              state.chatByCode[ck] = raw ? JSON.parse(raw) : [];
            } catch (_) {
              state.chatByCode[ck] = [];
            }
          }
          const hist = state.chatByCode[ck];
          const box = app.querySelector("#chat-box");
          if (box) {
            box.innerHTML += `<div class="bubble user">${esc(msg)}</div>`;
            box.innerHTML += `<div class="typing-dots" id="chat-typing" aria-label="Escribiendo"><span></span><span></span><span></span></div>`;
            box.scrollTop = box.scrollHeight;
          }
          hist.push({ role: "user", content: msg });
          input.value = "";
          input.disabled = true;
          try {
            const iaPrompt = p.ia_prompt || (() => { try { return JSON.parse(p.estilo_marco||"{}").ia_prompt||""; } catch { return ""; } })();
            const iaKnow = p.ia_conocimiento || (() => { try { return JSON.parse(p.estilo_marco||"{}").ia_conocimiento||""; } catch { return ""; } })();
            const prods = products(p).map((x) => ({
              id: x.id || x.codigo || "",
              nombre: x.nombre || x.name || x.titulo || "",
              precio: x.precio != null ? x.precio : x.price,
              stock: x.stock,
              descripcion: x.descripcion || x.desc || "",
            })).filter((x) => x.nombre);
            const r = await edge({
              action: "chat",
              message: msg,
              codigoCliente: ck,
              codigo_cliente: ck,
              prompt: iaPrompt || p.prompt || "",
              knowledge: iaKnow || p.conocimiento || "",
              history: hist.slice(-12).map((m) => ({ role: m.role, content: m.content })),
              products: prods,
              carrito_activo: prods.length > 0,
            });
            const typing = app.querySelector("#chat-typing");
            if (typing) typing.remove();
            let reply = String(r.reply || r.message || r.answer || "Sin respuesta");
            reply = reply.replace(/\[PRODUCTO:\s*([^\]]+)\]/gi, "$1").trim();
            let suggested = Array.isArray(r.products) ? r.products : [];
            if (!suggested.length && prods.length) {
              const low = reply.toLowerCase();
              const offers =
                /agreg|carrito|te recomiendo|también|tambien|puedes pedir|opciones|disponible/.test(
                  low,
                );
              if (offers) {
                suggested = prods
                  .filter((pr) => {
                    const n = String(pr.nombre || pr.id || "").toLowerCase();
                    return n.length >= 3 && low.includes(n);
                  })
                  .slice(0, 2);
              }
            }
            hist.push({ role: "assistant", content: reply, products: suggested });
              /* chat no se guarda */;
            if (box) {
              let html = `<div class="bubble bot">${esc(reply)}</div>`;
              if (suggested.length || prods.length) {
                html += '<div class="chat-prod-links">';
                suggested.forEach((pr) => {
                  html += '<button type="button" class="chat-prod-btn" data-panel="products" data-product-hint="' +
                    esc(pr.nombre || "") + '">' + esc(pr.nombre || "Producto") +
                    (pr.precio != null ? " · " + esc(String(pr.precio)) : "") + "</button>";
                });
                if (prods.length) {
                  html += '<button type="button" class="chat-prod-btn" data-panel="cart" style="background:#0f766e">Ver mi pedido</button>';
                }
                html += "</div>";
              }
              box.innerHTML += html;
              box.scrollTop = box.scrollHeight;
              box.querySelectorAll(".chat-prod-btn").forEach((btn) => {
                btn.addEventListener("click", () => {
                  state.panel = "products";
                  state.productHint = btn.getAttribute("data-product-hint") || "";
                  render();
                });
              });
            }
          } catch (err) {
            const typing = app.querySelector("#chat-typing");
            if (typing) typing.remove();
            if (box) box.innerHTML += `<div class="bubble bot">${esc(err.message || "Error")}</div>`;
          }
          input.disabled = false;
          input.focus();
        });

        
        app.querySelectorAll("[data-panel]").forEach((x) =>
          x.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            // NO activar audio al cambiar de sección
            const pan = x.getAttribute("data-panel") || x.dataset.panel;
            state.panel = !pan || pan === "none" ? null : pan;
            if (pan === "products") {
              state.cartView = "catalog";
              state.panel = "products";
              const p0 = state.profiles[state.index] || {};
              render();
              // siempre refrescar catálogo desde el servidor
              ensureProductsLoaded(p0).then((list) => {
                if (state.panel === "products") render();
              });
              return;
            }
            if (pan === "cart") state.cartView = "checkout";
            render();
          }),
        );
        app.querySelectorAll("[data-go-home]").forEach((b) => {
          b.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            state.panel = null;
            render();
          };
        });
        app.querySelectorAll("[data-close]").forEach((x) =>
          x.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            state.panel = null;
            render();
          }),
        );
        app.querySelector("[data-go-home]")?.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          state.panel = null;
          try { clearProdFloat(); } catch (_) {}
          render();
        });
        app.querySelector("[data-next]")?.addEventListener("click", () => {
          if (!state.profiles.length) return;
          state.index = (state.index + 1) % state.profiles.length;
          state.panel = null;
          render();
        });
        app.querySelectorAll("[data-profile]").forEach((x) =>
          x.addEventListener("click", () => {
            state.index = Number(x.dataset.profile);
            state.panel = null;
            render();
          }),
        );
        app.querySelectorAll("[data-faq-toggle]").forEach((btn) =>
          btn.addEventListener("click", (ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            const item = btn.closest(".faq-item");
            if (!item) return;
            const wasOpen = item.classList.contains("open");
            app.querySelectorAll(".faq-item").forEach((x) => {
              x.classList.remove("open");
              const sp = x.querySelector("[data-faq-toggle] span");
              if (sp) sp.textContent = "+";
            });
            if (!wasOpen) {
              item.classList.add("open");
              const sp = btn.querySelector("span");
              if (sp) sp.textContent = "−";
            }
          }),
        );
        app.querySelectorAll("[data-exp-toggle]").forEach((btn) =>
          btn.addEventListener("click", (ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            const item = btn.closest(".exp-item");
            if (!item) return;
            const wasOpen = item.classList.contains("open");
            app.querySelectorAll(".exp-item").forEach((x) => {
              x.classList.remove("open");
              const sp = x.querySelector("[data-exp-toggle] span");
              if (sp) sp.textContent = "+";
            });
            if (!wasOpen) {
              item.classList.add("open");
              const sp = btn.querySelector("span");
              if (sp) sp.textContent = "−";
            }
          }),
        );
        app.querySelector("[data-share-cv]")?.addEventListener("click", async () => {
          const p = state.profiles[state.index];
          const fileUrl = cvFile(p);
          if (!fileUrl) {
            alert("Este perfil aún no tiene un archivo CV subido.");
            return;
          }
          try {
            const res = await fetch(fileUrl, { mode: "cors" });
            const blob = await res.blob();
            const name =
              (title(p) || "CV").replace(/\s+/g, "_") +
              (blob.type.includes("pdf")
                ? ".pdf"
                : blob.type.includes("word")
                  ? ".doc"
                  : ".pdf");
            const file = new File([blob], name, {
              type: blob.type || "application/pdf",
            });
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
              await navigator.share({
                files: [file],
                title: "CV de " + title(p),
                text: "Curriculum de " + title(p),
              });
              return;
            }
            // fallback: descargar archivo (no solo el enlace)
            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = name;
            document.body.appendChild(a);
            a.click();
            a.remove();
            alert("Tu navegador no comparte archivos: se descargó el CV para que lo envíes en redes.");
          } catch (err) {
            // último recurso: abrir archivo
            window.open(fileUrl, "_blank");
            alert("No se pudo compartir el archivo directamente. Se abrió para que lo guardes y compartas.");
          }
        });
        app.querySelector("[data-download-cv]")?.addEventListener("click", () => {
          const p = state.profiles[state.index];
          const file = cvFile(p);
          if (!file) {
            alert("Este perfil aún no tiene un archivo CV subido.");
            return;
          }
          const a = document.createElement("a");
          a.href = file;
          a.target = "_blank";
          a.rel = "noopener";
          a.download = "";
          document.body.appendChild(a);
          a.click();
          a.remove();
        });
      }
      pocket.addEventListener("click", (ev) => {
        if (ev.target.closest("[data-next]")) {
          if (!state.profiles.length) return;
          state.index = (state.index + 1) % state.profiles.length;
          state.panel = null;
          render();
        }
      });
      async function init() {
        showLoader(qrCode ? "CARGANDO PERFIL…" : "CARGANDO EJEMPLOS…");
        try {
          let d = { formatos: [], clientes: [], productos: [], preguntas: [], enlaces: [] };
          try {
            d = await edge({ action: "public_content" });
          } catch (e) {
            console.warn("public_content", e);
          }
          state.formats = d.formatos?.length ? d.formatos : FALLBACK;
          state.service = Boolean(d.ia);
          state.products = d.productos || d.products || [];
          try {
            const plist = state.profiles || d.perfiles || d.profiles || [];
            const cur = plist[state.index] || plist[0] || d.perfil || d.cliente;
            if (cur) void trackVisita(cur);
          } catch (_) {}
          state.valoraciones = d.valoraciones || [];
          state.questions = d.preguntas || [];
          state.links = d.enlaces || [];

          if (qrCode) {
            let one = null;
            try {
              one = await edge({
                action: "public_profile",
                codigo_cliente: qrCode,
                perfil: qrCode,
              });
            } catch (e) {
              console.warn("public_profile", e);
              one = null;
            }
            let profile =
              one?.profile ||
              one?.cliente ||
              one?.client ||
              (d.clientes || []).find(
                (item) => String(item.codigo_cliente) === String(qrCode),
              ) ||
              null;
            if (!profile || !profile.codigo_cliente) {
              throw Error(
                one?.error ||
                  "El perfil QR no está activo o no existe. Código: " + qrCode,
              );
            }
            const active =
              profile.activo === true ||
              profile.activo === "true" ||
              profile.activo === 1 ||
              profile.activo === "1" ||
              profile.activo === undefined;
            if (profile.activo === false || profile.activo === "false" || profile.activo === 0) {
              throw Error(
                "Este perfil aún no está activo. El administrador debe validar el pago.",
              );
            }
            const bag = {
              productos: one?.products || one?.productos || d.productos || [],
              preguntas: one?.questions || one?.preguntas || d.preguntas || [],
              enlaces: one?.links || one?.enlaces || d.enlaces || [],
              valoraciones: one?.valoraciones || [],
              profile: one?.profile || profile,
            };
            state.products = bag.productos;
            state.valoraciones = bag.valoraciones || [];
            state.questions = bag.preguntas;
            state.links = bag.enlaces;
            // fusionar campos de estilo desde profile
            profile.estilo_marco = profile.estilo_marco || one?.profile?.estilo_marco;
            profile.modalidad = profile.modalidad || one?.profile?.modalidad;
            const normalized = normalizePublicProfile(profile, bag);
            const prods =
              (Array.isArray(one?.products) && one.products) ||
              (Array.isArray(one?.productos) && one.productos) ||
              (Array.isArray(bag.productos) && bag.productos) ||
              (Array.isArray(bag.products) && bag.products) ||
              [];
            normalized.productos = prods;
            normalized.products = prods;
            state.products = prods.length ? prods : state.products || [];
            state.profiles = [normalized];
            state.index = 0;
          } else {
            state.profiles = DEMOS;
            state.index = 0;
          }
          render();
        } catch (error) {
          console.error(error);
          if (qrCode) {
            app.innerHTML =
              `<div style="padding:20px"><p class="message">${esc(error.message || "No se pudo cargar el perfil")}</p>` +
              `<div class="join" style="margin-top:16px"><a href="${REGISTRO_URL}">Registrar mi WebPocket</a></div></div>`;
          } else {
            state.formats = FALLBACK;
            state.profiles = DEMOS;
            state.service = false;
            try {
              render();
            } catch (e) {
              app.innerHTML = `<p class="message" style="padding:20px">Error al mostrar ejemplos.</p>`;
            }
          }
        } finally {
          hideLoader();
        }
      }
      // zoom global (no depende de re-render)
      if (!window.__wpZoom) {
        window.__wpZoom = true;
        document.getElementById("pocket")?.addEventListener(
          "click",
          (e) => {
            const img = e.target.closest?.("img[data-zoom-src]");
            if (!img) return;
            e.preventDefault();
            e.stopPropagation();
            const src = img.getAttribute("data-zoom-src");
            if (!src) return;
            document.querySelector("#pocket .lightbox")?.remove();
            const box = document.createElement("div");
            box.className = "lightbox";
            const im = document.createElement("img");
            im.src = src;
            box.appendChild(im);
            box.onclick = () => box.remove();
            document.getElementById("pocket").appendChild(box);
          },
          true,
        );
      }
      init();
    
