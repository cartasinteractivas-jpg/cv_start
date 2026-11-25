/* WebPocket cv_start — IA / avatar */
      const AVATAR_FILES = {
        idle: "neutral.jpg",
        modo1: { a:"vocal_a.jpg", e:"vocal_e.jpg", i:"vocal_i.jpg", o:"vocal_o.jpg", u:"vocal_u.jpg" },
        modo2: { a:"vocal2_a.jpg", e:"vocal2_e.jpg", i:"vocal2_i.jpg", o:"vocal2_o.jpg", u:"vocal2_u.jpg" },
        yes: "respuesta_si.jpg",
        no: "respuesta_no.jpg",
      };

      function avatarBaseUrl(p) {
        const STORAGE =
          "https://rrubzwdrsuyjntoejmew.supabase.co/storage/v1/object/public/webpocket/";
        let cod = String((p && (p.codigo_cliente || p.codigo)) || state.qr || "").trim();
        try {
          const em = String((p && p.estilo_marco) || "");
          if (em.startsWith("{")) {
            const j = JSON.parse(em);
            if (j.avatar_base) {
              let b = String(j.avatar_base).trim();
              // Si ya es URL completa de storage, úsala
              if (/^https?:\/\//i.test(b)) return b.replace(/\/?$/, "/");
              // Si es ruta relativa tipo avatar/CODIGO/
              b = b.replace(/^\/+/, "");
              if (b.indexOf("avatar/") === 0) return STORAGE + b.replace(/\/?$/, "/");
              // Si solo guardaron el código en base
              if (!cod && b) cod = b.replace(/^avatar\//, "").replace(/\/$/, "");
            }
          }
        } catch (_) {}
        if (!cod) return "";
        return STORAGE + "avatar/" + cod + "/";
      }

      function avatarEnabled(p) {
        try {
          const em = String((p && p.estilo_marco) || "");
          if (em.startsWith("{")) {
            const j = JSON.parse(em);
            return !!(j.avatar_show && j.avatar_ready);
          }
        } catch (_) {}
        return false;
      }

      function detectReaction(text) {
        const t = String(text || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        if (/^(si|sí)\b|claro que si|por supuesto|correcto|exacto/.test(t) && t.length < 80) return "yes";
        if (/^(no)\b|no puedo|no tengo|lamentablemente no/.test(t) && t.length < 80) return "no";
        if (/\?|\b(quieres|deseas|te gustaria|te gustaría|puedo ayudarte)\b/.test(t)) return "question";
        if (/lo siento|entiendo|comprendo|ánimo|animo/.test(t)) return "empathetic";
        if (/wow|increible|sorprend|genial/.test(t)) return "surprised";
        return "neutral";
      }

      window._wpAvatar = window._wpAvatar || { timer: null, speaking: false, seq: [], mode: "modo1" };

      function avatarFrameUrl(base, name) {
        if (!base || !name) return "";
        return base + name + (base.includes("?") ? "" : "");
      }

      function setAvatarFrame(name) {
        const img = document.getElementById("wp-avatar-img");
        if (!img || !window._wpAvatar.base) return;
        const src = avatarFrameUrl(window._wpAvatar.base, name);
        if (img.dataset.frame === name) return;
        img.dataset.frame = name;
        img.src = src;
      }

      function stopAvatarAnim() {
        try {
          if (window._wpAvatar.timer) { clearInterval(window._wpAvatar.timer); clearTimeout(window._wpAvatar.timer); }
        } catch (_) {}
        window._wpAvatar.timer = null;
        window._wpAvatar.speaking = false;
      }

      function playAvatarSequence(frames, ms, done) {
        stopAvatarAnim();
        let i = 0;
        const run = () => {
          if (i >= frames.length) {
            stopAvatarAnim();
            setAvatarFrame(AVATAR_FILES.idle);
            if (done) done();
            return;
          }
          setAvatarFrame(frames[i++]);
        };
        run();
        window._wpAvatar.timer = setInterval(run, ms || 130);
      }

      function avatarOnThinking() {
        if (!window._wpAvatar.enabled) return;
        stopAvatarAnim();
        setAvatarFrame(AVATAR_FILES.think);
      }

      function avatarOnReply(text, audioEl) {
        if (!window._wpAvatar.enabled) return;
        stopAvatarAnim();
        try { if (window._wpAvatar._poll) clearInterval(window._wpAvatar._poll); } catch (_) {}
        window._wpAvatar._poll = null;
        const raw = String(text || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const special = /^(si|claro que si|por supuesto|correcto|exacto)\b/.test(raw) && raw.length < 80 ? AVATAR_FILES.yes : /^(no|no puedo|no tengo|lamentablemente no)\b/.test(raw) && raw.length < 80 ? AVATAR_FILES.no : "";
        const cleanup = () => {
          stopAvatarAnim();
          try { if (window._wpAvatar._poll) clearInterval(window._wpAvatar._poll); } catch (_) {}
          window._wpAvatar._poll = null;
          setAvatarFrame(AVATAR_FILES.idle);
        };
        if (special) {
          setAvatarFrame(special);
          if (audioEl) {
            const end = () => { audioEl.removeEventListener("ended", end); cleanup(); };
            audioEl.addEventListener("ended", end, { once:true });
            window._wpAvatar._poll = setInterval(() => { if (audioEl.ended) end(); }, 120);
          } else window._wpAvatar.timer = setTimeout(cleanup, 900);
          return;
        }
        const vowels = raw.match(/[aeiou]/g) || [];
        if (!vowels.length) { setAvatarFrame(AVATAR_FILES.idle); return; }
        const mode = window._wpAvatar.mode === "modo2" ? AVATAR_FILES.modo2 : AVATAR_FILES.modo1;
        const estimated = Math.max(1200, String(text || "").length * 88);
        const each = Math.max(170, estimated / vowels.length);
        let i = 0;
        const step = () => {
          if (i >= vowels.length) { cleanup(); return; }
          setAvatarFrame(mode[vowels[i++]] || AVATAR_FILES.idle);
        };
        step();
        window._wpAvatar.timer = setInterval(step, each);
        if (audioEl) {
          const end = () => cleanup();
          audioEl.addEventListener("ended", end, { once:true });
          window._wpAvatar._poll = setInterval(() => { if (audioEl.ended) end(); }, 180);
        }
      }

      function avatarHtml(p) {
        let show = false, ready = false;
        try {
          const em = String((p && p.estilo_marco) || "");
          if (em.startsWith("{")) {
            const j = JSON.parse(em);
            show = !!(j.avatar_show === true || j.avatar_show === "true" || j.avatar_show === 1);
            ready = !!(j.avatar_ready === true || j.avatar_ready === "true" || j.avatar_ready === 1);
            window._wpAvatar.mode = j.ia_avatar_modo === "modo2" ? "modo2" : "modo1";
            window._wpAvatar.mode = j.ia_avatar_modo === "modo2" ? "modo2" : "modo1";
          }
        } catch (_) {}
        // Si no hay flag de mostrar, no pintar nada
        if (!show) {
          window._wpAvatar.enabled = false;
          return "";
        }
        const base = avatarBaseUrl(p);
        if (!base) {
          window._wpAvatar.enabled = false;
          return '<div id="wp-avatar-wrap" style="text-align:center;padding:8px;font-size:12px;opacity:.9;color:#fecaca">No hay avatar</div>';
        }
        // Aunque avatar_ready falte en BD, intentamos cargar el frame idle del storage
        window._wpAvatar.base = base;
        window._wpAvatar.enabled = true;
        const idle = avatarFrameUrl(base, AVATAR_FILES.idle);
        // preload
        try {
          const all = [AVATAR_FILES.idle, ...Object.values(AVATAR_FILES.modo1), ...Object.values(AVATAR_FILES.modo2), AVATAR_FILES.yes, AVATAR_FILES.no];
          all.forEach((n) => {
            const im = new Image();
            im.src = avatarFrameUrl(base, n);
          });
        } catch (_) {}
        return (
          '<div id="wp-avatar-wrap" style="position:absolute;inset:0;z-index:1;display:flex;align-items:center;justify-content:center;pointer-events:none;margin:0;background:#050914">' +
          '<img id="wp-avatar-img" src="' +
          idle +
          '" alt="avatar" style="width:100%;height:100%;object-fit:contain;object-position:center;display:block" data-frame="' +
          AVATAR_FILES.idle +
          '" onerror="this.style.display=\'none\';var w=this.closest(\'#wp-avatar-wrap\');if(w){w.innerHTML=\'<div style=padding:10px;color:#fecaca;font-size:12px;text-align:center>No hay avatar (faltan fotos en storage)</div>\';}"/>' +
          "</div>"
        );
      }
