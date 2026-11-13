/* WebPocket cv_start — IA / avatar */
      const AVATAR_FILES = {
        idle: "01_escucha_neutral.jpg",
        blink: "02_parpadeo.jpg",
        think: "07_pensando.jpg",
        empathy: "06_empatia.jpg",
        surprise: "08_sorpresa.jpg",
        speak: [
          "16_hablar1.jpg",
          "HABLAR_entre_hablar1_hablar2_1.jpg",
          "HABLAR_entre_hablar1_hablar2_2.jpg",
          "HABLAR_baja_16_hablar1_a_17_hablar2_25.jpg",
          "HABLAR_baja_16_hablar1_a_17_hablar2_50.jpg",
          "HABLAR_baja_16_hablar1_a_17_hablar2_75.jpg",
          "17_hablar2.jpg",
          "HABLAR_entre_hablar2_hablando_1.jpg",
          "HABLAR_entre_hablar2_hablando_2.jpg",
          "HABLAR_baja_17_hablar2_a_09_hablando_25.jpg",
          "HABLAR_baja_17_hablar2_a_09_hablando_50.jpg",
          "HABLAR_baja_17_hablar2_a_09_hablando_75.jpg",
          "09_hablando.jpg",
        ],
        yes: [
          "10_si1.jpg",
          "SI_entre_si1_si2_1.jpg",
          "SI_entre_si1_si2_2.jpg",
          "SI_baja_10_si1_a_11_si2_25.jpg",
          "SI_baja_10_si1_a_11_si2_50.jpg",
          "SI_baja_10_si1_a_11_si2_75.jpg",
          "11_si2.jpg",
          "SI_entre_si2_si3_1.jpg",
          "SI_entre_si2_si3_2.jpg",
          "SI_baja_11_si2_a_12_si3_25.jpg",
          "SI_baja_11_si2_a_12_si3_50.jpg",
          "SI_baja_11_si2_a_12_si3_75.jpg",
          "12_si3.jpg",
          "18_hablar_cuerpo_01.jpg",
          "19_hablar_cuerpo_02.jpg",
        ],
        no: [
          "13_no1.jpg",
          "NO_entre_no1_no2_1.jpg",
          "NO_entre_no1_no2_2.jpg",
          "NO_baja_13_no1_a_14_no2_25.jpg",
          "NO_baja_13_no1_a_14_no2_50.jpg",
          "NO_baja_13_no1_a_14_no2_75.jpg",
          "14_no2.jpg",
          "NO_entre_no2_no3_1.jpg",
          "NO_entre_no2_no3_2.jpg",
          "NO_baja_14_no2_a_15_no3_25.jpg",
          "NO_baja_14_no2_a_15_no3_50.jpg",
          "NO_baja_14_no2_a_15_no3_75.jpg",
          "15_no3.jpg",
          "20_hablar_cuerpo_03.jpg",
          "21_hablar_cuerpo_04.jpg",
        ],
        question: [
          "22_hablar_cuerpo_05.jpg",
          "23_hablar_cuerpo_06.jpg",
        ],
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

      window._wpAvatar = window._wpAvatar || { timer: null, speaking: false, seq: [] };

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
          if (window._wpAvatar.timer) clearInterval(window._wpAvatar.timer);
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
        const reaction = detectReaction(text);
        const afterGesture = () => {
          if (audioEl) {
            // Secuencia completa de habla (todos los fotogramas) ida + vuelta
            const base = (AVATAR_FILES.speak || []).slice();
            const frames = base.concat(base.slice(0, -1).reverse());
            let i = 0;
            stopAvatarAnim();
            window._wpAvatar.speaking = true;
            window._wpAvatar.timer = setInterval(() => {
              if (!frames.length) return;
              setAvatarFrame(frames[i % frames.length]);
              i = (i + 1) % frames.length;
            }, 100);
            let ended = false;
            const end = () => {
              if (ended) return;
              ended = true;
              stopAvatarAnim();
              setAvatarFrame(AVATAR_FILES.idle);
              try {
                audioEl.removeEventListener("ended", end);
                audioEl.removeEventListener("pause", onPause);
              } catch (_) {}
              try {
                if (window._wpAvatar._poll) clearInterval(window._wpAvatar._poll);
                window._wpAvatar._poll = null;
              } catch (_) {}
            };
            const onPause = () => {
              // Si el audio terminó o se detuvo de verdad
              try {
                if (audioEl.ended || (audioEl.paused && audioEl.currentTime > 0.15 && audioEl.duration && audioEl.currentTime >= audioEl.duration - 0.2)) {
                  end();
                }
              } catch (_) {}
            };
            try {
              audioEl.addEventListener("ended", end);
              audioEl.addEventListener("pause", onPause);
            } catch (_) {}
            // Poll por si el móvil no dispara "ended"
            try {
              if (window._wpAvatar._poll) clearInterval(window._wpAvatar._poll);
              window._wpAvatar._poll = setInterval(() => {
                try {
                  if (!audioEl || audioEl.ended) {
                    end();
                    return;
                  }
                  if (audioEl.paused && audioEl.currentTime > 0 && audioEl.duration > 0 && audioEl.currentTime >= audioEl.duration - 0.15) {
                    end();
                  }
                } catch (_) {
                  end();
                }
              }, 200);
            } catch (_) {}
            // Seguridad máxima 90s
            setTimeout(end, 90000);
          } else {
            // Sin audio: igual simular habla con todos los fotogramas según longitud del texto
            const base = (AVATAR_FILES.speak || []).slice();
            const frames = base.concat(base.slice(0, -1).reverse());
            let i = 0;
            stopAvatarAnim();
            window._wpAvatar.speaking = true;
            window._wpAvatar.timer = setInterval(() => {
              if (!frames.length) return;
              setAvatarFrame(frames[i % frames.length]);
              i = (i + 1) % frames.length;
            }, 100);
            const ms = Math.min(12000, 900 + String(text || "").length * 55);
            setTimeout(() => {
              stopAvatarAnim();
              setAvatarFrame(AVATAR_FILES.idle);
            }, ms);
          }
        };
        if (reaction === "yes") playAvatarSequence(AVATAR_FILES.yes, 120, afterGesture);
        else if (reaction === "no") playAvatarSequence(AVATAR_FILES.no, 120, afterGesture);
        else if (reaction === "question") playAvatarSequence(AVATAR_FILES.question || AVATAR_FILES.speak, 160, afterGesture);
        else if (reaction === "empathetic") {
          setAvatarFrame(AVATAR_FILES.empathy);
          setTimeout(afterGesture, 600);
        } else if (reaction === "surprised") {
          setAvatarFrame(AVATAR_FILES.surprise);
          setTimeout(afterGesture, 600);
        } else afterGesture();
      }

      function avatarHtml(p) {
        let show = false, ready = false;
        try {
          const em = String((p && p.estilo_marco) || "");
          if (em.startsWith("{")) {
            const j = JSON.parse(em);
            show = !!(j.avatar_show === true || j.avatar_show === "true" || j.avatar_show === 1);
            ready = !!(j.avatar_ready === true || j.avatar_ready === "true" || j.avatar_ready === 1);
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
          const all = [
            AVATAR_FILES.idle, AVATAR_FILES.blink, AVATAR_FILES.think, AVATAR_FILES.empathy, AVATAR_FILES.surprise,
          ].concat(AVATAR_FILES.speak, AVATAR_FILES.yes, AVATAR_FILES.no);
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
